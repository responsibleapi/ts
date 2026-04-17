# ast-grep feasibility

Tested with `ast-grep 0.42.1`.

## Help commands inspected

```sh
ast-grep --version
ast-grep --help
ast-grep run --help
ast-grep scan --help
ast-grep test --help
ast-grep new --help
ast-grep new project --help
ast-grep new rule --help
ast-grep new test --help
```

Repo has no existing `sgconfig.yml`, `rules/`, or `rule-tests/`.

If we want project-style rules/tests, bootstrap looks like:

```sh
ast-grep new project -y
ast-grep new rule single-enum-is-const -l ts -y -c sgconfig.yml
ast-grep new test single-enum-is-const -y -c sgconfig.yml
ast-grep test -c sgconfig.yml
```

## `single-enum-is-const.ts`

### Core rewrite

Yes. Core syntax rewrite is doable with `ast-grep`.

This exact preview command matched real repo code:

```sh
ast-grep run \
  --lang ts \
  --pattern 'string({ $$$A, enum: [$E], $$$B })' \
  src/examples/youtube.ts
```

This exact preview rewrite also worked and preserved surrounding formatting
because it rewrote only property pair:

```sh
ast-grep run \
  --lang ts \
  --pattern '({ enum: [$E] })' \
  --selector pair \
  --rewrite 'const: $E' \
  src/examples/youtube.ts
```

### Where it gets weaker than current TypeScript script

Current script also needs:

- only `string(...)` imported from `./schema.ts` or `.../dsl/schema.ts`
- alias support like `import { string as text }`
- skip when sibling `const` already exists
- skip raw OpenAPI objects

I tried exact rule-file experiment:

```sh
cat > /tmp/ast-grep-single-enum.yml <<'EOF'
id: single-enum-is-const-direct
message: single enum can be const
severity: warning
language: TypeScript
rule:
  all:
    - pattern: 'string({ $$$A, enum: [$E], $$$B })'
    - not:
        has:
          pattern: 'const: $_'
fix: 'string({ $$$A, const: $E, $$$B })'
EOF

cat > /tmp/ast-grep-single-enum.ts <<'EOF'
import { string } from "../src/dsl/schema.ts"
import { string as text } from "../src/dsl/schema.ts"

const a = string({ enum: ["corner"] })
const b = text({ enum: ["corner"] })
const c = string({ enum: ["corner"], const: "corner" })
const d = { enum: ["corner"] }
EOF

ast-grep scan \
  --rule /tmp/ast-grep-single-enum.yml \
  /tmp/ast-grep-single-enum.ts \
  --report-style short
```

Observed problem: rule still flagged
`const c = string({ enum: ["corner"], const: "corner" })`.

### Estimate

- Approximate codemod: yes
- Same robustness as current script: not clean
- Main blockers: import-source gating, alias tracking, sibling-aware negative
  match

Best realistic `ast-grep` shape:

- use `ast-grep run` or `scan` for bulk candidate rewrite
- keep scope narrow to obvious direct `string(...)` calls
- review diff manually

If goal is exact parity, current TypeScript AST script is more solid.

## `oxlint-prefer-schema-examples.ts`

### Core rewrite

Bare syntax rewrite is doable. Exact parity is poor fit.

Direct helper-specific rule can be prototyped like this:

```sh
cat > /tmp/ast-grep-example.yml <<'EOF'
id: prefer-schema-examples-direct
message: prefer examples
severity: warning
language: TypeScript
rule:
  pattern: 'string({ $$$A, example: $E, $$$B })'
fix: 'string({ $$$A, examples: [$E], $$$B })'
EOF

cat > /tmp/ast-grep-example.ts <<'EOF'
import { string, dict } from "../src/dsl/schema.ts"
import { string as text } from "../src/dsl/schema.ts"

const a = string({ example: "x" })
const b = text({ example: "x" })
const c = dict(string(), string(), { example: makeValue() })
const d = queryParam({ example: "x", schema: string() })
const e = string({ example: "x", examples: ["x"] })
const f = string({ ...base, example: "x" })
EOF

ast-grep scan \
  --rule /tmp/ast-grep-example.yml \
  /tmp/ast-grep-example.ts \
  --report-style short
```

Observed problem: this direct rule overmatched file with existing `examples`,
missed alias/helper-position complexity, and said nothing about spread handling.

### Why current oxlint rule is much harder to replace

Current rule depends on:

- import-source gating from schema DSL only
- alias tracking for many helpers
- helper-specific option argument index
- object-literal-only detection, including parenthesized object
- skip on spread
- skip when `examples` already exists
- skip when `example` count is not exactly one
- rewrite only property, not whole call

`ast-grep` can express pieces of this, but clean parity likely means:

- many separate rules, at least grouped by helper argument index
- more negative conditions than positive ones
- awkward alias/import correlation
- higher risk of false positives than current oxlint rule

### Estimate

- Approximate codemod: maybe
- Solid replacement for current behavior: no
- Simpler than current oxlint rule: no

Current oxlint rule is better vehicle here.

## Bottom line

- `single-enum-is-const.ts`: `ast-grep` is viable for narrower bulk rewrite, not
  for equally solid replacement without extra review.
- `oxlint-prefer-schema-examples.ts`: `ast-grep` can prototype rewrite, but
  current behavior is not good `ast-grep` target. Existing oxlint rule stays
  simpler and more reliable.
