# Compiler Review

## Verdict

- Compiler is mostly single-walk today.
- Main problem is not multi-pass AST build. Main problem is DSL/runtime shape
  mismatch.
- `src/compiler/index.ts` spends large amount of logic recovering raw
  OpenAPI-ish intent from helper-produced objects, alternate spellings, and
  hidden metadata.
- `src/dsl/schema.ts` is already close to target.
- Biggest blockers to "raw + single pass" are `scope`, `operation`, `security`,
  `tags`, and method wrapping.

## Findings

### 1. Compiler has product-specific patch branch

- `src/compiler/index.ts:1475`
- `compileResponsibleAPI()` mutates final doc for `Listenbox` by injecting
  `StripeCheckoutID`.
- This breaks compiler purity. Single-pass compiler should not contain app-name
  branches.
- Severity: high.

### 2. Scope helper builds mini-AST, compiler must decode both old and new shapes

- `src/dsl/scope.ts:72`
- `src/dsl/scope.ts:129`
- `src/compiler/index.ts:389`
- `src/compiler/index.ts:421`
- `scope()` rewrites input `{ forEachOp, ...routes }` into `{ forAll, routes }`.
- Compiler then accepts all of these:
  - `scopeNode.forEachOp`
  - `scopeNode.forAll`
  - `scopeNode.routes.forEachOp`
  - `scopeNode.routes.forAll`
- This is explicit non-raw intermediate shape. It is AST-ish even if small.
- Severity: high.

### 3. Operation request parsing is heuristic, not structural

- `src/dsl/operation.ts:173`
- `src/compiler/index.ts:163`
- `src/compiler/index.ts:230`
- `src/compiler/index.ts:243`
- `Op.req` can be either `OpReq` or bare `Schema`.
- Compiler must guess with `isDslSchema()` and `isOpReqShaped()`.
- Detection currently depends on overlapping object keys like `type`,
  `properties`, `body`, `query`, `headers`.
- This is fragile. Every new DSL field risks changing parser behavior.
- Severity: high.

### 4. Security composition mutates raw requirement objects with hidden symbol metadata

- `src/dsl/security.ts:4`
- `src/dsl/security.ts:52`
- `src/dsl/security.ts:100`
- `src/dsl/security.ts:187`
- `src/compiler/request.ts:173`
- `securityAND`, `securityOR`, and `oauth2Requirement` are not raw OpenAPI
  values.
- They attach non-enumerable `Symbol("securitySchemes")` metadata so compiler
  can recover component registrations later.
- Output looks raw when serialized, but runtime value is not raw.
- This side channel leaks compiler concerns into DSL layer.
- Severity: medium-high.

### 5. Method helpers and route keys duplicate same information

- `src/dsl/methods.ts:23`
- `src/compiler/index.ts:1323`
- Method helpers add `method` onto operation objects.
- But inside `compileRoutes()` method can also be reconstructed from route key
  when absent.
- So codebase carries two canonical forms:
  - keyed-by-method object shape
  - wrapped op with embedded `method`
- This duplication increases normalization work for no OpenAPI gain.
- Severity: medium.

### 6. Tags are not raw at operation sites

- `src/dsl/tags.ts:24`
- `src/compiler/index.ts:1176`
- `declareTags()` materializes `{ name, ...tag }` objects and operations store
  those objects.
- Compiler later strips them back to `string[]` with `t.name`.
- Desired direction from prompt is raw top-level tags plus typesafe DSL. Current
  design stores enriched objects instead of raw tag names/references.
- Severity: medium.

### 7. Params layer supports two parallel DSLs, compiler pays branching cost

- `src/dsl/params.ts:33`
- `src/dsl/params.ts:73`
- `src/compiler/request.ts:242`
- `src/compiler/request.ts:332`
- `src/compiler/request.ts:498`
- Reusable params use near-raw `ParamRaw`.
- Inline param maps use synthetic record DSL where compiler invents `name`,
  `required`, and `in`.
- This is convenient, but not raw. It is one more normalization surface.
- Severity: medium.

### 8. Operation shape is compiler-first, not OpenAPI-first

- `src/dsl/operation.ts:16`
- `src/dsl/operation.ts:82`
- `src/dsl/operation.ts:163`
- Request/response data lives under custom fields:
  - `req`
  - `res`
  - `body?`
  - `security?`
  - `headID`
- Compiler then rebuilds `operationId`, `requestBody`, `responses`, `security`,
  `tags`.
- This works, but it forces parser/merger code instead of incremental fill of
  `oas31.OperationObject`.
- Severity: medium.

## DSL Assessment

### `src/dsl/schema.ts`

- Closest to target already.
- `RawSchema` is real payload shape. `Schema = Nameable<RawSchema>` is
  reasonable.
- Helpers mostly construct raw schema fragments directly.
- Only mild DSL sugar remains:
  - `object()` derives `required` from `?` suffix.
  - `dict()` omits default `propertyNames`.
  - `string()` stringifies `RegExp`.
- This file should be reference model for rest of DSL.

### `src/dsl/security.ts`

- Constructors like `querySecurity`, `headerSecurity`, `httpSecurity`,
  `oauth2Security` are good. They return raw scheme objects.
- Problem starts with composition helpers that need hidden attachment state.
- Better model:
  - keep raw scheme constructors
  - keep raw requirement objects
  - make composition helpers return explicit compiler-owned wrapper type, or
    require caller to list reusable schemes separately
- Current hidden mutation is wrong boundary.

### `src/dsl/tags.ts`

- User direction makes sense.
- Best raw shape:
  - top-level `partialDoc.tags` stays raw `oas31.TagObject[]`
  - operations store raw string names
  - helper only provides type-safe string literals or branded names
- Current helper stores full objects in operation layer, then compiler strips
  back to strings.

### `src/dsl/params.ts`

- `ParamRaw` is fine.
- `ReusableParam = Nameable<ParamRaw>` is fine.
- Record DSL for `query`, `headers`, `pathParams` is convenient but not raw.
- If target is stricter rawness, move toward raw `parameters` arrays with
  optional typed helper builders.
- If keeping record DSL, accept that compiler must keep synthesis logic for
  `name` and `required`.

### `src/dsl/operation.ts`

- Furthest from raw.
- `OpBase` is not close to `Partial<oas31.OperationObject>`.
- `req` and `res` create compiler-private sub-language.
- Strongest simplification path:
  - operation object becomes mostly raw OpenAPI operation fields
  - add only minimal DSL extras impossible or annoying in raw OAS
  - isolate extras under explicit names, not overloads
- `headID` is acceptable as narrow extension if kept explicit.
- `body?` and `security?` are useful ergonomically, but they force special
  parsing and merging semantics.

### `src/dsl/scope.ts`

- Cannot be fully raw because recursive route tree is compile input, not OpenAPI
  output.
- Still should be raw relative to its own domain:
  - one runtime shape
  - no `forEachOp` to `forAll` rewrite
  - no alternate keys accepted by compiler
- `Scope` should just be declared input shape, not compiler placeholder AST.

### `src/dsl/methods.ts`

- If routes are keyed by HTTP method already, embedded `method` field is
  redundant.
- Pick one:
  - raw method-keyed objects only
  - standalone method helper values only
- Current code supports both, which weakens invariants.

## Single-Pass Assessment

- Traversal itself is single-pass enough.
- `compileRoutes()` walks tree once and emits directly into `paths` and
  `components`.
- Component registration during emission is also single-pass enough.
- There is no meaningful whole-program AST build today.

### What still feels non-single-pass

- Scope normalization layer:
  - `scope()` rewrites shape
  - compiler re-normalizes it back
- Operation parsing layer:
  - compiler classifies request/response payloads by heuristic shape tests
- Security attachment layer:
  - DSL mutates values so compiler can recover hidden context later

Those are not extra passes over entire API, but they are parser-like stages
created by non-raw DSL design.

## Recommendation

### Priority 0

- Delete compiler app-specific branch:
  - `src/compiler/index.ts:1475`

### Priority 1

- Make scope runtime shape canonical.
- Recommended shape:

```ts
interface Scope {
  forEachOp?: ScopeOpts
  forEachPath?: ForEachPath
  routes: ScopeRoutes
}
```

- `scope()` should return exactly that.
- Compiler should only read exactly that.

### Priority 2

- Stop overloading `req` with `Schema | OpReq`.
- Make request body explicit.
- Two viable paths:
  - `req` always object; body lives in `req.body` or `req["body?"]`
  - operation itself moves closer to raw `requestBody`
- This removes `isDslSchema()` parser logic.

### Priority 3

- Move tags to raw strings at operation sites.
- Keep type-safe helper only for declaration-time string unions.
- Compiler should not need `t.name` mapping.

### Priority 4

- Remove hidden symbol channel from security composition.
- Prefer explicit compiler input over magical mutation.
- Example directions:
  - explicit reusable scheme registry
  - explicit wrapper type for composed security expressions
  - or require raw requirement objects plus separately referenced named schemes

### Priority 5

- Choose one method representation.
- Recommendation: method key already provides method. Keep route objects raw
  under `GET`, `POST`, etc. Drop runtime `method` field from DSL values and
  compiler internals.

### Priority 6

- Gradually converge operation shape toward `Partial<oas31.OperationObject>`.
- Keep only small DSL-only extensions where OpenAPI is too verbose:
  - `headID`
  - maybe compact response-status map helper
  - maybe param record sugar, if worth cost

## Suggested End State

- `schema.ts`: raw with light constructors.
- `security.ts`: raw constructors, no hidden metadata.
- `tags.ts`: raw top-level tags + typed tag-name helpers.
- `params.ts`: raw parameter objects or consciously non-raw sugar, not both
  everywhere.
- `operation.ts`: mostly `Partial<oas31.OperationObject>` plus minimal explicit
  extensions.
- `scope.ts`: single canonical recursive input shape. No AST rewrite.
- compiler: one recursive walk, direct emit, component registry only.

## Bottom Line

- Current compiler already walks in one pass.
- Current design debt is mostly representational, not traversal count.
- If goal is "single pass, close to zero AST, raw DSL", first attack shape
  duplication and hidden metadata.
- Start with `scope`, `operation.req`, `security`, and tag representation.
