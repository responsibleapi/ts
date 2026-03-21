/**
 * {@link Nameable} allows lazy thunks, but {@link named} should only wrap
 * concrete values. Callable inputs are therefore rejected by collapsing them
 * to `never`.
 */
type NonFunction<T> = T extends (...args: any[]) => unknown ? never : T

/**
 * this is pretty much core of this DSL. {@link Function.name} is used as
 * $ref in OpenAPI "#/components/.../$name", otherwise the value is inlined.
 *
 * This reuses {@link NonFunction} so callable values are rejected consistently
 * in both raw and thunk-wrapped forms.
 *
 * @dsl
 */
type NamedThunk<T> =
  /**
   * Collapse named thunks entirely when {@link NonFunction} rejects `T`,
   * otherwise `Nameable<Fn>` would degrade to `() => never` instead of `never`.
   */
  [NonFunction<T>] extends [never] ? never : () => NonFunction<T>

export type Nameable<T> = NamedThunk<T> | NonFunction<T>

/**
 * Use this for component keys that are not valid TypeScript identifiers,
 * for example `named("_.xgafv", queryParam(...))`.
 */
export const named = <T>(
  componentName: string,
  value: NonFunction<T>,
): (() => NonFunction<T>) =>
  Object.defineProperty(() => value, "name", {
    configurable: true,
    value: componentName,
  })

const isNamed = <T>(n: Nameable<T>): n is NamedThunk<T> =>
  typeof n === "function"

const _isNonFunction = <T>(n: Nameable<T>): n is NonFunction<T> =>
  typeof n !== "function"

function _decodeNameable<T>(n: Nameable<T>): {
  name?: string
  value: NonFunction<T>
} {
  if (isNamed(n)) {
    return { name: n.name, value: n() }
  }

  return { value: n }
}
