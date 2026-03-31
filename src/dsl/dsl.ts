import type { oas31 } from "openapi3-ts"
import { compileResponsibleAPI } from "../compiler/index.ts"
import type { PathRoutes, ScopeOpts } from "./scope.ts"

export type OptionalKey = `${string}?`

/**
 * holds info both about the name AND optionality of something
 * used in schemas and req params
 *
 * @dsl
 */
// oxlint-disable-next-line typescript/no-redundant-type-constituents
export type NameWithOptionality = string | OptionalKey

export const isOptional = (k: NameWithOptionality): k is OptionalKey =>
  k.endsWith("?")

/**
 * See other @dsl JSDocs to understand why we omit `#/components/`
 *
 * @dsl
 */
type PartialDoc = Partial<Omit<oas31.OpenAPIObject, "components">>

interface ResponsibleAPI {
  partialDoc: PartialDoc
  forAll: ScopeOpts
  routes: PathRoutes
}

export function responsibleAPI(api: ResponsibleAPI): oas31.OpenAPIObject {
  return compileResponsibleAPI(api)
}
