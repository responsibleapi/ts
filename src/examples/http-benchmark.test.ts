import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import theJSON from "./http-benchmark.json"

describe("http-benchmark example", () => {
  test("http-benchmark.json validates as OpenAPI", async () => {
    expect(await validate(theJSON)).toEqual<typeof theJSON>(theJSON)
  })

  test.skip("httpBenchmarkAPI matches http-benchmark.json", async () => {
    const { httpBenchmarkAPI } = await import("./http-benchmark.ts")

    expect(await validate(httpBenchmarkAPI)).toEqual<typeof theJSON>(theJSON)
  })
})
