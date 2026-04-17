import type { oas31 } from "openapi3-ts"
import { decodeNameable } from "../dsl/nameable.ts"
import type { Obj, RawSchema, Schema } from "../dsl/schema.ts"
import { deepEqualJson } from "./json-equal.ts"

type Dict = Extract<RawSchema, { type: "object"; propertyNames: unknown }>

export interface SchemaCompileState {
  components: {
    schemas: oas31.SchemasObject
    parameters: Record<string, oas31.ParameterObject | oas31.ReferenceObject>
    headers: Record<string, oas31.HeaderObject | oas31.ReferenceObject>
    responses: Record<string, oas31.ResponseObject>
    securitySchemes: Record<
      string,
      oas31.SecuritySchemeObject | oas31.ReferenceObject
    >
  }
  inProgress: {
    schemas: Set<string>
    parameters: Set<string>
    headers: Set<string>
    securitySchemes: Set<string>
  }
  anonymousSecuritySeq: number
}

export function createSchemaCompileState(): SchemaCompileState {
  return {
    components: {
      schemas: {},
      parameters: {},
      headers: {},
      responses: {},
      securitySchemes: {},
    },
    inProgress: {
      schemas: new Set(),
      parameters: new Set(),
      headers: new Set(),
      securitySchemes: new Set(),
    },
    anonymousSecuritySeq: 0,
  }
}

function schemaRef(name: string): oas31.ReferenceObject {
  return { $ref: `#/components/schemas/${name}` }
}

type EmittedSchema = oas31.SchemaObject | oas31.ReferenceObject

function schemaExampleFields(
  schema: {
  examples?: readonly unknown[]
  },
  opts?: { collapseExamplesToExample?: boolean },
): { example?: unknown } | { examples?: unknown[] } {
  if (opts?.collapseExamplesToExample) {
    const example = schema.examples?.[0]

    return example !== undefined ? { example } : {}
  }

  return schema.examples !== undefined ? { examples: [...schema.examples] } : {}
}

function schemaBaseFields(schema: object): Record<string, unknown> {
  const out = Object.fromEntries(Object.entries(schema))
  delete out["examples"]
  return out
}

function schemaRefWithSiblings(
  name: string,
  siblings: {
    summary?: string
    description?: string
  },
): oas31.ReferenceObject {
  return {
    ...schemaRef(name),
    ...(siblings.summary !== undefined ? { summary: siblings.summary } : {}),
    ...(siblings.description !== undefined
      ? { description: siblings.description }
      : {}),
  }
}

function emitString(
  s: Extract<RawSchema, { type: "string" }>,
  opts?: { collapseExamplesToExample?: boolean },
): oas31.SchemaObject {
  const pattern = s["pattern"]
  const constVal = s.const
  const out: Record<string, unknown> = {
    ...schemaBaseFields(s),
    ...schemaExampleFields(s, opts),
  }

  delete out["pattern"]
  delete out["const"]

  if (constVal !== undefined) {
    out["enum"] = [constVal]
  }

  if (pattern instanceof RegExp) {
    const src = pattern.source
    out["pattern"] = src.startsWith("^https") ? src : src.replace(/\\\//g, "/")
  } else if (pattern !== undefined) {
    out["pattern"] = pattern
  }

  return out as oas31.SchemaObject
}

function emitObject(
  state: SchemaCompileState,
  s: Obj,
  opts?: { collapseExamplesToExample?: boolean },
): oas31.SchemaObject {
  const properties: Record<string, EmittedSchema> = {}

  for (const [k, v] of Object.entries(s.properties)) {
    properties[k] = compileSchema(state, v)
  }

  const required = s.required
  const rest = schemaBaseFields(s)
  delete rest["properties"]
  delete rest["required"]
  delete rest["type"]

  if (
    Object.keys(properties).length === 0 &&
    required !== undefined &&
    required.length > 0 &&
    Object.keys(rest).length === 0
  ) {
    return {
      required: [...required],
    } as oas31.SchemaObject
  }

  const out: Record<string, unknown> = {
    ...rest,
    ...schemaExampleFields(s, opts),
    type: "object",
  }

  if (Object.keys(properties).length > 0) {
    out["properties"] = properties
  }

  if (required !== undefined && required.length > 0) {
    out["required"] = [...required]
  }

  return out as oas31.SchemaObject
}

function emitDict(
  state: SchemaCompileState,
  s: Dict,
  opts?: { collapseExamplesToExample?: boolean },
): oas31.SchemaObject {
  const propertyNames = s.propertyNames
  const additionalProperties = s.additionalProperties
  const rest = schemaBaseFields(s)
  delete rest["propertyNames"]
  delete rest["additionalProperties"]

  const pn = compileSchema(state, propertyNames)
  const ap = compileSchema(state, additionalProperties)
  const out: Record<string, unknown> = {
    ...rest,
    ...schemaExampleFields(s, opts),
    type: "object",
    additionalProperties: ap,
  }

  const bareStringKey =
    typeof pn === "object" &&
    pn !== null &&
    !("$ref" in pn) &&
    Object.keys(pn).length === 1 &&
    (pn as { type?: unknown }).type === "string"

  if (!bareStringKey) {
    out["propertyNames"] = pn
  }

  return out as oas31.SchemaObject
}

/**
 * Compiles a DSL {@link Schema} to an OpenAPI schema or `$ref`, registering
 * named thunks in {@link SchemaCompileState.components} (reserve-in-progress
 * first so recursion terminates).
 */
export function compileSchema(
  state: SchemaCompileState,
  schema: Schema,
  opts?: {
    collapseExamplesToExample?: boolean
    preserveIntNumDescription?: boolean
  },
): EmittedSchema {
  const { name, value, summary, description } = decodeNameable(schema)
  const refSiblings = {
    ...(summary !== undefined ? { summary } : {}),
    ...(description !== undefined ? { description } : {}),
  }

  if (name === undefined || name === "") {
    return compileRawSchema(state, value, opts)
  }

  if (state.components.schemas[name] !== undefined) {
    const existing = state.components.schemas[name]
    const schemaKeysBefore = new Set(Object.keys(state.components.schemas))
    const paramKeysBefore = new Set(Object.keys(state.components.parameters))
    const headerKeysBefore = new Set(Object.keys(state.components.headers))
    const secKeysBefore = new Set(Object.keys(state.components.securitySchemes))

    let candidate: EmittedSchema

    try {
      candidate = compileRawSchema(state, value, {
        preserveIntNumDescription: opts?.preserveIntNumDescription ?? true,
      })
    } finally {
      for (const k of Object.keys(state.components.schemas)) {
        if (!schemaKeysBefore.has(k)) {
          delete state.components.schemas[k]
        }
      }

      for (const k of Object.keys(state.components.parameters)) {
        if (!paramKeysBefore.has(k)) {
          delete state.components.parameters[k]
        }
      }

      for (const k of Object.keys(state.components.headers)) {
        if (!headerKeysBefore.has(k)) {
          delete state.components.headers[k]
        }
      }

      for (const k of Object.keys(state.components.securitySchemes)) {
        if (!secKeysBefore.has(k)) {
          delete state.components.securitySchemes[k]
        }
      }
    }

    if (!deepEqualJson(existing, candidate)) {
      throw new Error(
        `components.schemas: name "${name}" is already used by a different schema definition`,
      )
    }

    return schemaRefWithSiblings(name, refSiblings)
  }

  if (state.inProgress.schemas.has(name)) {
    return schemaRefWithSiblings(name, refSiblings)
  }

  state.inProgress.schemas.add(name)

  try {
    const compiled = compileRawSchema(state, value, {
      preserveIntNumDescription: opts?.preserveIntNumDescription ?? true,
    })

    state.components.schemas[name] = compiled
  } finally {
    state.inProgress.schemas.delete(name)
  }

  return schemaRefWithSiblings(name, refSiblings)
}

function compileRawSchema(
  state: SchemaCompileState,
  s: RawSchema,
  opts?: {
    collapseExamplesToExample?: boolean
    preserveIntNumDescription?: boolean
  },
): oas31.SchemaObject {
  if ("oneOf" in s) {
    return { oneOf: s.oneOf.map(x => compileSchema(state, x)) }
  }

  if ("anyOf" in s) {
    return { anyOf: s.anyOf.map(x => compileSchema(state, x)) }
  }

  if ("allOf" in s) {
    return { allOf: s.allOf.map(x => compileSchema(state, x)) }
  }

  if (!("type" in s)) {
    return {}
  }

  switch (s.type) {
    case "object": {
      if ("propertyNames" in s) {
        return emitDict(state, s, opts)
      }

      return emitObject(state, s, opts)
    }

    case "array": {
      const rest = schemaBaseFields(s)
      delete rest["items"]

      return {
        ...rest,
        ...schemaExampleFields(s, opts),
        type: "array",
        items: compileSchema(state, s.items),
      }
    }

    case "string":
      return emitString(s, opts)

    default: {
      if (s.type === "number" && !opts?.preserveIntNumDescription) {
        const rest = schemaBaseFields(s)
        delete rest["description"]

        return {
          ...rest,
          ...schemaExampleFields(s, opts),
        }
      }

      if (
        s.type === "integer" &&
        !opts?.preserveIntNumDescription &&
        (s as { format?: string }).format !== undefined
      ) {
        const rest = schemaBaseFields(s)
        delete rest["description"]

        return {
          ...rest,
          ...schemaExampleFields(s, opts),
        }
      }

      const rest = schemaBaseFields(s)

      return {
        ...rest,
        ...schemaExampleFields(s, opts),
      }
    }
  }
}
