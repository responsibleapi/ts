# Pachca DSL Proof

## Conclusion

Yes. If the target is faithful Pachca parity, the DSL/compiler needs to be
extended first.

## Proven Gaps

- Operation-level vendor extensions are used throughout `pachca.yaml`, and the
  current DSL has no place to put them.
  - `/audit_events` `GET` carries `x-paginated` and `x-requirements` at
    [pachca.yaml](./pachca.yaml#L167)
  - `/direct_url` `POST` carries `x-external-url` and `x-requirements` at
    [pachca.yaml](./pachca.yaml#L1333)
  - `x-requirements` appears 67 times in the file
  - `x-paginated` appears 14 times in the file
  - `x-external-url` appears once in the file
  - The operation DSL only admits fixed fields in
    [operation.ts](../dsl/operation.ts)
  - The compiler only emits that fixed set in
    [index.ts](../compiler/index.ts#L974)
  - There is no `extensions` field or other `x-*` escape hatch in the current
    DSL surface

- `nullable` is used in Pachca schemas, and the schema DSL cannot express it.
  - `profile/status` response has nullable `data` at
    [pachca.yaml](./pachca.yaml#L2874)
  - `AccessTokenInfo.name` is nullable at [pachca.yaml](./pachca.yaml#L4700)
  - `UserStatus.away_message` is nullable at [pachca.yaml](./pachca.yaml#L7625)
  - `nullable: true` appears 33 times in the file
  - `SchemaOpts` in [schema.ts](../dsl/schema.ts#L17) has no `nullable`
  - The schema union in [schema.ts](../dsl/schema.ts#L107) has no
    null-or-nullable form

## What Does Not Prove A Gap

- Unions do not justify extension work here.
  - `oneOf`, `anyOf`, and `allOf` are already supported in
    [schema.ts](../dsl/schema.ts#L205)
  - The note in [pachca.md](./pachca.md#L92) is stale on that point

- MIME-specific request bodies do not justify extension work here.
  - The DSL already supports `Schema | Record<Mime, Schema>` in
    [operation.ts](../dsl/operation.ts#L42)
  - The compiler already emits multi-content request bodies in
    [index.ts](../compiler/index.ts#L619)

- `additionalProperties: true` may still be a general DSL gap, but it does not
  prove anything for Pachca specifically.
  - I did not find that shape in `pachca.yaml`

## Minimal Extension Set Justified By Pachca

- Add schema-level `nullable`
- Add operation/scope-level `x-*` extension support

Without those two changes, `pachca.ts` will either lose Pachca metadata or fail
to represent parts of the schema exactly.
