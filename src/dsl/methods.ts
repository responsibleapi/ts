import type { Route } from "./dsl.ts"
import type { Schema } from "./schema.ts"

/**
 * either named reference in `#components/` or an actual inline thing
 */
type Nameable<T> = (() => T) | T

function decodeNameable<T>(n: Nameable<T>): { name?: string; value: T } {
  if (typeof n === "function") {
    const fn = n as () => T
    return { name: fn.name, value: fn() }
  }

  return { value: n }
}

export type Mime = `${string}/${string}`

export type Response = Nameable<
  Readonly<{
    body?: Schema | Record<Mime, Schema>
    description?: string
    headers?: Record<string, Schema>
    cookies?: Record<string, Schema>
  }>
>

export const response = (param: Response): Response => param

type QuerySecurity = Readonly<{
  type: "query"
  name: string
}>

type HeaderSecurity = Readonly<{
  type: "header"
  name: string
}>

export type Security = Nameable<QuerySecurity | HeaderSecurity>

export const querySecurity = (param: { name: string }): QuerySecurity => ({
  type: "query",
  ...param,
})

export const headerSecurity = (param: { name: string }): HeaderSecurity => ({
  type: "header",
  ...param,
})

type MatchStatus = number | `${number}..${number}`

/**
 * `type` because {@link Response} is nameable
 */
type MiddlewareResponse = Response & { mime?: Mime }

type Res = Schema | Response | (() => Response)

type Middleware = Readonly<{
  req?: MiddlewareReq
  res?: {
    mime?: Mime
    headers?: Record<string, Schema>
    /**
     * add responses in this scope
     */
    add?: Record<number, Res>
    match?: Record<MatchStatus, MiddlewareResponse>
  }
}>

type Path = `/${string}`

const isPath = (x: unknown): x is Path =>
  typeof x === "string" && x.startsWith("/")

export function path(
  strings: TemplateStringsArray,
  ...params: readonly Schema[]
): [Path, Record<string, Schema>] {
  if (!isPath(strings[0])) throw new Error(`${strings[0]} must start with /`)

  for (let i = 0; i < params.length; i++) {
    console.log(strings[i], params[i])
  }
  console.log(strings[params.length])

  throw new Error("TODO")
}

type Req = Readonly<{
  params?: Record<string, Schema>
  query?: Record<string, Schema>
  headers?: Record<string, Schema>
  security?: Security
  "security?"?: Security
  body?: Schema | Record<Mime, Schema>
}>

interface MiddlewareReq extends Req {
  mime?: Mime
}

export type Op = Readonly<{
  id?: string
  req?: Schema | Req
  res?: Record<number, Res>
  deprecated?: boolean
  description?: string
}>

type V2 =
  | { type: "middleware"; middleware: Middleware }
  | { type: "scope"; scope: ScopeOpts }
  | { type: "GET"; op: Op }
  | { type: "POST"; op: Op }

interface OuterV2 {
  [p: Path]: V2
}

interface ScopeOpts extends OuterV2 {
  params?: Record<string, Schema>

  GET?: Op
  POST?: Op
  PUT?: Op
  DELETE?: Op
}

export function GET(op: Op): V2 {
  throw new Error("TODO")
}

export function POST(op: Op): Route
export function POST(id: string, op: Op): Route
export function POST(idOrOp: string | Op, maybeOp?: Op): Route {
  throw new Error("TODO")
}
