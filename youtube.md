# `youtube.ts` param-mismatch fix plan

## Goal

Make `src/examples/youtube.ts` model `src/examples/youtube.json` directly.

The current file is still mixing two different `scope` roles:

- exact raw-path scope: `"/youtube/v3/captions"` and `"/youtube/v3/videos"`
  each carry same-path methods directly on the scope
- URL-prefix grouping scope: `"/youtube/v3/watermarks"` is only a container for
  `"/set"` and `"/unset"`
- hybrid scope: `"/youtube/v3/liveBroadcasts"` is both an exact raw path item
  and a parent for `"/bind"`, `"/cuepoint"`, and `"/transition"`

That blocks the goal at line 5 because `src/examples/youtube.json` is organized
as `39` independent raw OAS path items, while `youtube.ts` is still partly
organized as convenience trees. Once a scope can mean either "this exact path
item" or "a prefix that happens to own several path items", the source stops
being a direct mirror of the raw JSON shape. You then have to infer whether
shared `forAll`, `req`, `res`, and `tags` are meant to belong to one raw path
item or to several sibling raw path items. That ambiguity is exactly what makes
parameter and response placement drift easy: values that are shared for prefix
convenience can look like they belong to a concrete raw path item, and values
that belong to one raw path item can be written at a parent scope that also
governs descendants.

The captions regression was not caused by nesting alone:

- raw `"/youtube/v3/captions"` has path-level `parameters`
- current source already supplies the shared `11` path-level refs via the root
  `forAll.req.params`, which matches the golden
- the compiler already joins nested scope paths into separate full raw OAS path
  keys, so a nested `"/{id}"` still compiles as its own raw path item
- operation-level params are still easy to misplace when exact raw path items
  are blended with prefix-group scopes

## Facts To Build Around

- `src/examples/youtube.json` currently has `39` raw OAS path keys.
- Every one of those `39` path items has the same `11` path-level parameter
  refs:
  - `#/components/parameters/_.xgafv`
  - `#/components/parameters/access_token`
  - `#/components/parameters/alt`
  - `#/components/parameters/callback`
  - `#/components/parameters/fields`
  - `#/components/parameters/key`
  - `#/components/parameters/oauth_token`
  - `#/components/parameters/prettyPrint`
  - `#/components/parameters/quotaUser`
  - `#/components/parameters/upload_protocol`
  - `#/components/parameters/uploadType`
- Verified with `jq`: the file has `39` paths and `1` unique path-level
  parameter-ref list, so the shared-root interpretation is real, not inferred.

## Structural Direction

Keep `src/examples/youtube.json` as the direct modeling target. Exact-path
mirroring in source is required here.

With the current compiler:

- nested scopes are flattened by joined full paths
- inherited `forAll.req.params` compile into path-item `parameters` for each
  resulting raw OAS path key
- nesting is only a problem when parent-local inheritance would leak behavior
  that should not apply to a child raw path item

That means:

- the root `forAll.req.params` should keep carrying the common `11` refs,
  because `jq` shows they are identical across all `39` raw path items
- do not force-copy those `11` refs into every exact path scope unless the raw
  JSON stops being uniform
- promote a nested child path only when a parent-local `forAll` would make the
  child compile incorrectly, or when the flatter structure is materially
  clearer
- prefix-level sharing that is not truly shared by all descendants should move
  to local helpers or more precise scopes

In practice, later implementation should preserve the shared root-level `11`
refs and fix the exact-path structure around them. That structural correction
belongs in `src/examples`, not in ad hoc compiler behavior.

## Parameter Modeling Guardrails

Treat raw `youtube.json` inline parameters as placement data, not as reuse
candidates.

Rules:

- do not convert raw inline operation parameters from `youtube.json` into
  reusable `req.params` entries just because several operations happen to look
  similar
- if a parameter is an inline raw query parameter, model it in `req.query`
- if a parameter is an inline raw path parameter, model it in `req.pathParams`
- if a parameter is an inline raw header parameter, model it in `req.headers`
- if `youtube.ts` already uses `req.params` for parameters that should stay
  inline in the raw OAS, move them back into `query` / `pathParams` /
  `headers` record form
- keep `req.params` for actual reusable parameter components and deliberate
  shared refs, such as the already-uniform root-level `11` path-item refs

This matches the existing compiler split in `src/compiler/request.ts`:

- `req.params` is the reusable-parameter path
- `req.query`, `req.pathParams`, and `req.headers` are the structured inline
  parameter path

Do not "improve reuse" in `youtube.ts` by moving inline raw params into
`req.params` unless the raw OAS is already expressing that parameter as a
reusable component/ref and the source should mirror that.

## DSL-First Gate

`src/dsl` work comes first, but only when the raw YouTube parameter shape cannot
be expressed correctly with the current request surface.

Check the existing surface first:

- `req.query: Record<NameWithOptionality, Schema>`
- `req.pathParams: Record<string, Schema>`
- `req.headers: Record<NameWithOptionality, Schema>`
- `req.params: readonly ReusableParam[]`

Use the current DSL when it can represent the raw shape exactly enough. Do not
change the DSL just to fix path nesting or to preserve the shared root-level
`11` refs.

If raw `youtube.json` requires parameter behavior that the current DSL cannot
express, stop and do DSL work first. Examples:

- a parameter shape that cannot live in `query` / `pathParams` / `headers`
  record form without becoming semantically wrong
- parameter metadata outside the currently supported `ParamRaw` surface
- location-specific style/explode behavior that the current narrow param types
  do not permit

If that happens:

- modify `src/dsl` first
- add or update DSL/compiler tests first
- only then continue with `src/examples`

If the needed change touches `@dsl`-marked signatures, ask first before editing
those signatures.

## Paths To Review For Inheritance Leaks

These are currently nested and are separate raw OAS path items, so they are the
places to check first if parent-local `forAll` state is too broad:

- `/youtube/v3/captions/{id}`
- `/youtube/v3/comments/markAsSpam`
- `/youtube/v3/comments/setModerationStatus`
- `/youtube/v3/liveBroadcasts/bind`
- `/youtube/v3/liveBroadcasts/cuepoint`
- `/youtube/v3/liveBroadcasts/transition`
- `/youtube/v3/videos/getRating`
- `/youtube/v3/videos/rate`
- `/youtube/v3/videos/reportAbuse`
- `/youtube/v3/watermarks/set`
- `/youtube/v3/watermarks/unset`

Special case:

- `/youtube/v3/watermarks` is currently a synthetic prefix scope. It is not a
  raw OAS path key in `youtube.json`, but that alone does not make it wrong.
  It should only be removed if its inherited `forAll` stops matching all child
  paths.

## Ordered Workstreams

Work in this order:

1. `src/dsl`
2. `src/examples`
3. `src/compiler`

Compiler work is last on purpose. Do not change compiler behavior to compensate
for a source-modeling mistake in `youtube.ts`, and do not skip the DSL check by
encoding an unsupported raw parameter shape incorrectly in examples.

## 1. DSL Work First

### 1.1 Inventory first

Before touching code, use the golden file as the source of truth:

- `scc src/examples/youtube.ts`
- `jq -r '.paths | keys[]' src/examples/youtube.json`
- `jq -r '.paths | to_entries[] | [.key, ((.value.parameters // []) | map(if has("$ref") then ."$ref" else (.name // "<inline>") end) | join(","))] | @tsv' src/examples/youtube.json`
- `rg -n 'scope\\(|forAll:|\"/' src/examples/youtube.ts`

The point of this pass is to produce an exact mapping from:

- current top-level route key
- current nested child route key
- target full raw OAS path key

Also inventory the request-modeling surface before editing examples:

- inspect `src/dsl/operation.ts`
- inspect `src/dsl/params.ts`
- inspect `src/compiler/request.ts`

The point of this pass is to answer two questions up front:

- can this raw parameter be modeled as `query` / `pathParams` / `headers`
  without losing meaning?
- if not, what exact DSL gap must be closed before touching `youtube.ts`?

### 1.2 Decide whether DSL changes are needed

For each parameter mismatch you find:

- if it is representable with `req.query`, `req.pathParams`, or `req.headers`,
  keep the DSL as-is and defer the fix to `src/examples`
- if it only works today via `req.params` but should stay inline in raw OAS,
  treat that as an examples-level correction, not as a reason to keep the reuse
  path
- if the raw OAS needs unsupported parameter semantics, modify the DSL first

Deliverable for this stage:

- a short list of true DSL blockers, or a decision that there are none

## 2. Examples Work Second

### 2.1 Preserve the shared path-item baseline

Then:

- keep those params in the root `forAll.req`
- keep root-level MIME defaults
- only add path-local `forAll.req.params` if raw JSON shows path-specific
  `PathItem.parameters` beyond the global `11`

This is the key model correction: each exact raw path item must compile to the
right effective `PathItem.parameters`, but identical global refs do not need to
be mechanically duplicated in source.

### 2.2 Keep inline params inline

When rebuilding operation params from `youtube.json`:

- prefer `req.query` for inline query params
- prefer `req.pathParams` for inline path params
- prefer `req.headers` for inline header params
- if a current `req.params` entry is only standing in for one of those inline
  raw params, move it out of `req.params`
- do not introduce new reusable parameter components just to reduce duplication
  in `youtube.ts`

Use small local helpers only if they preserve inline compilation semantics. The
goal is not maximum deduplication; the goal is a source model that still matches
the raw OAS.

### 2.3 Reshape routes to one exact path item per `scope`

There are three cases:

- Exact multi-method paths:
  - keep them as scopes
  - keep relying on the shared root `11` unless that exact raw path has extra
    path-level params
- Nested child raw paths:
  - they may stay nested if the inherited `forAll` is semantically correct for
    the child raw path item
  - promote them to sibling full-path scopes only when that avoids incorrect
    inheritance or materially improves clarity
- Single-method direct paths:
  - wrap them in exact-path scopes when that helps the source mirror the raw
    `paths` object, not just to re-home the shared root `11`

This should keep the source behavior aligned with the raw OAS `paths` object,
whether the source uses exact-path scopes or a harmless prefix tree.

### 2.4 Rebuild operation-level params from raw JSON

After the path-item structure is correct, fix operation-level mismatches by
copying from raw `youtube.json`, not by inference.

Rule:

- `PathItem.parameters` in raw JSON maps to the effective path-item params for
  that exact source path after inheritance
- because raw `youtube.json` currently has one shared path-level param set
  across all `39` paths, root inheritance is acceptable for those `11` refs
- operation `parameters` in raw JSON stay inside the verb’s `req`
- shared query params like `onBehalfOf` only belong in path-level `forAll` if
  raw JSON actually puts them there

The captions block is the template:

- `/youtube/v3/captions` should still effectively get the shared `11` path-item
  refs from the root
- `DELETE` keeps only its operation-level extras:
  - `id`
  - `onBehalfOf`
  - `onBehalfOfContentOwner`
- `/youtube/v3/captions/{id}` must still compile as its own raw path item,
  whether it stays nested in source or is promoted to a sibling scope, while
  still effectively getting the same shared `11` refs

Do the same comparison for each reviewed cluster:

- captions
- comments
- liveBroadcasts
- videos
- watermarks

### 2.5 Preserve sharing without reintroducing wrong scope semantics

Anything that was previously being shared through prefix nesting should move to
local helpers instead when that sharing is not truly uniform:

- shared tag arrays
- shared security helpers
- shared success response helpers
- shared record-producing helpers when they still compile to inline params
- shared operation param arrays only for true reusable parameter components

Parent path scopes are fine for prefix reuse when the inherited behavior is
truly shared by every descendant raw path. Root-level sharing that `jq` proves
is universal across all `39` raw paths is still fine.

## 3. Compiler Work Third

Only touch `src/compiler` after the DSL decision is settled and the examples are
modeled correctly.

Compiler follow-up is justified only if:

- `youtube.ts` is using the right DSL surface
- the compiled output still mismatches raw `youtube.json`
- the mismatch is caused by compiler behavior rather than source placement

If compiler work is needed:

- preserve the distinction between reusable `req.params` and structured inline
  `req.query` / `req.pathParams` / `req.headers`
- do not add compiler logic whose only purpose is to recover from using
  `req.params` where inline records should have been used
- add focused tests in `src/compiler/request.test.ts` for the exact mismatch
  before or alongside the fix

## Tooling Plan

Use the existing CLI set first. It should be enough.

- `scc` for quick size estimation
- `jq` as the raw OAS source of truth
- `rg` for broad inventory and candidate lists
- `ast-grep` for structural search and preview of repetitive rewrites

Good `ast-grep` targets:

- find top-level route pairs whose value is a direct `GET(...)` / `POST(...)` /
  `PUT(...)` / `DELETE(...)` instead of a `scope(...)`
- find nested child path pairs inside existing `scope(...)` bodies
- preview repetitive wrapping or promotion candidates before editing

Use `ast-grep run` without `-U` first. Only apply a bulk rewrite after the
preview matches expectations.

## Optional Extra Tool

Not needed at the start, but if structural JSON diffs are still too noisy after
the refactor, consider:

- `brew install jd`

Use it only as a nicer JSON diff for compiled output vs golden. The core
refactor should still be driven by `jq`, `rg`, `ast-grep`, and the existing
test.

## Suggested Execution Order

1. Inventory `youtube.json`, `youtube.ts`, and the current DSL/compiler request
   surface.
2. Decide whether any raw YouTube params require DSL work before examples.
3. If there is a real DSL gap, fix `src/dsl` first and cover it with tests.
4. Keep the shared root-level `11` path params and stop treating that sharing
   as the bug.
5. Fix captions end to end in `src/examples`, using inline record-style params
   for inline raw parameters.
6. Review the other nested child-path clusters for incorrect inherited state:
   - comments
   - liveBroadcasts
   - videos
   - watermarks
7. Wrap remaining single-method direct paths into exact-path scopes.
8. Sweep operation-level mismatches against raw `youtube.json`.
9. Only then evaluate whether any residual mismatch requires compiler work.
10. Run verification.

Doing captions first is useful because it exercises all failure modes at once:

- confusion between effective path-item params and local placement in source
- wrong operation-level param distribution
- overly broad inherited scope state
- accidental misuse of reusable `req.params` for raw inline params

## Verification

After implementation later, verify in this order:

1. if `src/dsl` or `src/compiler` changed, run focused `bun test` coverage for
   the touched request/DSL behavior
2. `bun tsc`
3. `bun lint`

Also spot-check raw path-item `parameters` on a few representatives after each
cluster:

- `/youtube/v3/captions`
- `/youtube/v3/captions/{id}`
- `/youtube/v3/liveBroadcasts`
- `/youtube/v3/liveBroadcasts/bind`
- `/youtube/v3/videos`
- `/youtube/v3/videos/getRating`
- `/youtube/v3/watermarks/set`

## Success Criteria

The refactor is done when all of the following are true:

- each raw OAS path key in `youtube.json` has a matching exact-path source
  representation in `youtube.ts` ([scope merge behavior](src/dsl/scope.ts))
- each raw OAS path key gets the correct effective path-level params, whether
  supplied by the shared root `forAll` or by a path-local scope
- raw inline parameters from `youtube.json` stay modeled as inline
  `query` / `pathParams` / `headers` unless a real reusable parameter component
  is intended
- no unsupported raw parameter shape is silently approximated in `youtube.ts`;
  DSL work happens first if exact modeling requires it
