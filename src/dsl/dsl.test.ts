import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import { responsibleAPI } from "./dsl.ts"
import { POST } from "./methods.ts"
import { int32, object, string } from "./schema.ts"

const Err = object({ messsage: string() })

const SomeSuccess = object({ one: int32() })

describe("dslish", () => {
  test("tst", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: {
          title: "HTTP benchmarks",
          version: "1",
        },
      },
      forAll: {
        req: { mime: "application/json" },
        res: {
          match: {
            "100..499": {
              mime: "application/json",
              headers: { "Content-Length": int32({ minimum: 1 }) },
            },
          },
          add: {
            400: {
              body: Err,
            },
          },
        },
      },
      routes: {
        "/map": POST({
          req: Err,
          res: {
            200: SomeSuccess,
          },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    expect(rapi).toEqual({
      openapi: "3.1.0",
      info: {
        title: "HTTP benchmarks",
        version: "1",
      },
      paths: {
        "/map": {
          post: {
            responses: {
              ["200"]: {
                headers: {
                  ["Content-Length"]: {
                    required: true,
                    schema: { type: "integer", minimum: 1 },
                  },
                },
                content: {
                  ["application/json"]: {
                    schema: "#/components/schemas/SomeSuccess",
                  },
                },
              },
              ["400"]: {
                content: {
                  ["application/json"]: {
                    schema: "#/components/schemas/Err",
                  },
                },
              },
            },
          },
        },
      },
    } satisfies oas31.OpenAPIObject)
  })
})
