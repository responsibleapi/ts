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

interface NumberOpts extends SchemaOpts {
  minimum?: number
  maximum?: number
  example?: number
}

interface Int extends NumberOpts {
  type: "integer"
  format: IntFormat
}

interface Float extends NumberOpts {
  type: "number"
  format: "float" | "double"
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

export const array = (items: Schema, opts?: ArrayOpts): Arr => ({
  type: "array",
  items,
  ...opts,
})

interface Bool extends SchemaOpts {
  type: "boolean"
}

type Dict = Readonly<{
  type: "object"
  propertyNames: PropKeySchema
  additionalProperties: Schema
  example?: Record<PropertyKey, unknown>
}>

type OneOf = Readonly<{
  oneOf: readonly Schema[]
}>

interface AnyOf {
  anyOf: readonly Schema[]
}

interface AllOf {
  allOf: readonly Schema[]
}

type Num = Int | Float

export type Schema =
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

const isOptional = (key: string): key is `${string}?` => key.endsWith("?")

export const object = (
  props: Readonly<Record<string, Schema>> = {},
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

export const int64 = (opts?: NumberOpts): Int => ({
  ...opts,
  type: "integer",
  format: "int64",
})

export const int32 = (opts?: NumberOpts): Int => ({
  ...opts,
  type: "integer",
  format: "int32",
})

export const float = (opts?: NumberOpts): Float => ({
  ...opts,
  type: "number",
  format: "float",
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

export const allOf = (allOf: readonly Schema[]): AllOf => ({ allOf })

export const boolean = (opts?: SchemaOpts): Bool => ({
  type: "boolean",
  ...opts,
})

export const unknown = (): Unknown => ({})

export const email = (): Str => string({ format: "email" })
