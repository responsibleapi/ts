import type { Op, OpGET } from "./operation.ts"
import type { DeclaredTags } from "./tags.ts"

export type MethodRoutes<TTags extends DeclaredTags = DeclaredTags> = {
  GET?: OpGET<TTags>
  POST?: Op<TTags>
  PUT?: Op<TTags>
  DELETE?: Op<TTags>
  HEAD?: Op<TTags>
}

export type HttpMethod = keyof MethodRoutes

export function GET(_op: OpGET): OpGET {
  throw new Error("TODO")
}

export function HEAD(_op: Op): Op {
  throw new Error("TODO")
}

export function POST(op: Op): Op
export function POST(id: string, op: Op): Op
export function POST(_idOrOp: string | Op, _maybeOp?: Op): Op {
  throw new Error("TODO")
}

export function PUT(op: Op): Op
export function PUT(id: string, op: Op): Op
export function PUT(_idOrOp: string | Op, _maybeOp?: Op): Op {
  throw new Error("TODO")
}

export function DELETE(op: Op): Op
export function DELETE(id: string, op: Op): Op
export function DELETE(_idOrOp: string | Op, _maybeOp?: Op): Op {
  throw new Error("TODO")
}
