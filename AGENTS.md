# AGENTS.md

## Foundation

- use `bun` for everything
- never use `bunx`, if any package is missing, ask to add it to `package.json`
- don't waste time formatting files

## Current state of things

Migrating [examples](src/examples/) to the new [DSL](src/dsl/). Trying to move
away from `middleware` DSL to `forAll` prop in both `scope` and `responsibleAPI`
param obj.
