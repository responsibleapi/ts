import type { GetOp, Op, OpWithMethod } from "./operation.ts"
import type { DeclaredTags } from "./tags.ts"

export type MethodRoutes<TTags extends DeclaredTags = DeclaredTags> = {
  GET?: GetOp<TTags>
  POST?: Op<TTags>
  PUT?: Op<TTags>
  DELETE?: Op<TTags>
  HEAD?: Op<TTags>
}

export type HttpMethod = keyof MethodRoutes

export type GetOpWithMethod<TTags extends DeclaredTags = DeclaredTags> = GetOp<TTags> & {
  method: "GET"
}

export function GET(op: GetOp): GetOpWithMethod {
  return { ...op, method: "GET" }
}

export function HEAD(op: Op): OpWithMethod {
  return { ...op, method: "HEAD" }
}

export function POST(op: Op): OpWithMethod
export function POST(id: string, op: Op): OpWithMethod
export function POST(idOrOp: string | Op, maybeOp?: Op): OpWithMethod {
  if (typeof idOrOp === "string") {
    return { ...maybeOp!, method: "POST", id: idOrOp }
  }

  return { ...idOrOp, method: "POST" }
}

export function PUT(op: Op): OpWithMethod
export function PUT(id: string, op: Op): OpWithMethod
export function PUT(idOrOp: string | Op, maybeOp?: Op): OpWithMethod {
  if (typeof idOrOp === "string") {
    return { ...maybeOp!, method: "PUT", id: idOrOp }
  }

  return { ...idOrOp, method: "PUT" }
}

export function DELETE(op: Op): OpWithMethod
export function DELETE(id: string, op: Op): OpWithMethod
export function DELETE(idOrOp: string | Op, maybeOp?: Op): OpWithMethod {
  if (typeof idOrOp === "string") {
    return { ...maybeOp!, method: "DELETE", id: idOrOp }
  }

  return { ...idOrOp, method: "DELETE" }
}
