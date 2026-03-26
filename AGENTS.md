# AGENTS.md

## Chat rules

- never use absolute paths for clickable file links in this repo, refer to files
  and directories using repo-relative paths only. Root of this repo is `./`

## Current state of things

- 100% TypeScript codebase
- never run the whole test suite (the compiler is still TODO), run individual
  test files instead
- Use typechecking and linting for guidance
- DSL is almost finalized
- have not started implementing the compiler

## DSL design

- respect @dsl JSDocs, that's core DSL stuff

## CLI tools

- use `bun` for everything
- never use `bunx`, if a package is missing, ask to add it to `package.json`
- never use `node`
- never run formatting unless explicitly asked to
- [never use `vitest`](docs/package.jsonc), `bun test` instead
- never use `wc`, use `scc` instead. Can use it for both folders and files.
  `scc` counts lines + approximates code complexity.

## Packages

### `openapi3-ts`

- never `import type { ... } from "openapi3-ts/oas31"`,
  `import type { oas31 } from "openapi3-ts"` instead.

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
