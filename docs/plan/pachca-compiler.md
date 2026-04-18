# Pachca Compiler Plan

## Goal

- Implement compiler behavior needed by Pachca translation.
- Keep all code changes scoped to `src/compiler/`.

## Files Studied

- `src/compiler/index.ts`
- `src/compiler/schema.ts`

## Primary Compiler Change

- Make root `responsibleAPI({ forAll.req.security })` emit document-level
  OpenAPI `security`.
- Keep nested `scope({ forAll.req.security }).` behavior as per-operation
  inheritance.
- Register security schemes through root inherited request security path too, so
  `partialDoc` does not need raw auth metadata.

## Why This Matters

- `pachca.ts` should be able to express top-level auth via DSL alone.
- Exact top-level `security` parity should come from compiler behavior, not new
  example-only conventions.

## Scope Boundaries

- Only `src/compiler/*`.
- No edits in `src/examples/`.
- No DSL signature changes here.

## Suggested Implementation

1. Start by writing `src/compiler/security.test.ts` covering root and nested
   inherited request security behavior.
2. Trace current handling of inherited request security in compiler.
3. Detect root-level inherited security separately from nested scope security.
4. Emit document-level `security` when source is root `forAll.req.security`.
5. Preserve existing per-operation emission for nested scopes and operation
   overrides.
6. Ensure security schemes referenced through root path are registered in
   generated components.

## Validation

- Use `src/compiler/security.test.ts` as primary verification target.
- Verify nested scope auth still compiles to per-operation `security`.
- Verify root auth compiles to top-level OpenAPI `security`.

## Explicit Non-Goals

- No raw-schema escape hatch.
- No typed `extensions` support.

## Follow-Up For Example Work

- Once root auth behavior lands, `src/examples/pachca.ts` can rely on root
  `forAll.req.security` for exact document-level auth parity.
