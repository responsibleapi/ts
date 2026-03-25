import type { oas31 } from "openapi3-ts"
import type { Routes, ScopeOpts } from "./scope.ts"

/**
 * Named components are intentionally banned,
 * we use {@link import("./nameable.ts").Nameable}
 *
 * @dsl
 */
type PartialDoc = Partial<Omit<oas31.OpenAPIObject, "components">>

interface ResponsibleAPI {
  partialDoc: PartialDoc
  forAll: ScopeOpts
  routes: Routes
}

export function responsibleAPI(_api: ResponsibleAPI): oas31.OpenAPIObject {
  throw new Error("TODO")
}
