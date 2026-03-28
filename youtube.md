# `youtube.ts` duplication / rescoping notes

`src/examples/youtube.ts` already uses the right pattern once: root-level
`forAll.req.params` for the shared Google query params
(`src/examples/youtube.ts:5623`). The biggest wins are to reuse that same shape
deeper in the tree.

## High-value changes with the existing DSL

1. Reuse `onBehalfOfContentOwner` as a shared param instead of repeating it
   inline. `onBehalfOfContentOwner` and `onBehalfOfContentOwnerChannel` are
   already declared once (`src/examples/youtube.ts:5451`,
   `src/examples/youtube.ts:5458`), but only the channel variant is reused
   consistently. There are 23 inline `onBehalfOfContentOwner?` copies across
   scopes like `channelSections`, `liveStreams`, `playlistItems`, `playlists`,
   `search`, and `thumbnails`. Make `onBehalfOfContentOwner` a named param and
   move those copies into `req.params`, which is the DSL’s intended reuse slot
   for shared params (`src/dsl/operation.ts:19`).

2. Push base OAuth bundles into `scope({ forAll: { req } })`. `scope` already
   documents additive request inheritance (`src/dsl/scope.ts:113`). `youtube.ts`
   still has 49 `oauthScopes(...)` calls, mostly four repeated bundles: 15x
   `youtube + force-ssl`, 13x `+ youtubepartner`, 9x
   `+ readonly + youtubepartner`, 7x `+ readonly`. For resource scopes that
   already exist, put the base bundle in `forAll.req.security` and let list/read
   methods add `youtube.readonly`.

3. Fold `liveBroadcasts` child actions into the existing `/liveBroadcasts`
   scope. `"/youtube/v3/liveBroadcasts"` is already a scope
   (`src/examples/youtube.ts:6383`), but `bind`, `cuepoint`, and `transition`
   are still sibling top-level routes (`src/examples/youtube.ts:6499`,
   `src/examples/youtube.ts:6528`, `src/examples/youtube.ts:6558`). Move them to
   nested `"/bind"`, `"/cuepoint"`, and `"/transition"` routes so they inherit
   `tags`, `liveBroadcastContentOwnerParams`, and the shared response helpers.

4. Hoist partner defaults inside the partner-heavy scopes. `channelSections`
   (`src/examples/youtube.ts:5877`), `liveStreams`
   (`src/examples/youtube.ts:6796`), `playlistItems`
   (`src/examples/youtube.ts:6982`), and `playlists`
   (`src/examples/youtube.ts:7105`) all repeat the same partner query param plus
   near-identical partner security on every method. Once
   `onBehalfOfContentOwner` is reusable via `params`, move it into
   `forAll.req.params`; put the partner write security in `forAll.req.security`;
   let only the GET methods add `youtube.readonly`. `liveStreams` is the
   cleanest target because every method already uses both content-owner params.

## Optional `dsl.ts` change

5. Keep `src/dsl/dsl.ts` as-is unless you want a root API shape that matches
   `scope`. `responsibleAPI` still has a special root-only shape
   (`src/dsl/dsl.ts:24`) instead of the flat `forAll + routes` style that
   `scope` uses. Letting the root accept a `Scope`-like object, or a
   `root: Scope`, would make very large examples feel less special-cased. It is
   ergonomic only; the cleanup above does not require it.

## Probably not worth abstracting further

`partQuery`, `hlParam`, and `maxResultsParam` (`src/examples/youtube.ts:5530`)
already look like the right abstraction level. Their descriptions and
constraints vary enough that pushing them into `src/dsl/dsl.ts` would likely
hide real API differences more than it would reduce noise.
