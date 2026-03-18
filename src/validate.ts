import { Validator } from "@seriousme/openapi-schema-validator"
import type { oas31 } from "openapi3-ts"

const VALIDATOR = new Validator()

function assertValidOpenAPIDoc(
  doc: Partial<oas31.OpenAPIObject>,
  valid: boolean,
  errors: unknown,
): asserts doc is oas31.OpenAPIObject {
  if (!valid) {
    throw new Error(JSON.stringify(errors, null, 2))
  }
}

export async function validate(
  doc: Partial<oas31.OpenAPIObject>,
): Promise<oas31.OpenAPIObject> {
  const vld = await VALIDATOR.validate(doc)

  assertValidOpenAPIDoc(doc, vld.valid, vld.errors)

  return doc
}
