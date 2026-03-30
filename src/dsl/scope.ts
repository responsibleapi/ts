import type { oas31 } from "openapi3-ts"
import type { AtLeastOne, AtLeastTwo } from "../lib.ts"
import type { HttpMethod, MethodRoutes } from "./methods.ts"
import type { MatchStatus, Op, OpRes, ReqAugmentation, RespAugmentation } from "./operation.ts"
import type { DeclaredTags, OpTags } from "./tags.ts"

export type Mime = `${string}/${string}`

type ScopeResAugmentation = NonNullable<
  AtLeastOne<{
    mime?: Mime
    defaults?: Record<MatchStatus, RespAugmentation>
    add?: OpRes
  }>
>

type ScopeResShape = ScopeResAugmentation | OpRes

/**
 * This validates a concrete scope-level response object. The default keeps the
 * public DSL surface broad, while specific inputs can collapse to `never` when
 * they are neither a response augmentation object nor a numeric status map.
 */
export type ScopeRes<T extends object = ScopeResShape> =
  T extends ScopeResAugmentation
    ? T
    : keyof T extends never
      ? never
      : Exclude<keyof T, number> extends never
        ? T
        : never

type ScopeOrOp<TTags extends DeclaredTags = DeclaredTags> =
  | Op<TTags>
  | Scope<TTags>

type HttpPath = `/${string}`

/** for root level; only {@link HttpPath} keys */
export type PathRoutes<TTags extends DeclaredTags = DeclaredTags> = Record<
  HttpPath,
  ScopeOrOp<TTags>
>

type ScopeRoutes<TTags extends DeclaredTags = DeclaredTags> = MethodRoutes<TTags> &
  Partial<PathRoutes<TTags>>

type ScopeInput<TTags extends DeclaredTags = DeclaredTags> = {
  forAll?: ScopeOpts<TTags>
} & ScopeRoutes<TTags>

export interface ScopeOpts<TTags extends DeclaredTags = DeclaredTags> {
  req?: ReqAugmentation
  res?: ScopeRes
  tags?: OpTags<TTags>
}

/**
 * this is a temp placeholder return type while the compiler is still TODO
 *
 * it's basically a merged context stack, since this is a tree.
 * The only place where this single pass compiler MIGHT have an "AST"
 *
 * @compiler
 */
export interface Scope<TTags extends DeclaredTags = DeclaredTags> {
  forAll?: ScopeOpts<TTags>
  routes: ScopeRoutes<TTags>
}

/**
 * Scopes without nested paths are pure method collections, so require at least
 * two HTTP methods in that branch.
 *
 * `forAll` is ignored here so defaults do not affect the route-shape
 * validation. For single methods, use DSL from {@link file://../methods.ts}
 *
 * If a scope has at least one nested path, it is valid as-is. Otherwise we
 * validate only the method subset.
 *
 * @dsl
 */
type ValidScopeArg<T extends ScopeInput> =
  Extract<keyof T, HttpPath> extends never
    ? Pick<T, Extract<keyof T, HttpMethod>> extends AtLeastTwo<
        Record<HttpMethod, Op>
      >
      ? T
      : never
    : T

/**
 * Use this when declaring multiple routes under the same subpath.
 * For single methods, use DSL from {@link file://../methods.ts}
 *
 * Scope merge behavior:
 *
 * `forAll` is inherited by every nested route and scope.
 *
 * - `req` is additive: parent defaults provide shared mime, params, security,
 *   and request fields, while children extend or narrow them locally.
 * - `tags` are inherited from the nearest containing scope.
 * - `res.defaults` augments matching response ranges, for example to add shared
 *   mime or headers to every `2xx` or `4xx` response.
 * - `res.add` injects whole response entries into each child operation.
 * - If an operation already declares the same status code locally, keep that
 *   response local for now. In practice, `forAll.res.add.200` is for sibling
 *   operations that do not already define their own `200`.
 *
 * The `const` type parameter preserves literal method and path keys so the
 * type-level route validation runs before those keys widen to generic strings.
 *
 * @dsl
 */
export function scope<T extends ScopeInput>(arg: ValidScopeArg<T>): Scope {
  const { forAll, ...routes }: ScopeInput = arg

  if (forAll === undefined) {
    return {
      routes,
    }
  }

  return {
    forAll,
    routes,
  }
}

export function isScope<TTags extends DeclaredTags>(
  _s: ScopeOrOp<TTags>,
): _s is Scope<TTags> {
  throw new Error(
    "we have not figured out how ScopeOrOp is even constructed to start distinguishing them",
  )
}

function _scopeToPaths(_: Scope): oas31.PathsObject {
  throw new Error("not even sure we need this function")
}
