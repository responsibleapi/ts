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

export type Obj<Schemas extends DefaultSchemas> = Readonly<{
  type: "object"
  properties: Record<string, Schema<Schemas>>
  required?: readonly string[]
}>

type Unknown = Record<string, never>

type ArrayOpts = SchemaOpts &
  Readonly<{
    minItems?: number
    maxItems?: number
  }>

type Arr<Schemas extends DefaultSchemas> = ArrayOpts &
  Readonly<{
    type: "array"
    items: Schema<Schemas>
    minItems?: number
  }>

interface Bool {
  type: "boolean"
}

type Dict<Schemas extends DefaultSchemas> = Readonly<{
  type: "object"
  propertyNames: Schema<Schemas>
  additionalProperties: Schema<Schemas>
}>

type DefaultSchemas = {
  [k: string]: Schema<DefaultSchemas>
}

type DefaultSecurities = {
  [k: string]: Security<{}>
}

type OneOf<Schemas extends DefaultSchemas> = Readonly<{
  oneOf: readonly Schema<Schemas>[]
}>

type AnyOf<Schemas extends DefaultSchemas> = Readonly<{
  anyOf: readonly Schema<Schemas>[]
}>

type Schema<Schemas extends DefaultSchemas> =
  | (() => Schema<Schemas>)
  | keyof Schemas
  | Str
  | Int
  | Bool
  | Unknown
  | Obj<Schemas>
  | Arr<Schemas>
  | Dict<Schemas>
  | OneOf<Schemas>
  | AnyOf<Schemas>

export const dict = <Schemas extends DefaultSchemas = {}>(
  k: Schema<Schemas>,
  v: Schema<Schemas>,
): Dict<Schemas> => ({
  type: "object",
  propertyNames: k,
  additionalProperties: v,
})

const isOptional = (k: string): k is `${string}?` => k.endsWith("?")

export const object = <Schemas extends DefaultSchemas = {}>(
  props: Record<string, Schema<Schemas>> = {},
): Obj<Schemas> => ({
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

export const oneOf = <Schemas extends DefaultSchemas>(
  oneOf: readonly Schema<Schemas>[],
): OneOf<Schemas> => ({ oneOf })

export const anyOf = <Schemas extends DefaultSchemas>(
  anyOf: readonly Schema<Schemas>[],
): AnyOf<Schemas> => ({ anyOf })

export const boolean = (): Bool => ({ type: "boolean" })

export const array = <Schemas extends DefaultSchemas = DefaultSchemas>(
  items: Schema<Schemas>,
  opts?: ArrayOpts,
): Arr<Schemas> => ({
  type: "array",
  items,
  ...opts,
})

export const unknown = (): Unknown => ({})

export const email = (): Str => string({ format: "email" })

type Mime = `${string}/${string}`

type Response<Schemas extends DefaultSchemas> = Readonly<{
  body: Schema<Schemas> | Record<Mime, Schema<Schemas>>
  description?: string
  headers?: Record<string, Schema<Schemas>>
}>

type QuerySecurity = Readonly<{
  type: "query"
  name: string
}>

type Security<Securities extends DefaultSecurities> =
  | QuerySecurity
  | keyof Securities

type Middleware<
  Schemas extends DefaultSchemas,
  Securities extends DefaultSecurities,
> = Readonly<{
  req?: {
    mime?: Mime
    security?: Security<Securities>
  }
  res?: {
    mime?: Mime
    headers?: Record<string, Schema<Schemas>>

    /**
     * add responses in this scope
     */
    add?: Record<number, Schema<Schemas> | Response<Schemas>>
  }
}>

type Path = `/${string}`

type Param = Readonly<{}>

type Req<Schemas extends DefaultSchemas> = Readonly<{
  query?: Record<string, Schema<Schemas>>
}>

type Op<Schemas extends DefaultSchemas> = Readonly<{
  name?: string
  req?: Schema<Schemas> | Req<Schemas>
  res?: Record<number, Schema<Schemas> | Response<Schemas>>
}>

export const querySecurity = (param: { name: string }): QuerySecurity => ({
  type: "query",
  ...param,
})

type ScopeTemplate<P extends Path> = `scope ${P}`

type OuterScope<
  Schemas extends DefaultSchemas,
  Securities extends DefaultSecurities,
> = {
  forAll?: Middleware<Schemas, Securities>
} & {
  [K in ScopeTemplate<Path>]?: InnerScope<Schemas, Securities>
} & {
  [K in `POST ${Path}`]?: Op<Schemas>
} & {
  [k in `GET ${Path}`]?: Op<Schemas>
}

interface InnerScope<
  Schemas extends DefaultSchemas,
  Securities extends DefaultSecurities,
> extends OuterScope<Schemas, Securities> {
  params?: Record<string, Schema<Schemas>>
  POST?: Op<Schemas>
  GET?: Op<Schemas>
}

export function openAPI<
  Schemas extends DefaultSchemas,
  Securities extends DefaultSecurities,
>(
  doc: Partial<oas31.OpenAPIObject>,
  components: {
    schemas: Readonly<Schemas>
    securitySchemes?: Readonly<Securities>
  },
  scope: OuterScope<Schemas, Securities>,
): Readonly<oas31.OpenAPIObject> {
  throw new Error("TODO")
}
