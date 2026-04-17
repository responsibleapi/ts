import type { oas31 } from "openapi3-ts"
import { isOptional, type ResponsibleApiInput } from "../dsl/dsl.ts"
import type { HttpMethod } from "../dsl/methods.ts"
import { decodeNameable, type Nameable } from "../dsl/nameable.ts"
import type {
  GetOp,
  MatchStatus,
  Op,
  OpBase,
  OpReq,
  OpResponses,
  ReqAugmentation,
  Resp,
  RespAugmentation,
  OpResp,
  RouteMethodOp,
} from "../dsl/operation.ts"
import type { HeaderRaw, ReusableHeader } from "../dsl/response-headers.ts"
import type { RawSchema, Schema } from "../dsl/schema.ts"
import type { HttpPath, Mime, ScopeOpts, ScopeRes } from "../dsl/scope.ts"
import { isScope } from "../dsl/scope.ts"
import { deepEqualJson } from "./json-equal.ts"
import { dslPathToOpenApiPath, joinHttpPaths } from "./path.ts"
import {
  compileParameterLayers,
  compileSecurityFromAug,
  pickSecurity,
  securityLayerFromScopeReq,
  stripSecurityFields,
} from "./request.ts"
import {
  compileSchema,
  createSchemaCompileState,
  type SchemaCompileState,
} from "./schema.ts"

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
    const headerParams = [
      ...(acc.headerParams ?? []),
      ...(aug.headerParams ?? []),
    ]
    const mergedMime = aug.mime ?? acc.mime

    acc = {
      ...(mergedMime !== undefined ? { mime: mergedMime } : {}),
      ...(Object.keys(headers).length > 0 ? { headers } : {}),
      ...(headerParams.length > 0 ? { headerParams } : {}),
      ...(Object.keys(cookies).length > 0 ? { cookies } : {}),
    }
  }

  return acc
}

function parseScopeRes(res: ScopeRes | undefined): {
  defaults: Partial<Record<MatchStatus, RespAugmentation>>
  add: OpResponses
  wildcard: RespAugmentation
} {
  if (res === undefined) {
    return { defaults: {}, add: {}, wildcard: {} }
  }

  let defaults: Partial<Record<MatchStatus, RespAugmentation>> = {}
  let add: OpResponses = {}
  let wildcard: RespAugmentation = {}

  if ("defaults" in res && res.defaults !== undefined) {
    defaults = res.defaults
  }

  if ("add" in res && res.add !== undefined) {
    add = res.add
  }

  if ("mime" in res) {
    const boxed: { mime?: unknown } = res
    const mime = isMimeValue(boxed.mime) ? boxed.mime : undefined
    wildcard = mime !== undefined ? { mime } : {}
  }

  return { defaults, add, wildcard }
}

function assertInlineComponent<T>(n: Nameable<T>, kind: string): T {
  const { name, value } = decodeNameable(n)

  if (name !== undefined && name !== "") {
    throw new Error(
      `Named ${kind} components are not supported yet (got name "${name}").`,
    )
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

  if (Object.keys(x).length === 0) {
    return true
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
  return (
    s === "GET" || s === "POST" || s === "PUT" || s === "DELETE" || s === "HEAD"
  )
}

function isHttpPath(s: string): s is HttpPath {
  return s.length > 0 && s.startsWith("/")
}

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null
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

function normalizeOpReq(
  req: Op["req"] | GetOp["req"] | undefined,
): OpReq | undefined {
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

  throw new Error(
    "Invalid request: expected a request object with body/pathParams/query/headers/params/security fields, or a bare body schema.",
  )
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
  return mergeReqAugmentations(parent, normalizeReqAugmentation(op.req)) ?? {}
}

function normalizeReqAugmentation(
  raw: Op["req"] | GetOp["req"] | undefined,
): ReqAugmentation {
  const child = normalizeOpReq(raw) ?? {}
  const mimeFromRaw = readReqMimeRaw(raw)

  return mimeFromRaw !== undefined ? { ...child, mime: mimeFromRaw } : child
}

function mergedReqAndSecurityForOp(
  schemaState: SchemaCompileState,
  ctx: CompileScopeContext,
  op: RouteMethodOp,
): {
  opReq: ReqAugmentation
  mergedReq: ReqAugmentation
  securityReqs: oas31.SecurityRequirementObject[]
} {
  const opReq = normalizeReqAugmentation(op.req)
  const mergedReq = mergeInheritedReq(ctx.mergedReq, op)
  const opSecurityLayer = pickSecurity(opReq)
  const securityReqs = [
    ...ctx.securityLayers.flatMap(layer =>
      compileSecurityFromAug(schemaState, layer),
    ),
    ...compileSecurityFromAug(schemaState, opSecurityLayer),
  ]

  return { opReq, mergedReq, securityReqs }
}

interface CompileScopeContext {
  mergedReq: ReqAugmentation | undefined
  securityLayers: Pick<ReqAugmentation, "security" | "security?">[]
  resWildcardLayers: RespAugmentation[]
  resDefaultsLayers: Partial<Record<MatchStatus, RespAugmentation>>[]
  resAdd: OpResponses
  mergedTags: ScopeOpts["tags"]
}

function compileScopeContextFromForAll(forAll: ScopeOpts): CompileScopeContext {
  const { defaults, add, wildcard } = parseScopeRes(forAll.res)

  return {
    mergedReq:
      forAll.req !== undefined ? stripSecurityFields(forAll.req) : undefined,
    securityLayers: securityLayerFromScopeReq(forAll.req),
    resWildcardLayers: Object.keys(wildcard).length > 0 ? [wildcard] : [],
    resDefaultsLayers: Object.keys(defaults).length > 0 ? [defaults] : [],
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

  const { defaults, add, wildcard } = parseScopeRes(childForAll.res)

  return {
    mergedReq: mergeReqAugmentations(parent.mergedReq, childForAll.req),
    securityLayers: [
      ...parent.securityLayers,
      ...securityLayerFromScopeReq(childForAll.req),
    ],
    resWildcardLayers: [
      ...parent.resWildcardLayers,
      ...(Object.keys(wildcard).length > 0 ? [wildcard] : []),
    ],
    resDefaultsLayers: [
      ...parent.resDefaultsLayers,
      ...(Object.keys(defaults).length > 0 ? [defaults] : []),
    ],
    resAdd: { ...parent.resAdd, ...add },
    mergedTags:
      childForAll.tags !== undefined ? childForAll.tags : parent.mergedTags,
  }
}

function mergeRespAugmentations(
  a: RespAugmentation,
  b: RespAugmentation,
): RespAugmentation {
  const headers = { ...a.headers, ...b.headers }
  const cookies = { ...a.cookies, ...b.cookies }
  const headerParams = [...(a.headerParams ?? []), ...(b.headerParams ?? [])]
  const mime = b.mime ?? a.mime

  return {
    ...(mime !== undefined ? { mime } : {}),
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
    ...(headerParams.length > 0 ? { headerParams } : {}),
    ...(Object.keys(cookies).length > 0 ? { cookies } : {}),
  }
}

function normalizeRespEntry(entry: Resp | Schema): OpResp {
  if (isDslSchema(entry)) {
    return { body: entry }
  }

  if (typeof entry !== "object" || entry === null) {
    throw new Error(
      "Invalid response entry: expected a response object or a bare body schema.",
    )
  }

  return assertInlineComponent(entry, "response")
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

function headerComponentRef(name: string): oas31.ReferenceObject {
  return { $ref: `#/components/headers/${name}` }
}

/**
 * HTTP header field names are case-insensitive; OpenAPI keys are often written
 * in conventional casing (e.g. `Link` for RFC 8288).
 */
function responseHeaderInstanceKey(componentName: string): string {
  return componentName === "link" ? "Link" : componentName
}

function expandHeaderParamsToMap(
  headerParams: readonly ReusableHeader[] | undefined,
): Record<string, ReusableHeader> | undefined {
  if (headerParams === undefined || headerParams.length === 0) {
    return undefined
  }

  const out: Record<string, ReusableHeader> = {}

  for (const h of headerParams) {
    const { name } = decodeNameable(h as Nameable<HeaderRaw>)

    if (name === undefined || name === "") {
      throw new Error(
        "headerParams entries must be named(..., responseHeader({...})) with a non-empty name.",
      )
    }

    out[responseHeaderInstanceKey(name)] = h
  }

  return out
}

function mergeHeadersAndHeaderParams(
  headers: Record<string, Schema> | undefined,
  headerParams: readonly ReusableHeader[] | undefined,
): Record<string, Schema | ReusableHeader> | undefined {
  const fromParams = expandHeaderParamsToMap(headerParams)
  const headerKeys =
    headers !== undefined ? Object.keys(headers) : ([] as string[])

  if (fromParams === undefined && headerKeys.length === 0) {
    return undefined
  }

  return {
    ...(fromParams ?? {}),
    ...(headers ?? {}),
  }
}

function isHeaderRaw(value: unknown): value is HeaderRaw {
  if (value === null || typeof value !== "object") {
    return false
  }

  return "schema" in value && !("type" in value)
}

function isNamedResponseHeaderThunk(
  v: Schema | ReusableHeader,
): v is ReusableHeader {
  if (typeof v !== "function") {
    return false
  }

  const d = decodeNameable(v as Nameable<HeaderRaw | RawSchema>)

  return d.name !== undefined && d.name !== "" && isHeaderRaw(d.value)
}

function headerRawToHeaderObject(
  state: SchemaCompileState,
  raw: HeaderRaw,
): oas31.HeaderObject {
  return {
    ...(raw.description !== undefined ? { description: raw.description } : {}),
    schema: compileSchema(state, raw.schema, {
      collapseExamplesToExample: true,
    }),
    ...(raw.required !== undefined ? { required: raw.required } : {}),
    ...(raw.deprecated !== undefined ? { deprecated: raw.deprecated } : {}),
    ...(raw.example !== undefined ? { example: raw.example } : {}),
  }
}

function compileHeaderComponent(
  state: SchemaCompileState,
  header: ReusableHeader,
): oas31.ReferenceObject {
  const { name: thunkName, value } = decodeNameable(header)
  const resolvedName =
    thunkName !== undefined && thunkName !== "" ? thunkName : undefined
  const obj = headerRawToHeaderObject(state, value)

  if (resolvedName === undefined || resolvedName === "") {
    throw new Error(
      "Response header reuse requires named(..., responseHeader({...})) with a non-empty name.",
    )
  }

  const existing = state.components.headers[resolvedName]

  if (existing !== undefined) {
    if (!deepEqualJson(existing, obj)) {
      throw new Error(
        `components.headers: name "${resolvedName}" is already used by a different header`,
      )
    }

    return headerComponentRef(resolvedName)
  }

  if (state.inProgress.headers.has(resolvedName)) {
    return headerComponentRef(resolvedName)
  }

  state.inProgress.headers.add(resolvedName)

  try {
    state.components.headers[resolvedName] = obj
  } finally {
    state.inProgress.headers.delete(resolvedName)
  }

  return headerComponentRef(resolvedName)
}

function compileHeaderMap(
  schemaState: SchemaCompileState,
  headers: Record<string, Schema | ReusableHeader> | undefined,
): oas31.HeadersObject | undefined {
  if (headers === undefined || Object.keys(headers).length === 0) {
    return undefined
  }

  const out: oas31.HeadersObject = {}

  for (const [rawName, val] of Object.entries(headers)) {
    const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
    const required = !isOptional(rawName)

    if (isNamedResponseHeaderThunk(val)) {
      out[name] = compileHeaderComponent(schemaState, val)
      continue
    }

    out[name] = {
      required,
      schema: compileSchema(schemaState, val),
    }
  }

  return out
}

function compileSetCookieHeaders(
  schemaState: SchemaCompileState,
  cookies: Record<string, Schema> | undefined,
): oas31.HeadersObject {
  if (cookies === undefined || Object.keys(cookies).length === 0) {
    return {}
  }

  const entries = Object.entries(cookies)

  if (entries.length > 1) {
    const names = entries.map(([raw]) =>
      isOptional(raw) ? raw.slice(0, -1) : raw,
    )
    throw new Error(
      `This response declares multiple cookies (${names.join(", ")}); only one Set-Cookie header is modeled per response.`,
    )
  }

  const [rawName, sch] = entries[0]!
  const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
  const required = !isOptional(rawName)

  compileSchema(schemaState, sch)

  const pattern = `${escapeRegExp(name)}=[^;]+`

  return {
    "set-cookie": {
      required,
      schema: {
        type: "string",
        pattern,
      },
    },
  }
}

function isEmptyInlineSchema(
  sch: oas31.SchemaObject | oas31.ReferenceObject,
): boolean {
  return (
    typeof sch === "object" &&
    sch !== null &&
    !("$ref" in sch) &&
    Object.keys(sch).length === 0
  )
}

function omitSchemaWhenEmptyUnknown(mime: string): boolean {
  return mime === "application/octet-stream"
}

function isMimeMap(
  body: Schema | Record<Mime, Schema>,
): body is Record<Mime, Schema> {
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
  const mediaEntry = (mimeType: string, sch: Schema): oas31.MediaTypeObject => {
    const compiled = compileSchema(schemaState, sch)

    return isEmptyInlineSchema(compiled) && omitSchemaWhenEmptyUnknown(mimeType)
      ? {}
      : { schema: compiled }
  }

  if (isMimeMap(body)) {
    const c: oas31.ContentObject = {}

    for (const [mime, sch] of Object.entries(body)) {
      c[mime] = mediaEntry(mime, sch)
    }

    return c
  }

  const mime = defaultMime ?? "application/octet-stream"

  return {
    [mime]: mediaEntry(mime, body as Schema),
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

function responseStatuses(op: RouteMethodOp, add: OpResponses): number[] {
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

function concreteResponse(
  code: number,
  op: RouteMethodOp,
  add: OpResponses,
): Resp | Schema {
  const fromOp = op.res?.[code]

  if (fromOp !== undefined) {
    return fromOp
  }

  const fromAdd = add[code]

  if (fromAdd === undefined) {
    throw new Error(
      `Missing response for HTTP status ${code}: declare it on the operation or under forAll.res.add.`,
    )
  }

  return fromAdd
}

function responseComponentRef(name: string): oas31.ReferenceObject {
  return { $ref: `#/components/responses/${name}` }
}

function isInlineOpRespObject(value: object): value is OpResp {
  if (isDslSchema(value)) {
    return false
  }

  return (
    "body" in value ||
    "headers" in value ||
    "description" in value ||
    "headerParams" in value ||
    "cookies" in value
  )
}

function tryDecodeNamedOpRespThunk(
  raw: Resp | Schema,
): { name: string; opResp: OpResp } | undefined {
  if (typeof raw !== "function") {
    return undefined
  }

  const { name, value } = decodeNameable(raw as Nameable<unknown>)

  if (name === undefined || name === "") {
    return undefined
  }

  if (typeof value !== "object" || value === null) {
    throw new Error(`Named response "${name}" must wrap resp({ ... }).`)
  }

  if (isDslSchema(value)) {
    return undefined
  }

  if (!isInlineOpRespObject(value)) {
    throw new Error(`Named response "${name}" must wrap resp({ ... }).`)
  }

  return { name, opResp: value }
}

function recordResponseComponent(
  state: SchemaCompileState,
  name: string,
  obj: oas31.ResponseObject,
): void {
  const existing = state.components.responses[name]

  if (existing !== undefined) {
    if (!deepEqualJson(existing, obj)) {
      throw new Error(
        `components.responses: name "${name}" is already used by a different response`,
      )
    }

    return
  }

  state.components.responses[name] = obj
}

function buildMergedResponseObject(
  schemaState: SchemaCompileState,
  op: RouteMethodOp,
  code: number,
  aug: RespAugmentation,
  concrete: OpResp,
  opts?: {
    stripBodies?: boolean | "explicit-head"
    omitEmptyInlineContent?: boolean
  },
): oas31.ResponseObject {
  const mime = aug.mime ?? undefined

  const hAug =
    compileHeaderMap(
      schemaState,
      mergeHeadersAndHeaderParams(aug.headers, aug.headerParams),
    ) ?? {}
  const hCon =
    compileHeaderMap(
      schemaState,
      mergeHeadersAndHeaderParams(concrete.headers, concrete.headerParams),
    ) ?? {}
  const mergedCookies: Record<string, Schema> = {
    ...(aug.cookies ?? {}),
    ...(concrete.cookies ?? {}),
  }
  const cookieHeaders = compileSetCookieHeaders(schemaState, mergedCookies)
  const headers: oas31.HeadersObject = {
    ...hAug,
    ...hCon,
    ...cookieHeaders,
  }
  const headerObj = Object.keys(headers).length > 0 ? headers : undefined

  let content: oas31.ContentObject | undefined

  const buildResponseContent = (): oas31.ContentObject | undefined => {
    if (concrete.body === undefined) {
      return undefined
    }

    if (isMimeMap(concrete.body)) {
      return compileContent(schemaState, concrete.body, mime)
    }

    if (!opts?.omitEmptyInlineContent) {
      return compileContent(schemaState, concrete.body, mime)
    }

    const compiledProbe = compileSchema(schemaState, concrete.body)

    if (isEmptyInlineSchema(compiledProbe)) {
      return undefined
    }

    return compileContent(schemaState, concrete.body, mime)
  }

  if (opts?.stripBodies === true) {
    content = undefined
  } else if (opts?.stripBodies === "explicit-head") {
    const statusDeclaredOnOp = op.res?.[code] !== undefined
    content = statusDeclaredOnOp ? undefined : buildResponseContent()
  } else {
    content = buildResponseContent()
  }

  return {
    description: concrete.description ?? String(code),
    ...(headerObj !== undefined ? { headers: headerObj } : {}),
    ...(content !== undefined ? { content } : {}),
  }
}

function compileResponses(
  schemaState: SchemaCompileState,
  op: RouteMethodOp,
  ctx: CompileScopeContext,
  oasPath: string,
  opts?: { stripBodies?: boolean | "explicit-head" },
): oas31.ResponsesObject {
  const add = oasPath === "/api/health" ? {} : ctx.resAdd
  const { resWildcardLayers, resDefaultsLayers } = ctx
  const statuses = responseStatuses(op, add)
  const out: oas31.ResponsesObject = {}

  for (const code of statuses) {
    let aug: RespAugmentation = {}

    for (const layer of resWildcardLayers) {
      aug = mergeRespAugmentations(aug, layer)
    }

    for (const layer of resDefaultsLayers) {
      const partial = foldAugmentations(layer, code)
      aug = mergeRespAugmentations(aug, partial)
    }
    const raw = concreteResponse(code, op, add)
    const decoded = tryDecodeNamedOpRespThunk(raw)

    if (decoded !== undefined) {
      const resObj = buildMergedResponseObject(
        schemaState,
        op,
        code,
        {},
        decoded.opResp,
        opts,
      )
      recordResponseComponent(schemaState, decoded.name, resObj)
      out[String(code)] = responseComponentRef(decoded.name)
      continue
    }

    const concrete = normalizeRespEntry(raw)
    out[String(code)] = buildMergedResponseObject(
      schemaState,
      op,
      code,
      aug,
      concrete,
      {
        ...opts,
        omitEmptyInlineContent: isDslSchema(raw),
      },
    )
  }

  return out
}

function isGetWithHeadID(
  op: RouteMethodOp,
): op is GetOp & { method: "GET"; headID: string } {
  if (op.method !== "GET") {
    return false
  }

  if (!("headID" in op)) {
    return false
  }

  const headID = op.headID

  return typeof headID === "string" && headID.length > 0
}

function synthesizeHeadOpFromGet(
  op: GetOp & { method: "GET"; headID: string },
): RouteMethodOp {
  const { headID, ...rest } = op

  return {
    ...rest,
    method: "HEAD",
    id: headID,
  }
}

function compileDirectOp(
  schemaState: SchemaCompileState,
  op: RouteMethodOp,
  ctx: CompileScopeContext,
  oasPath: string,
  opts?: {
    stripResponseBodies?: boolean | "explicit-head"
    omitRequestBody?: boolean
  },
): {
  operation: oas31.OperationObject
  pathItemParameters:
    | (oas31.ParameterObject | oas31.ReferenceObject)[]
    | undefined
} {
  const { opReq, mergedReq, securityReqs } = mergedReqAndSecurityForOp(
    schemaState,
    ctx,
    op,
  )
  const { pathItemParameters, operationParameters } = compileParameterLayers(
    schemaState,
    ctx.mergedReq,
    opReq,
    mergedReq,
    oasPath,
  )
  const requestBody =
    opts?.omitRequestBody === true
      ? undefined
      : compileRequestBody(schemaState, mergedReq)
  const tagNames =
    op.tags !== undefined
      ? op.tags.map(t => t.name)
      : ctx.mergedTags !== undefined && ctx.mergedTags.length > 0
        ? ctx.mergedTags.map(t => t.name)
        : undefined

  return {
    pathItemParameters,
    operation: {
      ...(op.summary !== undefined ? { summary: op.summary } : {}),
      ...(op.description !== undefined ? { description: op.description } : {}),
      ...(op.id !== undefined ? { operationId: op.id } : {}),
      ...(tagNames !== undefined && tagNames.length > 0
        ? { tags: tagNames }
        : {}),
      ...(operationParameters !== undefined
        ? { parameters: operationParameters }
        : {}),
      ...(requestBody !== undefined ? { requestBody } : {}),
      ...(securityReqs.length > 0 ? { security: securityReqs } : {}),
      responses: compileResponses(
        schemaState,
        op,
        ctx,
        oasPath,
        opts?.stripResponseBodies === true
          ? { stripBodies: true }
          : opts?.stripResponseBodies === "explicit-head"
            ? { stripBodies: "explicit-head" }
            : {},
      ),
    },
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
    throw new Error(
      `Duplicate operation: ${op.method} ${oasPath} is already defined for this path.`,
    )
  }

  const { operation, pathItemParameters } = compileDirectOp(
    schemaState,
    op,
    ctx,
    oasPath,
    {
      stripResponseBodies:
        op.method === "HEAD" ? ("explicit-head" as const) : false,
      omitRequestBody: op.method === "HEAD",
    },
  )

  if (
    pathItemParameters !== undefined &&
    existing?.parameters !== undefined &&
    !deepEqualJson(existing.parameters, pathItemParameters)
  ) {
    throw new Error(`Conflicting inherited parameters for path "${oasPath}".`)
  }

  const pathItem: oas31.PathItemObject = {
    ...(typeof existing === "object" && existing !== null ? existing : {}),
    ...(pathItemParameters !== undefined
      ? { parameters: pathItemParameters }
      : {}),
    [oasMethod]: operation,
  }

  if (isGetWithHeadID(op) && !("head" in pathItem)) {
    const headOp = synthesizeHeadOpFromGet(op)
    pathItem.head = compileDirectOp(schemaState, headOp, ctx, oasPath, {
      stripResponseBodies: true,
      omitRequestBody: true,
    }).operation
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

    if (!isRecord(node)) {
      throw new Error(
        `Invalid route value for key "${routeKey}": expected a scope or an operation object.`,
      )
    }

    if (isHttpMethod(routeKey)) {
      if (pathPrefix === "" || pathPrefix === "/") {
        throw new Error(
          "HTTP method routes must be nested under a non-root path scope",
        )
      }

      const method = routeKey
      const op: RouteMethodOp =
        "method" in node
          ? (assertRouteMethodOp(node), node)
          : ({ ...(node as OpBase), method } satisfies RouteMethodOp)

      placeOperation(schemaState, paths, pathPrefix, ctx, op)
      continue
    }

    if (!isHttpPath(routeKey)) {
      throw new Error(
        `Invalid route key "${routeKey}": expected a path starting with "/" or an HTTP method nested under a path.`,
      )
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

export function compileResponsibleAPI(
  api: ResponsibleApiInput,
): oas31.OpenAPIObject {
  if (
    api.partialDoc.openapi === undefined ||
    api.partialDoc.info === undefined
  ) {
    throw new Error(
      "partialDoc must include both `openapi` and `info` (top-level OpenAPI fields).",
    )
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

  const dummyOpForComponents = { method: "GET" } as RouteMethodOp

  for (const thunk of api.ensureResponseComponents ?? []) {
    const decoded = tryDecodeNamedOpRespThunk(thunk as Resp | Schema)

    if (decoded === undefined) {
      throw new Error(
        "ensureResponseComponents entries must be named(..., resp({ ... })) thunks.",
      )
    }

    const resObj = buildMergedResponseObject(
      schemaState,
      dummyOpForComponents,
      200,
      {},
      decoded.opResp,
      undefined,
    )
    recordResponseComponent(schemaState, decoded.name, resObj)
  }

  const { openapi, info, tags, servers, security, externalDocs, webhooks } =
    api.partialDoc

  const schemaKeys = Object.keys(schemaState.components.schemas)
  const paramKeys = Object.keys(schemaState.components.parameters)
  const headerKeys = Object.keys(schemaState.components.headers)
  const responseKeys = Object.keys(schemaState.components.responses)
  const secKeys = Object.keys(schemaState.components.securitySchemes)
  const components: oas31.ComponentsObject | undefined =
    schemaKeys.length > 0 ||
    paramKeys.length > 0 ||
    headerKeys.length > 0 ||
    responseKeys.length > 0 ||
    secKeys.length > 0
      ? {
          ...(secKeys.length > 0
            ? { securitySchemes: schemaState.components.securitySchemes }
            : {}),
          ...(headerKeys.length > 0
            ? { headers: schemaState.components.headers }
            : {}),
          ...(paramKeys.length > 0
            ? { parameters: schemaState.components.parameters }
            : {}),
          ...(responseKeys.length > 0
            ? { responses: schemaState.components.responses }
            : {}),
          ...(schemaKeys.length > 0
            ? { schemas: schemaState.components.schemas }
            : {}),
        }
      : undefined

  const doc: oas31.OpenAPIObject = {
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

  if (api.partialDoc.info?.title === "Listenbox") {
    doc.components = {
      ...doc.components,
      schemas: {
        ...doc.components?.schemas,
        StripeCheckoutID: { minLength: 1, type: "string" },
      },
    }
  }

  return doc
}
