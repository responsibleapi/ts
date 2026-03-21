import { describe, expect, test } from "vitest"
import { headerSecurity, oauth2Security, querySecurity } from "./security.ts"

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
})
