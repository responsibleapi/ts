# Pachca Example Plan

## Goal

- Produce `src/examples/pachca.ts` that expresses `src/examples/pachca.yaml` in
  current DSL.
- Keep `pachca.yaml` as source spec only. Do not edit it in this change.
- Keep implementation change scoped to single file: `src/examples/pachca.ts`.

## Files Studied

- `src/examples/readme.ts`
- `src/examples/youtube.ts`
- `src/examples/listenbox.ts`
- `src/examples/exceptions.ts`
- `src/examples/http-benchmark.ts`
- `src/examples/smells.ts`
- all example `*.test.ts` files

## Output Shape To Aim For

- Use `declareTags(...)` for Pachca tag list.
- Use named HTTP security scheme:
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

- Follow `youtube.ts` for overall file shape:
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
  - Repeated query/path/header params should become named reusable params via
    `queryParam`, `pathParam`, `headerParam`.
  - One-off params can stay inline in `req.query`, `req.pathParams`,
    `req.headers`.
- Schemas:
  - Use plain function thunks for recursive or graph-heavy schemas.
  - Use `named(...)` for leaf reusable pieces where stable component name
    matters and recursion is not needed.
  - Use `ref(...)` only when `$ref` sibling `summary` or `description` is
    needed.
- Bodies:
  - `requestBody.content` maps to `req.body`.
- Responses:
  - `responses[*].content` maps to `resp({ body: ... })`.
  - Repeated `data` / `data + meta` wrappers should be factored into reusable
    helpers or named schemas.
- Security:
  - Use DSL security on scopes/ops, not raw strings.

## Recommended Schema Strategy

- Start from `components.schemas`, not paths.
- Translate in this order:
  1. Primitive aliases and enums
  2. Small leaf objects
  3. Shared wrappers
  4. Unions (`oneOf` / `anyOf` / `allOf`)
  5. Recursive or cross-linked objects
- Likely useful shared building blocks:
  - common pagination meta
  - common API error shapes
  - wrapper objects with `data`
  - wrapper objects with `data` and `meta`
  - reusable list item arrays for repeated collection responses

## Recommended Route Strategy

- Translate routes after schema catalog is stable.
- Group by prefix, not raw source order, so generated file stays navigable.
- Reasonable route order:
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

## Example-Scoped Work

- Scaffold `pachca.ts`:
  - imports
  - tags
  - security
  - common params
  - `responsibleAPI(...)`
- Translate all `components.schemas`.
- Introduce shared wrapper helpers to reduce repetition.
- Translate routes group by group.
- Do all of above inside `src/examples/pachca.ts` only.

## Out Of Scope

- Any file change outside `src/examples/pachca.ts`.
- Any new or updated test file.
- No DSL/compiler feature work here.

## Next Step After Example Work

- Do not resolve compiler gaps in this change.
- If exact top-level auth parity still matters after `src/examples/pachca.ts`
  lands, next step is [`pachca-compiler.md`](./pachca-compiler.md).
