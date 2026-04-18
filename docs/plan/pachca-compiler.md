# Pachca Compiler Plan

## Goal

- fix `bun check`
- compiler output must match Pachca goldens
- do not edit `src/examples/`
- do not edit golden files in `src/examples/*.json` or `src/examples/*.yaml`
- do not add normalize-only workarounds for compiler drift

## Files Studied

- `src/help/normalize.ts`
- `src/help/normalize.test.ts`
- `src/compiler/index.ts`
- `src/compiler/emit-schema.ts`
- `src/compiler/request.ts`
- `src/dsl/operation.ts`
- `src/examples/pachca.ts`
- `src/examples/pachca.test.ts`

## Updated Findings

- `pachca.test.ts` compares `normalize(validateDoc(theAPI))` against
  `normalize(theJSON)`.
- Normalize blocker and nullable typed-schema recursion blocker were enough to
  get past OpenAPI validation and expose real parity drift.
- Remaining problem is not fixture normalization anymore. Remaining problem is
  compiler output shape.
- Compiler currently drops operation-level `x-*` extensions even though
  `OpBase` accepts them.
- Pachca source uses named reusable params and named reusable response headers.
- Current compiler emits those as `components.parameters` /
  `components.headers` plus `$ref` use-sites.
- Pachca goldens inline those parameter and header objects instead of using
  `$ref` under `components.parameters` or `components.headers`.
- Current compiler emits `nullable(allOf([X], siblings))` as `anyOf` with
  explicit `{ type: "null" }`.
- Pachca goldens instead keep nullable typed top-level shapes such as
  `type: ["object", "null"]` while still preserving `allOf`, `description`,
  and other siblings on same schema object.
- Pachca goldens contain `examples: [null]` on several nullable fields whose
  DSL source does not currently declare `examples`.
- Example parity gap is therefore broader than one nested-schema bug.

## Concrete Drift Seen After Validation Passed

- `x-requirements` and `x-paginated` missing from compiled operations.
- `components.parameters` emitted by compiler, but Pachca golden keeps inline
  operation/path parameters.
- `components.headers.LocationHeader` emitted by compiler, but Pachca golden
  keeps inline response header object.
- Nullable composed schemas like `forwarding`, `thread`, and nullable
  `dataOf(nullable(allOf([UserStatus])))` do not match golden shape.
- Several nullable fields like `revoked_at`, `expires_in`, `payload`,
  `original_thread_id`, `display_name`, and `deleted_at` miss golden
  `examples: [null]`.

## Why This Matters

- Pachca now validates as OpenAPI, so next failures are real semantic/output
  mismatches.
- Example fixtures are contract tests for compiler output.
- Fixing this in normalize would hide wrong compiler behavior instead of fixing
  it.
- Parameter/header reuse behavior and nullable composition behavior are now
  primary blockers, not security.

## Scope Boundaries

- Focus on `src/compiler/*` first.
- Keep existing normalize work only as already-needed comparison support.
- No edits in `src/examples/`.
- No edits in golden `src/examples/*.json` or `src/examples/*.yaml`.
- No DSL signature changes.

## Best Path Forward

1. Add focused Pachca regression tests under `src/compiler/` for current drift
   instead of relying only on full-example diff.
   Repros:
   `x-*` operation extensions, named reusable params staying inline, named
   reusable response headers staying inline, nullable `allOf` preserving typed
   nullability, nullable fields synthesizing `examples: [null]` when required by
   current example contract.
2. Preserve operation-level vendor extensions in `compileDirectOp()`.
   Best implementation:
   copy every `x-*` own property from `op` into emitted
   `oas31.OperationObject`.
3. Revisit reusable param/header emission strategy.
   Best implementation for Pachca contract:
   keep named schemas and security schemes reusable, but inline parameter/header
   objects at use-sites instead of materializing `components.parameters` /
   `components.headers`.
   This likely means changing `compileParamComponent()` and
   `compileHeaderComponent()` behavior, then updating unit tests that currently
   encode `$ref` behavior.
4. Rework nullable composed-schema emission.
   Best implementation:
   when schema carries `type: [T, "null"]`, preserve that top-level `type`
   array and also emit structural siblings like `allOf`, `oneOf`, `anyOf`,
   `items`, `properties`, and `additionalProperties` on same schema object
   instead of wrapping in outer `anyOf`.
5. Derive explicit compiler rule for golden `examples: [null]`.
   Best implementation:
   inspect nullable-field corpus in Pachca and codify minimal rule in compiler,
   not in examples and not in normalize.
   If rule turns out inconsistent, stop and ask human before widening behavior.
6. After targeted regressions pass, rerun:
   `bun test src/examples/pachca.test.ts`
   then `bun check`

## Validation

- `bun test src/compiler/emit-schema.test.ts`
- add new targeted compiler tests for Pachca parity
- `bun test src/examples/pachca.test.ts`
- `bun check`

## Explicit Non-Goals

- No edits to Pachca golden JSON or YAML.
- No edits to Pachca TypeScript example source.
- No normalize-only masking of compiler mismatches.
- No new raw-schema escape hatch.
- No DSL API changes.
