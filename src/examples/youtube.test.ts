import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import youtube from "./youtube.json"

describe("youtube example", () => {
  test("youtube.json validates as OpenAPI", async () => {
    expect(await validate(youtube)).toEqual<typeof youtube>(youtube)
  })
})
