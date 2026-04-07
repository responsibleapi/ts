---
name: Normalize required-only schemas
overview: Align golden `readme.json` with compiler output by canonicalizing JSON Schema object shards that only declare `required` (no `type` / `properties`) inside `normalize()`, add a focused regression test in `schema.test.ts`, and rely on existing `readme.test.ts` as the full-doc check.
todos:
  - id: normalize-expand
    content: Add required-only object shard expansion in src/help/normalize.ts normVal object branch with safe guards
    status: pending
  - id: schema-test
    content: Add regression test in src/dsl/schema.test.ts comparing normalized compiler vs fixture-shaped allOf body schema
    status: pending
  - id: verify
    content: Run bun check and bun test (readme + schema tests at minimum)
    status: pending
isProject: false
---

# Normalize `required`-only object shards + schema regression test

## What is wrong

- [`src/examples/readme.ts`](src/examples/readme.ts) line 720 uses `body: allOf([category, object({ title: unknown() })])`.
- The compiler emits an explicit second `allOf` branch (verified):

```json
{
  "type": "object",
  "properties": { "title": {} },
  "required": ["title"]
}
```

- The frozen fixture [`src/examples/readme.json`](src/examples/readme.json) lines 429–431 only has `{ "required": ["title"] }`.
- [`src/examples/readme.test.ts`](src/examples/readme.test.ts) compares `normalize(await validate(readmeAPI))` to `normalize(theJSON)` and **fails** on that structural gap (fixture lacks `type` and `properties`).

## Compiler vs normalize

| Approach | Verdict |
|----------|---------|
| **Compiler** ([`src/compiler/schema.ts`](src/compiler/schema.ts) `emitObject`) | Would mean emitting the minimal `{ required: [...] }` shape to match the fixture. That is weaker documentation for “required + any-JSON value” and matches what you called out as a bad encoding. |
| **Normalize** ([`src/help/normalize.ts`](src/help/normalize.ts)) | Fits the existing role of `normalize`: bridge legacy / hand-authored golden shapes with current compiler output (see comment on `normalizePathItemParameters`). Canonical form should be the **explicit** `type: "object"` + `properties: { key: {} }` + `required`, matching the compiler. |

**Recommendation:** implement expansion in [`src/help/normalize.ts`](src/help/normalize.ts) in `normVal`’s object branch **before** `return normObj(o)` (and after existing object tweaks so ordering stays predictable).

### Normalization rule (precise)

When an object:

- has `required` as a non-empty array of strings,
- has **no** `type`,
- has **no** `properties` key (or treat missing only — avoid expanding refs/combinators),

then rewrite to:

- `type: "object"`
- `properties`: `{ [k]: {} }` for each `k` in `required` (stable order: follow sorted `required` after `normVal` runs on arrays, or sort when building entries to match final normalized `required` order),
- preserve any other keys on the object via spread.

**Guards:** skip if `"$ref"`, `"allOf"`, `"oneOf"`, or `"anyOf"` is present (not object shards). Skip if `type` is already set. This keeps the rule scoped to “required-only object applicator” fragments like the fixture.

No change to [`src/examples/readme.json`](src/examples/readme.json) (per AGENTS.md unless you explicitly ask).

## Test in [`src/dsl/schema.test.ts`](src/dsl/schema.test.ts)

Add one test that:

1. Imports `normalize` from [`src/help/normalize.ts`](src/help/normalize.ts).
2. Builds two minimal OpenAPI-shaped wrappers that only differ by the second `allOf` branch:
   - **A:** compiler-shaped `{ type: "object", properties: { title: {} }, required: ["title"] }`
   - **B:** fixture-shaped `{ required: ["title"] }`
3. Wraps each in a tiny valid `OpenAPIObject` (e.g. `openapi`, `info`, `paths: {}`, `components.schemas.UnderTest` with `allOf: [{ $ref: "#/components/schemas/category" }, <branch>]`, plus a minimal `category` schema in components so the doc validates if you run `validate` — **or** skip full-doc validate and only assert `normalize(wrap(A))` deep-equals `normalize(wrap(B))` if both wrappers are plain objects; prefer running `validate` on the wrapper for consistency with other tests in that file).
4. Asserts normalized equality (typecast **expected** side in `toEqual<...>()` per TypeScript skill, not the received value).

Name the test so it points at the readme example (e.g. “readme createCategory body allOf shard normalizes …”) without importing the entire [`readme.ts`](src/examples/readme.ts) if you can keep the snippet local; importing `readmeAPI` is acceptable if you want a true line-720 coupling but pulls a large module — **prefer a local duplicate** of the `allOf([category, object({ title: unknown() })])` pattern with a minimal `category` thunk named `category` so `$ref` matches the fixture fragment.

## Verification

- `bun check`
- `bun test src/dsl/schema.test.ts src/examples/readme.test.ts` (or full `bun test`)

## Outcome

- [`readme.test.ts`](src/examples/readme.test.ts) passes without editing the golden JSON.
- Explicit compiler output remains the source of truth; golden and compiler converge under `normalize`.
