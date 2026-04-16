# Pachca Translation Plan

## Goal

- Produce sibling `src/examples/pachca.ts` that expresses `src/examples/pachca.yaml` in the current DSL.
- Keep `pachca.yaml` as the source spec while translation is in progress.
- Target the style already used by `src/examples/youtube.ts`, `src/examples/readme.ts`, and `src/examples/listenbox.ts`.

## Files Studied

- Examples:
  - `src/examples/readme.ts`
  - `src/examples/youtube.ts`
  - `src/examples/listenbox.ts`
  - `src/examples/exceptions.ts`
  - `src/examples/http-benchmark.ts`
  - `src/examples/smells.ts`
  - all example `*.test.ts` files
- DSL and compiler:
  - `src/dsl/nameable.ts`
  - `src/dsl/schema.ts`
  - `src/dsl/operation.ts`
  - `src/dsl/params.ts`
  - `src/dsl/response-headers.ts`
  - `src/dsl/security.ts`
  - `src/dsl/scope.ts`
  - `src/dsl/tags.ts`
  - `src/compiler/index.ts`
  - `src/compiler/schema.ts`

## Output Shape To Aim For

- Use `declareTags(...)` for the Pachca tag list.
- Use a named HTTP security scheme:
  - `const BearerAuth = named("BearerAuth", httpSecurity({ scheme: "Bearer" }))`
- Put shared request defaults in root `forAll` where possible:
  - request mime
  - shared auth
  - shared reusable params
- Group routes by prefix with `scope(...)`:
  - `/chats`
  - `/messages`
  - `/users`
  - `/profile`
  - `/search`
  - `/tasks`
  - `/group_tags`
  - remaining one-off routes
- Create one reusable schema thunk per `components.schemas.*`.

## Style Choice

- Follow `youtube.ts` for the overall file shape:
  - large reusable schema catalog first
  - route tree second
  - heavy use of `scope(...)`
- Follow `readme.ts` for:
  - `named(...)` reusable params
  - `named(...)` reusable headers
  - reusable response wrappers and shared error bodies
- Follow `listenbox.ts` for:
  - multi-mime request bodies
  - response cookies and headers
  - nested route groups

## Translation Rules

- Path conversion:
  - OpenAPI `/users/{id}` becomes DSL `"/users/:id"`.
- Parameters:
  - Repeated query/path/header params should become named reusable params via `queryParam`, `pathParam`, `headerParam`.
  - One-off params can stay inline in `req.query`, `req.pathParams`, `req.headers`.
- Schemas:
  - Use plain function thunks for recursive or graph-heavy schemas.
  - Use `named(...)` for leaf reusable pieces where a stable component name matters and recursion is not needed.
  - Use `ref(...)` only when a `$ref` sibling `summary` or `description` is needed.
- Bodies:
  - `requestBody.content` maps to `req.body`.
  - `responses[*].content` maps to `resp({ body: ... })`.
- Responses:
  - Repeated `data` / `data + meta` wrappers should be factored into reusable helpers or named schemas.
- Security:
  - Use DSL security on scopes/ops, not raw strings.

## Recommended Schema Strategy

- Start from the components section, not the paths.
- Translate in this order:
  1. Primitive aliases and enums
  2. Small leaf objects
  3. Shared wrappers
  4. Unions (`oneOf` / `anyOf` / `allOf`)
  5. Recursive or cross-linked objects
- For Pachca specifically, likely useful shared building blocks are:
  - common pagination meta
  - common API error shapes
  - wrapper objects with `data`
  - wrapper objects with `data` and `meta`
  - reusable list item arrays for repeated collection responses

## Recommended Route Strategy

- Translate routes after the schema catalog is stable.
- Group by prefix, not by raw source order, so the generated file stays navigable.
- A reasonable route order:
  1. `/audit_events`
  2. `/bots`
  3. `/chats`
  4. `/custom_properties`
  5. `/direct_url`
  6. `/group_tags`
  7. `/messages`
  8. `/oauth/token/info`
  9. `/profile`
  10. `/search`
  11. `/tasks`
  12. `/threads`
  13. `/uploads`
  14. `/users`
  15. `/views`
  16. `/webhooks`

## Current DSL Gaps

- `nullable`
  - `src/dsl/schema.ts` does not expose `nullable`.
  - Pachca uses `nullable` in multiple schemas.
- Vendor extensions on operations
  - `x-paginated`
  - `x-requirements`
  - `x-external-url`
  - Current operation DSL/compiler does not preserve arbitrary `x-*` fields.
- Boolean `additionalProperties`
  - current `dict(...)` models schema-valued `additionalProperties`
  - it does not model raw `additionalProperties: true`
- Exact top-level global security placement
  - current DSL naturally emits per-operation security via `forAll.req.security`
  - `partialDoc.security` is copied through, but security schemes are only registered when the DSL security path is exercised
- Object-level example richness
  - the schema DSL is narrower than raw OpenAPI objects in a few places

## What This Means For `pachca.ts`

- A semantically close translation is possible for a large part of the file today.
- A structurally faithful translation is blocked until we choose a strategy for:
  - `nullable`
  - vendor extensions
  - boolean `additionalProperties`
- If byte-for-byte or normalized-equivalence against `pachca.yaml` matters, those gaps should be addressed before implementation.

## Suggested Minimal DSL Extensions

- Schema:
  - add `nullable?: true` support
  - or add a raw-schema escape hatch for cases the typed helpers do not cover
- Operation/scope:
  - add typed extension support such as `extensions?: Record<\`x-${string}\`, unknown>`
- Object dictionaries:
  - add support for `additionalProperties: true`
- Root auth:
  - decide whether exact top-level `security` parity is worth dedicated support

## Generator Idea

- `typescript` can help with code generation and printing TS source.
- Bun natively supports importing `.yaml` and `.yml`, so a Bun-run generator can consume `pachca.yaml` directly without adding a YAML package.
- Practical split:
  - import `./pachca.yaml` from the Bun script that generates or validates `pachca.ts`
  - generate `pachca.ts` from that object using TS AST or string templates
- This keeps `pachca.yaml` as the source spec while avoiding an extra dependency just for YAML parsing.

## Implementation Phases

1. Add or reject the missing DSL features.
2. Scaffold `pachca.ts`:
   - imports
   - tags
   - security
   - common params
   - `responsibleAPI(...)`
3. Translate all `components.schemas`.
4. Introduce shared wrapper helpers to reduce repetition.
5. Translate routes group by group.
6. Decide how to represent or defer Pachca-specific `x-*` metadata.
7. Add a validation test only after the parity target is clear.

## Decision Points Before Starting

- Is exact OpenAPI parity required, or is semantic parity enough?
- Can the DSL/compiler be extended first?
- Must the translation tooling run outside Bun, or is a Bun-only import path acceptable?
- Should Pachca-specific `x-*` metadata live in emitted OpenAPI, or is it acceptable to keep it in side metadata for now?
