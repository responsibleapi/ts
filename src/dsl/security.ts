import type { Nameable } from "./nameable.ts"

type QuerySecurity = Readonly<{
  type: "query"
  name: string
  description?: string
}>

type HeaderSecurity = Readonly<{
  type: "header"
  name: string
  description?: string
}>

type OAuthScopes = Readonly<Record<string, string>>

type OAuthImplicitFlow = Readonly<{
  authorizationUrl: string
  refreshUrl?: string
  scopes: OAuthScopes
}>

type OAuthPasswordFlow = Readonly<{
  tokenUrl: string
  refreshUrl?: string
  scopes: OAuthScopes
}>

type OAuthClientCredentialsFlow = Readonly<{
  tokenUrl: string
  refreshUrl?: string
  scopes: OAuthScopes
}>

type OAuthAuthorizationCodeFlow = Readonly<{
  authorizationUrl: string
  tokenUrl: string
  refreshUrl?: string
  scopes: OAuthScopes
}>

type OAuth2Flows = Readonly<{
  implicit?: OAuthImplicitFlow
  password?: OAuthPasswordFlow
  clientCredentials?: OAuthClientCredentialsFlow
  authorizationCode?: OAuthAuthorizationCodeFlow
}>

type OAuth2Security<TFlows extends OAuth2Flows = OAuth2Flows> = Readonly<{
  type: "oauth2"
  description?: string
  flows: TFlows
}>

export type SecurityScheme = Nameable<
  QuerySecurity | HeaderSecurity | OAuth2Security
>

/**
 * An OAuth2 scheme declares what flows and scopes exist.
 *
 * An OAuth2 requirement is the operation-level use of that scheme:
 * it points at the declared scheme and selects the scopes that must be
 * granted for that operation.
 */
type OAuth2Requirement = Readonly<{
  kind: "scheme"
  scheme: OAuth2SecurityScheme
  scopes: readonly string[]
}>

type SecurityOperands = readonly [Security, Security, ...Security[]]

type SecurityAnd = Readonly<{
  kind: "and"
  items: SecurityOperands
}>

type SecurityOr = Readonly<{
  kind: "or"
  items: SecurityOperands
}>

export type Security =
  | SecurityScheme
  | OAuth2Requirement
  | SecurityAnd
  | SecurityOr

type OAuth2SecurityScheme = Nameable<OAuth2Security>

/*
 * This unwraps {@link Nameable} so scope inference works for both inline
 * objects and named thunks.
 */
type DecodeSecurityScheme<T extends SecurityScheme> =
  T extends () => infer Value ? Value : T

/*
 * OAuth2 scopes can be declared across multiple flows, so this unions the
 * scope keys from every configured flow into one requirement-time scope set.
 */
export type OAuth2ScopeName<T extends OAuth2SecurityScheme> = Extract<
  {
    [K in keyof DecodeSecurityScheme<T>["flows"]]-?: NonNullable<
      DecodeSecurityScheme<T>["flows"][K]
    > extends Readonly<{
      scopes: infer Scopes extends OAuthScopes
    }>
      ? keyof Scopes
      : never
  }[keyof DecodeSecurityScheme<T>["flows"]],
  string
>

export const querySecurity = (param: {
  name: string
  description?: string
}): QuerySecurity => ({
  type: "query",
  ...param,
})

export const headerSecurity = (param: {
  name: string
  description?: string
}): HeaderSecurity => ({
  type: "header",
  ...param,
})

export const oauth2Security = <const TFlows extends OAuth2Flows>(param: {
  description?: string
  flows: TFlows
}): OAuth2Security<TFlows> => ({
  type: "oauth2",
  ...param,
})

export function oauth2Requirement<T extends OAuth2SecurityScheme>(
  scheme: T,
  scopes: readonly OAuth2ScopeName<T>[],
): OAuth2Requirement {
  return {
    kind: "scheme",
    scheme,
    scopes,
  }
}

export const AND = (...items: SecurityOperands): SecurityAnd => ({
  kind: "and",
  items,
})

export const OR = (...items: SecurityOperands): SecurityOr => ({
  kind: "or",
  items,
})
