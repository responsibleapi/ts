import type { oas31 } from "openapi3-ts"

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function normVal(value: unknown): unknown {
  if (!Array.isArray(value)) {
    if (isObject(value)) {
      return normObj(value)
    }
    return value
  }

  const arr = value.map(item => normVal(item))

  if (arr.every((item): item is string => typeof item === "string")) {
    return [...arr].sort((left, right) => left.localeCompare(right))
  }

  if (arr.every((item): item is number => typeof item === "number")) {
    return [...arr].sort((left, right) => left - right)
  }

  if (arr.every((item): item is boolean => typeof item === "boolean")) {
    return [...arr].sort((left, right) => Number(left) - Number(right))
  }

  if (arr.every(Array.isArray)) {
    return arr
  }

  if (arr.every((item): item is Record<string, unknown> => isObject(item))) {
    return [...arr].sort((left, right) => {
      const leftName = typeof left["name"] === "string" ? left["name"] : ""
      const rightName = typeof right["name"] === "string" ? right["name"] : ""
      return leftName.localeCompare(rightName)
    })
  }

  throw new Error(`Invalid value for ${JSON.stringify(arr)}`)
}

const normObj = <T extends object>(obj: T): T => {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion
  const normalizedObject = {} as T

  for (const k in obj) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion
    normalizedObject[k as keyof T] = normVal(obj[k]) as T[keyof T]
  }

  return normalizedObject
}

export const normalize = <T extends oas31.OpenAPIObject>(doc: T): T =>
  normObj(doc)
