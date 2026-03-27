# `src/examples/youtube.ts` route duplication audit

## Snapshot

- There are 76 operations in the route block.
- Root `forAll` already handles JSON mime plus the global Google query params.
- There are 15 route-level `scope(...)` blocks, and every one currently uses
  `forAll` only for `tags`.
- That means most route duplication is still sitting inside scopes instead of
  being pulled up.

## Biggest things already liftable with current `forAll`

### 1. Some sibling routes should be merged into one scope first

These are the clearest cases where route regrouping would unlock real `forAll`
reuse:

- `videos`
  - Current shape: `/youtube/v3/videos` plus `/getRating` plus `/rate` plus
    `/reportAbuse`
  - Shared today: `tags.videos`
  - Five operations repeat
    `youtubeScopes(youtube, youtube.force-ssl, youtubepartner)`.
  - Four operations repeat `onBehalfOfContentOwner?`.
- `watermarks`
  - Current shape: `/youtube/v3/watermarks/set` plus
    `/youtube/v3/watermarks/unset`
  - Shared today: `tags.watermarks`, `channelId`, `onBehalfOfContentOwner?`
  - `set` would just override body and use the wider upload security preset.

`liveChat` is a weaker candidate. The URL prefix is shared, but `bans`,
`messages`, and `moderators` have different tags and different query shapes, so
nesting helps less there.

### 2. Existing scopes leave a lot of `forAll` unused

Right now the route-level scopes are mostly using `forAll` as a tag holder. Some
of them could lift more immediately:

- `comments`: all methods share the same security requirement.
- `captions`: most methods share security and delegation params.
- `videos`: several methods share both partner-write security and
  `onBehalfOfContentOwner?`.
- `liveBroadcasts`: most methods share both delegation params, and several share
  the same write security.

There is also existing room in `forAll.res`:

- `successfulResponse` is already reused 20 times.
- Scope-level response defaults could remove more repeated `200` boilerplate
  once merge semantics are in place.

### 3. Repeated query packs are the main cross-route noise

Inside the route block, the biggest repeats are:

- `part`: 51 uses
- `onBehalfOfContentOwner?`: 42 uses
- `onBehalfOfContentOwnerChannel?`: 17 uses
- `pageToken?`: 15 uses
- `maxResults?`: 15 uses
- `hl?`: 10 uses

These are not all liftable with `forAll`, because they span unrelated scopes.
But they are strong signals for reusable query bundles or helper factories.

## DSL additions worth considering

### 1. Method-group `forAll`

Current `forAll` is all-methods-only. A lot of resource scopes have a stable
split like this:

- `GET` uses a read or read-partner security combo
- `POST` / `PUT` / `DELETE` use a write or write-partner combo
- the write methods repeat the same delegation params

That pattern shows up in at least:

- `channelSections`
- `liveBroadcasts`
- `liveStreams`
- `playlistItems`
- `playlists`
- `videos`

A DSL like `forMethods(["POST", "PUT", "DELETE"], { ... })`, or some named op
preset layer, would remove duplication that plain `forAll` cannot touch.

### 2. Reusable param bundles

The route file wants higher-level reusable packs, not just one param at a time.
Examples:

- `contentOwnerDelegation`
- `contentOwnerChannelDelegation`
- `pagination`
- `localizedList`
- `part("video", "list")`

This matters because the same query params recur across unrelated scopes, so
local `forAll` is not enough.

### 3. Security presets

There are only 11 distinct security shapes, and the top few dominate:

- 19 uses of `youtube + youtube.force-ssl + youtubepartner`
- 15 uses of `youtube + youtube.force-ssl`
- 9 uses of `youtube + youtube.force-ssl + youtube.readonly + youtubepartner`
- 8 uses of `youtubeScope(youtube.force-ssl)`

Named presets would make route definitions shorter and easier to scan than
repeating raw scope URLs everywhere.

### 4. Mutation and upload helpers

There are a few route shapes that recur enough to deserve a helper:

- JSON in, same JSON out
- image upload body reused by `channelBanners.insert` and `watermarks.set`
- caption upload body reused by `captions.insert` and `captions.update`
- bodyless `200` success reused 20 times

This suggests helpers like `jsonMutation(X)`, `imageUpload(X)`,
`captionUpload(X)`, and `ok()`.

## Suggested order

1. Rescope `comments`, `captions`, `videos`, and `liveBroadcasts` so nested
   `forAll` can actually pull its weight.
2. Add param and security presets once those family shapes are clearer in code.
3. Only then add a method-group DSL, because that seems to be the cleanest
   answer to the remaining duplication.
