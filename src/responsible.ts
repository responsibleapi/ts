import type { oas31 } from "openapi3-ts"

type StringFormat = "email" | "uri" | "uuid"

type SchemaOpts = Readonly<{
  default?: unknown
  description?: string
}>

interface StringsOpts extends SchemaOpts {
  format?: StringFormat
  minLength?: number
  maxLength?: number
  pattern?: string
  enum?: readonly string[]
  const?: string
}

interface Str extends StringsOpts {
  type: "string"
}

type IntFormat = "int64" | "int32"

interface IntOpts extends SchemaOpts {
  minimum?: number
  maximum?: number
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

type ArrayOpts = SchemaOpts &
  Readonly<{
    minItems?: number
    maxItems?: number
  }>

type Arr = ArrayOpts &
  Readonly<{
    type: "array"
    items: Schema
    minItems?: number
  }>

interface Bool {
  type: "boolean"
}

type Dict = Readonly<{
  type: "object"
  propertyNames: Schema
  additionalProperties: Schema
}>

type DefaultSchemas = {
  [k: string]: Schema
}

type DefaultSecurities = {
  [k: string]: Security<{}>
}

type OneOf = Readonly<{
  oneOf: readonly Schema[]
}>

type AnyOf = Readonly<{
  anyOf: readonly Schema[]
}>

type Schema =
  | (() => Schema)
  | Str
  | Int
  | Bool
  | Unknown
  | Obj
  | Arr
  | Dict
  | OneOf
  | AnyOf

export const dict = (k: Schema, v: Schema): Dict => ({
  type: "object",
  propertyNames: k,
  additionalProperties: v,
})

const isOptional = (k: string): k is `${string}?` => k.endsWith("?")

export const object = (props: Record<string, Schema> = {}): Obj => ({
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
  type: "integer",
  format: "int64",
  ...opts,
})

export const int32 = (opts?: IntOpts): Int => ({
  type: "integer",
  format: "int32",
  ...opts,
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

export const boolean = (): Bool => ({ type: "boolean" })

export const array = <Schemas extends DefaultSchemas = DefaultSchemas>(
  items: Schema,
  opts?: ArrayOpts,
): Arr => ({
  type: "array",
  items,
  ...opts,
})

export const unknown = (): Unknown => ({})

export const email = (): Str => string({ format: "email" })

type Mime = `${string}/${string}`

type Response = Readonly<{
  body: Schema | Record<Mime, Schema>
  description?: string
  headers?: Record<string, Schema>
}>

type QuerySecurity = Readonly<{
  type: "query"
  name: string
}>

type Security = QuerySecurity | (() => Security)

type Middleware = Readonly<{
  req?: {
    mime?: Mime
    security?: Security
  }
  res?: {
    mime?: Mime
    headers?: Record<string, Schema>

    /**
     * add responses in this scope
     */
    add?: Record<number, Schema | Response>
  }
}>

type Path = `/${string}`

type Param = Readonly<{}>

type Req = Readonly<{
  query?: Record<string, Schema>
}>

type Op = Readonly<{
  name?: string
  req?: Schema | Req
  res?: Record<number, Schema | Response>
}>

export const querySecurity = (param: { name: string }): QuerySecurity => ({
  type: "query",
  ...param,
})

type ScopeTemplate<P extends Path> = `scope ${P}`

type OuterScope = {
  forAll?: Middleware
} & {
  [K in ScopeTemplate<Path>]?: InnerScope
} & {
  [K in `POST ${Path}`]?: Op
} & {
  [k in `GET ${Path}`]?: Op
}

interface InnerScope extends OuterScope {
  params?: Record<string, Schema>
  POST?: Op
  GET?: Op
}

export function openAPI(
  doc: Partial<oas31.OpenAPIObject>,
  scope: OuterScope,
): Readonly<oas31.OpenAPIObject> {
  throw new Error("TODO")
}
