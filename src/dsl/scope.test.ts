import { describe, test } from "vitest"
import type {
  Assert,
  IsEqual,
  IsNever,
  OneExtendsTwo,
} from "../type-assertions.ts"
import type { ScopeOpts } from "./scope.ts"
import { scope } from "./scope.ts"
import { declareTags } from "./tags.ts"

type TestOp = {
  res: {
    200: Record<string, never>
  }
}

type ScopeInput<T extends Parameters<typeof scope>[0]> = Parameters<
  typeof scope<T>
>[0]

describe("scope", () => {
  test("accepts a pure scope with at least two methods", () => {
    type PureScope = {
      GET: TestOp
      POST: TestOp
    }

    type _Test = Assert<OneExtendsTwo<PureScope, ScopeInput<PureScope>>>
  })

  test("rejects a pure scope with only one method", () => {
    type _Test = Assert<IsNever<ScopeInput<{ GET: TestOp }>>>
  })

  test("accepts a flat scope with defaults and at least two methods", () => {
    type PureScopeWithDefaults = {
      forAll: ScopeOpts
      GET: TestOp
      POST: TestOp
    }

    type _Test = Assert<
      OneExtendsTwo<PureScopeWithDefaults, ScopeInput<PureScopeWithDefaults>>
    >
  })

  test("rejects a flat scope with defaults and only one method", () => {
    type _Test = Assert<IsNever<ScopeInput<{ forAll: ScopeOpts; GET: TestOp }>>>
  })

  test("rejects forAll.res.match in scope defaults", () => {
    // TODO write a type assertion
  })

  test("accepts a scope with a single method and a single path", () => {
    type MixedScope = {
      GET: TestOp
      "/videos": TestOp
    }

    type _Test = Assert<OneExtendsTwo<MixedScope, ScopeInput<MixedScope>>>
  })

  test("accepts a scope with a single path", () => {
    type PathOnlyScope = {
      "/videos": TestOp
    }

    type _Test = Assert<OneExtendsTwo<PathOnlyScope, ScopeInput<PathOnlyScope>>>
  })

  test("accepts declared tags in scope defaults", () => {
    const tags = declareTags({
      videos: {},
      channels: {},
    } as const)

    type _Test = Assert<
      IsEqual<
        NonNullable<ScopeOpts<typeof tags>["tags"]>,
        readonly (typeof tags.videos | typeof tags.channels)[]
      >
    >
  })

  test("rejects inline tag objects in scope defaults", () => {
    const tags = declareTags({
      videos: {},
    } as const)

    type _Test = Assert<
      IsNever<
        Extract<
          { readonly name: "videos" },
          NonNullable<ScopeOpts<typeof tags>["tags"]>[number]
        >
      >
    >
  })
})
