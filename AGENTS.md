# AGENTS.md

## Current state of things

- 100% typescript codebase
- never run the whole test suite (the compiler is still TODO), run individual
  test files instead
- Use typechecking and linting for guidance
- currently designing the DSL

## DSL design

- respect @dsl jsdocs, that's core DSL stuff

## Lang rules

### JSONC

- never use `//` comments
- never use `/*` for multiline comments, use `/**` instead, where each line
  starts with a `*`

## Tools

- use `bun` for everything
- never use `bunx`, if a package is missing, ask to add it to `package.json`
- never use `node`
- never run formatting unless the task actually requires it

## Docs

- field-by-field `package.json` rationale lives in `docs/package.jsonc`

## TODO

### Compiler

Single pass compiler design:

Each nested level inherits and extends the context, and as you return up the
stack, you merge the generated OpenAPI paths. No AST needed - just function
calls and return values
