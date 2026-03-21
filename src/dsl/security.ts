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

type OAuth2Security = Readonly<{
  type: "oauth2"
  description?: string
  flows: Readonly<{
    implicit?: OAuthImplicitFlow
    password?: OAuthPasswordFlow
    clientCredentials?: OAuthClientCredentialsFlow
    authorizationCode?: OAuthAuthorizationCodeFlow
  }>
}>

export type Security = Nameable<QuerySecurity | HeaderSecurity | OAuth2Security>

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

export const oauth2Security = (param: {
  description?: string
  flows: OAuth2Security["flows"]
}): OAuth2Security => ({
  type: "oauth2",
  ...param,
})
