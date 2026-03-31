import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import { responsibleAPI } from "../dsl/dsl.ts"
import { GET, POST } from "../dsl/methods.ts"
import { named } from "../dsl/nameable.ts"
import type { Op } from "../dsl/operation.ts"
import type { PathRoutes } from "../dsl/scope.ts"
import { queryParam } from "../dsl/params.ts"
import { int32, object, string } from "../dsl/schema.ts"
import { headerSecurity, httpSecurity } from "../dsl/security.ts"
import { scope } from "../dsl/scope.ts"

function operationRequestMime(
  op: oas31.OperationObject | undefined,
  mime: string,
): oas31.MediaTypeObject | undefined {
  const rb = op?.requestBody

  if (
    rb === undefined ||
    typeof rb !== "object" ||
    !("content" in rb) ||
    rb.content === undefined
  ) {
    return undefined
  }

  return rb.content[mime]
}

describe("compiler request", () => {
  test("compiles query and header params", async () => {
    const api = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Req API", version: "1" },
      },
      forAll: { req: { mime: "application/json" } },
      routes: {
        "/search": GET({
          req: {
            query: { q: string(), "limit?": string() },
            headers: { "X-Request-Id": string() },
          },
          res: { 200: object({}) },
        }),
      },
    })

    const doc = await validate(api)

    expect(doc).toEqual(api)
    const get = doc.paths!["/search"]?.get

    expect(get?.parameters).toEqual([
      {
        name: "q",
        in: "query",
        required: true,
        schema: { type: "string" },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        schema: { type: "string" },
      },
      {
        name: "X-Request-Id",
        in: "header",
        required: true,
        schema: { type: "string" },
      },
    ])
  })

  test("named reusable query param becomes components.parameters $ref", async () => {
    const PageToken = named(
      "pageToken",
      queryParam({
        name: "page_token",
        schema: string(),
      }),
    )

    const api = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Req API", version: "1" },
      },
      forAll: { req: { mime: "application/json" } },
      routes: {
        "/items": GET({
          req: { params: [PageToken] },
          res: { 200: object({}) },
        }),
      },
    })

    const doc = await validate(api)

    expect(doc).toEqual(api)
    expect(doc.components?.parameters?.["pageToken"]).toEqual({
      name: "page_token",
      in: "query",
      schema: { type: "string" },
    })
    expect(doc.paths!["/items"]?.get?.parameters).toEqual([
      { $ref: "#/components/parameters/pageToken" },
    ])
  })

  test("inherits default mime for shorthand body from forAll", async () => {
    const api = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Req API", version: "1" },
      },
      forAll: { req: { mime: "application/json" } },
      routes: {
        "/x": POST({
          req: object({ name: string() }),
          res: { 200: object({}) },
        }),
      },
    })

    const doc = await validate(api)

    expect(doc).toEqual(api)
    expect(
      operationRequestMime(doc.paths!["/x"]?.post, "application/json"),
    ).toBeDefined()
  })

  test("child req.mime overrides inherited default for body", async () => {
    const api = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Req API", version: "1" },
      },
      forAll: { req: { mime: "application/json" } },
      routes: {
        "/x": POST({
          req: {
            mime: "application/xml",
            body: string(),
          } as NonNullable<Op["req"]>,
          res: { 200: object({}) },
        }),
      },
    })

    const doc = await validate(api)

    expect(doc).toEqual(api)
    expect(
      operationRequestMime(doc.paths!["/x"]?.post, "application/xml"),
    ).toBeDefined()
    expect(
      operationRequestMime(doc.paths!["/x"]?.post, "application/json"),
    ).toBeUndefined()
  })

  test("rejects optional path param key", () => {
    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/a/:id": {
            method: "GET",
            req: {
              pathParams: { "id?": string() },
            },
            res: { 200: object({}) },
          },
        } as PathRoutes,
      }),
    ).toThrow(/Optional path parameter key/)
  })

  test("rejects pathParams key not present in path template", () => {
    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/a/:id": GET({
            req: { pathParams: { id: string(), extra: string() } },
            res: { 200: object({}) },
          }),
        },
      }),
    ).toThrow(/does not appear in path template/)
  })

  test("rejects missing path param schema", () => {
    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/a/:id": GET({
            req: { pathParams: {} },
            res: { 200: object({}) },
          }),
        },
      }),
    ).toThrow(/Missing schema for path parameter/)
  })

  test("rejects duplicate query param from params array and query map", () => {
    const Q = named(
      "qDup",
      queryParam({ name: "q", schema: string() }),
    )

    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/search": GET({
            req: {
              params: [Q],
              query: { q: string() },
            },
            res: { 200: object({}) },
          }),
        },
      }),
    ).toThrow(/Duplicate query parameter/)
  })

  test("rejects conflicting reuse of components.parameters name", () => {
    const A = named(
      "dupParam",
      queryParam({ name: "alpha_token", schema: string() }),
    )
    const B = named(
      "dupParam",
      queryParam({ name: "beta_token", schema: int32() }),
    )

    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/a": GET({
            req: { params: [A, B] },
            res: { 200: object({}) },
          }),
        },
      }),
    ).toThrow(/components\.parameters: name "dupParam"/)
  })

  test("rejects conflicting reuse of components.securitySchemes name", () => {
    const A = named("auth", httpSecurity({ scheme: "bearer" }))
    const B = named("auth", httpSecurity({ scheme: "basic" }))

    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json", security: A } },
        routes: {
          "/x": GET({
            req: { security: B },
            res: { 200: object({}) },
          }),
        },
      }),
    ).toThrow(/components\.securitySchemes: name "auth"/)
  })

  test("appends security requirements per scope and operation", async () => {
    const Bearer = named("bearerAuth", httpSecurity({ scheme: "bearer" }))
    const ApiKey = named(
      "apiKeyAuth",
      headerSecurity({ name: "X-Api-Key" }),
    )
    const Digest = named("digestAuth", httpSecurity({ scheme: "digest" }))

    const api = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Sec API", version: "1" },
      },
      forAll: {
        req: {
          mime: "application/json",
          security: Bearer,
        },
      },
      routes: {
        "/v1": scope({
          forAll: {
            req: { security: ApiKey },
          },
          "/r": GET({
            req: {
              security: Digest,
            },
            res: { 200: object({}) },
          }),
        }),
      },
    })

    const doc = await validate(api)

    expect(doc).toEqual(api)
    expect(doc.components?.securitySchemes?.["bearerAuth"]).toMatchObject({
      type: "http",
      scheme: "bearer",
    })
    expect(doc.components?.securitySchemes?.["apiKeyAuth"]).toMatchObject({
      type: "apiKey",
      in: "header",
    })
    expect(doc.paths!["/v1/r"]?.get?.security).toEqual([
      { bearerAuth: [] },
      { apiKeyAuth: [] },
      { digestAuth: [] },
    ] satisfies oas31.SecurityRequirementObject[])
  })

  test("security? appends empty requirement after its requirements", async () => {
    const Bearer = named("bearerAuth", httpSecurity({ scheme: "bearer" }))

    const api = responsibleAPI({
      partialDoc: {
        openapi: "3.1.0",
        info: { title: "Sec API", version: "1" },
      },
      forAll: { req: { mime: "application/json" } },
      routes: {
        "/x": GET({
          req: {
            "security?": Bearer,
          },
          res: { 200: object({}) },
        }),
      },
    })

    const doc = await validate(api)

    expect(doc).toEqual(api)
    expect(doc.paths!["/x"]?.get?.security).toEqual([
      { bearerAuth: [] },
      {},
    ] satisfies oas31.SecurityRequirementObject[])
  })
})
