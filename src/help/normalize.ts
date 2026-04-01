import type { oas31 } from "openapi3-ts"

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const normalizeValue = (value: unknown): unknown => {
  if (!Array.isArray(value)) {
    if (isObject(value)) {
      return normalizeObject(value)
    }
    return value
  }

  const normalizedItems = value.map(item => normalizeValue(item))

  if (
    normalizedItems.every((item): item is string => typeof item === "string")
  ) {
    return [...normalizedItems].sort((left, right) => left.localeCompare(right))
  }

  if (
    normalizedItems.every((item): item is number => typeof item === "number")
  ) {
    return [...normalizedItems].sort((left, right) => left - right)
  }

  if (
    normalizedItems.every((item): item is boolean => typeof item === "boolean")
  ) {
    return [...normalizedItems].sort(
      (left, right) => Number(left) - Number(right),
    )
  }

  if (normalizedItems.every(Array.isArray)) {
    return normalizedItems
  }

  if (
    normalizedItems.every((item): item is Record<string, unknown> =>
      isObject(item),
    )
  ) {
    return [...normalizedItems].sort((left, right) => {
      const leftName = typeof left["name"] === "string" ? left["name"] : ""
      const rightName = typeof right["name"] === "string" ? right["name"] : ""
      return leftName.localeCompare(rightName)
    })
  }

  // TBD: define a stable ordering for mixed or unsupported array element shapes.
  return normalizedItems
}

const normalizeObject = <T extends object>(obj: T): T => {
  const normalizedObject = {} as T

  for (const k in obj) {
    normalizedObject[k as keyof T] = normalizeValue(obj[k]) as T[keyof T]
  }

  return normalizedObject
}

export function normalize(doc: oas31.OpenAPIObject): oas31.OpenAPIObject {
  return normalizeObject(doc)
}
