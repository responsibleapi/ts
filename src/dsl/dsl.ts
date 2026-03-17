import type { oas31 } from "openapi3-ts"
import type { Routes, ScopeOpts } from "./scope.ts"

interface ResponsibleAPI {
  partialDoc: Partial<Omit<oas31.OpenAPIObject, "components">>
  forAll: ScopeOpts
  routes: Routes
}

export function responsibleAPI(_api: ResponsibleAPI): oas31.OpenAPIObject {
  throw new Error("TODO")
}
