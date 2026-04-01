import type { oas31 } from "openapi3-ts"

/**
 * Scalars are inlined as is in OpenAPI doc
 *
 * @dsl
 */
type Scalar<T> = T extends (...args: unknown[]) => unknown ? never : T

/**
 * OpenAPI {@link oas31.ReferenceObject} fields other than `$ref` (e.g.
 * `summary`, `description`), aligned with openapi3-ts types.
 */
export type RefWithoutRef = Omit<oas31.ReferenceObject, "$ref">

/**
 * In DSL positions that accept {@link Nameable}, passing a {@link NamedThunk}
 * emits an OpenAPI `{ "$ref": "#/components/<T>/<name>" }`, where `<name>`
 * comes from {@link Function.name}.
 *
 * Optional {@link RefWithoutRef} siblings (`summary`, `description`) may be set
 * via {@link ref}; they are meaningful when the compiler emits `$ref`
 * (follow-up).
 *
 * Never call the thunk, always pass the reference
 *
 * @dsl
 */
export type NamedThunk<T> = [Scalar<T>] extends [never]
  ? never
  : { (): Scalar<T> } & RefWithoutRef

export type Nameable<T> = NamedThunk<T> | Scalar<T>

function getRefSibling<T>(target: T, key: keyof T): string | undefined {
  const d = Object.getOwnPropertyDescriptor(target, key)
  if (d === undefined) return

  const v = d.value
  return typeof v === "string" ? v : undefined
}

/**
 * Creates a named thunk for component reuse in DSL positions that accept
 * {@link Nameable}. Pass the returned thunk itself when you want a `$ref`.
 *
 * Reference siblings (`summary`, `description`) are left unset; use {@link ref}
 * to attach them.
 */
export const named = <T>(name: string, value: Scalar<T>): NamedThunk<T> => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const thunk = (() => value) as NamedThunk<T>

  Object.defineProperty(thunk, "name", {
    value: name,
    writable: false,
    enumerable: false,
    configurable: true,
  })

  return thunk
}

/**
 * Wraps a {@link NamedThunk} with OpenAPI reference siblings. The returned thunk
 * keeps the same resolved value and copies {@link Function.name}. Existing
 * sibling values are preserved unless the outer wrapper overrides them.
 */
export const ref = <T>(
  thunk: NamedThunk<T>,
  fields: RefWithoutRef,
): NamedThunk<T> => {
  const wrapper = named(thunk.name, thunk())
  Object.assign(wrapper, thunk, fields)

  return wrapper
}

const isNamed = <T>(n: Nameable<T>): n is NamedThunk<T> =>
  typeof n === "function"

type DecodedNameable<T> = {
  name?: string
  value: Scalar<T>
  summary?: string
  description?: string
}

export function decodeNameable<T>(n: Nameable<T>): DecodedNameable<T> {
  if (!isNamed(n)) {
    return { value: n }
  }

  const summary = getRefSibling(n, "summary")
  const description = getRefSibling(n, "description")
  const out: DecodedNameable<T> = { name: n.name, value: n() }
  if (summary !== undefined) {
    out.summary = summary
  }
  if (description !== undefined) {
    out.description = description
  }
  return out
}
