import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { normalize } from "../help/normalize.ts"
import { validateDoc } from "../help/validate-doc.ts"
import json from "./youtube.json"
import youtubeAPI from "./youtube.ts"

describe("youtube example", () => {
  test("youtube.json is valid", async () => {
    expect(await validateDoc(json)).toEqual(json)
  })

  test("youtube.json validates as OpenAPI", async () => {
    expect(normalize(await validateDoc(youtubeAPI))).toEqual(
      normalize(json as oas31.OpenAPIObject),
    )
  })
})
