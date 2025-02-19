import {
  anyOf,
  array,
  object,
  openAPI,
  string,
  unixMillis,
  unknown,
} from "../responsible.ts"

const schemas = {
  AppID: string({ pattern: "^app_[a-zA-Z0-9]+$" }),
  ErrorID: string({ pattern: "^err_[a-zA-Z0-9]+$" }),
  NewError: anyOf([
    object({
      stack: string({ minLength: 1 }),
      message: string({ minLength: 1 }),
    }),
    object({
      message: string({ minLength: 1 }),
    }),
    object({
      stack: string({ minLength: 1 }),
    }),
  ]),
  get AppError() {
    return object({
      id: this.ErrorID,
      "stack?": string({ minLength: 1 }),
      "message?": string({ minLength: 1 }),
      "resolvedAt?": unixMillis(),
    })
  },
} as const

export const exceptionsAPI = openAPI(
  {
    openapi: "3.1.0",
  },
  { schemas },
  {
    "scope /app_errors/:appID": {
      params: { appID: "AppID" },

      POST: {
        req: "NewError",
        res: {
          201: unknown(),
        },
      },
      GET: {
        name: "appErrors",
        res: {
          200: array("AppError"),
        },
      },
    },
    "scope /errors/:errorID": {
      params: { errorID: "ErrorID" },

      GET: {
        name: "errorOccurrences",
      },
    },
  },
)
