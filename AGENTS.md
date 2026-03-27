# AGENTS.md

## Chat rules

- never use absolute paths for clickable file links in this repo, refer to files
  and directories using repo-relative paths only

## Current state of things

- 100% TypeScript codebase
- DSL is almost finalized
- have not started implementing the compiler
- never run the whole test suite, run individual test files instead
- use typechecking and linting for verification

## CLI tools

- never use `node`, use `bun` instead
- never use `bunx`, if a package is missing, ask to add it to `package.json`
- never run formatting unless explicitly asked to
- [never use `vitest`](docs/package.jsonc), `bun test` instead
- never use `wc`, use `scc` instead (both on files and folders)
- both `rg` and `ast-grep` are available for use

### `git`

- never run `git commit` without running `git add` first

### `ast-grep`

- Use `scc <path>` first when a refactor targets a large file or a large folder
  and you need a quick size estimate.
- Treat `ast-grep` as the default tool for large repetitive syntax-preserving
  refactors, especially when the same shape appears many times in one file.
- Prefer `ast-grep run` without `-U` first to preview the rewrite and inspect
  the diff before applying it.
- After the preview looks correct, rerun the same command with `-U` to apply it
  mechanically.
- Use `ast-grep` for the bulk transformation and then do a small follow-up
  cleanup pass for naming, formatting, or edge cases.

## DSL design

- never edit declarations tagged with `@dsl`. If you need to change them, ask
  first
- full DSL documentation is spreadout in `@dsl` tagged JSDocs, you can concat
  them to get the full story

## Language rules

### TypeScript

- when a helper takes a typed object parameter, add new override fields to that
  input object and handle them inside the helper instead of spreading the
  helper's return value just to patch one property afterward

## Package rules

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

### %day%'s productivity

```sh
git log --all --since='%day% 00:00:00' --until='%day% 23:59:59' --numstat --format=tformat: | awk 'NF==3 { if ($1 ~ /^[0-9]+$/) add += $1; if ($2 ~ /^[0-9]+$/) del += $2 } END { printf("+%d\n-%d\n", add, del) }'
```

### Commit

- `git add` files from current session
- `git commit` current session with extremely concise yet precise msg
