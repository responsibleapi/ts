import { describe, expect, test } from "vitest"
import { validateDoc } from "../help/validate-doc.ts"
import theJSON from "./pachca.json"

describe("pachca", () => {
  test("pachca.json is valid", async () => {
    expect(await validateDoc(theJSON)).toEqual(theJSON)
  })
})
