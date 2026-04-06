---
name: javascript
description: Follow JavaScript editing rules
---

# JavaScript

## Bans

- Never use `Reflect`.
- Never use `Object.assign` when you can do object spread.
- Never extract single item array as a named const. Inline `[item]` everywhere instead.

## Functions

- Never use named `function` for one liners, use arrow function instead.
- Never spread a returned object at the call site to change one property; add
  that property to the function's object arg in the definition and handle it
  in the function body. [example](./references/call-site-spreading.js).

## Modules

- Never export previously declared locals via `export { ... }` unless explicitly asked; export them at the declaration instead
- Never re-export from other modules unless explicitly asked; import from the source module directly

## Comments

- Never use comments to explain why code is written that way; use comments to explain why the code exists.
- Never use `//` unless inside function body.
- When moving or adding doc comments, attach the comment to the declaration that
  owns the documented behavior. Do not move a function-level comment onto a
  parameter unless the user explicitly asks to document that parameter.
- Never link to declarations using backticks. Use `{@link ...}` instead.
- Never link to GitHub when a local `{@link ...}` is possible.

## Tests

- Never leave a test file without a top level `describe` block.
- Never use `it` blocks, use `test` instead.
- Never use `JSON.stringify()` for deep equality, use `expect(x).toEqual(y)` instead.
- Never introduce declarations out of the `test` scope if they only used in a single `test`; make them `test`-local instead
- Never introduce declarations inside a top-level `describe`; make them top-level instead

## Bun

If a project uses [Bun](https://bun.com), follow these additional rules:

- Read YAML files like this: `import x from "./x.yaml" assert { type: "yaml" }`
