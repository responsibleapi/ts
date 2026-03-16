import { describe, expect, test } from "bun:test"
import { validate } from "../validate.ts"
import { listenboxAPI } from "./listenbox.ts"
import listenboxOpenAPI from "./listenbox.yaml" assert { type: "yaml" }

describe("listenbox example", () => {
  test("listenbox.yaml validates as OpenAPI", async () => {
    expect(await validate(listenboxAPI)).toEqual(listenboxOpenAPI)
  })
})
