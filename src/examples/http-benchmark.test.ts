import { describe, expect, test } from "bun:test"
import { validate } from "../validate.ts"
import exceptionsJSON from "./http-benchmark.json"
import { httpBenchmarkAPI } from "./http-benchmark.ts"

describe("exceptions example", () => {
  test("exceptions.json validates as OpenAPI", async () => {
    expect(await validate(httpBenchmarkAPI)).toEqual<typeof exceptionsJSON>(
      exceptionsJSON,
    )
  })
})
