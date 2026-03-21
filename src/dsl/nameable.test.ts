import { describe, expect, test } from "vitest"
import type { Assert, IsEqual, IsNever } from "../type-assertions.ts"
import type { Nameable } from "./nameable.ts"
import { named } from "./nameable.ts"

type NamedArg<T extends Parameters<typeof named>[1]> = Parameters<
  typeof named<T>
>[1]

describe("nameable", () => {
  test("assigns a component name to value-based definitions", () => {
    const inp = {
      in: "query",
      name: "$.xgafv",
    } as const

    const xgafv = named("_.xgafv", inp)
    expect(xgafv.name).toBe("_.xgafv")
    expect(xgafv()).toEqual(inp)
  })

  test("accepts object values", () => {
    type _Test = Assert<
      IsEqual<
        { type: "string"; minLength: 1 },
        NamedArg<{ type: "string"; minLength: 1 }>
      >
    >
  })

  test("rejects thunk-based definitions", () => {
    type _Test = Assert<
      IsNever<NamedArg<() => { type: "string"; minLength: 1 }>>
    >
  })

  test("rejects function-valued nameables", () => {
    type _Test = Assert<IsNever<Nameable<() => string>>>
  })

  function someNamedFunc(): 1 {
    return 1
  }

  test("someNamedFunc is Nameable", () => {
    type _Test = Assert<Nameable<typeof someNamedFunc>>
    type _Test2 = Assert<
      IsEqual<typeof someNamedFunc, NamedArg<typeof someNamedFunc>>
    >
  })
})
