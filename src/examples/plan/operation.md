# Operation Extension Proposal

## Goal

- Add operation-level OpenAPI vendor extension support to DSL.
- Cover Pachca cases now present in `pachca.yaml`:
  - `x-requirements`
  - `x-paginated`
  - `x-external-url`
- Keep existing fixed operation fields intact.

## Recommendation

- Add one explicit `extensions` field to `OpBase`.
- Type extension values as JSON-like serializable data, not `unknown`.
- Put new types in `src/dsl/operation.ts` first. Reuse same types from
  `scope.ts` later if scope-level support is added.

## Proposed `operation.ts` Shape

```ts
export type OperationExtensionValue =
  | string
  | number
  | boolean
  | null
  | readonly OperationExtensionValue[]
  | { readonly [key: string]: OperationExtensionValue }

export interface OperationExtensions {
  readonly [name: `x-${string}`]: OperationExtensionValue
}

export interface OpBase<TTags extends DeclaredTags = DeclaredTags> {
  id?: string
  res?: OpResponses
  deprecated?: boolean
  description?: string
  summary?: string
  tags?: OpTags<TTags>

  /**
   * OpenAPI vendor extensions emitted verbatim onto the operation object.
   * Keys must start with `x-`.
   *
   * @dsl
   */
  extensions?: OperationExtensions
}
```

## Why This Shape

- `OpBase` is shared by `GetOp` and `Op`. One field covers all methods.
- `extensions` is explicit. DSL stays discoverable. No hidden open-ended shape.
- JSON-like value typing matches OpenAPI payload reality better than `unknown`.
- Pachca fits cleanly:

```ts
GET({
  id: "AuditEventOperations_listAuditEvents",
  extensions: {
    "x-paginated": true,
    "x-requirements": {
      scope: "audit_events:read",
      plan: "corporation",
    },
  },
})

POST({
  id: "DirectUploadOperations_uploadFile",
  extensions: {
    "x-external-url": "directUrl",
    "x-requirements": {
      auth: false,
    },
  },
})
```

## Alternative

- raw template-literal index signature directly to `OpBase`, like:

```ts
readonly [name: `x-${string}`]: unknown
```

- Cons:
  - makes every operation object structurally open-ended
  - weaker excess-property checking
  - weaker docs surface than one named field
  - compiler must scan/filter top-level op keys to find extensions
  - `unknown` admits values impossible to serialize into OpenAPI

## Compiler Follow-Up

- `src/compiler/index.ts` `compileDirectOp(...)` needs one extra spread:

```ts
...(op.extensions !== undefined ? op.extensions : {}),
```

- Put it near other emitted operation metadata.
- `synthesizeHeadOpFromGet(...)` should keep copying `extensions` with rest of
  operation metadata. Current behavior already does this if field lives on
  `GetOp`.

## Scope Note

- Pachca also needs scope-level extension support.
- Same value/type pair can be reused there.
- Keep operation proposal separate first; no need to widen request/response
  shapes for this change.
