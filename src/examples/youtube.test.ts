import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { canonical } from "../help/canonical.ts"
import { validateDoc } from "../help/validate-doc.ts"
import json from "./youtube.json"
import youtubeAPI from "./youtube.ts"

describe("youtube example", () => {
  test("youtube.json is valid", async () => {
    expect(await validateDoc(json)).toEqual(json)
  })

  test("youtube.json validates as OpenAPI", async () => {
    expect(canonical(await validateDoc(youtubeAPI))).toEqual(
      canonical(json as oas31.OpenAPIObject),
    )
  })
})
