export const typesafeLowercase = <S extends string>(s: S): Lowercase<S> =>
  s.toLowerCase() as Lowercase<S>
