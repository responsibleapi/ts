import type { oas31 } from "openapi3-ts"

declare const declaredTagBrand: unique symbol

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

export type TagRegistry = DeclaredTags

type DeclaredOpTag<TTags extends TagRegistry = TagRegistry> = TTags[keyof TTags]

export type OpTags<TTags extends TagRegistry = TagRegistry> =
  readonly DeclaredOpTag<TTags>[]

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
      {
        ...declaredTag,
        name,
      },
    ]),
  ) as DeclaredTags<TTags>
