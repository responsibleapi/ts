import type { oas31 } from "openapi3-ts"
import { decodeNameable, type Nameable } from "../dsl/nameable.ts"
import type { Obj, RawSchema, Schema } from "../dsl/schema.ts"

type Dict = Extract<RawSchema, { type: "object"; propertyNames: unknown }>

function assertInline<T>(n: Nameable<T>, kind: string): T {
  const { name, value } = decodeNameable(n)

  if (name !== undefined && name !== "") {
    throw new Error(`Named ${kind} "${name}" is not supported yet`)
  }

  return value
}

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

function emitObject(s: Obj): oas31.SchemaObject {
  const properties: Record<string, oas31.SchemaObject> = {}

  for (const [k, v] of Object.entries(s.properties)) {
    properties[k] = emitInlineSchema(v)
  }

  const { properties: _p, ...rest } = s

  return {
    ...(rest as Record<string, unknown>),
    type: "object",
    properties,
  } as oas31.SchemaObject
}

function emitDict(s: Dict): oas31.SchemaObject {
  const { propertyNames, additionalProperties, ...rest } = s

  return {
    ...(rest as Record<string, unknown>),
    type: "object",
    propertyNames: emitInlineSchema(propertyNames),
    additionalProperties: emitInlineSchema(additionalProperties),
  } as oas31.SchemaObject
}

export function emitInlineSchema(schema: Schema): oas31.SchemaObject {
  const raw = assertInline(schema, "schema")

  return emitRawSchema(raw)
}

function emitRawSchema(s: RawSchema): oas31.SchemaObject {
  if ("oneOf" in s) {
    return { oneOf: s.oneOf.map(emitInlineSchema) }
  }

  if ("anyOf" in s) {
    return { anyOf: s.anyOf.map(emitInlineSchema) }
  }

  if ("allOf" in s) {
    return { allOf: s.allOf.map(emitInlineSchema) }
  }

  if (!("type" in s)) {
    return {}
  }

  switch (s.type) {
    case "object": {
      if ("propertyNames" in s) {
        return emitDict(s)
      }

      return emitObject(s)
    }

    case "array": {
      const { items, ...rest } = s

      return {
        ...rest,
        type: "array",
        items: emitInlineSchema(items),
      } as oas31.SchemaObject
    }

    case "string":
      return emitString(s)

    default:
      return { ...s } as oas31.SchemaObject
  }
}
