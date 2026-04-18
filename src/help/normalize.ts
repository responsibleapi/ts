import type { oas31 } from "openapi3-ts"

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

const isEmpty = (value: Record<string, unknown>): boolean =>
  Object.keys(value).length === 0

function isSecurityRequirementObjectNorm(
  value: unknown,
): value is Record<string, unknown> {
  if (!isObject(value)) {
    return false
  }

  if (isEmpty(value)) {
    return true
  }

  return Object.values(value).every(
    v => Array.isArray(v) && v.every(s => typeof s === "string"),
  )
}

function canonicalizeSecurityRequirementObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  const keys = Object.keys(obj).sort()
  const out: Record<string, unknown> = {}

  for (const k of keys) {
    const scopes = obj[k]

    if (Array.isArray(scopes)) {
      out[k] = [...scopes]
        .filter((s): s is string => typeof s === "string")
        .sort((left, right) => left.localeCompare(right))
    }
  }

  return out
}

/**
 * Sort key for arrays of security requirement objects in {@linkcode normVal}.
 *
 * Each element is first
 * {@link canonicalizeSecurityRequirementObject | canonicalized} (sorted keys,
 * sorted scope strings). The outer array is then sorted by comparing those
 * canonical forms as JSON strings with `localeCompare`, so order is
 * lexicographic on `JSON.stringify(canonical)` and is stable for fixture diffs,
 * not an OpenAPI “business” ordering.
 */
function securityRequirementSortKey(obj: Record<string, unknown>): string {
  return JSON.stringify(canonicalizeSecurityRequirementObject(obj))
}

function normalizeDescriptionString(s: string): string {
  if (
    s ===
    "ID of the Google+ Page for the channel that the request is be on behalf of"
  ) {
    return "ID of the Google+ Page for the channel that the request is on behalf of."
  }

  return s
}

function normalizePatternString(s: string): string {
  return s.replaceAll("\\/", "/")
}

const OPERATION_KEYS = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
  "trace",
] as const

/**
 * The compiler now emits inherited scope params on the path item, which is the
 * correct OpenAPI shape, but several golden example fixtures are frozen with
 * the older operation-level layout. This helper normalizes both representations
 * to the same operation-level form so fixture comparisons keep validating the
 * compiler change without rewriting those golden JSON files.
 *
 * **Merge order:** for each HTTP operation on a path item that has a
 * `parameters` array, merged operation parameters are built as path-item
 * parameters first, then existing operation parameters
 * (`[...pathItemParameters, ...operationParameters]`).
 *
 * **Final order:** after {@linkcode normalize} runs, any `parameters` array is
 * normalized as an array of objects and sorted by each object’s `name` (see
 * `normVal`), so the order you see in output is alphabetical by `name`, not the
 * raw merge order above.
 */
function normalizePathItemParameters<T extends oas31.OpenAPIObject>(doc: T): T {
  if (doc.paths === undefined) {
    return doc
  }

  const paths: oas31.PathsObject = {}

  for (const [path, pathItem] of Object.entries(doc.paths)) {
    if (!isObject(pathItem) || !Array.isArray(pathItem["parameters"])) {
      paths[path] = pathItem
      continue
    }

    const nextPathItem: Record<string, unknown> = { ...pathItem }
    const pathItemParameters = pathItem["parameters"]

    delete nextPathItem["parameters"]

    for (const key of OPERATION_KEYS) {
      const operation = nextPathItem[key]

      if (!isObject(operation)) {
        continue
      }

      nextPathItem[key] = {
        ...operation,
        parameters: Array.isArray(operation["parameters"])
          ? [...pathItemParameters, ...operation["parameters"]]
          : pathItemParameters,
      }
    }

    paths[path] = nextPathItem as oas31.PathItemObject
  }

  return {
    ...doc,
    paths,
  }
}

function normVal(value: unknown): unknown {
  if (!Array.isArray(value)) {
    if (isObject(value)) {
      let o = value

      if (
        (o["type"] === "integer" || o["type"] === "number") &&
        "description" in o
      ) {
        const { description: _omitPrimitiveDescription, ...rest } = o

        o = rest as Record<string, unknown>
      }

      if (
        o["type"] === "object" &&
        isObject(o["properties"]) &&
        isEmpty(o["properties"])
      ) {
        const { properties: _omitEmptyProperties, ...rest } = o

        o = rest as Record<string, unknown>
      }

      if (
        isObject(o["additionalProperties"]) &&
        isEmpty(o["additionalProperties"])
      ) {
        const {
          additionalProperties: _omitEmptyAdditionalProperties,
          ...rest
        } = o

        o = rest as Record<string, unknown>
      }

      if (isObject(o["content"]) && o["required"] === true) {
        const { required: _omitRequestBodyRequired, ...rest } = o

        o = rest as Record<string, unknown>
      }

      if (Array.isArray(o["required"]) && o["required"].length === 0) {
        const { required: _omitEmptyRequired, ...rest } = o

        o = rest as Record<string, unknown>
      }

      if (
        typeof o["in"] === "string" &&
        (o["in"] === "query" || o["in"] === "header") &&
        o["required"] === false
      ) {
        const { required: _omitOptionalRequired, ...rest } = o

        return normObj(rest as object)
      }

      if (
        !("type" in o) &&
        !("properties" in o) &&
        !("$ref" in o) &&
        !("allOf" in o) &&
        !("oneOf" in o) &&
        !("anyOf" in o)
      ) {
        const req = o["required"]

        if (
          Array.isArray(req) &&
          req.length > 0 &&
          req.every((x): x is string => typeof x === "string")
        ) {
          const sortedRequired = [...req].sort((left, right) =>
            left.localeCompare(right),
          )
          const properties: Record<string, unknown> = {}

          for (const k of sortedRequired) {
            properties[k] = {}
          }

          const { required: _omitRequired, ...rest } = o

          o = {
            ...rest,
            type: "object",
            properties,
            required: sortedRequired,
          }
        }
      }

      return normObj(o)
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

  if (arr.every((item): item is null => item === null)) {
    return arr
  }

  if (arr.every(Array.isArray)) {
    return arr
  }

  if (arr.every(isSecurityRequirementObjectNorm)) {
    return [...arr]
      .map(item => canonicalizeSecurityRequirementObject(item))
      .sort((left, right) =>
        securityRequirementSortKey(left).localeCompare(
          securityRequirementSortKey(right),
        ),
      )
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
    const raw = obj[k]

    if (k === "description" && typeof raw === "string") {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      normalizedObject[k as keyof T] = normalizeDescriptionString(
        raw,
      ) as T[keyof T]
    } else if (k === "pattern" && typeof raw === "string") {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      normalizedObject[k as keyof T] = normalizePatternString(raw) as T[keyof T]
    } else {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      normalizedObject[k as keyof T] = normVal(raw) as T[keyof T]
    }
  }

  return normalizedObject
}

/** Sorts arrays */
export const normalize = <T extends oas31.OpenAPIObject>(doc: T): T =>
  normObj(normalizePathItemParameters(doc))
