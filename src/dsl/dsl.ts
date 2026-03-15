import type { oas31 } from "openapi3-ts"
import { typesafeLowercase } from "../lib.ts"
import type { Mime, Response, Security } from "./methods.ts"
import type { Schema } from "./schema.ts"

interface ScopeReq {
  mime?: Mime
  security?: Security
  "security?"?: Security
  params?: Record<string, Schema>
  query?: Record<string, Schema>
}

interface StatusMatch {
  mime: Mime
  headers: Record<string, Schema>
}

type ScopeRes =
  | {
      mime?: Mime
      match?: Record<string, StatusMatch>
      add?: Record<number, Response | Schema>
    }
  | Record<number, Response | Schema>

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE"

export interface Route {
  id?: string
  req: ScopeReq
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
  opts?: ScopeOpts
  routes: Routes
}

export function scope(routes: ScopeRoutes): Scope
export function scope(forAll: ScopeOpts, routes: ScopeRoutes): Scope
export function scope(
  ...args: [routes: ScopeRoutes] | [opts: ScopeOpts, routes: ScopeRoutes]
): Scope {
  if (args.length === 1) {
    return {
      routes: args[0],
    }
  }

  const [opts, routes] = args

  return {
    opts,
    routes,
  }
}

function _scopeToPaths(s: Scope): oas31.PathsObject {
  const paths: Partial<Record<string, oas31.PathItemObject>> = {}

  for (const k in s.routes) {
    const path = k as keyof typeof s.routes
    const route = s.routes[path]
    if (isScope(route)) {
      // depth first search
    } else {
      const pathItem = (paths[k] ??= {})
      const lkMethod = typesafeLowercase(route.method)
      pathItem[lkMethod] ??= {}
    }
  }

  return paths as oas31.PathsObject
}
