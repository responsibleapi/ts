import { Validator } from "@seriousme/openapi-schema-validator"
import type { oas31 } from "openapi3-ts"

const VALIDATOR = new Validator()

export async function validate(
  doc: Partial<oas31.OpenAPIObject>,
): Promise<oas31.OpenAPIObject> {
  const vld = await VALIDATOR.validate(doc)

  if (!vld.valid) {
    throw new Error(JSON.stringify(vld.errors, null, 2))
  }

  return doc as oas31.OpenAPIObject
}
