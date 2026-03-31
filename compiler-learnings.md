# Compiler learnings (through Story 6: large examples)

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

## Story 5: response defaults and HEAD synthesis

- **Wildcard response defaults**: `forAll.res.mime` now behaves like a wildcard
  default applied to every compiled response status (including those injected by
  `forAll.res.add`). This fixes examples like `exceptions` where every response
  should inherit `"application/json"` without writing a `defaults` range.
- **Range matching**: `res.defaults` keys support both exact statuses (e.g.
  `404`) and inclusive ranges (`"400..499"`); matching augmentations are applied
  parent-to-child, then the concrete response is compiled.
- **`add` inheritance precedence**: Inherited `res.add` provides missing
  statuses for operations, but a local `op.res[code]` always wins over inherited
  `add[code]`.
- **HEAD behavior**:
  - explicit `HEAD(...)` responses compile with **no response content** (headers
    remain), since OpenAPI HEAD responses should not describe bodies.
  - `GET({ headID })` synthesizes a `HEAD` operation at the same path (unless an
    explicit `HEAD` already exists) with `operationId = headID` and responses
    cloned from GET but with bodies stripped.

## Story 6: componentized params/security and large examples

- **Named `components.parameters` / `components.securitySchemes`**: Same
  pipeline as Story 4 (`compileParamComponent`, `compileSecurityScheme` in
  `src/compiler/request.ts`). The readme example uses `named("page", …)`,
  `named("perPage", …)` and `named("apiKey", httpSecurity({ scheme: "basic" }))`;
  operations reference them via `$ref`.
- **Large-spec verification**: `src/compiler/large-examples.test.ts` asserts
  OpenAPI validation and the above component wiring for readme, and validation
  plus path breadth for listenbox. This satisfies an end-to-end check without
  depending on golden `src/examples/*.json` byte equality.
- **Golden JSON in `src/examples/`**: `listenbox.test.ts` / `readme.test.ts`
  still `toEqual` hand-maintained JSON. That snapshot diverges from the
  compiler today (e.g. listenbox `forAll.res.add` vs JSON missing inherited
  responses, schemas present only in JSON, readme JSON hoisting responses /
  headers / extra parameters into `components`). Refreshing those files is the
  follow-up when snapshots should track the compiler.
- **Empty `object()` emission**: `emitObject` omits `properties` and `required`
  when they would be empty, so media-type schemas stay valid under OpenAPI 3.0
  (no `required: []`) and match the usual `{ "type": "object" }` shorthand.

## DSL gotcha

- **`scope({ ... })` shape**: Paths and methods sit next to `forAll` at the top
  level of the argument; there is no `routes:` wrapper.
