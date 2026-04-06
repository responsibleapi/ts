---
name: typescript
description: Follow TypeScript editing rules
---

# TypeScript

This skill extends [JavaScript](../javascript/SKILL.md).
Read and apply that skill first.
If a rule conflicts, this TypeScript skill takes precedence.

Follow these additional rules when editing TypeScript:

## Bans

- Never use `as unknown as` to fix type errors.

## Functions

- Never create multiple signatures to fix type or lint errors.
- When asked to fix something inside a function, fix the function body without
  adjusting signatures or types. If the error remains, pause and ask whether you
  can change the types or signature.

## Types

- Always add comments on Conditional Types.
- Always add comments on const modifiers for type parameters.
- Always test Conditional Types. See [references/typelevel-tests.ts](references/typelevel-tests.ts) for the pattern.
- Never introduce a new `type` alias just for `export`. `export` that existing type instead.
- never put `readonly` on anonymous type props

## Tests

- Never typecast actual values (passed to `expect()`), typecast the expected (passed to `toEqual()`) value instead.
- Never use `JSON.stringify()` to work around deep equality type mismatches; specify `T` in `toEqual<T>()` instead.
