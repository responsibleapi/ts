import {
  array,
  boolean,
  httpURL,
  int32,
  object,
  string,
  unixMillis,
  unknown,
} from "../responsible.ts"

const email = string({ format: "email" })

const s = {
  ShowID: string({ minLength: 11, maxLength: 12 }),
  FeedID: string({ minLength: 11, maxLength: 11 }),

  Plan: string({ enum: ["free", "basic", "creator"] }),

  SubmitURL: object({ url: httpURL() }),

  get RecentResp() {
    return object({
      list: array(
        object({
          id: this.ShowID,
          feed_id: this.FeedID,
          title: string(),
          episodes: int32({ minimum: 0 }),
          "image?": httpURL(),
          "refreshed_utc?": unixMillis(),
          "author?": string(),
          "owner?": string(),
        }),
        { minItems: 0 },
      ),
      plan: this.Plan,
    })
  },

  ErrorStruct: object({}),

  LoginReq: object({
    email: email,
    host: string({ minLength: 1 }),
  }),
} as const

const middleware = {
  "*": op => ({
    ...op,
    responses: {
      ...op.responses,
      "400": {
        description: "Bad Request",
        headers: {
          "Content-Length": {
            schema: int32({ minimum: 1 }),
            required: true,
          },
        },
        content: { "application/json": { schema: s.ErrorStruct } },
      } satisfies oas31.ResponseObject,
    },
  }),
  "/japi/*": op => ({
    ...op,
    responses: Object.fromEntries(
      Object.entries(op.responses ?? {}).map(([status, v]) => {
        return [status, { ...v }]
      }),
    ),
  }),
} as const satisfies Record<string, Middleware>

const routes = {
  "/japi": {
    "*": {
      req: { mime: "application/json" },
      res: {
        match: {
          "200..299": {
            mime: "application/json",
            headers: {
              "Content-Length": int32({ minimum: 1 }),
            },
          },
        },
      },
    },
    "POST /login": {
      name: "requestOTP",
      req: s.LoginReq,
      res: {
        200: object({
          login: string({ enum: ["NEW", "EXISTING"] }),
        }),
      },
    },
    "POST /otp": {
      name: "submitOTP",
      req: object({
        email,
        otp: string({ minLength: 1 }),
        "updates?": boolean(),
      }),
      res: {
        201: object({
          jwt: string({ minLength: 1 }),
        }),
        401: {
          description: "Invalid OTP",
        },
      },
    },

    "/show/:show_id": {
      params: {
        show_id: s.ShowID,
      },

      "*": {
        res: {
          append: {
            404: unknown(),
          },
        },
      },

      GET: {},
      "GET /v2": {
        name: "getShow2",
        req: {},
      },
    },
  },
} as const
