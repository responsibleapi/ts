# Compiler Fix Plan

## Current failure

- As of 2026-04-02, `bun test` fails only on `src/examples/youtube.test.ts`.
- `bun test src/compiler` already passes, so the compiler has coverage gaps
  around real-world emission details rather than a broad regression in the
  existing unit tests.
- Per repo rules, do not update `src/examples/youtube.json`; the fix needs to
  come from compiler behavior and added tests.

## Regressions to fix

2. Map-style query/header params are emitted with the wrong OpenAPI shape.
   Current behavior from `compileMapParameter()` is too narrow:
   - it only lifts `description` out of string schemas
   - it keeps many descriptions inside `schema` instead of on the parameter
     object
   - it emits `required: false` for optional params instead of omitting
     `required`
   - array query params miss explicit `style: "form"` and `explode: true`
     Affected area: `src/compiler/request.ts`

3. Scope-level params are landing on operations instead of
   `PathItemObject.parameters`. Root `forAll.req.params` and inherited scope
   params should be emitted once per path item, while operation-local params
   stay on the operation. The current merge flattens everything into one
   operation-level array. Affected area: `src/compiler/index.ts`, with likely
   support changes in `src/compiler/request.ts`

4. Request bodies are always marked `required: true`. `compileRequestBody()`
   currently forces `required: true`, but the golden spec omits that field.
   Since `@dsl` request types do not expose body-required control, this should
   be fixed in compiler emission rather than by changing DSL signatures.
   Affected area: `src/compiler/index.ts`

5. Emission order is not stable enough for arrays that the normalizer does not
   sort. This shows up in security requirement arrays and `$ref`-only parameter
   arrays. Once the structural issues above are fixed, the remaining ordering
   must be made deterministic so the YouTube golden matches consistently.
   Affected area: `src/compiler/index.ts`, `src/compiler/request.ts`

## Implementation order

1. Add focused compiler tests before changing behavior. Add or extend tests
   under `src/compiler/` for:
   - `ref(..., { description })` on schema properties
   - query-map param description hoisting
   - optional query/header params omitting `required: false`
   - array query params emitting `style: "form"` and `explode: true`
   - hoisting inherited params to `PathItemObject.parameters`
   - request bodies omitting `required` unless the DSL later gains explicit
     support
   - deterministic merged security ordering if still needed after structural
     fixes

2. Teach schema compilation to preserve reference siblings. Keep component
   registration exactly as it is for equality/reuse, but when a `Nameable`
   resolves to a `$ref`, merge supported sibling fields from `decodeNameable()`
   into the emitted `ReferenceObject`.

3. Rework parameter compilation into two layers. Split parameter emission into:
   - inherited path-item params from scope/root `forAll`
   - operation-local params from the method node Then dedupe by `(in, name)`
     across both layers so operation-local params cannot silently double-emit
     inherited params.

4. Normalize map-style parameter emission. Update `compileMapParameter()` so it:
   - lifts supported metadata from compiled schemas to the parameter object for
     all scalar/array cases, not just strings
   - preserves the reduced schema body without duplicating parameter-level docs
   - emits explicit query array serialization defaults
   - omits `required` for optional query/header params

5. Stop forcing request bodies to be required. Change `compileRequestBody()` to
   emit only `content` for now. If body-required control is ever needed, that
   should be a separate DSL design discussion because `@dsl` signatures are
   currently fixed.

6. Make ordering deterministic where normalization does not help. After the
   structural fixes, sort nameless emitted arrays by a compiler-defined stable
   key:
   - parameter refs by `$ref`
   - security requirement objects by a stable serialized key Only do this where
     needed, so named parameter arrays and response content ordering are not
     disturbed unnecessarily.

## Verification

1. `bun test src/compiler`
2. `bun test`
3. `bun tsc`
4. `bun lint`

## One open question

- If small YouTube diffs remain after the compiler fixes, check whether they are
  true compiler issues or drift between `src/examples/youtube.ts` and the golden
  fixture. Do that inspection before considering any fixture update, because the
  repo rules treat `.json` examples as golden.
