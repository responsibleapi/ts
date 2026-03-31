/**
 * Scalars are inlined as is in OpenAPI doc
 *
 * @dsl
 */
type Scalar<T> = T extends (...args: unknown[]) => unknown ? never : T

/**
 * In DSL positions that accept {@link Nameable}, passing a {@link NamedThunk}
 * emits an OpenAPI `{ "$ref": "#/components/<T>/<name>" }`, where `<name>`
 * comes from {@link Function.name}.
 *
 * Never call the thunk, always pass the reference
 *
 * @dsl
 */
export type NamedThunk<T> = [Scalar<T>] extends [never]
  ? never
  : () => Scalar<T>

export type Nameable<T> = NamedThunk<T> | Scalar<T>

/**
 * Creates a named thunk for component reuse in DSL positions that accept
 * {@link Nameable}. Pass the returned thunk itself when you want a `$ref`.
 */
export const named = <T>(name: string, value: Scalar<T>): NamedThunk<T> => {
  // oxlint-disable-next-line typescript-eslint/no-unsafe-type-assertion
  const thunk = (() => value) as NamedThunk<T>

  Object.defineProperty(thunk, "name", { configurable: true, value: name })

  return thunk
}

const isNamed = <T>(n: Nameable<T>): n is NamedThunk<T> =>
  typeof n === "function"

export function decodeNameable<T>(n: Nameable<T>): {
  name?: string
  value: Scalar<T>
} {
  if (isNamed(n)) {
    return { name: n.name, value: n() }
  }

  return { value: n }
}
