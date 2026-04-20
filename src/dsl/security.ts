import type { oas31 } from "openapi3-ts"
import type { Nameable, NamedThunk } from "./nameable.ts"

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

type HttpSecuritySchemeObject<TScheme extends string = string> = Omit<
  oas31.SecuritySchemeObject,
  "type" | "scheme"
> & {
  type: "http"
  scheme: TScheme
}

/**
 * Security requirements reference component names, so composition helpers need
 * the named thunk branch of {@link Nameable} rather than inline scheme values.
 */
type NamedSecurityScheme<
  TScheme extends oas31.SecuritySchemeObject = oas31.SecuritySchemeObject,
> = NamedThunk<TScheme>

type NamedOAuth2SecurityScheme<
  TFlows extends oas31.OAuthFlowsObject = oas31.OAuthFlowsObject,
> = NamedSecurityScheme<OAuth2SecuritySchemeObject<TFlows>>

export interface SecurityRequirementWithSchemes {
  readonly requirement: oas31.SecurityRequirementObject
  readonly schemes: readonly NamedSecurityScheme[]
}

export interface SecurityRequirementsWithSchemes {
  readonly requirements: readonly [
    oas31.SecurityRequirementObject,
    oas31.SecurityRequirementObject,
    ...oas31.SecurityRequirementObject[],
  ]
  readonly schemes: readonly NamedSecurityScheme[]
}

type SecurityOperand =
  | NamedSecurityScheme
  | oas31.SecurityRequirementObject
  | SecurityRequirementWithSchemes

type SecurityOperands = readonly [
  SecurityOperand,
  SecurityOperand,
  ...SecurityOperand[],
]

export type Security =
  | SecurityScheme
  | oas31.SecurityRequirementObject
  | readonly oas31.SecurityRequirementObject[]
  | SecurityRequirementWithSchemes
  | SecurityRequirementsWithSchemes

function dedupeSecuritySchemes(
  schemes: readonly NamedSecurityScheme[],
): NamedSecurityScheme[] {
  const seen = new Set<string>()
  const out: NamedSecurityScheme[] = []

  for (const scheme of schemes) {
    if (seen.has(scheme.name)) {
      continue
    }

    seen.add(scheme.name)
    out.push(scheme)
  }

  return out
}

function isSecurityRequirementWithSchemes(
  security: SecurityOperand,
): security is SecurityRequirementWithSchemes {
  return (
    typeof security === "object" &&
    security !== null &&
    "requirement" in security &&
    "schemes" in security
  )
}

function toSecurityRequirementWithSchemes(
  security: SecurityOperand,
): SecurityRequirementWithSchemes {
  if (isSecurityRequirementWithSchemes(security)) {
    return security
  }

  if (typeof security !== "function") {
    return { requirement: security, schemes: [] }
  }

  if (security.name) {
    return {
      requirement: { [security.name]: [] },
      schemes: [security],
    }
  }

  throw new Error(
    `security requirements need a named scheme; got inline value ${JSON.stringify(
      security(),
    )}; use a named function or named()`,
  )
}

/**
 * This unwraps {@link Nameable} so scope inference works for both inline objects
 * and named thunks.
 */
type DecodeSecurityScheme<T extends SecurityScheme> =
  T extends NamedThunk<infer Value> ? Value : T

/**
 * Each OAuth2 flow contributes its own scope map, so absent flows collapse to
 * `never` while declared scope keys remain available for requirement typing.
 */
type OAuth2FlowScopeName<TFlow> =
  TFlow extends Readonly<{
    scopes: infer Scopes
  }>
    ? Extract<keyof Scopes, string>
    : never

/**
 * OAuth2 scopes can be declared across multiple flows, so this unions the scope
 * keys from every configured flow into one requirement-time scope set.
 */
export type OAuth2ScopeName<T extends OAuth2SecurityScheme> =
  DecodeSecurityScheme<T> extends Readonly<{
    flows: infer Flows extends oas31.OAuthFlowsObject
  }>
    ? Extract<
        {
          [K in keyof Flows]-?: OAuth2FlowScopeName<NonNullable<Flows[K]>>
        }[keyof Flows],
        string
      >
    : never

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

export const httpSecurity = <const TScheme extends string>(param: {
  scheme: TScheme
  description?: string
  bearerFormat?: string
}): HttpSecuritySchemeObject<TScheme> => ({
  type: "http",
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

export const oauth2Requirement = <T extends NamedOAuth2SecurityScheme>(
  scheme: T,
  scopes: readonly OAuth2ScopeName<T>[],
): SecurityRequirementWithSchemes => ({
  requirement: {
    [scheme.name]: [...scopes],
  },
  schemes: [scheme],
})

export function securityAND(
  ...items: SecurityOperands
): SecurityRequirementWithSchemes {
  const merged: oas31.SecurityRequirementObject = {}
  const parts = items.map(toSecurityRequirementWithSchemes)

  for (const { requirement } of parts) {
    for (const [scheme, scopes] of Object.entries(requirement)) {
      const existingScopes = merged[scheme] ?? []
      const nextScopes = scopes.filter(scope => !existingScopes.includes(scope))

      merged[scheme] = [...existingScopes, ...nextScopes]
    }
  }

  return {
    requirement: merged,
    schemes: dedupeSecuritySchemes(parts.flatMap(part => part.schemes)),
  }
}

export const securityOR = (
  ...items: SecurityOperands
): SecurityRequirementsWithSchemes => {
  const [first, second, ...rest] = items
  const head = toSecurityRequirementWithSchemes(first)
  const next = toSecurityRequirementWithSchemes(second)
  const tail = rest.map(toSecurityRequirementWithSchemes)

  return {
    requirements: [
      head.requirement,
      next.requirement,
      ...tail.map(item => item.requirement),
    ],
    schemes: dedupeSecuritySchemes(
      [head, next, ...tail].flatMap(item => item.schemes),
    ),
  }
}
