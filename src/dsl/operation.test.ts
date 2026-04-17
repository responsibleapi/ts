import { describe, test } from "vitest"
import type {
  Assert,
  IsEqual,
  IsNever,
  OneExtendsTwo,
} from "../type-assertions.ts"
import type {
  GetOp,
  GetOpReq,
  InlineHeaderParam,
  InlinePathParam,
  InlineQueryParam,
  Op,
  PathParams,
} from "./operation.ts"
import { declareTags } from "./tags.ts"

describe("operation", () => {
  test("only GET operations accept synthetic HEAD ids", () => {
    type _OpRejectsHeadID = Assert<IsNever<Extract<"headID", keyof Op>>>

    type _OpGETAcceptsHeadID = Assert<
      IsEqual<Extract<"headID", keyof GetOp>, "headID">
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

  test("accepts non-optional path param names", () => {
    type _Test = Assert<
      OneExtendsTwo<{ videoID: { type: "string" } }, PathParams>
    >
  })

  test("accepts inline map-style request params alongside legacy bare schemas", () => {
    type _PathInline = Assert<
      OneExtendsTwo<
        { videoID: { schema: { type: "string" }, style: "label" } },
        PathParams
      >
    >
    type _QueryInline = Assert<
      OneExtendsTwo<
        { "page?": { schema: { type: "integer" }, example: 1, style: "form" } },
        NonNullable<GetOpReq["query"]>
      >
    >
    type _HeaderInline = Assert<
      OneExtendsTwo<
        { "X-Trace?": { schema: { type: "string" }, description: "Trace id" } },
        NonNullable<GetOpReq["headers"]>
      >
    >
    type _QueryLegacy = Assert<
      OneExtendsTwo<{ filter: { type: "string" } }, NonNullable<GetOpReq["query"]>>
    >
  })

  test('rejects path param names ending with "?"', () => {
    type _Test = Assert<
      IsEqual<
        OneExtendsTwo<{ "videoID?": { type: "string" } }, PathParams>,
        false
      >
    >
  })

  test("inline map param types omit parameter object ownership fields", () => {
    type _PathName = Assert<IsNever<Extract<"name", keyof InlinePathParam>>>
    type _PathIn = Assert<IsNever<Extract<"in", keyof InlinePathParam>>>
    type _PathRequired = Assert<
      IsNever<Extract<"required", keyof InlinePathParam>>
    >
    type _QueryName = Assert<IsNever<Extract<"name", keyof InlineQueryParam>>>
    type _QueryIn = Assert<IsNever<Extract<"in", keyof InlineQueryParam>>>
    type _QueryRequired = Assert<
      IsNever<Extract<"required", keyof InlineQueryParam>>
    >
    type _HeaderName = Assert<IsNever<Extract<"name", keyof InlineHeaderParam>>>
    type _HeaderIn = Assert<IsNever<Extract<"in", keyof InlineHeaderParam>>>
    type _HeaderRequired = Assert<
      IsNever<Extract<"required", keyof InlineHeaderParam>>
    >
  })
})
