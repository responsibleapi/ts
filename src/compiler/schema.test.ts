import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { validate } from "../validate.ts"
import { responsibleAPI } from "../dsl/dsl.ts"
import type { NamedThunk } from "../dsl/nameable.ts"
import { named } from "../dsl/nameable.ts"
import { POST } from "../dsl/methods.ts"
import type { Obj, Schema } from "../dsl/schema.ts"
import { array, int32, object, string } from "../dsl/schema.ts"
import { compileSchema, createSchemaCompileState } from "./schema.ts"

/** Lazy {@link NamedThunk} for recursive schemas (`named()` is eager-only). */
function recursiveNamedTree(): NamedThunk<Obj> {
  function Tree(): Obj {
    return object({
      label: string(),
      children: array(Tree as Schema),
    })
  }

  Object.defineProperty(Tree, "name", { configurable: true, value: "Tree" })

  return Tree as NamedThunk<Obj>
}

describe("compiler schema", () => {
  test("inline schema has no components section via API", async () => {
    const doc = await validate(
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/x": POST({
            req: object({ n: int32() }),
            res: { 200: object({ ok: int32() }) },
          }),
        },
      }),
    )

    expect("components" in doc).toBe(false)
  })

  test("named schema becomes $ref and registers components", async () => {
    const Payload = named(
      "Payload",
      object({
        message: string(),
      }),
    )

    const doc = await validate(
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/x": POST({
            req: Payload,
            res: { 200: object({ ok: int32() }) },
          }),
        },
      }),
    )

    expect(doc.components?.schemas?.["Payload"]).toEqual<oas31.SchemaObject>({
      type: "object",
      properties: {
        message: { type: "string" },
      },
      required: ["message"],
    })

    expect(doc.paths?.["/x"]?.post?.requestBody).toEqual<
      oas31.RequestBodyObject
    >({
      required: true,
      content: {
        "application/json": {
          schema: { $ref: "#/components/schemas/Payload" },
        },
      },
    })
  })

  test("recursive named schema compiles with reserved slot", async () => {
    const Tree = recursiveNamedTree()

    const state = createSchemaCompileState()
    const root = compileSchema(state, Tree)

    expect(root).toEqual<oas31.ReferenceObject>({
      $ref: "#/components/schemas/Tree",
    })

    expect(state.components.schemas["Tree"]).toEqual<oas31.SchemaObject>({
      type: "object",
      properties: {
        label: { type: "string" },
        children: {
          type: "array",
          items: { $ref: "#/components/schemas/Tree" },
        },
      },
      required: ["label", "children"],
    })

    await validate({
      openapi: "3.1.0",
      info: { title: "t", version: "1" },
      paths: {},
      components: { schemas: state.components.schemas },
    })
  })

  test("second reference to same name reuses component", async () => {
    const Shared = named("Shared", object({ id: int32() }))

    const doc = await validate(
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/x": POST({
            req: object({ a: Shared, b: Shared }),
            res: { 200: object({ ok: int32() }) },
          }),
        },
      }),
    )

    expect(doc.paths?.["/x"]?.post?.requestBody).toEqual<
      oas31.RequestBodyObject | undefined
    >({
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              a: { $ref: "#/components/schemas/Shared" },
              b: { $ref: "#/components/schemas/Shared" },
            },
            required: ["a", "b"],
          },
        },
      },
    })
    expect(Object.keys(doc.components?.schemas ?? {})).toEqual(["Shared"])
  })

  test("rejects conflicting reuse of components.schemas name", () => {
    const A = named("Dup", object({ x: int32() }))
    const B = named("Dup", object({ y: string() }))

    expect(() =>
      responsibleAPI({
        partialDoc: {
          openapi: "3.1.0",
          info: { title: "t", version: "1" },
        },
        forAll: { req: { mime: "application/json" } },
        routes: {
          "/a": POST({
            req: object({ u: A, v: B }),
            res: { 200: object({}) },
          }),
        },
      }),
    ).toThrow(/components\.schemas: name "Dup"/)
  })
})
