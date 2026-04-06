# `youtube.ts` human-phase plan

## Problem

`src/examples/youtube.ts` does not yet match `src/examples/youtube.json` closely
enough in parameter placement.

The bug to fix is parameter modeling drift, not nesting by itself.

## Goal

Make `src/examples/youtube.ts` model `src/examples/youtube.json` directly enough
that:

- path-level params come out in the right place
- operation-level params come out in the right place
- inline raw params stay inline unless the raw OAS is actually reusable

Do not edit `src/examples/youtube.json`. It is the golden file.

## Facts

- `src/examples/youtube.json` has `39` raw OAS path keys.
- All `39` path items share the same `11` path-level parameter refs:
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
- That shared root interpretation was verified with `jq`.
- Nested scopes are not automatically wrong. Treat them as neutral unless they
  cause a concrete mismatch against `youtube.json`.

## Rules

### Path-level params

- Keep the shared `11` refs in the root `forAll.req.params`.
- Add path-local path-item params only when raw `youtube.json` shows extras
  beyond that shared set.

### Inline params stay inline

- Raw inline query params belong in `req.query`.
- Raw inline path params belong in `req.pathParams`.
- Raw inline header params belong in `req.headers`.
- Do not move inline raw params into reusable `req.params` just to reduce
  duplication.
- Keep `req.params` for real reusable parameter components and deliberate shared
  refs.

### Nesting

- Do not treat prefix nesting as a bug on its own.
- Only reshape route structure if it makes a concrete raw-JSON mismatch easier
  to model or review.
- Structural cleanup is optional. Semantic alignment with `youtube.json` is the
  requirement.

### DSL-first gate

Before changing examples, decide whether the current DSL can express the raw
shape exactly enough.

Use the existing DSL when possible:

- `req.query`
- `req.pathParams`
- `req.headers`
- `req.params`

Do DSL work first only if raw `youtube.json` needs something the current surface
cannot express without becoming semantically wrong.

If an edit would touch an `@dsl` signature, ask first.

## Work Order

1. Inspect `src/examples/youtube.json` as source of truth.
2. Inspect `src/dsl/operation.ts`, `src/dsl/params.ts`, and
   `src/compiler/request.ts`.
3. Decide whether there is any real DSL blocker.
4. If yes, fix `src/dsl` first and add focused tests.
5. Fix `src/examples/youtube.ts` by copying parameter placement from raw
   `youtube.json`, not by inference.
6. Stop for human review of the example shape.

## Suggested Focus Order

Do examples in clusters:

1. captions
2. comments
3. liveBroadcasts
4. videos
5. watermarks

Captions is the best first template because it covers:

- shared root path-level refs
- operation-level inline query params
- inline path params
- single-path and nested-path comparison

## Useful Commands

- `scc src/examples/youtube.ts`
- `jq -r '.paths | keys[]' src/examples/youtube.json`
- `jq -r '.paths | to_entries[] | [.key, ((.value.parameters // []) | map(if has("$ref") then ."$ref" else (.name // "<inline>") end) | join(","))] | @tsv' src/examples/youtube.json`
- `rg -n 'scope\\(|forAll:|\"/' src/examples/youtube.ts`

## Review Questions

For each raw path item:

- Are the path-item params correct after applying the shared root `11` refs?
- Are the operation params placed under the verb instead of being lifted without
  justification?
- Are inline raw params still modeled as inline?
- Is any current `req.params` entry only pretending to be an inline raw param?

## Human-Phase Success Criteria

- `src/examples/youtube.json` is unchanged
- each raw OAS path gets the correct effective path-level params
- raw inline params stay modeled as inline unless a real reusable component is
  intended
- no unsupported raw parameter shape is silently approximated in `youtube.ts`
- the `src/examples` parameter placement has been human-reviewed before compiler
  fixes are treated as valid
