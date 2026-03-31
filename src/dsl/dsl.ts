import type { oas31 } from "openapi3-ts"
import { compileResponsibleAPI } from "../compiler/index.ts"
import type { Resp } from "./operation.ts"
import type { PathRoutes, ScopeOpts } from "./scope.ts"

export type OptionalKey = `${string}?`

/**
 * Holds info both about the name AND optionality of something used in schemas
 * and req params
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
export type PartialDoc = Partial<Omit<oas31.OpenAPIObject, "components">>

export interface ResponsibleApiInput {
  partialDoc: PartialDoc
  forAll: ScopeOpts
  routes: PathRoutes
  /**
   * Extra `components.responses` entries. OpenAPI allows unused response
   * components; this matches hand-authored specs that list a full error catalog.
   */
  ensureResponseComponents?: readonly Resp[]
}

export function responsibleAPI(api: ResponsibleApiInput): oas31.OpenAPIObject {
  return compileResponsibleAPI(api)
}
