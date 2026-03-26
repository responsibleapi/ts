import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import json from "./youtube.json"
// import api from "./youtube.ts"

describe("youtube example", () => {
  test("youtube.json is valid", async () => {
    expect(await validate(json)).toEqual(json)
  })

  // test("youtube.json validates as OpenAPI", async () => {
  //   expect(await validate(api)).toEqual<typeof json>(json)
  // })
})
