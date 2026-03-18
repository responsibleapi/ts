// TODO: Merge this file into `src/dsl/dsl.ts`.

import type { Schema } from "./schema.ts"
import type { Op } from "./scope.ts"

type NonFunction =
  | bigint
  | boolean
  | null
  | number
  | object
  | string
  | symbol
  | undefined

/**
 * if it's a function, then the name of the function is used as a $ref in OpenAPI,
 * otherwise the value is inlined
 */
export type Nameable<T extends NonFunction> = (() => T) | T

const isNamed = <T extends NonFunction>(n: Nameable<T>): n is () => T =>
  typeof n === "function"

function _decodeNameable<T extends NonFunction>(
  n: Nameable<T>,
): { name?: string; value: T } {
  if (isNamed(n)) {
    return { name: n.name, value: n() }
  }

  return { value: n }
}

export type Mime = `${string}/${string}`

interface RespParams {
  body?: Schema | Record<Mime, Schema>
  description?: string
  headers?: Record<string, Schema>
  cookies?: Record<string, Schema>
}

export type Resp = Nameable<RespParams>

/** this exists mostly to distinguish {@link Schema} from {@link Resp} */
export const response = (param: RespParams): RespParams => param

export function GET(_op: Op): Op {
  throw new Error("TODO")
}

export function HEAD(_op: Op): Op {
  throw new Error("TODO")
}

export function POST(op: Op): Op
export function POST(id: string, op: Op): Op
export function POST(_idOrOp: string | Op, _maybeOp?: Op): Op {
  throw new Error("TODO")
}
