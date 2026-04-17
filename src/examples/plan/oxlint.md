# Oxlint Migration And Fixer Plan

## Goal

- Add a repo-local Oxlint fixer that migrates deprecated schema DSL option
  `example` to `examples: [value]`.
- Keep the rule narrow enough that it only rewrites the DSL call sites we own.
- Preserve the current Oxlint behavior while moving config from
  `.oxlintrc.jsonc` to `oxlint.config.ts`.

## Existing State

- The repo already has [.oxlintrc.jsonc](../../../.oxlintrc.jsonc).
- That config already enables `typescript/no-deprecated` for
  `src/**/*.ts` and `scripts/**/*.ts`.
- The deprecated property is declared in [schema.ts](../dsl/schema.ts#L17) and
  documented as:
  - `/** @deprecated Use {@link examples} instead */`
- The built-in `typescript/no-deprecated` rule reports deprecated usage, but it
  does not know the replacement shape for this repo.
- A plain rename from `example` to `examples` is not enough:
  - `example: "x"` must become `examples: ["x"]`
  - the fixer must not touch raw OpenAPI objects or YAML fixtures where
    `example` is still valid OpenAPI.

## Constraints

- Do not edit `package.json`.
- Do not edit `bunfig.toml`.
- Do not edit `src/examples/*.json`.
- Verify changes touching `src/` with `bun check`.
- Prefer Oxlint-native integration over an ad hoc script.

## High-Level Approach

1. Replace `.oxlintrc.jsonc` with `oxlint.config.ts`.
2. Load a local JS/TS Oxlint plugin via `jsPlugins`.
3. Add one custom rule that detects deprecated `example` usage only in schema
   DSL option objects.
4. Make the rule autofix to `examples: [value]`.
5. Keep `typescript/no-deprecated` enabled so generic deprecations still report.
6. Add rule-level tests and a config smoke test.

## Why The Config Must Move First

- `.oxlintrc.jsonc` can express `jsPlugins`, but this repo already uses comments
  and hand-maintained structure that will be easier to preserve in TS than in
  JSONC once a local plugin path and rule configuration are added.
- `oxlint.config.ts` lets us keep the current config semantics while making the
  plugin path and any future inline comments easier to maintain.
- The migration should be behavior-preserving first, before introducing the new
  custom rule.

## Phase 1: Migrate Config To `oxlint.config.ts`

### Files

- Create `oxlint.config.ts`.
- Delete `.oxlintrc.jsonc` only after the TS config matches behavior.

### Work

- Translate the current config 1:1:
  - `plugins`
  - `categories`
  - `options`
  - `settings.jsdoc.tagNamePreference`
  - all existing `overrides`
- Use `defineConfig` from `"oxlint"`.
- Keep rule severities and globs unchanged during the migration.
- Add `jsPlugins` entry for the local plugin file, but do not enable the new
  custom rule until the plugin exists.

### Acceptance

- `bun check` passes with no lint behavior regression attributable to config
  migration.
- `bun run lint` uses `oxlint.config.ts` without needing extra CLI flags.

### Suggested skeleton

```ts
import { defineConfig } from "oxlint"

export default defineConfig({
  $schema: "./node_modules/oxlint/configuration_schema.json",
  plugins: ["typescript", "jsdoc"],
  categories: {
    correctness: "error",
    nursery: "off",
    pedantic: "off",
    perf: "warn",
    restriction: "off",
    style: "off",
    suspicious: "warn",
  },
  options: {
    reportUnusedDisableDirectives: "error",
    typeAware: true,
  },
  settings: {
    jsdoc: {
      tagNamePreference: {
        dsl: "dsl",
        compiler: "compiler",
      },
    },
  },
  jsPlugins: ["./path/to/plugin.ts"],
  overrides: [
    // existing overrides translated directly
  ],
})
```

## Phase 2: Add A Local Oxlint Plugin

### Files

- Create a dedicated plugin file outside `src/`.
- Good candidates:
  - `scripts/oxlint-plugin.ts`
  - `tools/oxlint/plugin.ts`

### Plugin shape

- Export default plugin object with:
  - `meta.name`
  - `rules`
- Add one rule first, not a generalized migration framework.

### Rule name

- Recommended rule id:
  - `local/prefer-schema-examples`
- If the plugin filename is used directly without aliasing, pick a stable plugin
  name in `meta.name`, for example:
  - `"local"`

## Phase 3: Define The Exact Match Scope

### What the rule should rewrite

- Object properties named `example` when the object is passed as the options
  argument to one of the schema DSL builders:
  - `string(...)`
  - `array(...)`
  - `object(...)`
  - `dict(...)`
  - `integer(...)`
  - `int32(...)`
  - `int64(...)`
  - `uint32(...)`
  - `uint64(...)`
  - `number(...)`
  - `float(...)`
  - `double(...)`
  - `boolean(...)`
  - `oneOf(...)`
  - `anyOf(...)`
  - `allOf(...)`
- Match both direct imports from `../dsl/schema.ts` and any equivalent local
  bindings actually used in the file.

### What the rule must not rewrite

- Raw OpenAPI objects such as:
  - `queryParam({ example: "v1.0.0", schema: string() })`
  - `pathParam({ example: "id", schema: string() })`
  - `responseHeader({ example: "..." })`
- Compiler output code that intentionally emits raw OpenAPI `example`.
- YAML and JSON fixtures.
- Any object property already using `examples`.
- Any computed or spread-based shape where a safe autofix is unclear.

### Safety rule

- If the property shape is not exactly `example: <expr>` in a schema DSL options
  object, report without autofix or skip entirely.
- Prefer missing a few cases over rewriting valid raw OpenAPI.

## Phase 4: Implement The Rule

### Diagnostic behavior

- Message should be repo-specific and explicit:
  - ``Use `examples: [value]` instead of deprecated schema option `example`.```

### Fix behavior

- Replace only the property key/value pair text:
  - `example: foo` -> `examples: [foo]`
- Preserve surrounding commas and formatting by keeping the fix minimal.
- Do not try to collapse existing `examples` plus `example` combinations in the
  first version.

### AST strategy

- Visit `CallExpression`.
- Check callee identifier against the allowed schema helper names.
- Determine which argument is the options object for that helper:
  - first arg for scalar schema helpers like `string(opts)`
  - second arg for `array(items, opts)`, `dict(k, v, opts)`, `object(props, opts)`
- If the relevant argument is an `ObjectExpression`, scan its properties.
- For a normal `Property` with static key `example`, report on that property.
- Fix by replacing the property source text using
  `context.sourceCode.getText(node)` and a fixer text replacement.

### Edge cases to consciously support

- Literal values:
  - `example: "x"`
  - `example: 1`
  - `example: false`
  - `example: { a: 1 }`
  - `example: ["x"]`
- Complex expressions:
  - `example: someVar`
  - `example: makeValue()`
  - `example: condition ? a : b`

### Edge cases to consciously skip

- `["example"]: value`
- getters/setters/methods
- spread interactions that require semantic merging
- duplicate keys in one object

## Phase 5: Add Tests For The Rule

### Files

- Create a dedicated test file outside `src/examples/*.json`.
- Good candidate:
  - `scripts/oxlint-plugin.test.ts`

### Test tool

- Use `RuleTester` from `oxlint/dist/plugins-dev`.
- Keep tests in `vitest`, since the repo standard is `bun test` with `vitest`
  imports.

### Minimum valid cases

- `queryParam({ example: "x", schema: string() })`
- `pathParam({ example: "x", schema: string() })`
- `responseHeader({ example: "x" })`
- `string({ examples: ["x"] })`
- `const opts = { example: "x" }; string(opts)`
  - valid because the first version only rewrites inline object literals

### Minimum invalid cases

- `string({ example: "x" })`
  - output: `string({ examples: ["x"] })`
- `array(string(), { example: "x" })`
  - output: `array(string(), { examples: ["x"] })`
- `object({}, { example: { a: 1 } })`
  - output: `object({}, { examples: [{ a: 1 }] })`
- `dict(string(), string(), { example: makeValue() })`
  - output: `dict(string(), string(), { examples: [makeValue()] })`

### Required assertions

- Exact message or `messageId`
- Exact autofix output
- At least one non-schema false-positive guard

## Phase 6: Enable The Rule In Config

### Where

- In the same `src/**/*.ts` and `scripts/**/*.ts` override where
  `typescript/no-deprecated` already runs.

### Severity

- Start with `"warn"` if you want a low-risk rollout.
- Start with `"error"` if the repo is ready to bulk-fix immediately.

### Recommended rollout

1. Add the rule as `"warn"`.
2. Run Oxlint and inspect matches.
3. Run `oxlint --fix` and review the diff.
4. If matches are clean, raise to `"error"`.

## Phase 7: Bulk Migration

### Command sequence

1. `bun run lint`
2. `bun run lint:fix`
3. Review only schema DSL call sites.
4. `bun check`

### Review checklist

- Every rewritten `example` became `examples: [value]`.
- No raw OpenAPI parameter/header `example` fields were changed.
- No compiler emission code was changed accidentally.
- No fixtures changed.

## Phase 8: Optional Follow-Up Cleanup

- After the bulk fix lands cleanly, consider updating tests and docs to prefer
  `examples` in new code.
- Keep the deprecated `example` field in the TypeScript types for one migration
  window.
- Later, remove the deprecated field only after the repo is clean and the API
  change is acceptable.

## Concrete File Plan

- Add `oxlint.config.ts`
- Remove `.oxlintrc.jsonc`
- Add local plugin file
- Add local plugin test file
- Possibly add a small README comment near the plugin if the path is
  non-obvious

## Validation Plan

- `bun run lint`
- `bun run lint:fix`
- `bun check`
- If useful during development:
  - run the new test file directly with `bun test <path>`

## Failure Modes To Watch

- Oxlint JS plugin loading may be sensitive to plugin path or runtime support.
  This repo uses Bun, so a local `.ts` plugin should be viable.
- A rule based only on property name will produce false positives.
  The schema-helper call-site check is mandatory.
- A rule based on inline syntax only will miss aliased helpers or reexports.
  Start narrow, then extend only if real misses show up.
- A fix that replaces more than the property text can break commas or comments.
  Keep the replacement localized.

## Done Criteria

- The repo uses `oxlint.config.ts` instead of `.oxlintrc.jsonc`.
- Oxlint loads the local plugin successfully.
- The custom rule reports deprecated schema `example` usage.
- `oxlint --fix` rewrites inline schema DSL options to `examples: [value]`.
- False positives do not appear on raw OpenAPI `example` fields.
- `bun check` passes after the migration.
