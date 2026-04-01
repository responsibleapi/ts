# TODO

- Remove `ensureResponseComponents` from
  [`ResponsibleApiInput`](src/dsl/dsl.ts#L27) in
  [`src/dsl/dsl.ts`](src/dsl/dsl.ts) and allow passing OpenAPI `components`
  (extend [`PartialDoc`](src/dsl/dsl.ts#L25) / input shape accordingly) so
  callers can declare `components.responses` and other component kinds without a
  special-case field.
