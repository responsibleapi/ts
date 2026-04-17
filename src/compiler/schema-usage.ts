import { decodeNameable } from "../dsl/nameable.ts"
import type { RawSchema, Schema } from "../dsl/schema.ts"
import type { EmittedSchema } from "./emit-schema.ts"

const schemaDescription = (schema: RawSchema): string | undefined =>
  typeof schema === "object" &&
  schema !== null &&
  typeof (schema as { description?: unknown }).description === "string"
    ? ((schema as { description?: string }).description ?? undefined)
    : undefined

const schemaExample = (schema: RawSchema): unknown => {
  if (typeof schema !== "object" || schema === null) {
    return undefined
  }

  const boxed = schema as {
    example?: unknown
    examples?: readonly unknown[]
  }

  if (Array.isArray(boxed.examples) && boxed.examples[0] !== undefined) {
    return boxed.examples[0]
  }

  return boxed.example
}

export const getSchemaUseDescription = (schema: Schema): string | undefined => {
  const decoded = decodeNameable(schema)

  return decoded.description ?? schemaDescription(decoded.value)
}

export const getSchemaUseExample = (schema: Schema): unknown => {
  const decoded = decodeNameable(schema)

  return schemaExample(decoded.value)
}

export const stripSchemaUsageFields = (
  schema: EmittedSchema,
  opts: {
    description?: boolean
    example?: boolean
  },
): EmittedSchema => {
  if (!opts.description && !opts.example) {
    return schema
  }

  const out = { ...schema } as Record<string, unknown>

  if (opts.description) {
    delete out["description"]
  }

  if (opts.example) {
    delete out["example"]
    delete out["examples"]
  }

  return out as EmittedSchema
}
