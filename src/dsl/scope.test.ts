import { describe, test } from "vitest"
import type {
  Assert,
  IsEqual,
  IsNever,
  OneExtendsTwo,
} from "../type-assertions.ts"
import type { Op } from "./scope.ts"
import { scope } from "./scope.ts"
import { declareTags } from "./tags.ts"

type TestOp = {
  res: {
    200: Record<string, never>
  }
}

type PureScope = {
  GET: TestOp
  POST: TestOp
}

type SingleMethodPureScope = {
  GET: TestOp
}

type WrappedPureScope = {
  routes: PureScope
}

type WrappedSingleMethodPureScope = {
  routes: SingleMethodPureScope
}

type ScopeArg<T extends (...args: never[]) => unknown> = Parameters<T>[0]

describe("scope", () => {
  test("accepts a pure scope with at least two methods", () => {
    type _Test = Assert<
      OneExtendsTwo<PureScope, ScopeArg<typeof scope<PureScope>>>
    >
  })

  test("rejects a pure scope with only one method", () => {
    type _Test = Assert<IsNever<ScopeArg<typeof scope<SingleMethodPureScope>>>>
  })

  test("accepts a wrapped pure scope with at least two methods", () => {
    type _Test = Assert<
      OneExtendsTwo<WrappedPureScope, ScopeArg<typeof scope<WrappedPureScope>>>
    >
  })

  test("rejects wrapped routes with only one method", () => {
    type _Test = Assert<
      IsNever<ScopeArg<typeof scope<WrappedSingleMethodPureScope>>["routes"]>
    >
  })

  test("accepts declared tags on operations", () => {
    const tags = declareTags({
      videos: {},
      channels: {},
    } as const)

    type _Test = Assert<
      IsEqual<
        NonNullable<Op<typeof tags>["tags"]>,
        readonly (typeof tags.videos | typeof tags.channels)[]
      >
    >
  })

  test("rejects inline tag objects on operations", () => {
    const tags = declareTags({
      videos: {},
    } as const)

    type _Test = Assert<
      IsNever<
        Extract<
          { readonly name: "videos" },
          NonNullable<Op<typeof tags>["tags"]>[number]
        >
      >
    >
  })
})
