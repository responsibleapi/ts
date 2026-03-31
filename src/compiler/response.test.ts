import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { responsibleAPI } from "../dsl/dsl.ts"
import { GET, HEAD } from "../dsl/methods.ts"
import { int32, object, string, unknown } from "../dsl/schema.ts"
import { scope } from "../dsl/scope.ts"
import { validate } from "../validate.ts"

describe("compiler response defaults and HEAD", () => {
  test("scope-level res.mime is a wildcard default mime", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Wildcard mime", version: "1" },
      },
      forAll: {
        res: {
          mime: "application/json",
          add: {
            400: unknown(),
          },
        },
      },
      routes: {
        "/items": GET({
          res: {
            200: object({ ok: string() }),
          },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    const paths = rapi.paths ?? {}

    expect(paths["/items"]?.get?.responses).toEqual({
      ["200"]: {
        description: "200",
        content: {
          ["application/json"]: {
            schema: {
              type: "object",
              properties: { ok: { type: "string" } },
              required: ["ok"],
            },
          },
        },
      },
      ["400"]: {
        description: "400",
        content: {
          ["application/json"]: {
            schema: {},
          },
        },
      },
    } satisfies oas31.ResponsesObject)
  })

  test("inherited res.add provides statuses, but local op.res beats inherited add", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Add precedence", version: "1" },
      },
      forAll: {
        res: {
          mime: "application/json",
          add: {
            200: string(),
            404: unknown(),
          },
        },
      },
      routes: {
        "/x": GET({
          res: {
            200: int32(),
          },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    const paths = rapi.paths ?? {}

    expect(paths["/x"]?.get?.responses).toEqual({
      ["200"]: {
        description: "200",
        content: {
          ["application/json"]: {
            schema: { type: "integer", format: "int32" },
          },
        },
      },
      ["404"]: {
        description: "404",
        content: {
          ["application/json"]: {
            schema: {},
          },
        },
      },
    } satisfies oas31.ResponsesObject)
  })

  test("synthetic HEAD from GET headID strips response bodies and uses headID as operationId", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Head synthesis", version: "1" },
      },
      forAll: {
        res: { mime: "application/json" },
      },
      routes: {
        "/p": GET({
          id: "getP",
          headID: "headP",
          res: { 200: object({ ok: string() }) },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    const paths = rapi.paths ?? {}

    expect(paths["/p"]?.head).toEqual({
      operationId: "headP",
      responses: {
        ["200"]: {
          description: "200",
        },
      },
    } satisfies oas31.OperationObject)
  })

  test("explicit HEAD strips response bodies", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Explicit head", version: "1" },
      },
      forAll: {
        res: { mime: "application/json" },
      },
      routes: {
        "/p": HEAD({
          id: "headP",
          res: { 200: object({ ok: string() }) },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    const paths = rapi.paths ?? {}

    expect(paths["/p"]?.head?.responses).toEqual({
      ["200"]: {
        description: "200",
      },
    } satisfies oas31.ResponsesObject)
  })

  test("explicit HEAD prevents GET headID synthesis overwrite", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Explicit head wins", version: "1" },
      },
      forAll: { res: { mime: "application/json" } },
      routes: {
        "/p": scope({
          HEAD: {
            id: "explicitHead",
            res: { 200: unknown() },
          },
          GET: {
            id: "getP",
            headID: "syntheticHead",
            res: { 200: object({ ok: string() }) },
          },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    const paths = rapi.paths ?? {}

    expect(paths["/p"]?.head?.operationId).toEqual("explicitHead")
  })

  test("Set-Cookie header schema uses name=[^;]+ pattern", async () => {
    const rapi = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Cookie pattern", version: "1" },
      },
      forAll: { req: { mime: "application/json" } },
      routes: {
        "/c": GET({
          res: {
            200: {
              description: "ok",
              cookies: { sid: string({ minLength: 1 }) },
            },
          },
        }),
      },
    })

    expect(await validate(rapi)).toEqual(rapi)

    expect(rapi.paths?.["/c"]?.get?.responses?.["200"]?.headers?.["set-cookie"]).toEqual(
      {
        required: true,
        schema: { type: "string", pattern: "sid=[^;]+" },
      },
    )
  })

  test("rejects multiple cookies on one response", () => {
    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "Multi cookie", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/c": GET({
            res: {
              200: {
                cookies: { a: string(), b: string() },
              },
            },
          }),
        },
      }),
    ).toThrow(/multiple cookies/)
  })

  test("rejects multiple cookies after merging defaults and response", () => {
    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "Merged cookies", version: "1" },
        },
        forAll: {
          req: { mime: "application/json" },
          res: {
            defaults: {
              "200": { cookies: { a: string() } },
            },
          },
        },
        routes: {
          "/c": GET({
            res: {
              200: {
                description: "x",
                cookies: { b: string() },
                body: object({ ok: string() }),
              },
            },
          }),
        },
      }),
    ).toThrow(/multiple cookies/)
  })
})

