import { describe, expect, test } from "vitest"
import type { Assert, IsEqual } from "../type-assertions.ts"
import { named } from "./nameable.ts"
import {
  type OAuth2ScopeName,
  AND,
  headerSecurity,
  oauth2Security,
  OR,
  querySecurity,
  requireSecurity,
} from "./security.ts"

describe("security", () => {
  test("builds api-key security schemes", () => {
    expect(
      querySecurity({
        name: "key",
        description: "API key auth",
      }),
    ).toEqual({
      type: "query",
      name: "key",
      description: "API key auth",
    })

    expect(headerSecurity({ name: "authorization" })).toEqual({
      type: "header",
      name: "authorization",
    })
  })

  test("builds oauth2 security schemes", () => {
    expect(
      oauth2Security({
        description: "Google OAuth2",
        flows: {
          implicit: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            scopes: {
              "scope:read": "Read data",
            },
          },
          authorizationCode: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://accounts.google.com/o/oauth2/token",
            scopes: {
              "scope:write": "Write data",
            },
          },
        },
      }),
    ).toEqual({
      type: "oauth2",
      description: "Google OAuth2",
      flows: {
        implicit: {
          authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
          scopes: {
            "scope:read": "Read data",
          },
        },
        authorizationCode: {
          authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
          tokenUrl: "https://accounts.google.com/o/oauth2/token",
          scopes: {
            "scope:write": "Write data",
          },
        },
      },
    })
  })

  test("builds composed security requirements", () => {
    const Oauth2 = named(
      "Oauth2",
      oauth2Security({
        description: "Google OAuth2",
        flows: {
          implicit: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            scopes: {
              "scope:read": "Read data",
              "scope:write": "Write data",
            },
          },
        },
      }),
    )

    const Oauth2c = named(
      "Oauth2c",
      oauth2Security({
        description: "Google OAuth2 code flow",
        flows: {
          authorizationCode: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://accounts.google.com/o/oauth2/token",
            scopes: {
              "scope:read": "Read data",
              "scope:write": "Write data",
            },
          },
        },
      }),
    )

    expect(
      OR(
        AND(
          requireSecurity(Oauth2, ["scope:read"]),
          requireSecurity(Oauth2c, ["scope:read"]),
        ),
        AND(
          requireSecurity(Oauth2, ["scope:write"]),
          requireSecurity(Oauth2c, ["scope:write"]),
        ),
      ),
    ).toEqual({
      kind: "or",
      items: [
        {
          kind: "and",
          items: [
            {
              kind: "scheme",
              scheme: Oauth2,
              scopes: ["scope:read"],
            },
            {
              kind: "scheme",
              scheme: Oauth2c,
              scopes: ["scope:read"],
            },
          ],
        },
        {
          kind: "and",
          items: [
            {
              kind: "scheme",
              scheme: Oauth2,
              scopes: ["scope:write"],
            },
            {
              kind: "scheme",
              scheme: Oauth2c,
              scopes: ["scope:write"],
            },
          ],
        },
      ],
    })
  })

  test("types oauth2 scopes from declared flows", () => {
    const Oauth2 = named(
      "Oauth2",
      oauth2Security({
        flows: {
          implicit: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            scopes: {
              "scope:read": "Read data",
              "scope:write": "Write data",
            },
          },
          authorizationCode: {
            authorizationUrl: "https://accounts.google.com/o/oauth2/auth",
            tokenUrl: "https://accounts.google.com/o/oauth2/token",
            scopes: {
              "scope:admin": "Admin data",
            },
          },
        },
      }),
    )

    type _InfersScopeNames = Assert<
      IsEqual<
        OAuth2ScopeName<typeof Oauth2>,
        "scope:admin" | "scope:read" | "scope:write"
      >
    >

    expect(requireSecurity(Oauth2, ["scope:admin"])).toEqual({
      kind: "scheme",
      scheme: Oauth2,
      scopes: ["scope:admin"],
    })
  })

  test("keeps bare schemes as a shorthand requirement", () => {
    const AuthorizationHeader = named(
      "Authorization",
      headerSecurity({ name: "authorization" }),
    )

    expect(AuthorizationHeader().type).toBe("header")
    expect(requireSecurity(AuthorizationHeader)).toEqual({
      kind: "scheme",
      scheme: AuthorizationHeader,
    })
  })
})
