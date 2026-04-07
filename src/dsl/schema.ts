import { isOptional, type NameWithOptionality } from "./dsl.ts"
import type { Nameable } from "./nameable.ts"

type KnownStringFormat =
  | "byte"
  | "email"
  | "uri"
  | "uuid"
  | "date"
  | "date-time"
  | "binary"
  | "url"
  | "blob"

type StringFormat = KnownStringFormat | (string & {})

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

interface NumberOpts extends SchemaOpts {
  minimum?: number
  maximum?: number
  example?: number
}

interface Int extends NumberOpts {
  type: "integer"
  format?: "int32" | "int64" | "uint32" | "uint64"
}

interface Float extends NumberOpts {
  type: "number"
  format?: "float" | "double"
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

interface DictOpts extends SchemaOpts {
  example?: Record<PropertyKey, unknown>
}

type Dict = Readonly<{
  type: "object"
  propertyNames: DictKeySchema
  additionalProperties: Schema
}> &
  DictOpts

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

export type RawSchema =
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

export type Schema = Nameable<RawSchema>

type DictKeySchema = Nameable<Str | Num>

export const dict = (k: DictKeySchema, v: Schema, opts?: DictOpts): Dict => ({
  ...opts,
  type: "object",
  propertyNames: k,
  additionalProperties: v,
})

export const object = (
  props: Readonly<Record<NameWithOptionality, Schema>> = {},
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

export const uint64 = (opts?: NumberOpts): Int => ({
  ...opts,
  type: "integer",
  format: "uint64",
})

export const integer = (opts?: NumberOpts): Int => ({
  ...opts,
  type: "integer",
})

export const int32 = (opts?: NumberOpts): Int => ({
  ...opts,
  type: "integer",
  format: "int32",
})

export const uint32 = (opts?: NumberOpts): Int => ({
  ...opts,
  type: "integer",
  format: "uint32",
})

export const number = (opts?: NumberOpts): Float => ({
  ...opts,
  type: "number",
})

export const float = (opts?: NumberOpts): Float => ({
  ...opts,
  type: "number",
  format: "float",
})

export const double = (opts?: NumberOpts): Float => ({
  ...opts,
  type: "number",
  format: "double",
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

export const oneOf = (schemas: readonly Schema[]): OneOf => ({ oneOf: schemas })

export const anyOf = (schemas: readonly Schema[]): AnyOf => ({ anyOf: schemas })

export const allOf = (schemas: readonly Schema[]): AllOf => ({ allOf: schemas })

export const boolean = (opts?: SchemaOpts): Bool => ({
  type: "boolean",
  ...opts,
})

export const unknown = (): Unknown => ({})

export const email = (): Str => string({ format: "email" })
