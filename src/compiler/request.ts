import type { oas31 } from "openapi3-ts"
import { isOptional, type NameWithOptionality } from "../dsl/dsl.ts"
import type { Nameable } from "../dsl/nameable.ts"
import { decodeNameable } from "../dsl/nameable.ts"
import type {
  InlineHeaderParam,
  InlinePathParam,
  InlineQueryParam,
  ReqAugmentation,
} from "../dsl/operation.ts"
import type { ReusableParam, ParamRaw } from "../dsl/params.ts"
import type { Schema } from "../dsl/schema.ts"
import type { Security } from "../dsl/security.ts"
import { getAttachedSecuritySchemes } from "../dsl/security.ts"
import { deepEqual } from "../help/deep-equal.ts"
import type { ComponentRegistryState } from "./components.ts"
import { emitSchemaRefOrValue, type EmittedSchema } from "./emit-schema.ts"
import { openApiPathTemplateNames } from "./path.ts"
import {
  getSchemaUseDescription,
  getSchemaUseExample,
  stripSchemaUsageFields,
} from "./schema-usage.ts"

type ParameterSchema = EmittedSchema
type InlineMapParameter = InlinePathParam | InlineQueryParam | InlineHeaderParam
type InlineNonPathMapParameter = InlineQueryParam | InlineHeaderParam
type InlineOrLegacyMapParameter = Schema | InlineNonPathMapParameter

function parameterSchemaFields(
  source: Schema,
  compiled: ParameterSchema,
  opts?: {
    example?: boolean
  },
): {
  description?: string
  schema: ParameterSchema
} {
  const description = getSchemaUseDescription(source)

  return {
    ...(description !== undefined ? { description } : {}),
    schema: stripSchemaUsageFields(compiled, {
      description: true,
      ...(opts?.example ? { example: true } : {}),
    }),
  }
}

function isSchemaRef(schema: ParameterSchema): schema is oas31.ReferenceObject {
  return "$ref" in schema
}

function isInlineMapParameter(value: unknown): value is InlineMapParameter {
  return typeof value === "object" && value !== null && "schema" in value
}

function compileLegacyMapParameterFields(
  state: ComponentRegistryState,
  schemaSource: Schema,
): {
  description?: string
  example?: unknown
  schema: ParameterSchema
} {
  const emittedSchema = emitSchemaRefOrValue(state, schemaSource)
  const example = !isSchemaRef(emittedSchema)
    ? getSchemaUseExample(schemaSource)
    : undefined
  const { description, schema } = parameterSchemaFields(
    schemaSource,
    emittedSchema,
    {
      ...(example !== undefined ? { example: true } : {}),
    },
  )

  return {
    ...(description !== undefined ? { description } : {}),
    ...(example !== undefined ? { example } : {}),
    schema,
  }
}

export function stripSecurityFields(
  req: ReqAugmentation | undefined,
): ReqAugmentation | undefined {
  if (req === undefined) {
    return undefined
  }

  const { mime, pathParams, query, headers, params, body } = req

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
    ...(req["security?"] !== undefined
      ? { "security?": req["security?"] }
      : {}),
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
  state: ComponentRegistryState,
  scheme: Nameable<oas31.SecuritySchemeObject> | oas31.SecuritySchemeObject,
): string {
  const { name, value } = decodeNameable(scheme)

  if (name !== undefined && name !== "") {
    const existingScheme = state.components.securitySchemes[name]

    if (existingScheme !== undefined) {
      if (!deepEqual(existingScheme, value)) {
        throw new Error(
          `components.securitySchemes: name "${name}" is already used by a different security scheme`,
        )
      }

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

function registerAttachedSecuritySchemes(
  state: ComponentRegistryState,
  sec: Security,
): void {
  for (const thunk of getAttachedSecuritySchemes(sec)) {
    compileSecurityScheme(state, thunk)
  }
}

function compileSecurityInput(
  state: ComponentRegistryState,
  sec: Security,
): oas31.SecurityRequirementObject[] {
  if (Array.isArray(sec)) {
    registerAttachedSecuritySchemes(state, sec)

    return sec.map(item => {
      if (!isSecurityRequirementObject(item)) {
        throw new Error(
          "Security array entries must be OpenAPI security requirement objects (each key is a scheme name, each value is a scope list).",
        )
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
      registerAttachedSecuritySchemes(state, sec)

      return [sec]
    }

    if (isSecuritySchemeObject(sec)) {
      const schemeName = compileSecurityScheme(state, sec)

      return [{ [schemeName]: [] }]
    }
  }

  throw new Error(
    "Invalid security value: expected a requirement array, a requirement object, a SecuritySchemeObject, or a named security scheme thunk.",
  )
}

export function compileSecurityFromAug(
  state: ComponentRegistryState,
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
  state: ComponentRegistryState,
  raw: ParamRaw,
  hintName?: string,
): oas31.ParameterObject {
  const paramName = raw.name ?? hintName

  if (paramName === undefined || paramName === "") {
    throw new Error(
      "Parameter has no name; set `name` on the parameter or use a named parameter thunk.",
    )
  }

  if (raw.schema === undefined) {
    throw new Error(`Parameter "${paramName}" has no schema.`)
  }

  const schema = emitSchemaRefOrValue(state, raw.schema)
  const example = raw.example ?? getSchemaUseExample(raw.schema)
  const base: oas31.ParameterObject = {
    name: paramName,
    in: raw.in,
    schema:
      example !== undefined && isSchemaRef(schema)
        ? { ...schema, example }
        : schema,
    ...(raw.description !== undefined ? { description: raw.description } : {}),
    ...(example !== undefined ? { example } : {}),
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
    ...(raw.required !== undefined ? { required: raw.required } : {}),
    ...(raw.style !== undefined ? { style: raw.style } : {}),
    ...(raw.explode !== undefined ? { explode: raw.explode } : {}),
  }
}

export function compileParamComponent(
  state: ComponentRegistryState,
  param: ReusableParam,
): oas31.ParameterObject | oas31.ReferenceObject {
  const { name: thunkName, value } = decodeNameable(param)
  const resolvedName =
    thunkName !== undefined && thunkName !== "" ? thunkName : undefined
  const obj = paramRawToParameterObject(state, value, resolvedName)

  if (resolvedName === undefined || resolvedName === "") {
    return obj
  }

  const existingParam = state.components.parameters[resolvedName]

  if (existingParam !== undefined) {
    if (!deepEqual(existingParam, obj)) {
      throw new Error(
        `components.parameters: name "${resolvedName}" is already used by a different parameter`,
      )
    }

    return obj
  }

  if (state.inProgress.parameters.has(resolvedName)) {
    return obj
  }

  state.inProgress.parameters.add(resolvedName)

  try {
    state.components.parameters[resolvedName] = obj
  } finally {
    state.inProgress.parameters.delete(resolvedName)
  }

  return obj
}

function compileMapParameter(
  state: ComponentRegistryState,
  rawName: NameWithOptionality,
  rawParam: InlineOrLegacyMapParameter,
  location: "query" | "header",
): oas31.ParameterObject {
  const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
  let fields: {
    description?: string
    example?: unknown
    schema: ParameterSchema
  }
  let style: "form" | "simple" | undefined
  let explode: boolean | undefined

  if (typeof rawParam === "object" && rawParam !== null && "schema" in rawParam) {
    const schema = emitSchemaRefOrValue(state, rawParam.schema)

    fields = {
      ...(rawParam.description !== undefined
        ? { description: rawParam.description }
        : {}),
      ...(rawParam.example !== undefined ? { example: rawParam.example } : {}),
      schema:
        rawParam.example !== undefined && isSchemaRef(schema)
          ? { ...schema, example: rawParam.example }
          : schema,
    }
    style = rawParam.style
    explode = rawParam.explode
  } else {
    fields = compileLegacyMapParameterFields(state, rawParam)
  }

  const required = !isOptional(rawName)

  return {
    name,
    in: location,
    ...(required ? { required: true } : {}),
    ...(fields.description !== undefined ? { description: fields.description } : {}),
    ...(fields.example !== undefined ? { example: fields.example } : {}),
    ...(style !== undefined ? { style } : {}),
    ...(explode !== undefined ? { explode } : {}),
    schema: fields.schema,
  }
}

function resolvePathParamSchemas(
  mergedReq: ReqAugmentation,
  oasPath: string,
): Record<string, Schema | InlinePathParam> {
  const namesInPath = openApiPathTemplateNames(oasPath)
  const pathParams = { ...(mergedReq.pathParams ?? {}) }

  for (const p of mergedReq.params ?? []) {
    const { name: thunkName, value: v } = decodeNameable(p)

    if (v.in !== "path") {
      continue
    }

    const paramName = v.name ?? thunkName

    if (paramName === undefined || paramName === "") {
      throw new Error("Path parameter in `params` must declare `name`.")
    }

    if (pathParams[paramName] !== undefined) {
      throw new Error(`Duplicate path parameter "${paramName}" in \`params\`.`)
    }

    if (v.schema === undefined) {
      throw new Error(
        `Path parameter "${paramName}" in \`params\` has no schema.`,
      )
    }

    pathParams[paramName] = v.schema
  }

  for (const key of Object.keys(pathParams)) {
    if (isOptional(key)) {
      throw new Error(
        `Optional path parameter key "${key}" is not allowed; path parameters are always required.`,
      )
    }
  }

  for (const name of namesInPath) {
    if (pathParams[name] === undefined) {
      throw new Error(
        `Missing schema for path parameter "{${name}}" in path "${oasPath}" (check pathParams or path \`params\`).`,
      )
    }
  }

  for (const key of Object.keys(pathParams)) {
    if (!namesInPath.includes(key)) {
      throw new Error(
        `pathParams key "${key}" does not appear in path template "${oasPath}".`,
      )
    }
  }

  return pathParams
}

function paramSlotKey(loc: string, name: string): string {
  return `${loc}:${name}`
}

function namedPathParamForTemplateName(
  req: ReqAugmentation | undefined,
  pathName: string,
): ReusableParam | undefined {
  for (const entry of req?.params ?? []) {
    const { name: thunkName, value: v } = decodeNameable(entry)

    if (v.in !== "path") {
      continue
    }

    const paramName = v.name ?? thunkName

    if (paramName !== pathName) {
      continue
    }

    if (thunkName === undefined || thunkName === "") {
      return undefined
    }

    return entry
  }

  return undefined
}

function hasPathParamForTemplateName(
  req: ReqAugmentation | undefined,
  pathName: string,
): boolean {
  if (req?.pathParams?.[pathName] !== undefined) {
    return true
  }

  for (const entry of req?.params ?? []) {
    const { name: thunkName, value: v } = decodeNameable(entry)

    if (v.in !== "path") {
      continue
    }

    const paramName = v.name ?? thunkName

    if (paramName === pathName) {
      return true
    }
  }

  return false
}

function compilePathParametersForLayer(
  state: ComponentRegistryState,
  req: ReqAugmentation | undefined,
  mergedReq: ReqAugmentation,
  oasPath: string,
  seen: Set<string>,
  out: (oas31.ParameterObject | oas31.ReferenceObject)[],
): void {
  const namesInPath = openApiPathTemplateNames(oasPath)
  const pathSchemas = resolvePathParamSchemas(mergedReq, oasPath)

  for (const name of namesInPath) {
    if (!hasPathParamForTemplateName(req, name)) {
      continue
    }

    const slot = paramSlotKey("path", name)

    if (seen.has(slot)) {
      throw new Error(
        `Duplicate path parameter "${name}" for path "${oasPath}".`,
      )
    }

    seen.add(slot)
    const namedPath = namedPathParamForTemplateName(req, name)

    if (namedPath !== undefined) {
      out.push(compileParamComponent(state, namedPath))
    } else {
      const pathParam = pathSchemas[name]!
      let fields: {
        description?: string
        example?: unknown
        schema: ParameterSchema
      }
      let style: InlinePathParam["style"] | undefined
      let explode: boolean | undefined

      if (isInlineMapParameter(pathParam)) {
        fields = {
          ...(pathParam.description !== undefined
            ? { description: pathParam.description }
            : {}),
          ...(pathParam.example !== undefined
            ? { example: pathParam.example }
            : {}),
          schema: emitSchemaRefOrValue(state, pathParam.schema),
        }
        style = pathParam.style
        explode = pathParam.explode
      } else {
        fields = compileLegacyMapParameterFields(state, pathParam)
      }

      out.push({
        name,
        in: "path",
        required: true,
        ...(fields.description !== undefined ? { description: fields.description } : {}),
        ...(fields.example !== undefined ? { example: fields.example } : {}),
        ...(style !== undefined ? { style } : {}),
        ...(explode !== undefined ? { explode } : {}),
        schema: fields.schema,
      })
    }
  }
}

function compileQueryParametersForLayer(
  state: ComponentRegistryState,
  req: ReqAugmentation | undefined,
  seen: Set<string>,
  out: (oas31.ParameterObject | oas31.ReferenceObject)[],
): void {
  const queryMap = req?.query ?? {}

  for (const rawName of Object.keys(queryMap)) {
    const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
    const slot = paramSlotKey("query", name)

    if (seen.has(slot)) {
      throw new Error(`Duplicate query parameter "${name}".`)
    }

    seen.add(slot)
    out.push(compileMapParameter(state, rawName, queryMap[rawName]!, "query"))
  }
}

function compileReusableParametersForLayer(
  state: ComponentRegistryState,
  req: ReqAugmentation | undefined,
  seen: Set<string>,
  out: (oas31.ParameterObject | oas31.ReferenceObject)[],
): void {
  for (const p of req?.params ?? []) {
    const { name: thunkName, value: v } = decodeNameable(p)

    if (v.in === "path") {
      continue
    }

    if (v.in === "query") {
      const paramName = v.name ?? thunkName

      if (paramName === undefined || paramName === "") {
        throw new Error("Query parameter in `params` must declare `name`.")
      }

      const slot = paramSlotKey("query", paramName)

      if (seen.has(slot)) {
        throw new Error(
          `Duplicate query parameter "${paramName}" in \`params\`.`,
        )
      }

      seen.add(slot)
      out.push(compileParamComponent(state, p))
    }

    if (v.in === "header") {
      const paramName = v.name ?? thunkName

      if (paramName === undefined || paramName === "") {
        throw new Error("Header parameter in `params` must declare `name`.")
      }

      const slot = paramSlotKey("header", paramName)

      if (seen.has(slot)) {
        throw new Error(
          `Duplicate header parameter "${paramName}" in \`params\`.`,
        )
      }

      seen.add(slot)
      out.push(compileParamComponent(state, p))
    }
  }
}

function compileHeaderParametersForLayer(
  state: ComponentRegistryState,
  req: ReqAugmentation | undefined,
  seen: Set<string>,
  out: (oas31.ParameterObject | oas31.ReferenceObject)[],
): void {
  const headerMap = req?.headers ?? {}

  for (const rawName of Object.keys(headerMap)) {
    const name = isOptional(rawName) ? rawName.slice(0, -1) : rawName
    const slot = paramSlotKey("header", name)

    if (seen.has(slot)) {
      throw new Error(`Duplicate header parameter "${name}".`)
    }

    seen.add(slot)
    out.push(compileMapParameter(state, rawName, headerMap[rawName]!, "header"))
  }
}

function compileParametersForLayer(
  state: ComponentRegistryState,
  req: ReqAugmentation | undefined,
  mergedReq: ReqAugmentation,
  oasPath: string,
  seen: Set<string>,
): (oas31.ParameterObject | oas31.ReferenceObject)[] | undefined {
  const out: (oas31.ParameterObject | oas31.ReferenceObject)[] = []

  compilePathParametersForLayer(state, req, mergedReq, oasPath, seen, out)
  compileQueryParametersForLayer(state, req, seen, out)
  compileReusableParametersForLayer(state, req, seen, out)
  compileHeaderParametersForLayer(state, req, seen, out)

  return out.length > 0 ? out : undefined
}

export function compileParameterLayers(
  state: ComponentRegistryState,
  inheritedReq: ReqAugmentation | undefined,
  operationReq: ReqAugmentation | undefined,
  mergedReq: ReqAugmentation,
  oasPath: string,
): {
  pathItemParameters:
    | (oas31.ParameterObject | oas31.ReferenceObject)[]
    | undefined
  operationParameters:
    | (oas31.ParameterObject | oas31.ReferenceObject)[]
    | undefined
} {
  const seen = new Set<string>()
  const pathItemParameters = compileParametersForLayer(
    state,
    inheritedReq,
    mergedReq,
    oasPath,
    seen,
  )
  const operationParameters = compileParametersForLayer(
    state,
    operationReq,
    mergedReq,
    oasPath,
    seen,
  )

  return {
    pathItemParameters,
    operationParameters,
  }
}
