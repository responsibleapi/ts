import type { oas31 } from "openapi3-ts"
import type { RequireAtLeastTwo } from "../lib.ts"
import type { HttpMethod } from "./methods.ts"
import type {
  MatchStatus,
  Op,
  OpRes,
  ReqAugmentation,
  RespAugmentation,
} from "./operation.ts"
import type { OpTags, TagRegistry } from "./tags.ts"

export type Mime = `${string}/${string}`

type ScopeRes =
  | {
      mime?: Mime
      defaults?: Record<MatchStatus, RespAugmentation>
      add?: OpRes
    }
  | OpRes

type ScopeOrOp<TTags extends TagRegistry = TagRegistry> =
  | Op<TTags>
  | Scope<TTags>

type HttpPath = `/${string}`

/** for root level; only {@link HttpPath} keys */
export type PathRoutes<TTags extends TagRegistry = TagRegistry> = Record<
  HttpPath,
  ScopeOrOp<TTags>
>

/* Supports scopes that declare HTTP handlers alongside nested path routes. */
type MethodRoutes<TTags extends TagRegistry = TagRegistry> = Partial<
  Record<HttpMethod, Op<TTags>>
>

/*
 * Real `routes` objects can contain both HTTP methods and nested path keys at
 * the same time, so this is a combined shape instead of a simple union.
 */
type ScopeRoutes<TTags extends TagRegistry = TagRegistry> = PathRoutes<TTags> &
  MethodRoutes<TTags>

/*
 * `scope()` accepts a flat object where `forAll` sits alongside HTTP methods
 * and nested path keys.
 */
type ScopeArg<TTags extends TagRegistry = TagRegistry> = {
  forAll?: ScopeOpts<TTags>
} & ScopeRoutes<TTags>

export interface ScopeOpts<TTags extends TagRegistry = TagRegistry> {
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
export interface Scope<TTags extends TagRegistry = TagRegistry> {
  forAll?: ScopeOpts<TTags>
  routes: ScopeRoutes<TTags>
}

/**
 * it's done to prevent {@link scope} usage with single {@link HttpMethod}.
 * `forAll` is ignored here so defaults do not affect the route-shape validation.
 * for single methods, use DSL from {@link file://../methods.ts}
 *
 * If a scope has at least one nested path, it is valid as-is. Otherwise, we
 * validate just the method subset and require at least two HTTP methods.
 *
 * @dsl
 */
type ValidScopeArg<T extends ScopeArg> =
  Extract<keyof T, HttpPath> extends never
    ? Pick<T, Extract<keyof T, HttpMethod>> extends RequireAtLeastTwo<
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
export function scope<const T extends ScopeArg>(arg: ValidScopeArg<T>): Scope {
  const scopeArg: ScopeArg = arg
  const { forAll, ...routes } = scopeArg

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

export function isScope<TTags extends TagRegistry>(
  _s: ScopeOrOp<TTags>,
): _s is Scope<TTags> {
  throw new Error(
    "we have not figured out how ScopeOrOp is even constructed to start distinguishing them",
  )
}

function _scopeToPaths(_: Scope): oas31.PathsObject {
  throw new Error("not even sure we need this function")
}
