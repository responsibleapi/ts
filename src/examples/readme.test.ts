import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import theJSON from "./readme.json"

describe("readme example", () => {
  test("readme.json validates as OpenAPI", async () => {
    /** compiler isn't implemented, this import throws */
    const { default: readmeAPI } = await import("./readme.ts")

    expect(await validate(readmeAPI)).toEqual<typeof theJSON>(theJSON)
  })
})
