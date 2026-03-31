import type { oas31 } from "openapi3-ts"
import { isOptional } from "../dsl/dsl.ts"
import { decodeNameable, type Nameable } from "../dsl/nameable.ts"
import type { HttpMethod } from "../dsl/methods.ts"
import type {
  GetOp,
  MatchStatus,
  Op,
  OpBase,
  OpReq,
  OpRes,
  ReqAugmentation,
  Resp,
  RespAugmentation,
  RespParams,
  RouteMethodOp,
} from "../dsl/operation.ts"
import type { Schema } from "../dsl/schema.ts"
import type { HttpPath, Mime, PathRoutes, ScopeOpts, ScopeRes } from "../dsl/scope.ts"
import { isScope } from "../dsl/scope.ts"
import { emitInlineSchema } from "./schema.ts"

type PartialDoc = Partial<Omit<oas31.OpenAPIObject, "components">>

interface ResponsibleAPIInput {
  partialDoc: PartialDoc
  forAll: ScopeOpts
  routes: PathRoutes
}

const OAS_METHOD: Record<HttpMethod, keyof oas31.PathItemObject> = {
  GET: "get",
  POST: "post",
  PUT: "put",
  DELETE: "delete",
  HEAD: "head",
}

function statusMatchesDefaultKey(key: string, status: number): boolean {
  const asNum = Number(key)

  if (String(asNum) === key && Number.isInteger(asNum)) {
    return asNum === status
  }

  const parts = key.split("..")

  if (parts.length !== 2) {
    return false
  }

  const lo = Number(parts[0])
  const hi = Number(parts[1])

  return status >= lo && status <= hi
}

function foldAugmentations(
  defaults: Partial<Record<MatchStatus, RespAugmentation>>,
  status: number,
): RespAugmentation {
  let acc: RespAugmentation = {}

  for (const [key, aug] of Object.entries(defaults)) {
    if (aug === undefined) {
      continue
    }

    if (!statusMatchesDefaultKey(key, status)) {
      continue
    }

    const headers = { ...acc.headers, ...aug.headers }
    const cookies = { ...acc.cookies, ...aug.cookies }
    const mergedMime = aug.mime ?? acc.mime

    acc = {
      ...(mergedMime !== undefined ? { mime: mergedMime } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      ...(Object.keys(cookies).length > 0 ? { cookies } : {}),
    }
  }

  return acc
}

function parseScopeRes(res: ScopeRes | undefined): {
  defaults: Partial<Record<MatchStatus, RespAugmentation>>
  add: OpRes
} {
  if (res === undefined) {
    return { defaults: {}, add: {} }
  }

  let defaults: Partial<Record<MatchStatus, RespAugmentation>> = {}
  let add: OpRes = {}

  if ("defaults" in res && res.defaults !== undefined) {
    defaults = res.defaults
  }

  if ("add" in res && res.add !== undefined) {
    add = res.add
  }

  return { defaults, add }
}

function assertInlineComponent<T>(n: Nameable<T>, kind: string): T {
  const { name, value } = decodeNameable(n)

  if (name !== undefined && name !== "") {
    throw new Error(`Named ${kind} "${name}" is not supported yet`)
  }

  return value
}

function isMimeValue(x: unknown): x is Mime {
  return typeof x === "string" && x.includes("/")
}

function readReqMimeRaw(
  raw: Op["req"] | GetOp["req"] | undefined,
): Mime | undefined {
  if (typeof raw !== "object" || raw === null || !("mime" in raw)) {
    return undefined
  }

  const boxed: { mime?: unknown } = raw

  return isMimeValue(boxed.mime) ? boxed.mime : undefined
}

function isDslSchema(x: unknown): x is Schema {
  if (typeof x === "function") {
    return true
  }

  if (typeof x !== "object" || x === null) {
    return false
  }

  if ("type" in x) {
    const t: unknown = (x as { type?: unknown }).type

    return typeof t === "string"
  }

  if ("oneOf" in x || "anyOf" in x || "allOf" in x) {
    return true
  }

  if (
    "properties" in x &&
    typeof (x as { properties?: unknown }).properties === "object" &&
    (x as { properties?: unknown }).properties !== null &&
    !("body" in x)
  ) {
    return true
  }

  return "propertyNames" in x && "additionalProperties" in x
}

function isHttpMethod(s: string): s is HttpMethod {
  return s === "GET" || s === "POST" || s === "PUT" || s === "DELETE" || s === "HEAD"
}

function isHttpPath(s: string): s is HttpPath {
  return s.length > 0 && s.startsWith("/")
}

function assertRouteMethodOp(node: OpBase): asserts node is RouteMethodOp {
  if (typeof node !== "object" || node === null || !("method" in node)) {
    throw new Error(
      "Each route must be an HTTP method helper result (e.g. POST({...}))",
    )
  }

  const boxed: { method?: unknown } = node

  if (typeof boxed.method !== "string" || !isHttpMethod(boxed.method)) {
    throw new Error(
      "Each route must be an HTTP method helper result (e.g. POST({...}))",
    )
  }
}

function isOpReqShaped(x: object): x is OpReq {
  return (
    "body" in x ||
    "pathParams" in x ||
    "query" in x ||
    "headers" in x ||
    "params" in x ||
    "security" in x ||
    "security?" in x
  )
}

function normalizeOpReq(req: Op["req"] | GetOp["req"] | undefined): OpReq | undefined {
  if (req === undefined) {
    return undefined
  }

  if (typeof req !== "object" || req === null) {
    return undefined
  }

  if (isOpReqShaped(req)) {
    return req
  }

  if (isDslSchema(req)) {
    return { body: req }
  }

  throw new Error("Invalid request shape")
}

function mergeInheritedReq(
  parent: ReqAugmentation | undefined,
  op: RouteMethodOp,
): ReqAugmentation {
  const p = parent ?? {}
  const raw = op.req
  const child = normalizeOpReq(raw) ?? {}
  const mergedMime = readReqMimeRaw(raw) ?? p["mime"]
  const mergedBody = child.body !== undefined ? child.body : p.body

  const base: ReqAugmentation = {
    ...p,
    ...child,
    pathParams: { ...p.pathParams, ...child.pathParams },
    query: { ...p.query, ...child.query },
    headers: { ...p.headers, ...child.headers },
    params: [...(p.params ?? []), ...(child.params ?? [])],
  }

  return {
    ...base,
    ...(mergedMime !== undefined ? { mime: mergedMime } : {}),
    ...(mergedBody !== undefined ? { body: mergedBody } : {}),
  }
}

function normalizeRespEntry(entry: Resp | Schema): RespParams {
  if (typeof entry !== "object" || entry === null) {
    throw new Error("Invalid response entry")
  }

  if (isDslSchema(entry)) {
    return { body: entry }
  }

  return assertInlineComponent(entry, "response")
}

function compileHeaderMap(
  headers: Record<string, Schema> | undefined,
): oas31.HeadersObject | undefined {
  if (headers === undefined || Object.keys(headers).length === 0) {
    return undefined
  }

  const out: oas31.HeadersObject = {}

  for (const [rawName, sch] of Object.entries(headers)) {
    const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
    const required = !isOptional(rawName)

    out[name] = {
      required,
      schema: emitInlineSchema(sch),
    }
  }

  return out
}

function isMimeMap(body: Schema | Record<Mime, Schema>): body is Record<Mime, Schema> {
  if (typeof body !== "object" || body === null || "type" in body) {
    return false
  }

  const keys = Object.keys(body as object)

  if (keys.length === 0) {
    return false
  }

  return keys.every(k => k.includes("/"))
}

function compileContent(
  body: Schema | Record<Mime, Schema>,
  defaultMime: Mime | undefined,
): oas31.ContentObject {
  if (isMimeMap(body)) {
    const c: oas31.ContentObject = {}

    for (const [mime, sch] of Object.entries(body)) {
      c[mime] = { schema: emitInlineSchema(sch) }
    }

    return c
  }

  const mime = defaultMime ?? "application/octet-stream"

  return {
    [mime]: { schema: emitInlineSchema(body) },
  }
}

function compileRequestBody(
  merged: ReqAugmentation,
): oas31.RequestBodyObject | undefined {
  if (merged.body === undefined) {
    return undefined
  }

  return {
    required: true,
    content: compileContent(merged.body, merged.mime),
  }
}

function responseStatuses(op: RouteMethodOp, add: OpRes): number[] {
  const keys = new Set<number>()

  if (op.res !== undefined) {
    for (const k of Object.keys(op.res)) {
      keys.add(Number(k))
    }
  }

  for (const k of Object.keys(add)) {
    keys.add(Number(k))
  }

  return [...keys].sort((a, b) => a - b)
}

function concreteResponse(code: number, op: RouteMethodOp, add: OpRes): Resp | Schema {
  const fromOp = op.res?.[code]

  if (fromOp !== undefined) {
    return fromOp
  }

  const fromAdd = add[code]

  if (fromAdd === undefined) {
    throw new Error(`Missing response for status ${code}`)
  }

  return fromAdd
}

function compileResponses(
  op: RouteMethodOp,
  scopeRes: ScopeOpts["res"],
): oas31.ResponsesObject {
  const { defaults, add } = parseScopeRes(scopeRes)
  const statuses = responseStatuses(op, add)
  const out: oas31.ResponsesObject = {}

  for (const code of statuses) {
    const aug = foldAugmentations(defaults, code)
    const raw = concreteResponse(code, op, add)
    const concrete = normalizeRespEntry(raw)
    const mime = aug.mime ?? undefined

    const hAug = compileHeaderMap(aug.headers) ?? {}
    const hCon = compileHeaderMap(concrete.headers) ?? {}
    const headers: oas31.HeadersObject = { ...hAug, ...hCon }
    const headerObj =
      Object.keys(headers).length > 0 ? headers : undefined

    let content: oas31.ContentObject | undefined

    if (concrete.body !== undefined) {
      content = compileContent(concrete.body, mime)
    }

    const response: oas31.ResponseObject = {
      description: concrete.description ?? String(code),
      ...(headerObj !== undefined ? { headers: headerObj } : {}),
      ...(content !== undefined ? { content } : {}),
    }

    out[String(code)] = response
  }

  return out
}

function compileDirectOp(op: RouteMethodOp, scope: ScopeOpts): oas31.OperationObject {
  const mergedReq = mergeInheritedReq(scope.req, op)
  const requestBody = compileRequestBody(mergedReq)

  return {
    ...(op.summary !== undefined ? { summary: op.summary } : {}),
    ...(op.description !== undefined ? { description: op.description } : {}),
    ...(op.deprecated === true ? { deprecated: true } : {}),
    ...(op.id !== undefined ? { operationId: op.id } : {}),
    ...(requestBody !== undefined ? { requestBody } : {}),
    responses: compileResponses(op, scope.res),
  }
}

export function compileResponsibleAPI(api: ResponsibleAPIInput): oas31.OpenAPIObject {
  if (api.partialDoc.openapi === undefined || api.partialDoc.info === undefined) {
    throw new Error("partialDoc must include openapi and info")
  }

  const scope: ScopeOpts = api.forAll
  const paths: oas31.PathsObject = {
    ...(api.partialDoc.paths ?? {}),
  }

  for (const pathUntyped of Object.keys(api.routes)) {
    if (!isHttpPath(pathUntyped)) {
      continue
    }

    const path = pathUntyped
    const node = api.routes[path]

    if (node === undefined) {
      continue
    }

    if (isScope(node)) {
      throw new Error("Nested scopes are not supported yet")
    }

    assertRouteMethodOp(node)
    const op = node
    const oasMethod = OAS_METHOD[op.method]

    const existing = paths[path]

    if (existing !== undefined && oasMethod in existing) {
      throw new Error(`Duplicate operation for ${op.method} ${path}`)
    }

    const pathItem: oas31.PathItemObject = {
      ...(typeof existing === "object" && existing !== null ? existing : {}),
      [oasMethod]: compileDirectOp(op, scope),
    }

    paths[path] = pathItem
  }

  const { openapi, info, tags, servers, security, externalDocs, webhooks } =
    api.partialDoc

  return {
    openapi,
    info,
    paths,
    ...(tags !== undefined ? { tags } : {}),
    ...(servers !== undefined ? { servers } : {}),
    ...(security !== undefined ? { security } : {}),
    ...(externalDocs !== undefined ? { externalDocs } : {}),
    ...(webhooks !== undefined ? { webhooks } : {}),
  }
}
