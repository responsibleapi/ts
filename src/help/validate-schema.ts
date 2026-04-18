/**
 * Validates standalone OpenAPI 3.1 schema objects synchronously.
 *
 * OpenAPI 3.1 aligns Schema Object semantics with JSON Schema draft 2020-12, so
 * this helper uses {@link Ajv2020}. `strict: false` keeps OpenAPI-style
 * extension fields such as `x-*` acceptable during schema validation.
 */
import Ajv2020, { type SchemaObject } from "ajv/dist/2020"

const VALIDATOR = new Ajv2020({ strict: false })

function assertValid<T extends SchemaObject>(
  schema: T,
  valid: boolean,
): asserts schema is T {
  if (!valid) {
    throw new Error(VALIDATOR.errorsText(VALIDATOR.errors))
  }
}

/** Returns schema to be passed to expect() */
export const validateSchema = <T extends SchemaObject>(schema: T): T => {
  const valid = VALIDATOR.validateSchema(schema)

  if (typeof valid !== "boolean") {
    throw new TypeError("validateSchema must stay synchronous")
  }

  assertValid(schema, valid)

  return schema
}
