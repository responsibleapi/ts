# AGENTS.md

## Current state of things

- 100% TypeScript codebase
- DSL is ready
- have not started implementing the compiler

## TypeScript

- ALWAYS run `bun check` to verify your changes
- never add `oxlint-disable-next-line` unless explicitly asked

## Imports from packages

- never import from "openapi3-ts/oas31",
  `import type { oas31 } from "openapi3-ts"` instead
- never import from "bun:test", import from "vitest" instead

## CLI tools

- never call `node`, call `bun` instead
- never call `npx` or `bunx`:
  - if a package is missing, ask to add it to `package.json`
  - if a package is present, call through `bun`
- never run code formatting unless explicitly asked
- [never call `vitest`](docs/package.jsonc), `bun test` instead
- `rg`, `ast-grep`, `jq` are available for calling
- never call `wc`, call `scc` instead (both on files and folders)
- never pass multiple paths to `scc`. A single dir or a single file only.

### Code search

Use `ripgrep` for:

- exact strings
- symbol/file discovery
- comments/docs/config text
- first-pass broad narrowing

Use `ast-grep` for:

- “find X inside Y”
- syntax/context constraints
- refactoring/codemod search
- “find behavior pattern, not exact text”

### `git`

- never run `git commit` without running `git add` first

### Refactoring with `ast-grep`

- Use `scc <path>` first when a large-file or large-folder refactor needs a
  quick size estimate.
- Prefer `ast-grep` for large repetitive syntax-preserving refactors instead of
  writing an ad hoc TypeScript codemod.
- Start with `ast-grep run` without `-U` to preview the rewrite and inspect the
  diff. Rerun with `-U` only after the preview looks correct.
- Use plain `--rewrite` only when replacing matched node text is enough. If the
  edit must also move or remove commas, brackets, or other separators, switch to
  a YAML rule with `fix`.
- When removing a list/object item plus its trailing comma, use `fix` with
  `expandStart` and/or `expandEnd`.
- When one match needs coordinated rewrites across multiple child nodes, prefer
  `rewriters` with `transform.rewrite`.
- Use `ast-grep` for the bulk rewrite, then do a small cleanup pass for naming
  or edge cases.

## DSL design

- NEVER EDIT types/signatures marked with `@dsl`. If you need to change them,
  ASK FIRST
- full DSL documentation is spread out in `@dsl` tagged JSDocs, you can concat
  them to get the whole picture

## Compiler design

Still TODO.

Single pass compiler design:

- Each nested level inherits and extends the context, and as you return up the
  stack, you merge the generated OpenAPI paths. No AST needed - just function
  calls and return values

## Docs

- field-by-field `package.json` rationale lives in `docs/package.jsonc`

## Custom commands

### %day%'s productivity

```sh
git log --all --since='%day% 00:00:00' --until='%day% 23:59:59' --numstat --format=tformat: | awk 'NF==3 { if ($1 ~ /^[0-9]+$/) add += $1; if ($2 ~ /^[0-9]+$/) del += $2 } END { printf("+%d\n-%d\n", add, del) }'
```

### Commit

- `git add` files from current session
- `git commit` current session with extremely concise yet precise msg
