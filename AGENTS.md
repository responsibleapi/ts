# AGENTS.md

- 100% TypeScript codebase
- Scope of the compiler: OpenAPI 3.1+. If any work touches OpenAPI 3.0.x and
  lower, stop and tell the human

## Vocabulary

- never refer to https://readme.com as "README". Use "readme.com"

## DSL design

- NEVER EDIT types/signatures marked with `@dsl`. If you need to change them,
  ASK FIRST
- full DSL documentation is spread out in `@dsl` tagged JSDocs, you can concat
  them to get the whole picture

## Compiler design

Single pass compiler design:

- Each nested level inherits and extends the context, and as you return up the
  stack, you merge the generated OpenAPI paths. No AST needed - just function
  calls and return values

## Rules

- verify changes to `src/` with `bun check`
- never add `oxlint-disable-next-line` unless explicitly asked
- never edit [package.json](package.json) unless explicitly asked
- never edit [bunfig.toml](bunfig.toml) unless explicitly asked
- never disable or skip or ignore tests
- never edit `src/examples/*.json` files unless explicitly asked

## Imports from packages

- never import from "openapi3-ts/oas31",
  `import type { oas31 } from "openapi3-ts"` instead
- never import from "bun:test", import from "vitest" instead

## CLI tools

### Available

- `rg`
- `jq`
- `xq`
- `ast-grep`
- `scc`
- `bun`
- `pkgx` for calling any CLI in existence

### Rules

- never call `rg --files`, call `rg --files --hidden -g '!.git'` instead
- never call `node`, call `bun` instead
- never call `npx` or `bunx`:
  - if a package is missing, ask to add it to `package.json`
  - if a package is present, call through `bun`
- never run code formatting unless explicitly asked
- [never call `vitest`](docs/package.jsonc), `bun test` instead
- never call `wc`, call `scc` instead (both on files and folders)
- never pass multiple paths to `scc`. A single dir or a single file only

## Docs

- Field-by-field rationale for `package.json` lives in `docs/package.jsonc`

## Custom commands

### %day%'s productivity

```sh
git log --all --since='%day% 00:00:00' --until='%day% 23:59:59' --numstat --format=tformat: | awk 'NF==3 { if ($1 ~ /^[0-9]+$/) add += $1; if ($2 ~ /^[0-9]+$/) del += $2 } END { printf("+%d\n-%d\n", add, del) }'
```

### Commit

- `git add` files from current session
- `git commit` current session with extremely concise yet precise msg
