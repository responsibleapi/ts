I stopped before editing [youtube.ts](src/examples/youtube.ts), because
`youtube.json` needs DSL features that are not present yet.

## OAuth2

OAuth2 security schemes are missing from the DSL. [dsl.ts](src/dsl/dsl.ts#L4),
and [security.ts](src/dsl/security.ts#L3) only models query/header schemes. The
YouTube spec defines OAuth2 implicit and authorization-code schemes in
[youtube.json](src/examples/youtube.json#L13701).

read https://spec.openapis.org/oas/v3.1.0.html#security-scheme-object

DSL is just a convenient layer on top of OpenAPI 3.1

- OpenAPI security requirement arrays with scoped alternatives are missing.
  [scope.ts](src/dsl/scope.ts#L24) only allows a single `security` value or a
  single optional `"security?"` value. The YouTube spec uses arrays of
  alternative requirements with per-scheme scope lists, for example in
  [youtube.json](src/examples/youtube.json#L211) and
  [youtube.json](src/examples/youtube.json#L6121).
- The schema DSL hardcodes too few formats. [schema.ts](src/dsl/schema.ts#L3)
  only permits string formats `email|uri|uuid|date|date-time|binary|url|blob`,
  and [schema.ts](src/dsl/schema.ts#L33) only permits integer formats
  `int32|int64`. The YouTube schema needs at least `byte`, `uint32`, and
  `uint64`, e.g. [youtube.json](src/examples/youtube.json#L10357),
  [youtube.json](src/examples/youtube.json#L11679), and
  [youtube.json](src/examples/youtube.json#L13076).

Because of those gaps, bringing [youtube.ts](src/examples/youtube.ts) fully up
to date would require DSL work first. If you want, I can implement those DSL
additions next.
