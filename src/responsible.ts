import type { oas31 } from "openapi3-ts"

type StringFormat = "email" | "uri" | "uuid" | "date" | "date-time" | "binary"

type SchemaOpts = Readonly<{
  default?: unknown
  description?: string
  deprecated?: boolean
}>

interface StringsOpts extends SchemaOpts {
  format?: StringFormat
  minLength?: number
  maxLength?: number
  pattern?: string | RegExp
  enum?: readonly string[]
  const?: string
  example?: string
}

interface Str extends StringsOpts {
  type: "string"
}

type IntFormat = "int64" | "int32"

interface IntOpts extends SchemaOpts {
  minimum?: number
  maximum?: number
  example?: number
}

interface Int extends IntOpts {
  type: "integer"
  format: IntFormat
}

export type Obj = Readonly<{
  type: "object"
  properties: Record<string, Schema>
  required?: readonly string[]
}>

type Unknown = Record<string, never>

interface ArrayOpts extends SchemaOpts {
  minItems?: number
  maxItems?: number
  example?: readonly unknown[]
}

interface Arr extends ArrayOpts {
  type: "array"
  items: Schema
}

interface Bool extends SchemaOpts {
  type: "boolean"
}

interface Dict {
  type: "object"
  propertyNames: PropKeySchema
  additionalProperties: Schema
  example?: Record<PropertyKey, unknown>
}

interface OneOf {
  oneOf: readonly Schema[]
}

interface AnyOf {
  anyOf: readonly Schema[]
}

interface AllOf {
  allOf: readonly Schema[]
}

type Num = Int

type Schema =
  | (() => Schema)
  | Str
  | Num
  | Bool
  | Unknown
  | Obj
  | Arr
  | Dict
  | OneOf
  | AnyOf
  | AllOf

type PropKeySchema = (() => PropKeySchema) | Str | Num

export const dict = (k: PropKeySchema, v: Schema): Dict => ({
  type: "object",
  propertyNames: k,
  additionalProperties: v,
})

const isOptional = (k: string): k is `${string}?` => k.endsWith("?")

export const object = (
  props: Record<string, Schema> = {},
  opts?: SchemaOpts,
): Obj => ({
  ...opts,
  type: "object",
  properties: Object.fromEntries(
    Object.entries(props).map(([k, v]) => [
      isOptional(k) ? k.slice(0, -1) : k,
      v,
    ]),
  ),
  required: Object.keys(props).filter(k => !isOptional(k)),
})

export const int64 = (opts?: IntOpts): Int => ({
  ...opts,
  type: "integer",
  format: "int64",
})

export const int32 = (opts?: IntOpts): Int => ({
  ...opts,
  type: "integer",
  format: "int32",
})

export const httpURL = (): Str =>
  string({
    format: "uri",
    pattern: "^https?://\\S+$",
  })

export const unixMillis = (): Int =>
  int64({ description: "UNIX epoch milliseconds" })

export const string = (opts?: StringsOpts): Str => ({
  type: "string",
  ...opts,
})

export const oneOf = (oneOf: readonly Schema[]): OneOf => ({ oneOf })

export const anyOf = (anyOf: readonly Schema[]): AnyOf => ({ anyOf })

export const allOf = (allOf: readonly Schema[]): AnyOf => ({ allOf })

export const boolean = (opts?: SchemaOpts): Bool => ({
  type: "boolean",
  ...opts,
})

export const array = (items: Schema, opts?: ArrayOpts): Arr => ({
  type: "array",
  items,
  ...opts,
})

export const unknown = (): Unknown => ({})

export const email = (): Str => string({ format: "email" })

type Mime = `${string}/${string}`

type Response = Readonly<{
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

export const querySecurity = (param: { name: string }): QuerySecurity => ({
  type: "query",
  ...param,
})

export const headerSecurity = (param: { name: string }): HeaderSecurity => ({
  type: "header",
  ...param,
})

type Security = (() => Security) | QuerySecurity | HeaderSecurity

type MatchStatus = number | `${number}..${number}`

interface MiddlewareResponse extends Response {
  mime?: Mime
}

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

type Op = Readonly<{
  name?: string
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

export function middleware(opts: Middleware): V2 {
  throw new Error("TODO")
}

export function scope(opts: ScopeOpts): V2 {
  throw new Error("TODO")
}

export function scope2(middleware: Middleware, endpoints: ScopeOpts): V2 {
  throw new Error("TODO")
}

export function GET(op: Op): V2 {
  throw new Error("TODO")
}

export function POST(op: Op): V2 {
  throw new Error("TODO")
}

export function openAPI(
  doc: Partial<oas31.OpenAPIObject>,
  scope: ScopeOpts,
): Readonly<oas31.OpenAPIObject> {
  throw new Error("TODO")
}
