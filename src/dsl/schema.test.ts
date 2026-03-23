import { describe, expect, test } from "vitest"
import { object, string } from "./schema.ts"

describe("schema", () => {
  test("supports extended OpenAPI string and integer formats", () => {
    expect(
      object({
        imageBytes: string({ format: "byte" }),
        broadcastStreamDelayMs: {
          type: "integer",
          format: "uint32",
        },
        bitrateBps: {
          type: "integer",
          format: "uint64",
        },
      }),
    ).toEqual({
      type: "object",
      properties: {
        imageBytes: {
          type: "string",
          format: "byte",
        },
        broadcastStreamDelayMs: {
          type: "integer",
          format: "uint32",
        },
        bitrateBps: {
          type: "integer",
          format: "uint64",
        },
      },
      required: ["imageBytes", "broadcastStreamDelayMs", "bitrateBps"],
    })
  })
})
