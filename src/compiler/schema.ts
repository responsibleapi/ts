import type { oas31 } from "openapi3-ts"
import { decodeNameable } from "../dsl/nameable.ts"
import type { Obj, RawSchema, Schema } from "../dsl/schema.ts"

type Dict = Extract<RawSchema, { type: "object"; propertyNames: unknown }>

export interface SchemaCompileState {
  components: {
    schemas: oas31.SchemasObject
    parameters: Record<string, oas31.ParameterObject | oas31.ReferenceObject>
    securitySchemes: Record<
      string,
      oas31.SecuritySchemeObject | oas31.ReferenceObject
    >
  }
  inProgress: {
    schemas: Set<string>
    parameters: Set<string>
    securitySchemes: Set<string>
  }
  anonymousSecuritySeq: number
}

export function createSchemaCompileState(): SchemaCompileState {
  return {
    components: {
      schemas: {},
      parameters: {},
      securitySchemes: {},
    },
    inProgress: {
      schemas: new Set(),
      parameters: new Set(),
      securitySchemes: new Set(),
    },
    anonymousSecuritySeq: 0,
  }
}

function schemaRef(name: string): oas31.ReferenceObject {
  return { $ref: `#/components/schemas/${name}` }
}

type EmittedSchema = oas31.SchemaObject | oas31.ReferenceObject

function emitString(s: Extract<RawSchema, { type: "string" }>): oas31.SchemaObject {
  const pattern = s["pattern"]
  const out: Record<string, unknown> = { ...s }

  delete out["pattern"]

  if (pattern instanceof RegExp) {
    out["pattern"] = pattern.source
  } else if (pattern !== undefined) {
    out["pattern"] = pattern
  }

  return out as oas31.SchemaObject
}

function emitObject(state: SchemaCompileState, s: Obj): oas31.SchemaObject {
  const properties: Record<string, EmittedSchema> = {}

  for (const [k, v] of Object.entries(s.properties)) {
    properties[k] = compileSchema(state, v)
  }

  const { properties: _p, ...rest } = s

  return {
    ...(rest as Record<string, unknown>),
    type: "object",
    properties,
  } as oas31.SchemaObject
}

function emitDict(state: SchemaCompileState, s: Dict): oas31.SchemaObject {
  const { propertyNames, additionalProperties, ...rest } = s

  return {
    ...(rest as Record<string, unknown>),
    type: "object",
    propertyNames: compileSchema(state, propertyNames),
    additionalProperties: compileSchema(state, additionalProperties),
  } as oas31.SchemaObject
}

/**
 * Compiles a DSL {@link Schema} to an OpenAPI schema or `$ref`, registering
 * named thunks in {@link SchemaCompileState.components} (reserve-in-progress
 * first so recursion terminates).
 */
export function compileSchema(
  state: SchemaCompileState,
  schema: Schema,
): EmittedSchema {
  const { name, value } = decodeNameable(schema)

  if (name === undefined || name === "") {
    return compileRawSchema(state, value)
  }

  if (state.components.schemas[name] !== undefined) {
    return schemaRef(name)
  }

  if (state.inProgress.schemas.has(name)) {
    return schemaRef(name)
  }

  state.inProgress.schemas.add(name)

  try {
    const compiled = compileRawSchema(state, value)

    state.components.schemas[name] = compiled
  } finally {
    state.inProgress.schemas.delete(name)
  }

  return schemaRef(name)
}

function compileRawSchema(state: SchemaCompileState, s: RawSchema): oas31.SchemaObject {
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
        return emitDict(state, s)
      }

      return emitObject(state, s)
    }

    case "array": {
      const { items, ...rest } = s

      return {
        ...rest,
        type: "array",
        items: compileSchema(state, items),
      } as oas31.SchemaObject
    }

    case "string":
      return emitString(s)

    default:
      return { ...s } as oas31.SchemaObject
  }
}
