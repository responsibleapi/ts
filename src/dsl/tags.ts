/**
 * DSL helpers for the top-level OpenAPI `#/tags` array.
 *
 * Declared tag keys become the emitted OpenAPI tag `name` values so operations
 * can reuse a closed set of tags instead of repeating string literals inline.
 *
 * @dsl
 */
import type { oas31 } from "openapi3-ts"

const declaredTagBrand = Symbol("declaredTagBrand")

type TagNoName = Omit<oas31.TagObject, "name">

/**
 * Top-level tags should be declared once as a keyed object so operations can
 * reference the stable tag keys instead of repeating tag names inline.
 */
export type TagDeclarations = Readonly<Record<string, TagNoName>>

export type DeclaredTag<
  TName extends string = string,
  TTag extends TagNoName = TagNoName,
> = TTag & {
  readonly name: TName
  readonly [declaredTagBrand]: true
}

export type DeclaredTags<TTags extends TagDeclarations = TagDeclarations> = {
  readonly [K in keyof TTags]: DeclaredTag<Extract<K, string>, TTags[K]>
}

type DeclaredOpTag<TTags extends DeclaredTags = DeclaredTags> =
  TTags[keyof TTags]

export type OpTags<TTags extends DeclaredTags = DeclaredTags> =
  readonly DeclaredOpTag<TTags>[]

const declareTag = <TName extends string, TTag extends TagNoName>(
  name: TName,
  tag: TTag,
): DeclaredTag<TName, TTag> => ({
  ...tag,
  name,
  [declaredTagBrand]: true,
})

/**
 * Wrap the raw tag registry so the DSL can brand each entry with its key as the
 * OpenAPI tag name. That gives operations a closed set of reusable tag values
 * instead of ad-hoc objects or repeated string literals.
 *
 * @dsl
 */
export const declareTags = <TTags extends TagDeclarations>(
  tags: TTags,
): DeclaredTags<TTags> =>
  Object.fromEntries(
    Object.entries(tags).map(([name, declaredTag]) => [
      name,
      declareTag(name, declaredTag),
    ]),
  ) as DeclaredTags<TTags>
