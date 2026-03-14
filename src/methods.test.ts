import { describe, expect, test } from "vitest"
import { path } from "./methods.ts"
import { httpURL, string } from "./schema.ts"

describe("responsible", () => {
  test("httpURL", () => {
    const re = new RegExp(httpURL().pattern!)
    expect("https://www.google.com").toMatch(re)
    expect("htps://www.google.com").not.toMatch(re)
    expect("https://www. google.com/").not.toMatch(re)
  })

  test("custom tag", () => {
    path`/foo/${string()}/bar`
    path`/${string()}`
  })
})
