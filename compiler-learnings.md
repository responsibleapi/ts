# Compiler learnings (through Story 4: request compiler)

## Story 3 recap (scopes, paths, tags)

- **Recursive walk**: `compileRoutes` visits every path key and method key;
  nested `scope()` nodes merge `forAll` and recurse into `node.routes`.
- **Path join**: `joinHttpPaths(prefix, segment)`; OpenAPI `{param}` templates;
  duplicate `(normalized path, method)` is rejected.
- **`forAll.req` (non-security)**: Shallow merge for `pathParams` / `query` /
  `headers`, `params` concatenated, `mime` and `body` child-preferred.
- **`forAll.res`**: `res.defaults` layers and `res.add` shallow merge as before.
- **Tags**: Nearest scope `forAll.tags`; op `tags` override; emitted names are
  `.name` strings.

## Story 4: request compiler

- **`src/compiler/request.ts`**: Path/query/header parameters, named `Param`
  components (`#/components/parameters/{name}`), and security compilation live
  here. `compileOperationParameters` merges path template names with
  `pathParams` plus `params` entries (`in: "path"`), then `params`
  (`in: "query"`), then `query` and `headers` maps. Duplicate `(in, name)` is
  rejected.
- **Path params**: Same rules as before: every `{name}` in the template needs a
  schema (from `pathParams` or a path `Param` in `params`); optional
  `pathParams` keys (`name?`) and keys not in the template are errors.
- **`SchemaCompileState`**: Now carries `components.parameters`,
  `components.securitySchemes`, matching `inProgress` sets, and
  `anonymousSecuritySeq` for inline schemes used only as security values.
- **Security merge** (matches compiler plan): `security` and `security?` are
  stripped from merged `mergedReq` and tracked as `securityLayers` on
  `CompileScopeContext`. Each layer compiles to `SecurityRequirementObject[]` in
  order; `security?` appends `[]` then `{}`. Operation-level security is
  compiled after all inherited layers. Inline or named `SecuritySchemeObject`
  values register under `components.securitySchemes` and become
  `{ schemeName: [] }` requirements.
- **`normalizeRespEntry`**: Schema thunks (`typeof entry === "function"`) are
  handled before the object check so `res: { 201: () => object(...) }` style
  entries compile (needed for examples that use lazy schema functions).

## Deferred / follow-ups

- **`http-benchmark.test.ts`**:
  `expect(validate(httpBenchmarkAPI)).toEqual(theJSON)` still fails:
  `http-benchmark.json` mixes string-typed numeric constraints
  (`"minimum": "1"`, etc.) and a custom `400` description where the compiler
  emits numeric JSON and default `description` from the status code. Aligning
  the golden requires regenerating or editing `src/examples/http-benchmark.json`
  (project docs mark `src/examples/` as do-not-edit for routine work).

## DSL gotcha

- **`scope({ ... })` shape**: Paths and methods sit next to `forAll` at the top
  level of the argument; there is no `routes:` wrapper.
