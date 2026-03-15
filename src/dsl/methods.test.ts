import { describe, expect, test } from "vitest"
import { path } from "./methods.ts"
import { httpURL, string } from "./schema.ts"

describe("responsible", () => {
  test("httpURL", () => {
    const { pattern } = httpURL()
    if (typeof pattern !== "string") {
      throw new TypeError("httpURL must return a string pattern")
    }

    const re = new RegExp(pattern)
    expect("https://www.google.com").toMatch(re)
    expect("htps://www.google.com").not.toMatch(re)
    expect("https://www. google.com/").not.toMatch(re)
  })

  test("custom tag", () => {
    expect(() => path`/foo/${string()}/bar`).toThrow("TODO")
    expect(() => path`/${string()}`).toThrow("TODO")
  })
})
