import { describe, expect, test } from "vitest"
import { exceptionsAPI } from "./exceptions.ts"
import { validate } from "../help/validate.ts"
import theJSON from "./exceptions.json"

describe("exceptions example", () => {
  test("exceptions.json validates as OpenAPI", async () => {
    expect(await validate(exceptionsAPI)).toEqual(theJSON)
  })
})
