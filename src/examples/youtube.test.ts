import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import json from "./youtube.json"

describe("youtube example", () => {
  test("youtube.json is valid", async () => {
    expect(await validate(json as oas31.OpenAPIObject)).toEqual(json)
  })

  test("youtube.json validates as OpenAPI", async () => {
    /** compiler isn't implemented, this import throws */
    const { default: api } = await import("./youtube.ts")

    expect(await validate(api)).toEqual<typeof json>(json)
  })
})
