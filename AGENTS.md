# AGENTS.md

## Current state of things

- 100% typescript codebase
- never run the whole test suite (the compiler is still TODO), run individual
  test files instead
- Use typechecking and linting for guidance
- currently finalizing the DSL
- have not started implementing the compiler

## DSL design

- respect @dsl JSDocs, that's core DSL stuff

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

## Custom commands

### Print %day%'s productivity

```sh
git log --all --since='%day% 00:00:00' --until='%day% 23:59:59' --numstat --format=tformat: | awk 'NF==3 { if ($1 ~ /^[0-9]+$/) add += $1; if ($2 ~ /^[0-9]+$/) del += $2 } END { printf("+%d\n-%d\n", add, del) }'
```
