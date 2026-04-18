# ResponsibleAPI

Small Typescript [DSL](src/dsl/) that [compiles](src/compiler/) to OpenAPI
3.1.0.

## Development

### CLI

To work on this repo, keep these CLI tools available:

- `bun`: required
- `git`: required for the normal contribution workflow.
- `rg` (`ripgrep`): required for code and file search.
- `ast-grep` (`sg`): required for syntax-aware search and bulk refactors.
- `jq`: required for JSON inspection from the shell.
- `awk`: required for the productivity helper command documented in
  [AGENTS.md](AGENTS.md).
- `scc`: required for file or directory size/count checks; use it instead of
  `wc`.
