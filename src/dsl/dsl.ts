import type { oas31 } from "openapi3-ts"
import { typesafeLowercase } from "../lib.ts"
import type { Mime, Op, Response, Security } from "./methods.ts"
import type { Schema } from "./schema.ts"

interface ScopeReq {
  mime?: Mime
  security?: Security
  "security?"?: Security
  params?: Record<string, Schema>
}

interface StatusMatch {
  mime: Mime
  headers: Record<string, Schema>
}

interface ScopeRes {
  mime?: Mime
  match?: Record<string, StatusMatch>
  add?: Record<number, Response>
}

export interface Route {
  id?: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  req: ScopeReq
  res: ScopeRes
  op?: Op
}

type ScopeOrRoute = Route | Scope

export function isScope(s: ScopeOrRoute): s is Scope {
  throw new Error(
    "we have not figured out how ScopeOrRoute is even constructed to start distinguishing them",
  )
}

type Routes = Record<`/${string}`, ScopeOrRoute>

interface ScopeOpts {
  req?: ScopeReq
  res?: ScopeRes
}

interface ResponsibleAPI {
  partialDoc: Partial<oas31.OpenAPIObject>
  forAll: ScopeOpts
  routes: Routes
}

export function responsibleAPI(
  _api: ResponsibleAPI,
): oas31.OpenAPIObject {
  throw new Error("TODO")
}

interface Scope {
  opts?: ScopeOpts
  routes: Routes
}

export function scope(routes: Routes): Scope
export function scope(forAll: ScopeOpts, routes: Routes): Scope
export function scope(
  ...args: [routes: Routes] | [opts: ScopeOpts, routes: Routes]
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
