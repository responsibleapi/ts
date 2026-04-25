# Progress

## TODO

- make the npm package usable as `@responsibleapi/ts` from downstream projects
  like `/Users/adelnizamutdinov/Projects/recurring/packages/openapi`
  - `package.json` currently declares `types: "./dist/index.d.ts"` and exports
    `./dist/index.js`, but the installed `@responsibleapi/ts@1.0.0` package did
    not include `dist/`
  - `bunx tsc --noEmit -p packages/openapi/tsconfig.json` in `recurring`
    failed with `Cannot find module '@responsibleapi/ts' or its corresponding
    type declarations`
  - publish a fixed version that includes built `dist/**`, or change exports to
    files that are actually published
  - verify from a fresh downstream install that `import { responsibleAPI } from
    "@responsibleapi/ts"` resolves without `paths` hacks
  - consider adding a publish guard that packs to a temp dir and type-checks a
    tiny consumer project against the packed tarball
- introduce a `duration` DSL helper for RFC 3339 / ISO 8601 duration strings
  - should emit a string schema with `format: "duration"`
  - useful for recurring billing periods like `P1W`, `P1M`, and `P1Y`
- rename req.params to req.reusableparams, because it's not clear why we're
  defining an inline query param in `query` but some other random named param in
  `params`
- we have "legacy" stuff already in `src/compiler/`. wtf
- SKILL.md

## Someday

https://www.openapis.org/blog/2025/09/23/announcing-openapi-v3-2
