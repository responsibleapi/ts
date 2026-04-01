import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { normalize } from "../help/normalize.ts"
import { validate } from "../help/validate.ts"
import json from "./listenbox.json"
import listenboxAPI from "./listenbox.ts"

describe("listenbox", () => {
  test("listenbox.json validates as OpenAPI", async () => {
    expect(normalize(await validate(listenboxAPI))).toEqual(
      normalize(json as oas31.OpenAPIObject),
    )
  })
})
