import { describe, expect, test } from "vitest"

import { validateSchema } from "../help/validate-schema.ts"
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
  int32,
  int64,
  integer,
  nullable,
  number,
  object,
  oneOf,
  string,
  uint32,
  uint64,
  unixMillis,
  unknown,
} from "./schema.ts"

describe("schema", () => {
  test("array", () => {
    const schema = array(string(), {
      minItems: 1,
      maxItems: 3,
      examples: [["a"]],
    })

    expect(schema).toEqual({
      type: "array",
      items: {
        type: "string",
      },
      minItems: 1,
      maxItems: 3,
      examples: [["a"]],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("dict", () => {
    const schema = dict(string({ minLength: 1 }), int32({ minimum: 0 }), {
      description: "Localized values by language code",
      deprecated: true,
      examples: [{ en: 1 }],
    })

    expect(validateSchema(schema)).toEqual({
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
      examples: [{ en: 1 }],
    })
  })

  test("dict omits default string propertyNames", () => {
    const schema = dict(string(), int32({ minimum: 0 }))

    expect(schema).toEqual({
      type: "object",
      additionalProperties: {
        type: "integer",
        format: "int32",
        minimum: 0,
      },
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("object", () => {
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

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("object with optional property names omits required", () => {
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
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("int64", () => {
    const schema = int64({
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(schema).toEqual({
      type: "integer",
      format: "int64",
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("int32", () => {
    const schema = int32({
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(schema).toEqual({
      type: "integer",
      format: "int32",
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("integer", () => {
    const schema = integer({
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(schema).toEqual({
      type: "integer",
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("uint64", () => {
    const schema = uint64({
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(schema).toEqual({
      type: "integer",
      format: "uint64",
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("float", () => {
    const schema = float({
      minimum: 1.25,
      maximum: 9.5,
      examples: [4.75],
    })

    expect(schema).toEqual({
      type: "number",
      format: "float",
      minimum: 1.25,
      maximum: 9.5,
      examples: [4.75],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("double", () => {
    const schema = double({
      minimum: 1.25,
      maximum: 9.5,
      examples: [4.75],
    })

    expect(schema).toEqual({
      type: "number",
      format: "double",
      minimum: 1.25,
      maximum: 9.5,
      examples: [4.75],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("number", () => {
    const schema = number({
      minimum: 1.25,
      maximum: 9.5,
      examples: [4.75],
    })

    expect(schema).toEqual({
      type: "number",
      minimum: 1.25,
      maximum: 9.5,
      examples: [4.75],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("uint32", () => {
    const schema = uint32({
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(schema).toEqual({
      type: "integer",
      format: "uint32",
      minimum: 1,
      maximum: 10,
      examples: [4],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("httpURL", () => {
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

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("unixMillis", () => {
    const schema = unixMillis()

    expect(schema).toEqual({
      type: "integer",
      format: "int64",
      description: "UNIX epoch milliseconds",
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("string", () => {
    const schema = string({
      format: "byte",
      minLength: 1,
      maxLength: 8,
      pattern: "^[a-z]+$",
      enum: ["alpha", "beta"],
      examples: ["alpha"],
    })

    expect(schema).toEqual({
      type: "string",
      format: "byte",
      minLength: 1,
      maxLength: 8,
      pattern: "^[a-z]+$",
      enum: ["alpha", "beta"],
      examples: ["alpha"],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("string stringifies RegExp pattern", () => {
    const schema = string({
      minLength: 1,
      pattern: /^[a-z]+$/i,
      examples: ["alpha"],
    })

    expect(schema).toEqual({
      type: "string",
      minLength: 1,
      pattern: "^[a-z]+$",
      examples: ["alpha"],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("string with contentMediaType", () => {
    const schema = string({
      description: "OpenAPI/Swagger file. We accept JSON or YAML.",
      contentMediaType: "application/octet-stream",
    })

    expect(schema).toEqual({
      type: "string",
      description: "OpenAPI/Swagger file. We accept JSON or YAML.",
      contentMediaType: "application/octet-stream",
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("string with vendor extensions", () => {
    const schema = string({
      description: "Тип события webhook для пользователей",
      enum: ["invite", "confirm", "update", "suspend", "activate", "delete"],
      "x-enum-descriptions": {
        invite: "Приглашение",
        confirm: "Подтверждение",
        update: "Обновление",
        suspend: "Приостановка",
        activate: "Активация",
        delete: "Удаление",
      },
    })

    expect(schema).toEqual({
      type: "string",
      description: "Тип события webhook для пользователей",
      enum: ["invite", "confirm", "update", "suspend", "activate", "delete"],
      "x-enum-descriptions": {
        invite: "Приглашение",
        confirm: "Подтверждение",
        update: "Обновление",
        suspend: "Приостановка",
        activate: "Активация",
        delete: "Удаление",
      },
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("oneOf", () => {
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

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("anyOf", () => {
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

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("allOf", () => {
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
        },
      ],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("nullable", () => {
    const schema = nullable(int32({ examples: [7] }))

    expect(schema).toEqual({
      type: ["integer", "null"],
      format: "int32",
      examples: [7],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("nullable oneOf", () => {
    const schema = nullable(oneOf([string(), int32()]))

    expect(schema).toEqual({
      anyOf: [
        {
          oneOf: [
            {
              type: "string",
            },
            {
              type: "integer",
              format: "int32",
            },
          ],
        },
        {
          type: "null",
        },
      ],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("nullable unknown", () => {
    const schema = nullable(unknown())

    expect(schema).toEqual({})

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("nullable anyOf", () => {
    const schema = nullable(anyOf([string(), int32()]))

    expect(schema).toEqual({
      anyOf: [
        {
          anyOf: [
            {
              type: "string",
            },
            {
              type: "integer",
              format: "int32",
            },
          ],
        },
        {
          type: "null",
        },
      ],
    })

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("boolean", () => {
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

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("unknown", () => {
    const schema = unknown()

    expect(schema).toEqual({})

    expect(validateSchema(schema)).toEqual(schema)
  })

  test("email", () => {
    const schema = email()

    expect(schema).toEqual({
      type: "string",
      format: "email",
    })

    expect(validateSchema(schema)).toEqual(schema)
  })
})
