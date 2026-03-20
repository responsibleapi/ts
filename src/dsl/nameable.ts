type NonFunction =
  | bigint
  | boolean
  | null
  | number
  | object
  | string
  | symbol
  | undefined

/**
 * this is pretty much core of this DSL. {@link Function.name} is used as
 * $ref in OpenAPI "#/components/.../$name", otherwise the value is inlined
 *
 * now the big question is, when we need to name something weird like
 * "#/components/parameters/_.xgafv",
 */
export type Nameable<T extends NonFunction> = (() => T) | T

const isNamed = <T extends NonFunction>(n: Nameable<T>): n is () => T =>
  typeof n === "function"

function _decodeNameable<T extends NonFunction>(
  n: Nameable<T>,
): { name?: string; value: T } {
  if (isNamed(n)) {
    return { name: n.name, value: n() }
  }

  return { value: n }
}
