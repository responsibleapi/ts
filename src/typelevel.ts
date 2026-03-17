export type Assert<T extends true> = T

/*
 * This conditional mirrors tsd's `expectAssignable`, checking whether `Actual`
 * can be used anywhere `Expected` is required.
 */
export type IsAssignable<Actual, Expected> = [Actual] extends [Expected]
  ? true
  : false

/*
 * This is useful for compile-time assertions that a rejected type-level branch
 * collapsed to `never`.
 */
export type IsNever<T> = [T] extends [never] ? true : false
