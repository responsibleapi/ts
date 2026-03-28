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

/* for root level, only paths */
export type Routes<TTags extends TagRegistry = TagRegistry> = Record<
  HttpPath,
  ScopeOrOp<TTags>
>

/* Supports scopes that declare HTTP handlers alongside nested path routes. */
type MethodRoutes<TTags extends TagRegistry = TagRegistry> = Partial<
  Record<HttpMethod, Op<TTags>>
>

/*
 * The stricter "at least two methods" rule only makes sense for pure
 * method-only scopes. Once a scope also has nested `"/child"` routes, we allow
 * partial method sets so parent scopes can mix handlers with subpaths.
 */
type PureMethodRoutes<TTags extends TagRegistry = TagRegistry> =
  RequireAtLeastTwo<Record<HttpMethod, Op<TTags>>>

/*
 * Real `routes` objects can contain both HTTP methods and nested path keys at
 * the same time, so this is a combined shape instead of a simple union.
 */
type ScopeRoutes<TTags extends TagRegistry = TagRegistry> = Routes<TTags> &
  MethodRoutes<TTags>

/*
 * `scope()` accepts either the bare routes object or the full `{ routes,
 * forAll? }` wrapper.
 */
type ScopeArg<TTags extends TagRegistry = TagRegistry> =
  | ScopeRoutes<TTags>
  | Scope<TTags>

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
 * DO NOT modify this, it's done to prevent {@link scope} usage with single {@link HttpMethod}.
 * for single methods, use DSL from {@link file://../methods.ts}
 *
 * @dsl
 */
type ValidScopeRoutes<T extends ScopeRoutes> =
  Extract<keyof T, HttpPath> extends never
    ? T extends PureMethodRoutes
      ? T
      : never
    : T

/**
 * DO NOT modify this, it's done to prevent {@link scope} usage with single {@link HttpMethod}.
 * for single methods, use DSL from {@link file://../methods.ts}
 *
 * @dsl
 */
type ValidScopeArg<T extends ScopeArg> = T extends Scope
  ? Omit<T, "routes"> & { routes: ValidScopeRoutes<T["routes"]> }
  : T extends ScopeRoutes
    ? ValidScopeRoutes<T>
    : never

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
 * @dsl
 */
export function scope<const T extends ScopeArg>(arg: ValidScopeArg<T>): Scope {
  if ("routes" in arg) {
    return arg
  }

  return {
    routes: arg,
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
