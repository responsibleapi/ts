import { Validator } from "@seriousme/openapi-schema-validator"
import type { OpenAPIObject } from "openapi3-ts/oas31"

const VALIDATOR = new Validator()

function assertValid(
  doc: Partial<OpenAPIObject>,
  v: Awaited<ReturnType<typeof VALIDATOR.validate>>,
): asserts doc is OpenAPIObject {
  if (!v.valid) {
    throw new Error(JSON.stringify(v.errors, null, 2))
  }
}

/** returns {@link OpenAPIObject} to be passed to expect() */
export async function validate(
  doc: Partial<OpenAPIObject>,
): Promise<OpenAPIObject> {
  const vld = await VALIDATOR.validate(doc)

  assertValid(doc, vld)

  return doc
}
