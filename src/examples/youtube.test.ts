import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { normalize } from "../help/normalize.ts"
import { validate } from "../help/validate.ts"
import json from "./youtube.json"
import youtubeAPI from "./youtube.ts"

describe("youtube example", () => {
  test("youtube.json is valid", async () => {
    expect(await validate(json)).toEqual(json)
  })

  test.skip("youtube.json validates as OpenAPI", async () => {
    expect(normalize(await validate(youtubeAPI))).toEqual(
      normalize(json as unknown as oas31.OpenAPIObject),
    )
  })
})
