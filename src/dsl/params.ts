import type { Nameable } from "./nameable.ts"
import type { Schema } from "./schema.ts"

interface ParamBase {
  name?: string
  description?: string
  schema?: Schema
  example?: string
}

export interface QueryParamRaw extends ParamBase {
  in: "query"
  required?: boolean
  style?: "form"
  explode?: boolean
}

export interface PathParamRaw extends ParamBase {
  in: "path"
  required: true
  style?: "simple" | "label" | "matrix"
  explode?: boolean
}

export interface HeaderParamRaw extends ParamBase {
  in: "header"
  required?: boolean
  style?: "simple"
  explode?: boolean
}

export type ParamRaw = QueryParamRaw | PathParamRaw | HeaderParamRaw

/** @dsl */
export type ReusableParam = Nameable<ParamRaw>

/**
 * Reusable response header under `components.headers` when passed as a
 * {@link Nameable} thunk in {@link import("./operation.ts").RespParams.headers}.
 *
 * @dsl
 */
export type ReusableHeader = Nameable<HeaderRaw>

export interface HeaderRaw {
  description?: string
  schema: Schema
  required?: boolean
  deprecated?: boolean
  example?: unknown
}

export const queryParam = (r: Omit<QueryParamRaw, "in">): QueryParamRaw => ({
  ...r,
  in: "query",
})

export const pathParam = (r: Omit<PathParamRaw, "in">): PathParamRaw => ({
  ...r,
  in: "path",
})

export const headerParam = (r: Omit<HeaderParamRaw, "in">): HeaderParamRaw => ({
  ...r,
  in: "header",
})

export const responseHeader = (r: HeaderRaw): HeaderRaw => ({ ...r })
