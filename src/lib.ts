export function typesafeLowercase<S extends string>(s: S): Lowercase<S> {
  return s.toLowerCase() as Lowercase<S>
}

export type RequireAtLeastTwo<T> = {
  [K1 in keyof T]: {
    [K2 in Exclude<keyof T, K1>]: Required<Pick<T, K1 | K2>> &
      Partial<Omit<T, K1 | K2>>
  }[Exclude<keyof T, K1>]
}[keyof T]
