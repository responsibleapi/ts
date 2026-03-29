import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import theJSON from "./exceptions.json"

describe("exceptions example", () => {
  test("exceptions.json validates as OpenAPI", async () => {
    /** compiler isn't implemented, this import throws */
    const { exceptionsAPI } = await import("./exceptions.ts")

    expect(await validate(exceptionsAPI)).toEqual<typeof theJSON>(theJSON)
  })
})
