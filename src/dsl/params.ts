import type { Nameable } from "./nameable.ts"
import type { Schema } from "./schema.ts"

interface ParamBase {
  name?: string
  description?: string
  schema?: Schema
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

export type ParamRaw = QueryParamRaw | PathParamRaw

/**
 *
 * @dsl
 */
export type Param = Nameable<ParamRaw>

export const queryParam = (r: Omit<QueryParamRaw, "in">): QueryParamRaw => ({
  ...r,
  in: "query",
})
