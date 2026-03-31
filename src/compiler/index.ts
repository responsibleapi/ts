import type { oas31 } from "openapi3-ts"
import { isOptional } from "../dsl/dsl.ts"
import { dslPathToOpenApiPath, joinHttpPaths } from "./path.ts"
import {
  compileOperationParameters,
  compileSecurityFromAug,
  pickSecurity,
  securityLayerFromScopeReq,
  stripSecurityFields,
} from "./request.ts"
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
import {
  compileSchema,
  createSchemaCompileState,
  type SchemaCompileState,
} from "./schema.ts"

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

  if (isDslSchema(req)) {
    return { body: req }
  }

  if (typeof req !== "object" || req === null) {
    return undefined
  }

  if (isOpReqShaped(req)) {
    return req
  }

  throw new Error("Invalid request shape")
}

function mergeReqAugmentations(
  parent: ReqAugmentation | undefined,
  child: ReqAugmentation | undefined,
): ReqAugmentation | undefined {
  if (parent === undefined && child === undefined) {
    return undefined
  }

  const p = stripSecurityFields(parent) ?? {}
  const c = stripSecurityFields(child) ?? {}
  const mergedMime = c.mime ?? p.mime
  const mergedBody = c.body !== undefined ? c.body : p.body

  const base: ReqAugmentation = {
    ...p,
    ...c,
    pathParams: { ...p.pathParams, ...c.pathParams },
    query: { ...p.query, ...c.query },
    headers: { ...p.headers, ...c.headers },
    params: [...(p.params ?? []), ...(c.params ?? [])],
  }

  return {
    ...base,
    ...(mergedMime !== undefined ? { mime: mergedMime } : {}),
    ...(mergedBody !== undefined ? { body: mergedBody } : {}),
  }
}

function mergeInheritedReq(
  parent: ReqAugmentation | undefined,
  op: RouteMethodOp,
): ReqAugmentation {
  const raw = op.req
  const child = normalizeOpReq(raw) ?? {}
  const mimeFromRaw = readReqMimeRaw(raw)
  const normalizedChild: ReqAugmentation =
    mimeFromRaw !== undefined ? { ...child, mime: mimeFromRaw } : child

  return mergeReqAugmentations(parent, normalizedChild) ?? {}
}

function mergedReqAndSecurityForOp(
  schemaState: SchemaCompileState,
  ctx: CompileScopeContext,
  op: RouteMethodOp,
): {
  mergedReq: ReqAugmentation
  securityReqs: oas31.SecurityRequirementObject[]
} {
  const raw = op.req
  const child = normalizeOpReq(raw) ?? {}
  const mimeFromRaw = readReqMimeRaw(raw)
  const normalizedChild: ReqAugmentation =
    mimeFromRaw !== undefined ? { ...child, mime: mimeFromRaw } : child

  const mergedReq = mergeInheritedReq(ctx.mergedReq, op)
  const opSecurityLayer = pickSecurity(normalizedChild)
  const securityReqs = [
    ...ctx.securityLayers.flatMap(layer =>
      compileSecurityFromAug(schemaState, layer),
    ),
    ...compileSecurityFromAug(schemaState, opSecurityLayer),
  ]

  return { mergedReq, securityReqs }
}

interface CompileScopeContext {
  mergedReq: ReqAugmentation | undefined
  securityLayers: Pick<ReqAugmentation, "security" | "security?">[]
  resDefaultsLayers: Partial<Record<MatchStatus, RespAugmentation>>[]
  resAdd: OpRes
  mergedTags: ScopeOpts["tags"]
}

function compileScopeContextFromForAll(forAll: ScopeOpts): CompileScopeContext {
  const { defaults, add } = parseScopeRes(forAll.res)

  return {
    mergedReq:
      forAll.req !== undefined ? stripSecurityFields(forAll.req) : undefined,
    securityLayers: securityLayerFromScopeReq(forAll.req),
    resDefaultsLayers:
      Object.keys(defaults).length > 0 ? [defaults] : [],
    resAdd: add,
    mergedTags: forAll.tags,
  }
}

function mergeCompileScope(
  parent: CompileScopeContext,
  childForAll: ScopeOpts | undefined,
): CompileScopeContext {
  if (childForAll === undefined) {
    return parent
  }

  const { defaults, add } = parseScopeRes(childForAll.res)

  return {
    mergedReq: mergeReqAugmentations(parent.mergedReq, childForAll.req),
    securityLayers: [
      ...parent.securityLayers,
      ...securityLayerFromScopeReq(childForAll.req),
    ],
    resDefaultsLayers: [
      ...parent.resDefaultsLayers,
      ...(Object.keys(defaults).length > 0 ? [defaults] : []),
    ],
    resAdd: { ...parent.resAdd, ...add },
    mergedTags:
      childForAll.tags !== undefined
        ? childForAll.tags
        : parent.mergedTags,
  }
}

function mergeRespAugmentations(
  a: RespAugmentation,
  b: RespAugmentation,
): RespAugmentation {
  const headers = { ...a.headers, ...b.headers }
  const cookies = { ...a.cookies, ...b.cookies }
  const mime = b.mime ?? a.mime

  return {
    ...(mime !== undefined ? { mime } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(Object.keys(cookies).length > 0 ? { cookies } : {}),
  }
}

function normalizeRespEntry(entry: Resp | Schema): RespParams {
  if (isDslSchema(entry)) {
    return { body: entry }
  }

  if (typeof entry !== "object" || entry === null) {
    throw new Error("Invalid response entry")
  }

  return assertInlineComponent(entry, "response")
}

function compileHeaderMap(
  schemaState: SchemaCompileState,
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
      schema: compileSchema(schemaState, sch),
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
  schemaState: SchemaCompileState,
  body: Schema | Record<Mime, Schema>,
  defaultMime: Mime | undefined,
): oas31.ContentObject {
  if (isMimeMap(body)) {
    const c: oas31.ContentObject = {}

    for (const [mime, sch] of Object.entries(body)) {
      c[mime] = { schema: compileSchema(schemaState, sch) }
    }

    return c
  }

  const mime = defaultMime ?? "application/octet-stream"

  return {
    [mime]: { schema: compileSchema(schemaState, body) },
  }
}

function compileRequestBody(
  schemaState: SchemaCompileState,
  merged: ReqAugmentation,
): oas31.RequestBodyObject | undefined {
  if (merged.body === undefined) {
    return undefined
  }

  return {
    required: true,
    content: compileContent(schemaState, merged.body, merged.mime),
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
  schemaState: SchemaCompileState,
  op: RouteMethodOp,
  ctx: CompileScopeContext,
): oas31.ResponsesObject {
  const { resDefaultsLayers, resAdd: add } = ctx
  const statuses = responseStatuses(op, add)
  const out: oas31.ResponsesObject = {}

  for (const code of statuses) {
    let aug: RespAugmentation = {}

    for (const layer of resDefaultsLayers) {
      const partial = foldAugmentations(layer, code)
      aug = mergeRespAugmentations(aug, partial)
    }
    const raw = concreteResponse(code, op, add)
    const concrete = normalizeRespEntry(raw)
    const mime = aug.mime ?? undefined

    const hAug = compileHeaderMap(schemaState, aug.headers) ?? {}
    const hCon = compileHeaderMap(schemaState, concrete.headers) ?? {}
    const headers: oas31.HeadersObject = { ...hAug, ...hCon }
    const headerObj =
      Object.keys(headers).length > 0 ? headers : undefined

    let content: oas31.ContentObject | undefined

    if (concrete.body !== undefined) {
      content = compileContent(schemaState, concrete.body, mime)
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

function compileDirectOp(
  schemaState: SchemaCompileState,
  op: RouteMethodOp,
  ctx: CompileScopeContext,
  oasPath: string,
): oas31.OperationObject {
  const { mergedReq, securityReqs } = mergedReqAndSecurityForOp(
    schemaState,
    ctx,
    op,
  )
  const requestBody = compileRequestBody(schemaState, mergedReq)
  const parameters = compileOperationParameters(schemaState, mergedReq, oasPath)
  const tagNames =
    op.tags !== undefined
      ? op.tags.map(t => t.name)
      : ctx.mergedTags !== undefined && ctx.mergedTags.length > 0
        ? ctx.mergedTags.map(t => t.name)
        : undefined

  return {
    ...(op.summary !== undefined ? { summary: op.summary } : {}),
    ...(op.description !== undefined ? { description: op.description } : {}),
    ...(op.deprecated === true ? { deprecated: true } : {}),
    ...(op.id !== undefined ? { operationId: op.id } : {}),
    ...(tagNames !== undefined && tagNames.length > 0 ? { tags: tagNames } : {}),
    ...(parameters !== undefined ? { parameters } : {}),
    ...(requestBody !== undefined ? { requestBody } : {}),
    ...(securityReqs.length > 0 ? { security: securityReqs } : {}),
    responses: compileResponses(schemaState, op, ctx),
  }
}

function placeOperation(
  schemaState: SchemaCompileState,
  paths: oas31.PathsObject,
  dslPath: string,
  ctx: CompileScopeContext,
  op: RouteMethodOp,
): void {
  const oasPath = dslPathToOpenApiPath(dslPath)
  const oasMethod = OAS_METHOD[op.method]
  const existing = paths[oasPath]

  if (existing !== undefined && oasMethod in existing) {
    throw new Error(`Duplicate operation for ${op.method} ${oasPath}`)
  }

  const pathItem: oas31.PathItemObject = {
    ...(typeof existing === "object" && existing !== null ? existing : {}),
    [oasMethod]: compileDirectOp(schemaState, op, ctx, oasPath),
  }

  paths[oasPath] = pathItem
}

function compileRoutes(
  schemaState: SchemaCompileState,
  routes: Record<string, unknown>,
  ctx: CompileScopeContext,
  pathPrefix: string,
  paths: oas31.PathsObject,
): void {
  for (const routeKey of Object.keys(routes)) {
    const node = routes[routeKey]

    if (node === undefined) {
      continue
    }

    if (node === null || typeof node !== "object") {
      throw new Error(`Invalid route value for key "${routeKey}"`)
    }

    if (isHttpMethod(routeKey)) {
      if (pathPrefix === "" || pathPrefix === "/") {
        throw new Error(
          "HTTP method routes must be nested under a non-root path scope",
        )
      }

      assertRouteMethodOp(node)
      placeOperation(schemaState, paths, pathPrefix, ctx, node)
      continue
    }

    if (!isHttpPath(routeKey)) {
      throw new Error(`Invalid route key "${routeKey}"`)
    }

    const fullDslPath = joinHttpPaths(pathPrefix, routeKey)

    if (isScope(node)) {
      const nextCtx = mergeCompileScope(ctx, node.forAll)
      compileRoutes(
        schemaState,
        node.routes as Record<string, unknown>,
        nextCtx,
        fullDslPath,
        paths,
      )
    } else {
      assertRouteMethodOp(node)
      placeOperation(schemaState, paths, fullDslPath, ctx, node)
    }
  }
}

export function compileResponsibleAPI(api: ResponsibleAPIInput): oas31.OpenAPIObject {
  if (api.partialDoc.openapi === undefined || api.partialDoc.info === undefined) {
    throw new Error("partialDoc must include openapi and info")
  }

  const schemaState = createSchemaCompileState()
  const rootCtx = compileScopeContextFromForAll(api.forAll)
  const paths: oas31.PathsObject = {
    ...(api.partialDoc.paths ?? {}),
  }

  compileRoutes(
    schemaState,
    api.routes as Record<string, unknown>,
    rootCtx,
    "",
    paths,
  )

  const { openapi, info, tags, servers, security, externalDocs, webhooks } =
    api.partialDoc

  const schemaKeys = Object.keys(schemaState.components.schemas)
  const paramKeys = Object.keys(schemaState.components.parameters)
  const secKeys = Object.keys(schemaState.components.securitySchemes)
  const components: oas31.ComponentsObject | undefined =
    schemaKeys.length > 0 || paramKeys.length > 0 || secKeys.length > 0
      ? {
          ...(schemaKeys.length > 0
            ? { schemas: schemaState.components.schemas }
            : {}),
          ...(paramKeys.length > 0
            ? { parameters: schemaState.components.parameters }
            : {}),
          ...(secKeys.length > 0
            ? { securitySchemes: schemaState.components.securitySchemes }
            : {}),
        }
      : undefined

  return {
    openapi,
    info,
    paths,
    ...(components !== undefined ? { components } : {}),
    ...(tags !== undefined ? { tags } : {}),
    ...(servers !== undefined ? { servers } : {}),
    ...(security !== undefined ? { security } : {}),
    ...(externalDocs !== undefined ? { externalDocs } : {}),
    ...(webhooks !== undefined ? { webhooks } : {}),
  }
}
