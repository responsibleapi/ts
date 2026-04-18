import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"

import { object, string, unknown } from "../dsl/schema.ts"
import { normalize } from "./normalize.ts"

describe("normalize", () => {
  test("sorts supported arrays without mutating the original document", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: {
        title: "Example",
        version: "1.0.0",
      },
      paths: {},
      "x-strings": ["beta", "alpha", "gamma"],
      "x-numbers": [4, 1, 3, 2],
      "x-bools": [true, false, true, false],
      "x-objects": [
        { name: "beta", tags: ["zeta", "alpha"] },
        { name: "alpha", tags: ["gamma", "beta"] },
      ],
      "x-arrays": [
        ["beta", "alpha"],
        ["delta", "charlie"],
      ],
      // "x-mixed": ["beta", 1, false],
      "x-nested": {
        "x-strings": ["delta", "alpha", "charlie"],
      },
    }

    const normalized = normalize(doc)

    expect(normalized).not.toBe(doc)
    expect(normalized.info).not.toBe(doc.info)
    expect(normalized["x-strings"]).not.toBe(doc["x-strings"])
    expect(normalized["x-objects"]).not.toBe(doc["x-objects"])
    expect(normalized["x-arrays"]).not.toBe(doc["x-arrays"])
    expect(normalized["x-nested"]).not.toBe(doc["x-nested"])

    expect(normalized).toMatchObject({
      "x-strings": ["alpha", "beta", "gamma"],
      "x-numbers": [1, 2, 3, 4],
      "x-bools": [false, false, true, true],
      "x-objects": [
        { name: "alpha", tags: ["beta", "gamma"] },
        { name: "beta", tags: ["alpha", "zeta"] },
      ],
      "x-arrays": [
        ["alpha", "beta"],
        ["charlie", "delta"],
      ],
      // "x-mixed": ["beta", 1, false],
      "x-nested": {
        "x-strings": ["alpha", "charlie", "delta"],
      },
    })

    expect(doc).toMatchObject({
      "x-strings": ["beta", "alpha", "gamma"],
      "x-numbers": [4, 1, 3, 2],
      "x-bools": [true, false, true, false],
      "x-objects": [
        { name: "beta", tags: ["zeta", "alpha"] },
        { name: "alpha", tags: ["gamma", "beta"] },
      ],
      "x-arrays": [
        ["beta", "alpha"],
        ["delta", "charlie"],
      ],
      // "x-mixed": ["beta", 1, false],
      "x-nested": {
        "x-strings": ["delta", "alpha", "charlie"],
      },
    })
  })

  test("treats path-item parameters as equivalent to leading operation parameters", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: {
        title: "Example",
        version: "1.0.0",
      },
      paths: {
        "/items/{id}": {
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string" },
            },
          ],
          get: {
            operationId: "getItem",
            parameters: [
              {
                name: "expand",
                in: "query",
                required: false,
                schema: { type: "string" },
              },
            ],
            responses: {
              200: {
                description: "200",
              },
            },
          },
        },
      },
    }

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: {
        title: "Example",
        version: "1.0.0",
      },
      paths: {
        "/items/{id}": {
          get: {
            operationId: "getItem",
            parameters: [
              {
                name: "expand",
                in: "query",
                schema: { type: "string" },
              },
              {
                name: "id",
                in: "path",
                required: true,
                schema: { type: "string" },
              },
            ],
            responses: {
              200: {
                description: "200",
              },
            },
          },
        },
      },
    })
  })

  test("leaves documents without paths unchanged at path-item merge step", () => {
    const doc = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
    } as oas31.OpenAPIObject

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
    })
  })

  test("skips path items that are not objects or have no parameters array", () => {
    const doc = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {
        "/plain": {
          get: {
            responses: { 200: { description: "ok" } },
          },
        },
        "/bad": "not-a-path-item" as unknown as oas31.PathItemObject,
      },
    } as oas31.OpenAPIObject

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {
        "/plain": {
          get: {
            responses: { 200: { description: "ok" } },
          },
        },
        "/bad": "not-a-path-item" as unknown as oas31.PathItemObject,
      },
    })
  })

  test("merges path-level parameters when the operation has no parameters array", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {
        "/items": {
          parameters: [
            {
              name: "shared",
              in: "query",
              schema: { type: "string" },
            },
          ],
          get: {
            responses: { 200: { description: "ok" } },
          },
        },
      },
    }

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {
        "/items": {
          get: {
            parameters: [
              {
                name: "shared",
                in: "query",
                schema: { type: "string" },
              },
            ],
            responses: { 200: { description: "ok" } },
          },
        },
      },
    })
  })

  test("fixes the known YouTube description typo", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-desc": {
        description:
          "ID of the Google+ Page for the channel that the request is be on behalf of",
      },
    }

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-desc": {
        description:
          "ID of the Google+ Page for the channel that the request is on behalf of.",
      },
    })
  })

  test("normalizes schema shapes used in fixture comparisons", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-primitive": {
        type: "integer",
        description: "strip me",
      },
      "x-pattern": {
        type: "string",
        pattern: "^https?:\\/\\/\\S+$",
      },
      "x-empty-props": {
        type: "object",
        properties: {},
      },
      "x-empty-additional-props": {
        type: "object",
        additionalProperties: {},
      },
      "x-body": {
        content: {
          "application/json": {
            schema: { type: "string" },
          },
        },
        required: true,
      },
      "x-optional-param": {
        in: "query",
        name: "q",
        required: false,
        schema: { type: "string" },
      },
      "x-required-only": {
        required: ["b", "a"],
      },
      "x-empty-required": {
        type: "object",
        properties: {
          maybe: { type: "string" },
        },
        required: [],
      },
      "x-null-examples": {
        type: ["string", "null"],
        examples: [null],
      },
    }

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-primitive": {
        type: "integer",
      },
      "x-pattern": {
        type: "string",
        pattern: "^https?://\\S+$",
      },
      "x-empty-props": {
        type: "object",
      },
      "x-empty-additional-props": {
        type: "object",
      },
      "x-body": {
        content: {
          "application/json": {
            schema: { type: "string" },
          },
        },
      },
      "x-optional-param": {
        in: "query",
        name: "q",
        schema: { type: "string" },
      },
      "x-required-only": {
        type: "object",
        properties: {
          a: {},
          b: {},
        },
        required: ["a", "b"],
      },
      "x-empty-required": {
        type: "object",
        properties: {
          maybe: { type: "string" },
        },
      },
      "x-null-examples": {
        type: ["string", "null"],
        examples: [null],
      },
    })
  })

  test("normalizes required-only allOf shards to explicit objects", () => {
    const category = object({ slug: string() })
    const compilerShard = object({ title: unknown() })

    const docCompiler: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "normalize shard", version: "1" },
      paths: {},
      components: {
        schemas: {
          category: category as oas31.SchemaObject,
          UnderTest: {
            allOf: [{ $ref: "#/components/schemas/category" }, compilerShard],
          } as oas31.SchemaObject,
        },
      },
    }

    const docFixture: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "normalize shard", version: "1" },
      paths: {},
      components: {
        schemas: {
          category: category as oas31.SchemaObject,
          UnderTest: {
            allOf: [
              { $ref: "#/components/schemas/category" },
              { required: ["title"] },
            ],
          } as oas31.SchemaObject,
        },
      },
    }

    expect(normalize(docCompiler)).toEqual(normalize(docFixture))
  })

  test("sorts security requirement arrays and canonicalizes scopes", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-security": [
        { b: ["z", "a"], a: [] },
        {},
        { oauth2: ["read", "write"] },
      ],
    }

    expect(normalize(doc)).toEqual<oas31.OpenAPIObject>({
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-security": [
        { a: [], b: ["a", "z"] },
        { oauth2: ["read", "write"] },
        {},
      ],
    })
  })

  test("throws on arrays that cannot be normalized", () => {
    const doc: oas31.OpenAPIObject = {
      openapi: "3.1.0",
      info: { title: "Example", version: "1.0.0" },
      paths: {},
      "x-bad": [1, { a: [] }],
    }

    expect(() => normalize(doc)).toThrow(/Invalid value/)
  })
})
