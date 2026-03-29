import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import theJSON from "./http-benchmark.json"

describe("exceptions example", () => {
  test("exceptions.json validates as OpenAPI", async () => {
    /** compiler isn't implemented, this import throws */
    const { httpBenchmarkAPI } = await import("./http-benchmark.ts")

    expect(await validate(httpBenchmarkAPI)).toEqual<typeof theJSON>(theJSON)
  })
})
