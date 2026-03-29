# Compiler plan

## What the current DSL already gives us

- The compiler does not need to parse source code. The runtime values already
  form the tree:
  - `responsibleAPI({ partialDoc, forAll, routes })`
  - `scope({ forAll?, ...routes })`
  - method helpers returning operations
- The only AST-like structure should be the existing `Scope` tree from
  `scope()`. Do not add another IR layer unless a real blocker appears.
- `Nameable` is the explicit reuse signal. That means v1 components should come
  from named thunks, not from trying to auto-hoist arbitrary repeated objects.

That last point is the biggest difference from the old generator.

The old KDL compiler is still useful for:

- recursive scope walking
- path joining
- request/response merge order
- HEAD synthesis

But it is not the source of truth for reuse strategy. The current TS DSL is.

## Source of truth

If there is a conflict, prefer the current DSL contracts and tests over the old
generator output.

In particular:

- `src/dsl/dsl.test.ts` expects a simple inline document and is a better v1
  target than the giant legacy example JSONs
- named schemas/params/security schemes are representable today
- named responses/headers are not really representable today, so auto-hoisting
  those like the old generator did should not drive the first implementation

## Runtime shape to compile

I would normalize around these two runtime types:

```ts
type RouteNode = Scope | OpWithMethod

interface CompileState {
  components: {
    schemas: oas31.SchemasObject
    parameters: Record<string, oas31.ParameterObject | oas31.ReferenceObject>
    securitySchemes: Record<
      string,
      oas31.SecuritySchemeObject | oas31.ReferenceObject
    >
  }
  inProgress: {
    schemas: Set<string>
    parameters: Set<string>
    securitySchemes: Set<string>
  }
}

interface ScopeContext {
  pathPrefix: string
  req: NormalizedReq
  res: NormalizedRes
  tags?: readonly string[]
}
```

I would make `GET/POST/PUT/DELETE/HEAD` return `OpWithMethod`, because top-level
`"/foo": POST({...})` is otherwise ambiguous at runtime.

## Normalized context

### Request defaults

```ts
interface NormalizedReq {
  mime?: Mime
  pathParams: Record<string, Schema>
  query: Record<string, Schema>
  headers: Record<string, Schema>
  params: readonly Param[]
  security: readonly oas31.SecurityRequirementObject[]
  body?: Schema | Record<Mime, Schema>
}
```

Merge rules:

- `mime`: child overrides parent
- `pathParams`, `query`, `headers`: shallow merge by key, child wins
- `params`: append parent first, then child
- `security`: compile to OpenAPI security requirement arrays and concatenate
- `body`: child wins if both define it

### Response defaults

```ts
interface NormalizedRes {
  wildcard: RespAugmentation[]
  ranges: Array<{
    match: MatchStatus
    augmentation: RespAugmentation
  }>
  add: OpRes
}
```

Merge rules:

- wildcard and range defaults keep parent-to-child order
- `add` is shallow by status code, child wins
- when compiling an operation status:
  - apply all matching wildcard/range augmentations in order
  - then apply the concrete response
  - local concrete response beats inherited `add` for the same status

That preserves the current `forAll.res.defaults` / `forAll.res.add` intent
without inventing another pass.

## Single-pass algorithm

### 1. Entry point

`responsibleAPI()` should:

1. seed `CompileState`
2. seed root `ScopeContext` from top-level `forAll`
3. walk `routes`
4. merge generated `paths` and `components` into `partialDoc`
5. omit empty component sections

### 2. Walk routes recursively

`compileRoutes(routes, ctx, state)`:

- for each `[routeKey, node]`
- if `node` is a scope:
  - parse and join the path prefix
  - merge `forAll`
  - recurse into `node.routes`
- otherwise compile a single operation into `paths[path][method]`

This is the whole compiler. No AST, no later lowering stage.

### 3. Compile one operation

For each operation:

- compute final path
- merge inherited req/res/tags with local op fields
- compile parameters
- compile request body
- compile responses
- compile security
- write `operationId`, `summary`, `description`, `deprecated`, `tags`

Reject duplicate `(path, method)` pairs immediately.

### 4. Compile refs on demand

Every `compileSchema`, `compileParam`, and `compileSecurityScheme` call should
go through `decodeNameable()`.

Rule:

- anonymous value: inline it
- named thunk: reserve component name first, then compile and store it, then
  return `$ref`

The "reserve name first" part is important for recursive schemas.

Without it, something like a tree node schema will recurse forever.

## Important behavior decisions

### Paths

Current path strings use `:param`, not the old `:param(Type)` syntax.

So path compilation should be simple:

- convert `:id` to `{id}`
- collect the param names from the path
- require a schema for every path param after req inheritance is merged
- reject extra `req.pathParams` keys that are not present in the final path
- reject optional path params

This gives good compiler feedback early and keeps path bugs local.

### Tags

Scope tags should behave like "nearest scope wins":

- child scope `forAll.tags` replaces inherited scope tags
- op-level `tags` replaces scope tags
- emitted OpenAPI tags are just `.name`

### HEAD support

The old generator already had the right basic idea here.

I would support two cases:

- explicit `HEAD({...})`
- synthetic HEAD from `GET({... headID })`

Synthetic HEAD should clone GET and strip response bodies/content.

### Cookies

The old generator silently overwrote multiple cookies into one `set-cookie`
header. I would not copy that behavior blindly.

Safer v1:

- lower one response cookie to a `set-cookie` header with pattern `name=[^;]+`
- if a single response tries to emit multiple cookies, throw a clear compiler
  error for now

That is better than shipping lossy behavior by accident.

### Security

Do not rely on generic object deep-merge here. OpenAPI security semantics are
too specific.

Compile all security inputs to `SecurityRequirementObject[]` first, then merge
explicitly:

- `security`: append compiled requirements
- `security?`: append compiled requirements and then append `{}`

This matches the current DSL surface better than a generic deep merge.

## Suggested file layout

Keep it boring. Something like:

- `src/compiler/index.ts`
- `src/compiler/path.ts`
- `src/compiler/schema.ts`
- `src/compiler/request.ts`
- `src/compiler/response.ts`
- `src/compiler/components.ts`

Then `src/dsl/dsl.ts` just delegates to the compiler entrypoint.

I would avoid starting with more modules than this. The old compiler was only
~1900 LOC with tests. This one should stay in that ballpark.

## Ralph slices

The main thing Ralph needs is not "more tasks", but small tasks with hard stop
conditions and narrow feedback.

### Story 1: minimal direct-op compiler

Scope:

- method helpers return `OpWithMethod`
- `isScope()` works
- `responsibleAPI()` compiles top-level direct ops
- inline schema/request/response only
- no named refs yet
- no nested scopes yet

Stop condition:

- `src/dsl/dsl.test.ts` passes

Feedback:

- `bun test src/dsl/dsl.test.ts`
- `bun run typecheck`
- `bun run lint`

### Story 2: schema compiler plus named schema refs

Scope:

- compile all current schema forms
- use `decodeNameable()` for schema refs
- support recursive named schemas via reserved component slots

Stop condition:

- focused schema compiler tests pass
- output validates through `validate()`

Feedback:

- `bun test src/dsl/schema.test.ts`
- a new focused compiler schema test
- `bun run typecheck`
- `bun run lint`

### Story 3: nested scopes, path joining, tag inheritance

Scope:

- recursive scope walk
- path join and `:param` conversion
- `forAll.req` inheritance except security edge cases
- nearest-scope tag behavior

Stop condition:

- a focused nested-scope golden test passes
- no duplicate path/method regressions

Feedback:

- `bun test src/dsl/dsl.test.ts`
- a new compiler scope/path test
- `bun run typecheck`
- `bun run lint`

### Story 4: request compiler

Scope:

- path/query/header params
- named reusable params
- request body inheritance with `mime`
- explicit path-param mismatch errors
- security compilation

Stop condition:

- request-focused tests pass, including failure cases

Feedback:

- a new compiler request test file
- `bun test src/examples/http-benchmark.test.ts`
- `bun run typecheck`
- `bun run lint`

### Story 5: response defaults and HEAD synthesis

Scope:

- `forAll.res` wildcard defaults
- `defaults` range matching
- `add` inheritance
- local response beats inherited `add`
- explicit `HEAD`
- synthetic HEAD from `headID`

Stop condition:

- response-focused tests pass
- `http-benchmark` and `exceptions` examples pass

Feedback:

- a new compiler response test file
- `bun test src/examples/http-benchmark.test.ts`
- `bun test src/examples/exceptions.test.ts`
- `bun run typecheck`
- `bun run lint`

### Story 6: componentized params/security and real examples

Scope:

- named params in `components.parameters`
- named security schemes in `components.securitySchemes`
- verify larger examples
- update stale expected JSON only where current DSL semantics intentionally
  differ from legacy output

Stop condition:

- at least one large example passes end-to-end

Feedback:

- `bun test src/examples/listenbox.test.ts`
- `bun test src/examples/readme.test.ts`
- `bun run typecheck`
- `bun run lint`

### Story 7: last-mile edge cases

Scope:

- cookies policy
- better duplicate-name errors for components
- polish error messages
- remaining example parity work

Stop condition:

- all remaining focused compiler tests pass
- all example tests that are still meant to be authoritative pass

Feedback:

- targeted `bun test <file>` only
- `bun run typecheck`
- `bun run lint`

## What I would not do in the first iteration

- no compiler AST
- no generic deep-merge utility for everything
- no automatic response/header hoisting based on object identity
- no starting with `youtube` or `readme` as the first acceptance target

Those are good end-state checks, but they are bad first Ralph stories.

## Short version

The compiler can stay very small if it is just:

- a recursive scope walker
- a context merger
- a few emitters for schema/request/response/security
- a component registry driven by `Nameable`

If Ralph stories are shaped around that, each iteration gets a crisp "done"
signal instead of one huge "implement the compiler" blob.
