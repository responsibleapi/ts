# `youtube.ts` duplication / rescoping notes

`src/examples/youtube.ts` already uses the right pattern once: root-level
`forAll.req.params` for the shared Google query params
(`src/examples/youtube.ts:5623`). The biggest wins are to reuse that same shape
deeper in the tree.

## High-value changes with the existing DSL

2. Push base OAuth bundles into `scope({ forAll: { req } })`. `scope` already
   documents additive request inheritance (`src/dsl/scope.ts:113`). `youtube.ts`
   still has 49 `oauthScopes(...)` calls, mostly four repeated bundles: 15x
   `youtube + force-ssl`, 13x `+ youtubepartner`, 9x
   `+ readonly + youtubepartner`, 7x `+ readonly`. For resource scopes that
   already exist, put the base bundle in `forAll.req.security` and let list/read
   methods add `youtube.readonly`.

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
