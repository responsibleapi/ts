import { describe, expect, test } from "vitest"
import { rewriteSingleEnumIsConst } from "./single-enum-is-const.ts"

describe("rewriteSingleEnumIsConst", () => {
  test("rewrites single-item enum in schema string helper options", () => {
    const input = [
      'import { string } from "../src/dsl/schema.ts"',
      "",
      "const value = string({",
      '  description: "x",',
      '  enum: ["corner"],',
      "})",
      "",
    ].join("\n")

    expect(rewriteSingleEnumIsConst(input)).toEqual([
      'import { string } from "../src/dsl/schema.ts"',
      "",
      "const value = string({",
      '  description: "x",',
      '  const: "corner",',
      "})",
      "",
    ].join("\n"))
  })

  test("rewrites aliased schema string imports", () => {
    const input = [
      'import { string as text } from "../src/dsl/schema.ts"',
      "",
      'const value = text({ enum: ["corner"] })',
      "",
    ].join("\n")

    expect(rewriteSingleEnumIsConst(input)).toEqual([
      'import { string as text } from "../src/dsl/schema.ts"',
      "",
      'const value = text({ const: "corner" })',
      "",
    ].join("\n"))
  })

  test("does not rewrite multi-item enums", () => {
    const input = [
      'import { string } from "../src/dsl/schema.ts"',
      "",
      'const value = string({ enum: ["corner", "edge"] })',
      "",
    ].join("\n")

    expect(rewriteSingleEnumIsConst(input)).toEqual(input)
  })

  test("does not rewrite raw OpenAPI schema objects", () => {
    const input = [
      "const value = {",
      '  type: "string",',
      '  enum: ["corner"],',
      "}",
      "",
    ].join("\n")

    expect(rewriteSingleEnumIsConst(input)).toEqual(input)
  })

  test("does not rewrite when const already exists", () => {
    const input = [
      'import { string } from "../src/dsl/schema.ts"',
      "",
      'const value = string({ enum: ["corner"], const: "corner" })',
      "",
    ].join("\n")

    expect(rewriteSingleEnumIsConst(input)).toEqual(input)
  })
})
