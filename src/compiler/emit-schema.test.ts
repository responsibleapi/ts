import { describe, expect, test } from "vitest"
import { array, nullable, object, string } from "../dsl/schema.ts"
import { validateSchema } from "../help/validate-schema.ts"
import { createComponentRegistryState } from "./components.ts"
import { emitSchemaRefOrValue } from "./emit-schema.ts"

describe("emitSchemaRefOrValue", () => {
  test("compiles nested array examples with named item schema", () => {
    const Button = () =>
      object({
        text: string(),
        "url?": string({ format: "uri" }),
      })

    const examples = [
      [
        [
          {
            text: "Подробнее",
            url: "https://example.com/details",
          },
        ],
      ],
    ] as const

    const description =
      "Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив."

    const dsl = array(array(Button), {
      description,
      examples,
    })

    expect(
      validateSchema(emitSchemaRefOrValue(createComponentRegistryState(), dsl)),
    ).toEqual({
      type: "array",
      items: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Button",
        },
      },
      description,
      examples,
    })
  })

  test("compiles nullable nested array examples with named item schema", () => {
    const Button = () =>
      object({
        text: string(),
        "url?": string({ format: "uri" }),
      })

    const examples = [
      [
        [
          {
            text: "Подробнее",
            url: "https://example.com/details",
          },
        ],
      ],
      null,
    ] as const

    const description =
      "Массив строк, каждая из которых представлена массивом кнопок. Максимум 100 кнопок у сообщения, до 8 кнопок в строке. Для удаления кнопок пришлите пустой массив."

    const dsl = nullable(
      array(array(Button), {
        description,
        examples,
      }),
    )

    expect(
      validateSchema(emitSchemaRefOrValue(createComponentRegistryState(), dsl)),
    ).toEqual({
      type: ["array", "null"],
      items: {
        type: "array",
        items: {
          $ref: "#/components/schemas/Button",
        },
      },
      description,
      examples,
    })
  })
})
