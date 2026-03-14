import { responsibleAPI, scope } from "../dsl.ts"
import { anyOf, array, int64, object, string, unknown } from "../schema.ts"

const AppID = () =>
  string({
    pattern: /^app_\w+$/,
    example: "app_123",
  })

const ErrID = () =>
  string({
    pattern: /^err_\w+$/,
    example: "err_123",
  })

const NonEmptyStr = () => string({ minLength: 1 })

const NewErr = () =>
  anyOf([
    object({ stack: NonEmptyStr, message: NonEmptyStr }),
    object({ stack: NonEmptyStr }),
    object({ message: NonEmptyStr }),
  ])

const UnixMillis = () =>
  int64({
    description: "UNIX epoch milliseconds",
    example: 1739982555384,
  })

const OneErr = () =>
  object({
    id: ErrID,
    "stack?": NonEmptyStr,
    "message?": NonEmptyStr,
    "resolvedAt?": UnixMillis,
  })

const ErrLog = () =>
  object({
    id: string({ format: "uuid" }),
    errID: ErrID,
    ts: UnixMillis,
  })

export const exceptionsAPI = responsibleAPI(
  {
    openapi: "3.1.0",
    info: {
      title: "Exceptions API",
      version: "1",
      description: "Sentry.io clone",
    },
  },
  {
    "/*": middleware({
      req: {
        mime: "application/json",
      },
      res: {
        mime: "application/json",
        add: {
          /** TODO describe your validation lib err schema */
          400: unknown(),
        },
      },
    }),
    "/app_errors/:app_id": scope({
      params: { app_id: AppID },

      POST: {
        id: "newError",
        req: NewErr,
        res: { 201: unknown() },
      },
      GET: {
        id: "appErrors",
        res: { 200: array(OneErr) },
      },
    }),
    "/errors/:err_id": scope({
      params: { err_id: ErrID },

      GET: {
        id: "errorOccurrences",
        res: { 200: array(ErrLog) },
      },
    }),
  },
)
