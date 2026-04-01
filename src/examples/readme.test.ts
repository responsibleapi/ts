import { describe, expect, test } from "vitest"
import { validate } from "../help/validate.ts"
import theJSON from "./readme.json"
import readmeAPI from "./readme.ts"

describe("readme example", () => {
  test("readme.json validates as OpenAPI", async () => {
    expect(await validate(readmeAPI)).toEqual(theJSON)
  })
})
