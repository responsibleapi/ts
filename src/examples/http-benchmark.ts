import {
  array,
  dict,
  email,
  int32,
  int64,
  object,
  openAPI,
  string,
  unixMillis,
} from "../responsible.ts"

export const httpBenchmark = openAPI(
  {
    openapi: "3.1.0",
    info: {
      title: "HTTP benchmarks",
      version: "0.0.1",
    },
  },
  {
    schemas: {
      PostID: int64({ minimum: 1 }),
      UserID: int64({ minimum: 1 }),
      NewPost: object({
        email: email(),
        content: string({ minLength: 1 }),
      }),
      get Post() {
        return object({
          id: this.PostID,
          user_id: this.UserID,
          content: string({ minLength: 1 }),
          created_at: unixMillis(),
          updated_at: unixMillis(),
        })
      },
    },
  },
  {
    forAll: {
      req: { mime: "application/json" },
      res: {
        mime: "application/json",
        headers: { "Content-Length": int32({ minimum: 1 }) },
        add: {
          400: {
            description: "Bad Request",
            body: dict(
              string({ minLength: 1 }),
              array(string({ minLength: 1 }), { minItems: 1 }),
            ),
          },
        },
      },
    },
    "POST /posts": {
      name: "newPost",
      req: "NewPost",
      res: { 201: "Post" },
    },
    "POST /echo": {
      name: "echo",
      req: "NewPost",
      res: { 200: "Post" },
    },
  },
)
