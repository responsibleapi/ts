import type { oas31 } from "openapi3-ts"
import type { RequireAtLeastTwo } from "../lib.ts"
import type { HttpMethod, Mime, Resp } from "./methods.ts"
import type { Nameable } from "./nameable.ts"
import type { Schema } from "./schema.ts"
import type { Security } from "./security.ts"

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

const declaredTagBrand = Symbol("declaredTagBrand")

type TagNoName = Omit<oas31.TagObject, "name">

/**
 * Top-level tags should be declared once as a keyed object so operations can
 * reference the stable tag keys instead of repeating tag names inline.
 */
type TagDeclarations = Readonly<Record<string, TagNoName>>

type DeclaredTag<
  TName extends string = string,
  TTag extends TagNoName = TagNoName,
> = TTag & {
  readonly name: TName
  readonly [declaredTagBrand]: true
}

type DeclaredTags<TTags extends TagDeclarations = TagDeclarations> = {
  readonly [K in keyof TTags]: DeclaredTag<Extract<K, string>, TTags[K]>
}

type TagRegistry = DeclaredTags

type DeclaredOpTag<TTags extends TagRegistry = TagRegistry> = TTags[keyof TTags]

type OpTags<TTags extends TagRegistry = TagRegistry> =
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
      Object.assign(
        { name, ...declaredTag },
        { [declaredTagBrand]: true as const },
      ),
    ]),
  ) as DeclaredTags<TTags>

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

type ScopeOrOp = Op | Scope

/* for root level, only paths */
export type Routes = Record<`/${string}`, ScopeOrOp>

/* Supports scopes that declare HTTP handlers alongside nested path routes. */
type MethodRoutes = Partial<Record<HttpMethod, Op>>

/*
 * The stricter "at least two methods" rule only makes sense for pure
 * method-only scopes. Once a scope also has nested `"/child"` routes, we allow
 * partial method sets so parent scopes can mix handlers with subpaths.
 */
type PureMethodRoutes = RequireAtLeastTwo<Record<HttpMethod, Op>>

/*
 * Real `routes` objects can contain both HTTP methods and nested path keys at
 * the same time, so this is a combined shape instead of a simple union.
 */
type ScopeRoutes = Routes & MethodRoutes

/*
 * `scope()` accepts either the bare routes object or the full `{ routes,
 * forAll? }` wrapper.
 */
type ScopeArg = ScopeRoutes | Scope

/*
 * A simple `Routes & PureMethodRoutes` would reject mixed scopes entirely,
 * while `Routes & MethodRoutes` alone would allow single-method scopes through.
 * This conditional keeps mixed scopes valid and only enforces
 * `RequireAtLeastTwo` when there are no path keys at all.
 */
type ValidScopeRoutes<T extends ScopeRoutes> =
  Extract<keyof T, `/${string}`> extends never
    ? T extends PureMethodRoutes
      ? T
      : never
    : T

/*
 * The same validation needs to work for both `scope({ GET: ... })` and
 * `scope({ routes: { GET: ... } })`, so we reapply `ValidScopeRoutes` to the
 * nested `routes` property in the wrapped form.
 */
type ValidScopeArg<T extends ScopeArg> = T extends Scope
  ? Omit<T, "routes"> & { routes: ValidScopeRoutes<T["routes"]> }
  : T extends ScopeRoutes
    ? ValidScopeRoutes<T>
    : never

export interface ScopeOpts {
  req?: ReqAugmentation
  res?: ScopeRes
}

export interface Scope {
  forAll?: ScopeOpts
  routes: ScopeRoutes
}

export function scope<const T extends ScopeArg>(arg: ValidScopeArg<T>): Scope {
  if ("routes" in arg) {
    return arg
  }

  return {
    routes: arg,
  }
}

export function isScope(_s: ScopeOrOp): _s is Scope {
  throw new Error(
    "we have not figured out how ScopeOrOp is even constructed to start distinguishing them",
  )
}

function _scopeToPaths(_: Scope): oas31.PathsObject {
  throw new Error("not even sure we need this function")
}
