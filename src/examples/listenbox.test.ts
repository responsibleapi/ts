import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import json from "./listenbox.json"

describe("listenbox example", () => {
  test("listenbox.json validates as OpenAPI", async () => {
    /** compiler isn't implemented, this import throws */
    const { default: api } = await import("./listenbox.ts")

    expect(await validate(api)).toEqual<typeof json>(json)
  })
})
