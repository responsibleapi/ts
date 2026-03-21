import type { oas31 } from "openapi3-ts"
import { decodeNameable, type Nameable } from "./nameable.ts"

type SecurityScheme = Nameable<oas31.SecuritySchemeObject>

type OAuth2SecuritySchemeObject<
  TFlows extends oas31.OAuthFlowsObject = oas31.OAuthFlowsObject,
> = Omit<oas31.SecuritySchemeObject, "type" | "flows"> & {
  type: "oauth2"
  flows: TFlows
}

type OAuth2SecurityScheme<
  TFlows extends oas31.OAuthFlowsObject = oas31.OAuthFlowsObject,
> = Nameable<OAuth2SecuritySchemeObject<TFlows>>

type NamedOAuth2SecurityScheme<
  TFlows extends oas31.OAuthFlowsObject = oas31.OAuthFlowsObject,
> = () => OAuth2SecuritySchemeObject<TFlows>

type NamedSecurityScheme = () => oas31.SecuritySchemeObject

type SecurityOperand = NamedSecurityScheme | oas31.SecurityRequirementObject

type SecurityOperands = readonly [
  SecurityOperand,
  SecurityOperand,
  ...SecurityOperand[],
]

export type Security =
  | SecurityScheme
  | oas31.SecurityRequirementObject
  | readonly oas31.SecurityRequirementObject[]

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
      scopes: infer Scopes
    }>
      ? Extract<keyof Scopes, string>
      : never
  }[keyof DecodeSecurityScheme<T>["flows"]],
  string
>

export const querySecurity = (param: {
  name: string
  description?: string
}): oas31.SecuritySchemeObject => ({
  type: "apiKey",
  in: "query",
  ...param,
})

export const headerSecurity = (param: {
  name: string
  description?: string
}): oas31.SecuritySchemeObject => ({
  type: "apiKey",
  in: "header",
  ...param,
})

export const oauth2Security = <
  const TFlows extends oas31.OAuthFlowsObject,
>(param: {
  description?: string
  flows: TFlows
}): OAuth2SecuritySchemeObject<TFlows> => ({
  type: "oauth2",
  ...param,
})

function getSecuritySchemeName(scheme: SecurityScheme): string {
  const { name } = decodeNameable(scheme)

  if (typeof name !== "string" || name.length === 0) {
    // OAS 3.1 security requirement keys must match component security scheme
    // names, so inline unnamed schemes cannot be referenced here.
    throw new Error(
      "security requirements need a named scheme; use a named function or named()",
    )
  }

  return name
}

function toSecurityRequirement(
  security: SecurityOperand,
): oas31.SecurityRequirementObject {
  if (typeof security === "function") {
    return { [getSecuritySchemeName(security)]: [] }
  }

  return security
}

export function oauth2Requirement<T extends NamedOAuth2SecurityScheme>(
  scheme: T,
  scopes: readonly OAuth2ScopeName<T>[],
): oas31.SecurityRequirementObject {
  return {
    [getSecuritySchemeName(scheme)]: [...scopes],
  }
}

export const securityAND = (
  ...items: SecurityOperands
): oas31.SecurityRequirementObject => {
  const merged: oas31.SecurityRequirementObject = {}

  for (const item of items) {
    for (const [scheme, scopes] of Object.entries(
      toSecurityRequirement(item),
    )) {
      const existingScopes = merged[scheme] ?? []
      const nextScopes = scopes.filter(scope => !existingScopes.includes(scope))

      merged[scheme] = [...existingScopes, ...nextScopes]
    }
  }

  return merged
}

export const securityOR = (
  ...items: SecurityOperands
): readonly [
  oas31.SecurityRequirementObject,
  oas31.SecurityRequirementObject,
  ...oas31.SecurityRequirementObject[],
] => {
  const [first, second, ...rest] = items

  return [
    toSecurityRequirement(first),
    toSecurityRequirement(second),
    ...rest.map(toSecurityRequirement),
  ]
}
