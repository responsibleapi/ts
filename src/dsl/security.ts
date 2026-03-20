import type { Nameable } from "./nameable.ts"

type QuerySecurity = Readonly<{
  type: "query"
  name: string
}>

type HeaderSecurity = Readonly<{
  type: "header"
  name: string
}>

export type Security = Nameable<QuerySecurity | HeaderSecurity>

export const querySecurity = (param: { name: string }): QuerySecurity => ({
  type: "query",
  ...param,
})

export const headerSecurity = (param: { name: string }): HeaderSecurity => ({
  type: "header",
  ...param,
})
