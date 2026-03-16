import type { oas31 } from "openapi3-ts"
import type { Mime, Resp, Security } from "./methods.ts"
import type { Schema } from "./schema.ts"

interface ScopeReq {
  mime?: Mime
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

interface LeafReq {
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

interface StatusMatch {
  mime: Mime
  headers: Record<string, Schema>
}

type MatchStatus = number | `${number}..${number}`

type ScopeRes =
  | {
      mime?: Mime
      match?: Record<MatchStatus, StatusMatch>
      add?: Record<number, Resp | Schema>
    }
  | Record<number, Resp | Schema>

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface Route {
  id?: string
  req?: ScopeReq | Schema
  res: ScopeRes
  deprecated?: boolean
  description?: string
}

export interface RouteWithMethod extends Route {
  method: HttpMethod
}

type ScopeOrRoute = Route | Scope

export function isScope(s: ScopeOrRoute): s is Scope {
  throw new Error(
    "we have not figured out how ScopeOrRoute is even constructed to start distinguishing them",
  )
}

type Routes = Record<`/${string}`, ScopeOrRoute>
type MethodRoutes = Record<HttpMethod, Route>
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
  routes: Routes
}

export function scope(arg: ScopeRoutes | Scope): Scope {
  if ("forAll" in arg) {
    return arg
  }

  return {
    routes: arg.routes,
  }
}

function _scopeToPaths(_: Scope): oas31.PathsObject {
  throw new Error("not even sure if we need this function")
}
