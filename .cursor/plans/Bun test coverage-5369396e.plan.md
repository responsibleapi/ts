<!-- 5369396e-fd35-467f-9c8c-374e9f1f8243 -->
---
todos:
  - id: "pkg-script"
    content: "Add `test:coverage` script (`bun test --coverage`) to package.json"
    status: pending
  - id: "bunfig"
    content: "Add [test] coverage settings to bunfig.toml (reporters, dir, skip test files; no default coverage on plain `bun test`)"
    status: pending
  - id: "verify"
    content: "Run `bun run test:coverage` and `bun check` to validate"
    status: pending
isProject: false
---
# Bun test coverage setup

## Context

- Primary test command is already [`package.json`](package.json) `"test": "bun test"`.
- [`.gitignore`](.gitignore) already ignores `coverage/`, which matches Bun’s default output directory.
- No `vitest.config.*` exists; coverage should be configured for **Bun’s runner**, not Vitest (`test:slow` is a separate path).

## Approach

Use Bun’s native coverage ([docs](https://bun.sh/docs/test/coverage)): `bun test --coverage`. No new npm packages.

### 1. Add a dedicated script in `package.json`

Add something like:

- `"test:coverage": "bun test --coverage"`

Keep the existing `"test"` script unchanged so normal runs and `bun check` stay fast (coverage adds overhead).

You explicitly asked for this setup; that overrides the usual “don’t touch `package.json`” workspace rule.

### 2. Configure coverage in `bunfig.toml`

The repo’s [`bunfig.toml`](bunfig.toml) is empty today. Add a `[test]` section with sensible defaults:

| Option | Recommendation |
|--------|----------------|
| `coverageReporter` | `["text", "lcov"]` — terminal table plus `coverage/lcov.info` for Codecov, IDE plugins, or `genhtml` if you use it locally |
| `coverageDir` | `"coverage"` (explicit; already gitignored) |
| `coverageSkipTestFiles` | `true` — coverage % reflects **source** files, not `*.test.ts` (usually what people mean by “how covered is the code”) |
| `coverage` | **omit** or `false` — do **not** enable coverage on every `bun test` unless you want slower default runs |

Optional later: `coverageThreshold` once you want CI to enforce minimums (skip initially to avoid surprise failures).

### 3. How you’ll use it

- **Summary in terminal:** `bun run test:coverage` (or `bun test --coverage`).
- **Artifact:** `coverage/lcov.info` for tooling.
- **Per-file curiosity (e.g. `src/help/normalize.ts`):** use the text reporter’s file table or open the lcov in your IDE/coverage viewer.

### 4. Verification

After edits: run `bun run test:coverage` once to confirm output and that `coverage/lcov.info` appears. Run `bun check` per project rules (config-only change, but quick sanity).

### 5. Optional documentation

Only if you want parity with [`docs/package.jsonc`](docs/package.jsonc): add a one-line note that `test:coverage` runs Bun with `--coverage`. Not required for functionality.

## What we are not doing

- No Vitest coverage config (would only apply to `test:slow`).
- No new dependencies or `package.json` edits beyond the one script (unless you later ask for an HTML reporter package).
- No coverage thresholds until you explicitly want gates.
