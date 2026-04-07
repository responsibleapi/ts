import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { normalize } from "../help/normalize.ts"
import { validate } from "../help/validate.ts"
import type { RawSchema } from "./schema.ts"
import {
  allOf,
  anyOf,
  array,
  boolean,
  dict,
  double,
  email,
  float,
  httpURL,
  integer,
  int32,
  int64,
  number,
  object,
  oneOf,
  string,
  unixMillis,
  unknown,
  uint32,
  uint64,
} from "./schema.ts"

const docWithSchema = (schema: RawSchema): Partial<oas31.OpenAPIObject> => ({
  openapi: "3.1.0",
  info: {
    title: "Schema test",
    version: "1",
  },
  paths: {},
  components: {
    schemas: {
      UnderTest: schema as oas31.SchemaObject,
    },
  },
})

const expectValidSchema = async (schema: RawSchema): Promise<void> => {
  const doc = docWithSchema(schema)
  await expect(validate(doc)).resolves.toEqual(doc)
}

describe("schema", () => {
  test("array", async () => {
    const schema = array(string(), {
      minItems: 1,
      maxItems: 3,
      example: ["a"],
    })

    expect(schema).toEqual({
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
      maxItems: 3,
      example: ["a"],
    })

    await expectValidSchema(schema)
  })

  test("dict", async () => {
    const schema = dict(string({ minLength: 1 }), int32({ minimum: 0 }), {
      description: "Localized values by language code",
      deprecated: true,
      example: { en: 1 },
    })

    expect(schema).toEqual({
      type: "object",
      propertyNames: {
        type: "string",
        minLength: 1,
      },
      additionalProperties: {
        type: "integer",
        format: "int32",
        minimum: 0,
      },
      description: "Localized values by language code",
      deprecated: true,
      example: { en: 1 },
    })

    await expectValidSchema(schema)
  })

  test("object", async () => {
    const schema = object(
      {
        title: string(),
        "subtitle?": string(),
      },
      {
        description: "Article metadata",
        deprecated: true,
      },
    )

    expect(schema).toEqual({
      description: "Article metadata",
      deprecated: true,
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        subtitle: {
          type: "string",
        },
      },
      required: ["title"],
    })

    await expectValidSchema(schema)
  })

  test("object with optional property names yields empty required", async () => {
    const schema = object({
      "title?": string(),
      "subtitle?": string(),
    })

    expect(schema).toEqual({
      type: "object",
      properties: {
        title: {
          type: "string",
        },
        subtitle: {
          type: "string",
        },
      },
      required: [],
    })

    await expectValidSchema(schema)
  })

  test("int64", async () => {
    const schema = int64({
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    expect(schema).toEqual({
      type: "integer",
      format: "int64",
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    await expectValidSchema(schema)
  })

  test("int32", async () => {
    const schema = int32({
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    expect(schema).toEqual({
      type: "integer",
      format: "int32",
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    await expectValidSchema(schema)
  })

  test("integer", async () => {
    const schema = integer({
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    expect(schema).toEqual({
      type: "integer",
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    await expectValidSchema(schema)
  })

  test("uint64", async () => {
    const schema = uint64({
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    expect(schema).toEqual({
      type: "integer",
      format: "uint64",
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    await expectValidSchema(schema)
  })

  test("float", async () => {
    const schema = float({
      minimum: 1.25,
      maximum: 9.5,
      example: 4.75,
    })

    expect(schema).toEqual({
      type: "number",
      format: "float",
      minimum: 1.25,
      maximum: 9.5,
      example: 4.75,
    })

    await expectValidSchema(schema)
  })

  test("double", async () => {
    const schema = double({
      minimum: 1.25,
      maximum: 9.5,
      example: 4.75,
    })

    expect(schema).toEqual({
      type: "number",
      format: "double",
      minimum: 1.25,
      maximum: 9.5,
      example: 4.75,
    })

    await expectValidSchema(schema)
  })

  test("number", async () => {
    const schema = number({
      minimum: 1.25,
      maximum: 9.5,
      example: 4.75,
    })

    expect(schema).toEqual({
      type: "number",
      minimum: 1.25,
      maximum: 9.5,
      example: 4.75,
    })

    await expectValidSchema(schema)
  })

  test("uint32", async () => {
    const schema = uint32({
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    expect(schema).toEqual({
      type: "integer",
      format: "uint32",
      minimum: 1,
      maximum: 10,
      example: 4,
    })

    await expectValidSchema(schema)
  })

  test("httpURL", async () => {
    const schema = httpURL()

    expect(schema).toEqual({
      type: "string",
      format: "uri",
      pattern: "^https?://\\S+$",
    })

    if (typeof schema.pattern !== "string") {
      throw new TypeError("httpURL must return a string pattern")
    }

    const re = new RegExp(schema.pattern)
    expect("https://www.google.com").toMatch(re)
    expect("htps://www.google.com").not.toMatch(re)
    expect("https://www. google.com/").not.toMatch(re)

    await expectValidSchema(schema)
  })

  test("unixMillis", async () => {
    const schema = unixMillis()

    expect(schema).toEqual({
      type: "integer",
      format: "int64",
      description: "UNIX epoch milliseconds",
    })

    await expectValidSchema(schema)
  })

  test("string", async () => {
    const schema = string({
      format: "byte",
      minLength: 1,
      maxLength: 8,
      pattern: "^[a-z]+$",
      enum: ["alpha", "beta"],
      example: "alpha",
    })

    expect(schema).toEqual({
      type: "string",
      format: "byte",
      minLength: 1,
      maxLength: 8,
      pattern: "^[a-z]+$",
      enum: ["alpha", "beta"],
      example: "alpha",
    })

    await expectValidSchema(schema)
  })

  test("oneOf", async () => {
    const schema = oneOf([string(), int32()])

    expect(schema).toEqual({
      oneOf: [
        {
          type: "string",
        },
        {
          type: "integer",
          format: "int32",
        },
      ],
    })

    await expectValidSchema(schema)
  })

  test("anyOf", async () => {
    const schema = anyOf([string(), int32()])

    expect(schema).toEqual({
      anyOf: [
        {
          type: "string",
        },
        {
          type: "integer",
          format: "int32",
        },
      ],
    })

    await expectValidSchema(schema)
  })

  test("allOf", async () => {
    const schema = allOf([
      object({
        name: string(),
      }),
      object({
        "nickname?": string(),
      }),
    ])

    expect(schema).toEqual({
      allOf: [
        {
          type: "object",
          properties: {
            name: {
              type: "string",
            },
          },
          required: ["name"],
        },
        {
          type: "object",
          properties: {
            nickname: {
              type: "string",
            },
          },
          required: [],
        },
      ],
    })

    await expectValidSchema(schema)
  })

  test("boolean", async () => {
    const schema = boolean({
      description: "Whether the feature is enabled",
      deprecated: true,
      default: false,
    })

    expect(schema).toEqual({
      type: "boolean",
      description: "Whether the feature is enabled",
      deprecated: true,
      default: false,
    })

    await expectValidSchema(schema)
  })

  test("unknown", async () => {
    const schema = unknown()

    expect(schema).toEqual({})

    await expectValidSchema(schema)
  })

  test("email", async () => {
    const schema = email()

    expect(schema).toEqual({
      type: "string",
      format: "email",
    })

    await expectValidSchema(schema)
  })

  test("readme createCategory body allOf second shard: required-only normalizes to explicit object", async () => {
    const category = object({ slug: string() })
    const compilerShard = object({ title: unknown() })

    const docCompiler: Partial<oas31.OpenAPIObject> = {
      openapi: "3.1.0",
      info: { title: "normalize shard", version: "1" },
      paths: {},
      components: {
        schemas: {
          category: category as oas31.SchemaObject,
          UnderTest: {
            allOf: [
              { $ref: "#/components/schemas/category" },
              compilerShard,
            ],
          } as oas31.SchemaObject,
        },
      },
    }

    const docFixture: Partial<oas31.OpenAPIObject> = {
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

    const normCompiler = normalize(await validate(docCompiler))
    const normFixture = normalize(await validate(docFixture))

    expect(normCompiler).toEqual(normFixture)
  })
})
