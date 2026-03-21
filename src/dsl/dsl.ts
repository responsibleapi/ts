import type { oas31 } from "openapi3-ts"
import type { Routes, ScopeOpts } from "./scope.ts"

/**
 * this this core of the DSL. Named components are intentionally banned,
 * we use {@link import("./nameable.ts").Nameable}
 */
type BanComponents = Omit<oas31.OpenAPIObject, "components">

interface ResponsibleAPI {
  partialDoc: Partial<BanComponents>
  forAll: ScopeOpts
  routes: Routes
}

export function responsibleAPI(_api: ResponsibleAPI): oas31.OpenAPIObject {
  throw new Error("TODO")
}
