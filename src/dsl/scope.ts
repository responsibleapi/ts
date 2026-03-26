import type { oas31 } from "openapi3-ts"
import type { RequireAtLeastTwo } from "../lib.ts"
import type { HttpMethod, Mime, Resp } from "./methods.ts"
import type { Nameable } from "./nameable.ts"
import type { Schema } from "./schema.ts"
import type { Security } from "./security.ts"
import type { OpTags, TagRegistry } from "./tags.ts"

interface ReusableParam {
  in: "query" | "path"
  name?: string
  description?: string
  schema?: Schema
  required?: boolean
}

interface QueryParamRaw extends ReusableParam {
  style?: "form"
  explode?: boolean
}

type Param = Nameable<QueryParamRaw>

export const queryParam = (r: QueryParamRaw): QueryParamRaw => r

interface OpReq {
  readonly security?: Security
  /* optional security means `value` OR `no authentication` */
  readonly "security?"?: Security
  readonly pathParams?: Record<string, Schema>
  readonly query?: Record<string, Schema>
  readonly headers?: Record<string, Schema>
  readonly body?: Schema | Record<Mime, Schema>
  readonly params?: readonly Param[]
}

interface ReqAugmentation extends OpReq {
  readonly mime?: Mime
}

interface RespAugmentation {
  readonly mime?: Mime
  readonly headers?: Record<string, Schema>
  readonly cookies?: Record<string, Schema>
}

type MatchStatus = number | `${number}..${number}`

type OpRes = Record<number, Resp | Schema>

type ScopeRes =
  | {
      mime?: Mime
      defaults?: Record<MatchStatus, RespAugmentation>
      add?: OpRes
    }
  | OpRes

export interface Op<TTags extends TagRegistry = TagRegistry> {
  id?: string
  headID?: string
  req?: OpReq | Schema
  res: OpRes
  deprecated?: boolean
  description?: string
  summary?: string
  tags?: OpTags<TTags>
}

export interface OpWithMethod<
  TTags extends TagRegistry = TagRegistry,
> extends Op<TTags> {
  method: HttpMethod
}

type ScopeOrOp<TTags extends TagRegistry = TagRegistry> =
  | Op<TTags>
  | Scope<TTags>

/* for root level, only paths */
export type Routes<TTags extends TagRegistry = TagRegistry> = Record<
  `/${string}`,
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
  Extract<keyof T, `/${string}`> extends never
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
