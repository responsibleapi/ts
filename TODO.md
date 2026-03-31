# TODO

## readme.test.ts

- Missing DSL for `components.headers` (golden file defines reusable headers
  under `components.headers`; the compiler does not emit that bucket yet).
- Missing thunks / wiring in `src/examples/readme.ts` that produce
  `components.responses` as in `src/examples/readme.json` (golden has a large
  `components.responses` map starting around line 1493; paths reference these
  via `$ref`, while the compiled doc inlines response shapes instead).
- Smaller field-level mismatches vs the compiled output: compare optional query
  parameters and integer schemas in the golden file — e.g.
  `components.parameters.page` and `components.parameters.perPage` (roughly
  lines 1451–1470 in `src/examples/readme.json`), where the JSON omits
  `required` on the parameter object and omits `format` on `schema`, but the
  received spec adds `required: false` and `format: "int32"` for those integers.
  Use the same area for other parameter/schema diffs when reconciling snapshots.
