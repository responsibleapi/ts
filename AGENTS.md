# AGENTS.md

## Current state of things

The compiler itself isn't implemented yet, so running tests won't be too useful.
Rely on code, typechecking and linting for now. Once the examples are in good
shape, we can start implementing the compiler and use examples as tests

## Tools

- use `bun` for everything
- never use `bunx`, if a package is missing, ask to add it to `package.json`
- never use `node`
- never use `prettier` or other formatting tools, just don't bother

## Typescript

- never create multiple signatures to fix type/lint errors
- never use `Reflect`. Adjust types instead

## Docs

- field-by-field `package.json` rationale lives in `docs/package.jsonc`

## TODO

Single pass compiler design:

Each nested level inherits and extends the context, and as you return up the
stack, you merge the generated OpenAPI paths. No AST needed - just function
calls and return values
