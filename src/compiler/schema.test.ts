import type { oas31 } from "openapi3-ts"
import { describe, expect, test } from "vitest"
import { responsibleAPI } from "../dsl/dsl.ts"
import { POST } from "../dsl/methods.ts"
import type { NamedThunk } from "../dsl/nameable.ts"
import { named, ref } from "../dsl/nameable.ts"
import type { Obj, Schema } from "../dsl/schema.ts"
import { array, int32, object, string } from "../dsl/schema.ts"
import { validate } from "../help/validate.ts"
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

    expect(
      doc.paths?.["/x"]?.post?.requestBody,
    ).toEqual<oas31.RequestBodyObject>({
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

  test("schema $ref siblings are preserved on object properties", () => {
    const Shared = named("Shared", object({ id: int32() }))
    const state = createSchemaCompileState()

    const compiled = compileSchema(
      state,
      object({
        first: ref(Shared, { description: "First shared schema" }),
        second: ref(Shared, { description: "Second shared schema" }),
      }),
    )

    expect(compiled).toEqual<oas31.SchemaObject>({
      type: "object",
      properties: {
        first: {
          $ref: "#/components/schemas/Shared",
          description: "First shared schema",
        },
        second: {
          $ref: "#/components/schemas/Shared",
          description: "Second shared schema",
        },
      },
      required: ["first", "second"],
    })

    expect(state.components.schemas["Shared"]).toEqual<oas31.SchemaObject>({
      type: "object",
      properties: {
        id: { type: "integer", format: "int32" },
      },
      required: ["id"],
    })
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
