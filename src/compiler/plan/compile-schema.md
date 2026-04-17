# Compile Schema Removal Plan

## Goal

- Delete `src/compiler/schema.ts`.
- Stop rewriting schema shape in compiler.
- Keep only work compiler actually owns:
  - resolve `Nameable<Schema>` into inline schema or `$ref`
  - register named schemas into `components.schemas`
  - terminate recursive named schema graphs
  - preserve `$ref` siblings from `ref(...)`

## Why Remove It

- `src/dsl/schema.ts` already models OpenAPI 3.1 / JSON Schema payloads.
- Current compiler layer mixes two different jobs:
  - graph lowering: named thunk -> component + `$ref`
  - schema mutation: examples collapsing, regex stringification, dict/object rewrites
- Mixed design already leaks bugs:
  - named schema component shape depends on first call-site options
  - duplicate-name comparison replays different options than first registration
  - emitted schema can differ from DSL schema even when no component extraction is needed

## Hard Constraint

- Under current `@dsl` signatures, zero schema work is impossible.
- Two DSL features are not raw OpenAPI values:
  - `Schema = Nameable<RawSchema>` allows function thunks inside schema trees
  - `string({ pattern: /.../ })` allows `RegExp`, which must serialize to string
- So plan is not "do nothing". Plan is "remove schema compiler as mutating serializer; keep only tiny lowering helpers elsewhere".

## Target Design

- `src/dsl/schema.ts` remains source of truth for schema shape.
- Compiler keeps one small component registry helper, not full schema compiler.
- Registry helper API should do only this:
  - inspect `decodeNameable(schema)`
  - if unnamed, recurse children and return schema-shaped value
  - if named, register canonical component once and return `$ref` with siblings
  - on recursion, reserve component name before descending
- Context-specific adaptation moves to callers:
  - parameter/header/path compilation decides whether to hoist `description`
  - parameter/header/path compilation decides whether to use `example`
  - schema components never depend on `collapseExamplesToExample`
  - schema components never depend on `preserveIntNumDescription`

## Work Split

### 1. Freeze Current Intent With Tests

- Add regression tests for named schema reused across:
  - request body + query/header/path parameter
  - request body + response header
  - two sites with `examples`
- Add test proving component registration is order-independent.
- Add test proving recursive named schemas still terminate.
- Add test for `$ref` sibling preservation after ref extraction moves.

## 2. Define Canonical Schema Emission Rules

- Canonical component schema must equal DSL schema shape after only unavoidable lowering:
  - nested named thunks replaced with `$ref`
  - `RegExp` converted to pattern string
- Delete compiler-only rewrites unless explicit OpenAPI requirement exists:
  - special-case object -> `{ required }`
  - omit `propertyNames` for bare string keys
  - call-site-controlled `examples` -> `example`
  - call-site-controlled integer/number description stripping
- If one of these rewrites is still desired, move it to exact consumer and test there.

## 3. Replace `SchemaCompileState`

- Move schema-related state out of `schema.ts`.
- Likely destination: `src/compiler/components.ts` or fold into existing compiler state module.
- Rename state to match real ownership, e.g. `ComponentRegistryState`.
- Keep existing non-schema component registries together if useful:
  - `schemas`
  - `parameters`
  - `headers`
  - `securitySchemes`
- Remove schema-specific option plumbing from shared state.

## 4. Build Tiny Schema Lowering Helper

- Introduce one internal helper with narrow contract, e.g. `emitSchemaRefOrValue(...)`.
- Helper responsibilities:
  - decode `Nameable`
  - register named schemas
  - recurse through child schema positions:
    - `properties`
    - `items`
    - `additionalProperties`
    - `propertyNames`
    - `oneOf` / `anyOf` / `allOf`
  - preserve `summary` / `description` siblings on emitted `$ref`
  - serialize `RegExp` patterns
- Helper must not know about parameter/header/request-body context.

## 5. Move Context Logic To Callers

- `src/compiler/request.ts`
  - hoist parameter schema `description` at parameter emission time
  - decide parameter/header/path `example` handling at emission time
  - stop passing schema emission options
- `src/compiler/index.ts`
  - response/request-body/header builders consume canonical schema values directly
  - header emission handles header-level `example` itself
- After this step, remove:
  - `collapseExamplesToExample`
  - `preserveIntNumDescription`

## 6. Delete `src/compiler/schema.ts`

- Update imports in:
  - `src/compiler/index.ts`
  - `src/compiler/request.ts`
  - tests
- Move surviving tests next to new helper or inline into caller tests.
- Delete obsolete schema-compiler tests that only assert removed rewrites.

## Solved Questions

- `RegExp` support: keep tiny serializer helper
- Bare `propertyNames: { type: "string" }`: keep verbatim because DSL already emits valid OAS 3.1

## Success Criteria

- `bun check` passes
- `src/examples/` stays unmodified
- `src/dsl/` stays unmodified
