# AGENTS.md

## Current state of things

- DO NOT attempt to run tests.
- Current implementation is throwing errors at import time, don't worry about
  it.
- Use typechecking and linting for guidance

## Tools

- use `bun` for everything
- never use `bunx`, if a package is missing, ask to add it to `package.json`
- never use `node`
- never use `prettier` or other formatting tools, just don't bother

## Typescript

- When reading yaml files, use
  `import x from "./x.yaml" assert { type: "yaml" }`

## Docs

- field-by-field `package.json` rationale lives in `docs/package.jsonc`

## TODO

Single pass compiler design:

Each nested level inherits and extends the context, and as you return up the
stack, you merge the generated OpenAPI paths. No AST needed - just function
calls and return values
