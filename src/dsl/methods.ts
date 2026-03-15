import type { Route } from "./dsl.ts"
import type { Schema } from "./schema.ts"

/**
 * either named reference in `#components/` or an actual inline thing
 */
export type Nameable<T> = (() => T) | T

function _decodeNameable<T>(n: Nameable<T>): { name?: string; value: T } {
  if (typeof n === "function") {
    const fn = n as () => T
    return { name: fn.name, value: fn() }
  }

  return { value: n }
}

export type Mime = `${string}/${string}`

export type Response = Nameable<{
  body?: Schema | Record<Mime, Schema>
  description?: string
  headers?: Record<string, Schema>
  cookies?: Record<string, Schema>
}>

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

/**
 * `type` because {@link Response} is nameable
 */
type MiddlewareResponse = Response & { mime?: Mime }

type Res = Schema | Response | (() => Response)

type Path = `/${string}`

const isPath = (x: unknown): x is Path =>
  typeof x === "string" && x.startsWith("/")

export function path(
  strings: TemplateStringsArray,
  ...params: readonly Schema[]
): [Path, Record<string, Schema>] {
  if (!isPath(strings[0])) {
    throw new Error(`${strings[0]} must start with /`)
  }

  void params
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

export function GET(_op: Route): Route {
  throw new Error("TODO")
}

export function POST(op: Route): Route
export function POST(id: string, op: Route): Route
export function POST(_idOrOp: string | Route, _maybeOp?: Route): Route {
  throw new Error("TODO")
}
