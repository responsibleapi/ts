import type { oas31 } from "openapi3-ts"
import type { Mime, Resp, Security } from "./methods.ts"
import type { Schema } from "./schema.ts"

interface OpReq {
  security?: Security

  /**
   * optional security means something OR `no authentication`
   */
  "security?"?: Security

  params?: Record<string, Schema>
  query?: Record<string, Schema>
  headers?: Record<string, Schema>
  body?: Schema | Record<Mime, Schema>
}

interface ScopeReq extends OpReq {
  mime?: Mime
}

interface StatusMatch {
  mime: Mime
  headers: Record<string, Schema>
}

type MatchStatus = number | `${number}..${number}`

type OpRes = Record<number, Resp | Schema>

type ScopeRes =
  | {
      mime?: Mime
      match?: Record<MatchStatus, StatusMatch>
      add?: OpRes
    }
  | OpRes

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface Op {
  id?: string
  req?: OpReq | Schema
  res: OpRes
  deprecated?: boolean
  description?: string
}

export interface OpWithMethod extends Op {
  method: HttpMethod
}

type ScopeOrOp = Op | Scope

export function isScope(s: ScopeOrOp): s is Scope {
  throw new Error(
    "we have not figured out how ScopeOrOp is even constructed to start distinguishing them",
  )
}

type Routes = Record<`/${string}`, ScopeOrOp>
type MethodRoutes = Record<HttpMethod, Op>
type ScopeRoutes = Routes | MethodRoutes

interface ScopeOpts {
  req?: ScopeReq
  res?: ScopeRes
}

interface ResponsibleAPI {
  partialDoc: Partial<oas31.OpenAPIObject>
  forAll: ScopeOpts
  routes: Routes
}

export function responsibleAPI(_api: ResponsibleAPI): oas31.OpenAPIObject {
  throw new Error("TODO")
}

interface Scope {
  forAll?: ScopeOpts
  routes: ScopeRoutes
}

export function scope(arg: ScopeRoutes | Scope): Scope {
  if ("routes" in arg) {
    return arg
  }

  return {
    routes: arg,
  }
}

function _scopeToPaths(_: Scope): oas31.PathsObject {
  throw new Error("not even sure if we need this function")
}
