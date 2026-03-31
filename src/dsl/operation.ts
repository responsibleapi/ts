import type { NameWithOptionality, OptionalKey } from "./dsl.ts"
import type { HttpMethod } from "./methods.ts"
import type { Nameable } from "./nameable.ts"
import type { ReusableParam } from "./params.ts"
import type { ReusableHeader } from "./response-headers.ts"
import type { Schema } from "./schema.ts"
import type { Mime } from "./scope.ts"
import type { Security } from "./security.ts"
import type { DeclaredTags, OpTags } from "./tags.ts"

/**
 * Path params are always required to build the path, so names with the "?"
 * suffix are rejected by forcing those keys to `never`
 *
 * @dsl
 */
export interface PathParams extends Record<string, Schema> {
  readonly [name: OptionalKey]: never
}

export interface GetOpReq {
  readonly security?: Security
  /* optional security means `value` OR `no authentication` */
  readonly "security?"?: Security

  readonly pathParams?: PathParams
  readonly query?: Record<NameWithOptionality, Schema>
  readonly headers?: Record<NameWithOptionality, Schema>

  /**
   * The dedicated reuse mechanism for OpenAPI parameters. Keep one-off params
   * inline in {@link pathParams}, {@link query}, or {@link headers}. When a param
   * is shared across operations or scopes, declare it here instead of reusing
   * parameter maps via object spreading.
   *
   * @dsl
   */
  readonly params?: readonly ReusableParam[]
}

export interface OpReq extends GetOpReq {
  readonly body?: Schema | Record<Mime, Schema>
}

export interface ReqAugmentation extends OpReq {
  readonly mime?: Mime
}

export interface RespAugmentation {
  readonly mime?: Mime
  readonly headers?: Record<NameWithOptionality, Schema | ReusableHeader>

  /**
   * Reusable response headers follow the same array-first composition pattern
   * as {@link GetOpReq.params}. We intentionally do not introduce a dedicated
   * `resHeaders()` helper because a wrapper API would propagate through
   * adjacent param/header typings and complicate otherwise simple record
   * literals.
   *
   * Keep one-off response headers inline in {@link headers}; declare shared
   * reusable headers here.
   *
   * @dsl
   */
  readonly headerParams?: readonly ReusableHeader[]
  readonly cookies?: Record<NameWithOptionality, Schema>
}

export type MatchStatus = number | `${number}..${number}`

export interface RespParams {
  body?: Schema | Record<Mime, Schema>

  /**
   * Even though `oas31.ResponseObject.description` is required, we don't
   * require it. The compiler will add the status number there
   *
   * @compiler
   */
  description?: string

  headers?: Record<NameWithOptionality, Schema | ReusableHeader>
  /**
   * Reusable response headers follow the same array-first composition pattern
   * as {@link GetOpReq.params}. We intentionally do not introduce a dedicated
   * `resHeaders()` helper because a wrapper API would propagate through
   * adjacent param/header typings and complicate otherwise simple record
   * literals.
   *
   * Keep one-off response headers inline in {@link headers}; declare shared
   * reusable headers here.
   *
   * @dsl
   */
  headerParams?: readonly ReusableHeader[]
  cookies?: Record<NameWithOptionality, Schema>
}

export type Resp = Nameable<RespParams>

export type OpRes = Record<number, Resp | Schema>

/**
 * Shared fields for {@link GetOp} and {@link Op}.
 *
 * `TTags` is a {@link DeclaredTags} registry (from `declareTags`) so `tags` is a
 * tuple of those tag objects; the default keeps bare `Op` / `GetOp` and the
 * HTTP method helpers type-checkable without an explicit type argument.
 */
export interface OpBase<TTags extends DeclaredTags = DeclaredTags> {
  id?: string
  res?: OpRes
  deprecated?: boolean
  description?: string
  summary?: string
  tags?: OpTags<TTags>
}

export interface Op<
  TTags extends DeclaredTags = DeclaredTags,
> extends OpBase<TTags> {
  req?: OpReq | Schema
}

export interface GetOp<
  TTags extends DeclaredTags = DeclaredTags,
> extends OpBase<TTags> {
  req?: GetOpReq

  /**
   * Id for synthetic HEAD. Only valid for GET ops
   *
   * @dsl
   */
  headID?: string
}

export interface OpWithMethod<
  TTags extends DeclaredTags = DeclaredTags,
> extends Op<TTags> {
  method: HttpMethod
}

/**
 * Any operation node produced by HTTP method helpers at runtime (includes
 * {@link OpWithMethod} and GET’s {@link GetOp} + `method` shape).
 *
 * @compiler
 */
export type RouteMethodOp<TTags extends DeclaredTags = DeclaredTags> =
  | OpWithMethod<TTags>
  | (GetOp<TTags> & { method: "GET" })

/** This exists mostly to distinguish {@link Schema} from {@link Resp} */
export const resp = (param: RespParams): RespParams => param
