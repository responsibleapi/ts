import {
  anyOf,
  array,
  object,
  openAPI,
  string,
  unixMillis,
  unknown,
} from "../responsible.ts"

const AppID = () => string({ pattern: "^app_[a-zA-Z0-9]+$" })

const ErrorID = () => string({ pattern: "^err_[a-zA-Z0-9]+$" })

const NewError = () =>
  anyOf([
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
  ])

const AppError = () =>
  object({
    id: ErrorID,
    "stack?": string({ minLength: 1 }),
    "message?": string({ minLength: 1 }),
    "resolvedAt?": unixMillis,
  })

export const exceptionsAPI = openAPI(
  {
    openapi: "3.1.0",
  },
  {
    forAll: {
      req: { mime: "application/json" },
      res: {
        mime: "application/json",
        add: {
          /** TODO describe your validation lib err schema */
          400: unknown(),
        },
      },
    },
    "scope /app_errors/:appID": {
      params: { appID: AppID },

      POST: {
        name: "newError",
        req: NewError,
        res: { 201: unknown() },
      },
      GET: {
        name: "appErrors",
        res: { 200: array(AppError) },
      },
    },
    "scope /errors/:errorID": {
      params: { errorID: ErrorID },

      GET: {
        name: "errorOccurrences",
      },
    },
  },
)
