import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import json from "./listenbox.json"

describe("listenbox", () => {
  test("listenbox.json validates as OpenAPI", async () => {
    /** Compiler isn't implemented, this import throws */
    const { default: api } = await import("./listenbox.ts")

    expect(await validate(api)).toEqual<typeof json>(json)
  })
})
