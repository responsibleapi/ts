import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { normalize } from "../help/normalize.ts"
import { validateDoc } from "../help/validate-doc.ts"
import theJSON from "./exceptions.json"
import { exceptionsAPI } from "./exceptions.ts"

describe("exceptions", () => {
  test("fixture", async () => {
    expect(normalize(await validateDoc(exceptionsAPI))).toEqual(
      normalize(theJSON as oas31.OpenAPIObject),
    )
  })
})
