# `youtube.ts` compiler-phase plan

## Entry Criteria

Only start compiler work after:

- the DSL decision is settled
- `src/examples/youtube.ts` reflects the intended parameter placement
- human review of the example shape is complete
- a remaining mismatch is clearly compiler behavior, not source modeling

## Compiler Scope

Inspect and change compiler behavior only as needed to make compiled output
match `src/examples/youtube.json`.

Primary file:

- `src/compiler/request.ts`

Compiler fixes must preserve the distinction between:

- reusable `req.params`
- inline `req.query`
- inline `req.pathParams`
- inline `req.headers`

## Work Order

1. Confirm the remaining mismatch still exists after the human phase.
2. Identify the exact compiler behavior causing it.
3. Fix `src/compiler`.
4. Add or update focused coverage for the compiler behavior.
5. Run automated verification in the required order.

## Verification

Run in this order:

1. if `src/dsl` changed, run focused `bun test` coverage first
2. stop for human review if `src/examples` changed
3. if `src/compiler` changed, run focused coverage and then full `bun test`
4. `bun tsc`
5. `bun lint`

Required passing checks at the end:

- `bun test src/examples/youtube.test.ts`
- `bun tsc`
- `bun lint`

Spot-check these raw paths after each cluster:

- `/youtube/v3/captions`
- `/youtube/v3/captions/{id}`
- `/youtube/v3/liveBroadcasts`
- `/youtube/v3/liveBroadcasts/bind`
- `/youtube/v3/videos`
- `/youtube/v3/videos/getRating`
- `/youtube/v3/watermarks/set`

## Final Success Criteria

- `src/examples/youtube.json` is unchanged
- each raw OAS path gets the correct effective path-level params
- raw inline params stay modeled as inline unless a real reusable component is
  intended
- after the examples are settled, compiler work continues until full `bun test`
  passes
- `bun test src/examples/youtube.test.ts`, `bun tsc`, and `bun lint` all pass
