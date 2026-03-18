function isLowercaseResult<S extends string>(
  source: S,
  candidate: string,
): candidate is Lowercase<S> {
  return candidate === source.toLowerCase()
}

export function typesafeLowercase<S extends string>(s: S): Lowercase<S> {
  const lower = s.toLowerCase()

  if (isLowercaseResult(s, lower)) {
    return lower
  }

  throw new Error("Lowercasing returned an unexpected value")
}

export type RequireAtLeastTwo<T> = {
  [K1 in keyof T]: {
    [K2 in Exclude<keyof T, K1>]: Required<Pick<T, K1 | K2>> &
      Partial<Omit<T, K1 | K2>>
  }[Exclude<keyof T, K1>]
}[keyof T]
