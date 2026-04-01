import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { normalize } from "../help/normalize.ts"
import { validate } from "../help/validate.ts"
import theJSON from "./readme.json"
import readmeAPI from "./readme.ts"

describe("readme example", () => {
  test("readme.json validates as OpenAPI", async () => {
    expect(normalize(await validate(readmeAPI))).toEqual(
      normalize(theJSON as oas31.OpenAPIObject),
    )
  })
})
