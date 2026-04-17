# Operation Param Map Fix Plan

## Problem

`GetOpReq.pathParams`, `GetOpReq.query`, and `GetOpReq.headers` are typed as
schema maps in [`operation.ts`](/Users/adelnizamutdinov/Projects/responsibleapi/src/dsl/operation.ts).
That forces map-style parameters to encode parameter metadata through
`Schema` usage fields. Compiler then "lifts" schema `description` / `example` /
`examples[0]` onto `ParameterObject`, which mixes two different OpenAPI levels:

- parameter-level metadata: `ParameterObject.description`, `ParameterObject.example`
- schema-level metadata: `SchemaObject.description`, `SchemaObject.example`,
  `SchemaObject.examples`

Root bug: map-style parameter DSL has no way to express nameless inline
parameter objects, so compiler compensates with incorrect schema-to-parameter
promotion.

## Goal

Make map-style params capable of carrying parameter metadata directly, without
reusing schema usage fields for that job.

## Recommended DSL Direction

Introduce dedicated inline map-entry types in `operation.ts` for each request
parameter location.

- `PathParams` values: nameless path-param object, not bare `Schema`
- `query` values: nameless query-param object
- `headers` values: nameless header-param object

Each map-entry type should:

- require `schema: Schema`
- omit `name` because map key already owns name
- omit `in` because container owns location
- omit `required` because key optionality already owns required-ness for
  `query`/`headers`, and path params are always required
- keep location-appropriate serialization fields like `style` / `explode`
- keep parameter-level `description` / `example`

Recommended shape:

```ts
type InlineQueryParam = {
  description?: string
  example?: unknown
  schema: Schema
  style?: "form"
  explode?: boolean
}
```

Equivalent path/header variants follow same pattern with location-specific
serialization fields.

## Compatibility Decision

Two viable options.

1. Strict fix. Recommended.
   Bare `Schema` stops being valid inside `pathParams` / `query` / `headers`.
   All parameter metadata becomes explicit on inline param objects. This removes
   ambiguous lifting completely.
2. Transitional union.
   Allow `Schema | Inline*Param` for one release. Compiler must treat bare
   `Schema` as legacy shorthand. Still need explicit rule for whether legacy
   schema `description` / `example` continue lifting.

Recommended choice: option 1. User-facing break, but semantics become coherent.
If project wants softer migration, add option 2 first, then remove bare-schema
support later.

## Concrete Changes

1. Update `operation.ts` request map types.
   Replace `Record<..., Schema>` with location-specific inline param maps.
   Keep `PathParams` optional-key rejection.

2. Keep `params?: readonly ReusableParam[]` unchanged.
   Reusable params already model true `ParameterObject` shape and remain array
   based.

3. Update compiler request path.
   [`request.ts`](/Users/adelnizamutdinov/Projects/responsibleapi/src/compiler/request.ts)
   must stop assuming map values are `Schema`.
   `compileMapParameter` and path-param compilation should read
   `entry.description`, `entry.example`, `entry.schema`, `entry.style`,
   `entry.explode` directly.

4. Remove schema-to-parameter lifting for map-style params.
   No more `getSchemaUseDescription()` / `getSchemaUseExample()` when compiling
   inline request param maps. Nested schema metadata stays nested. Parameter
   metadata comes only from inline param object.

5. Revisit reusable-param behavior separately.
   `ParamRaw` already has top-level `example`; keep that. Schema `examples`
   inside reusable params should remain schema-level data. Current fallback
   logic in `paramRawToParameterObject()` likely needs same correction so
   reusable params do not revive same bug through another path.

6. Update request normalization / merging only if needed.
   [`index.ts`](/Users/adelnizamutdinov/Projects/responsibleapi/src/compiler/index.ts)
   currently merges request maps structurally. Confirm new inline object maps
   still merge correctly without schema-specific assumptions.

## Test Plan

Add or update tests in both type layer and compiler layer.

- `src/dsl/operation.test.ts`
  assert new map-entry types accepted
- reject optional path-param keys still
- reject invalid map-entry fields like `name`, `in`, `required`
- if strict migration: reject bare `Schema` in query/header/path maps
- if transitional migration: accept both forms

- `src/compiler/request.test.ts`
  map-style param `example` stays on parameter object
- schema `examples` stay under `parameter.schema.examples`
- schema `example` stays under `parameter.schema.example`
- no more "lift" behavior for map-style params
- reusable param with top-level `example` still emits `parameter.example`
- reusable param with schema `examples` does not overwrite top-level param
  example
- path/query/header variants all covered
- array query serialization defaults still preserved for inline query param
  objects

## Migration Notes

Docs and examples need rewrite away from:

```ts
query: {
  filter: string({ description: "Filter expression", examples: ["open"] }),
}
```

toward:

```ts
query: {
  filter: {
    description: "Filter expression",
    example: "open",
    schema: string(),
  },
}
```

Same migration for `pathParams` and request `headers`.

## Risks

- This touches `@dsl` signatures in `operation.ts`. Human approval required
  before implementation.
- Strict fix is source-breaking.
- Transitional union lowers breakage but preserves ambiguity unless compiler
  rules are very explicit.
- Compiler helper names like `getSchemaUseDescription` may still be correct for
  bodies/headers elsewhere; avoid broad deletion without checking call sites.

## Validation

After implementation:

- run `bun check`
- run focused `bun test` coverage for request/compiler and DSL typing
- inspect emitted OpenAPI for one path/query/header example to confirm no
  schema-to-parameter leakage
