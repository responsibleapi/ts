import type { oas31 } from "openapi3-ts"
import { isOptional, type NameWithOptionality } from "../dsl/dsl.ts"
import type { Nameable } from "../dsl/nameable.ts"
import { decodeNameable } from "../dsl/nameable.ts"
import type { ReqAugmentation } from "../dsl/operation.ts"
import type { Param, ParamRaw } from "../dsl/params.ts"
import type { Security } from "../dsl/security.ts"
import type { Schema } from "../dsl/schema.ts"
import { openApiPathTemplateNames } from "./path.ts"
import { compileSchema, type SchemaCompileState } from "./schema.ts"

export function stripSecurityFields(
  req: ReqAugmentation | undefined,
): ReqAugmentation | undefined {
  if (req === undefined) {
    return undefined
  }

  const {
    mime,
    pathParams,
    query,
    headers,
    params,
    body,
  } = req

  const out: ReqAugmentation = {
    ...(mime !== undefined ? { mime } : {}),
    ...(pathParams !== undefined ? { pathParams } : {}),
    ...(query !== undefined ? { query } : {}),
    ...(headers !== undefined ? { headers } : {}),
    ...(params !== undefined ? { params } : {}),
    ...(body !== undefined ? { body } : {}),
  }

  return Object.keys(out).length === 0 ? undefined : out
}

export function pickSecurity(
  req: ReqAugmentation | undefined,
): Pick<ReqAugmentation, "security" | "security?"> {
  if (req === undefined) {
    return {}
  }

  return {
    ...(req.security !== undefined ? { security: req.security } : {}),
    ...(req["security?"] !== undefined ? { "security?": req["security?"] } : {}),
  }
}

function hasSecurityKeys(req: ReqAugmentation | undefined): boolean {
  return (
    req !== undefined &&
    (req.security !== undefined || req["security?"] !== undefined)
  )
}

export function securityLayerFromScopeReq(
  req: ReqAugmentation | undefined,
): Pick<ReqAugmentation, "security" | "security?">[] {
  return hasSecurityKeys(req) ? [pickSecurity(req)] : []
}

function parameterRef(name: string): oas31.ReferenceObject {
  return { $ref: `#/components/parameters/${name}` }
}

const SCHEME_TYPES = new Set([
  "apiKey",
  "http",
  "oauth2",
  "openIdConnect",
  "mutualTLS",
])

function isSecuritySchemeObject(x: unknown): x is oas31.SecuritySchemeObject {
  if (typeof x !== "object" || x === null || !("type" in x)) {
    return false
  }

  const t = (x as { type?: unknown }).type

  return typeof t === "string" && SCHEME_TYPES.has(t)
}

function isSecurityRequirementObject(
  x: unknown,
): x is oas31.SecurityRequirementObject {
  if (typeof x !== "object" || x === null) {
    return false
  }

  if ("type" in x) {
    return false
  }

  return Object.values(x).every(v => Array.isArray(v))
}

function compileSecurityScheme(
  state: SchemaCompileState,
  scheme: Nameable<oas31.SecuritySchemeObject> | oas31.SecuritySchemeObject,
): string {
  const { name, value } = decodeNameable(scheme)

  if (name !== undefined && name !== "") {
    if (state.components.securitySchemes[name] !== undefined) {
      return name
    }

    if (state.inProgress.securitySchemes.has(name)) {
      return name
    }

    state.inProgress.securitySchemes.add(name)

    try {
      state.components.securitySchemes[name] = value
    } finally {
      state.inProgress.securitySchemes.delete(name)
    }

    return name
  }

  const anon = `__anonSecurity${state.anonymousSecuritySeq++}`

  state.components.securitySchemes[anon] = value

  return anon
}

function compileSecurityInput(
  state: SchemaCompileState,
  sec: Security,
): oas31.SecurityRequirementObject[] {
  if (Array.isArray(sec)) {
    return sec.map(item => {
      if (!isSecurityRequirementObject(item)) {
        throw new Error("Invalid entry in security requirement array")
      }

      return item
    })
  }

  if (typeof sec === "function") {
    const schemeName = compileSecurityScheme(state, sec)

    return [{ [schemeName]: [] }]
  }

  if (typeof sec === "object" && sec !== null) {
    if (isSecurityRequirementObject(sec)) {
      return [sec]
    }

    if (isSecuritySchemeObject(sec)) {
      const schemeName = compileSecurityScheme(state, sec)

      return [{ [schemeName]: [] }]
    }
  }

  throw new Error("Invalid security value")
}

export function compileSecurityFromAug(
  state: SchemaCompileState,
  layer: Pick<ReqAugmentation, "security" | "security?">,
): oas31.SecurityRequirementObject[] {
  const out: oas31.SecurityRequirementObject[] = []

  if (layer.security !== undefined) {
    out.push(...compileSecurityInput(state, layer.security))
  }

  if (layer["security?"] !== undefined) {
    out.push(...compileSecurityInput(state, layer["security?"]), {})
  }

  return out
}

function paramRawToParameterObject(
  state: SchemaCompileState,
  raw: ParamRaw,
  hintName?: string,
): oas31.ParameterObject {
  const paramName = raw.name ?? hintName

  if (paramName === undefined || paramName === "") {
    throw new Error("Parameter is missing a name")
  }

  if (raw.schema === undefined) {
    throw new Error(`Parameter "${paramName}" is missing a schema`)
  }

  const schema = compileSchema(state, raw.schema)
  const base: oas31.ParameterObject = {
    name: paramName,
    in: raw.in,
    schema,
    ...(raw.description !== undefined ? { description: raw.description } : {}),
  }

  if (raw.in === "path") {
    return {
      ...base,
      required: true,
      ...(raw.style !== undefined ? { style: raw.style } : {}),
      ...(raw.explode !== undefined ? { explode: raw.explode } : {}),
    }
  }

  return {
    ...base,
    required: raw.required ?? false,
    ...(raw.style !== undefined ? { style: raw.style } : {}),
    ...(raw.explode !== undefined ? { explode: raw.explode } : {}),
  }
}

export function compileParamComponent(
  state: SchemaCompileState,
  param: Param,
): oas31.ParameterObject | oas31.ReferenceObject {
  const { name: thunkName, value } = decodeNameable(param)
  const resolvedName =
    thunkName !== undefined && thunkName !== "" ? thunkName : undefined
  const obj = paramRawToParameterObject(state, value, resolvedName)

  if (resolvedName === undefined || resolvedName === "") {
    return obj
  }

  if (state.components.parameters[resolvedName] !== undefined) {
    return parameterRef(resolvedName)
  }

  if (state.inProgress.parameters.has(resolvedName)) {
    return parameterRef(resolvedName)
  }

  state.inProgress.parameters.add(resolvedName)

  try {
    state.components.parameters[resolvedName] = obj
  } finally {
    state.inProgress.parameters.delete(resolvedName)
  }

  return parameterRef(resolvedName)
}

function compileMapParameter(
  state: SchemaCompileState,
  rawName: NameWithOptionality,
  sch: Schema,
  location: "query" | "header",
): oas31.ParameterObject {
  const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName

  return {
    name,
    in: location,
    required: !isOptional(rawName),
    schema: compileSchema(state, sch),
  }
}

function resolvePathParamSchemas(
  mergedReq: ReqAugmentation,
  oasPath: string,
): Record<string, Schema> {
  const namesInPath = openApiPathTemplateNames(oasPath)
  const pathParams = { ...(mergedReq.pathParams ?? {}) }

  for (const p of mergedReq.params ?? []) {
    const { name: thunkName, value: v } = decodeNameable(p)

    if (v.in !== "path") {
      continue
    }

    const paramName = v.name ?? thunkName

    if (paramName === undefined || paramName === "") {
      throw new Error("Path param in params array must have a name")
    }

    if (pathParams[paramName] !== undefined) {
      throw new Error(`Duplicate path param "${paramName}"`)
    }

    if (v.schema === undefined) {
      throw new Error(`Path param "${paramName}" is missing a schema`)
    }

    pathParams[paramName] = v.schema
  }

  for (const key of Object.keys(pathParams)) {
    if (isOptional(key)) {
      throw new Error(`Optional path param key "${key}" is not allowed`)
    }
  }

  for (const name of namesInPath) {
    if (pathParams[name] === undefined) {
      throw new Error(`Missing pathParams schema for "${name}" in path ${oasPath}`)
    }
  }

  for (const key of Object.keys(pathParams)) {
    if (!namesInPath.includes(key)) {
      throw new Error(`pathParams key "${key}" is not used in path ${oasPath}`)
    }
  }

  return pathParams
}

function paramSlotKey(loc: string, name: string): string {
  return `${loc}:${name}`
}

export function compileOperationParameters(
  state: SchemaCompileState,
  mergedReq: ReqAugmentation,
  oasPath: string,
): (oas31.ParameterObject | oas31.ReferenceObject)[] | undefined {
  const namesInPath = openApiPathTemplateNames(oasPath)
  const pathSchemas = resolvePathParamSchemas(mergedReq, oasPath)
  const seen = new Set<string>()
  const out: (oas31.ParameterObject | oas31.ReferenceObject)[] = []

  for (const name of namesInPath) {
    const slot = paramSlotKey("path", name)

    if (seen.has(slot)) {
      throw new Error(`Duplicate path parameter "${name}"`)
    }

    seen.add(slot)
    out.push({
      name,
      in: "path",
      required: true,
      schema: compileSchema(state, pathSchemas[name]!),
    })
  }

  for (const p of mergedReq.params ?? []) {
    const { name: thunkName, value: v } = decodeNameable(p)

    if (v.in === "path") {
      continue
    }

    if (v.in === "query") {
      const paramName = v.name ?? thunkName

      if (paramName === undefined || paramName === "") {
        throw new Error("Query param in params array must have a name")
      }

      const slot = paramSlotKey("query", paramName)

      if (seen.has(slot)) {
        throw new Error(`Duplicate query parameter "${paramName}"`)
      }

      seen.add(slot)
      out.push(compileParamComponent(state, p))
    }
  }

  const queryMap = mergedReq.query ?? {}

  for (const rawName of Object.keys(queryMap)) {
    const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
    const slot = paramSlotKey("query", name)

    if (seen.has(slot)) {
      throw new Error(`Duplicate query parameter "${name}"`)
    }

    seen.add(slot)
    out.push(compileMapParameter(state, rawName, queryMap[rawName]!, "query"))
  }

  const headerMap = mergedReq.headers ?? {}

  for (const rawName of Object.keys(headerMap)) {
    const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
    const slot = paramSlotKey("header", name)

    if (seen.has(slot)) {
      throw new Error(`Duplicate header parameter "${name}"`)
    }

    seen.add(slot)
    out.push(compileMapParameter(state, rawName, headerMap[rawName]!, "header"))
  }

  return out.length > 0 ? out : undefined
}
