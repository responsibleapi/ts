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

function normalizeSecurityRequirements(value: unknown[]): unknown[] {
  const normalized = value.map(item => normVal(item))

  if (!normalized.every(isSecurityRequirementObjectNorm)) {
    return normalized
  }

  return [...normalized]
    .map(item => canonicalizeSecurityRequirementObject(item))
    .sort((left, right) =>
      securityRequirementSortKey(left).localeCompare(
        securityRequirementSortKey(right),
      ),
    )
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

function parameterIdentity(
  value: unknown,
  components?: oas31.ComponentsObject,
): string | undefined {
  if (!isObject(value)) {
    return undefined
  }

  if (typeof value["$ref"] === "string") {
    const ref = value["$ref"]
    const match = /^#\/components\/parameters\/(.+)$/.exec(ref)

    if (match !== null) {
      const parameter = components?.parameters?.[match[1]]

      if (
        isObject(parameter) &&
        typeof parameter["name"] === "string" &&
        typeof parameter["in"] === "string"
      ) {
        return `${parameter["in"]}:${parameter["name"]}`
      }
    }

    return `$ref:${ref}`
  }

  if (typeof value["name"] === "string" && typeof value["in"] === "string") {
    return `${value["in"]}:${value["name"]}`
  }

  return undefined
}

function mergePathItemParameters(
  pathItemParameters: unknown[],
  operationParameters: unknown[],
  components?: oas31.ComponentsObject,
): unknown[] {
  const operationParameterIds = new Set(
    operationParameters
      .map(parameter => parameterIdentity(parameter, components))
      .filter((parameter): parameter is string => parameter !== undefined),
  )

  return [
    ...pathItemParameters.filter(parameter => {
      const id = parameterIdentity(parameter, components)

      return id === undefined || !operationParameterIds.has(id)
    }),
    ...operationParameters,
  ]
}

/**
 * The compiler now emits inherited scope params on the path item, which is the
 * correct OpenAPI shape, but several golden example fixtures are frozen with
 * the older operation-level layout. This helper normalizes both representations
 * to the same operation-level form so fixture comparisons keep validating the
 * compiler change without rewriting those golden JSON files.
 *
 * **Merge order:** for each HTTP operation on a path item that has a
 * `parameters` array, merged operation parameters are built as path-item
 * parameters first, then existing operation parameters, with operation-level
 * params overriding path-item params that share same `(name, in)` pair or same
 * `$ref`.
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
    let hasOperation = false

    for (const key of OPERATION_KEYS) {
      const operation = nextPathItem[key]

      if (!isObject(operation)) {
        continue
      }

      hasOperation = true
      nextPathItem[key] = {
        ...operation,
        parameters: Array.isArray(operation["parameters"])
          ? mergePathItemParameters(
              pathItemParameters,
              operation["parameters"],
              doc.components,
            )
          : [...pathItemParameters],
      }
    }

    if (hasOperation) {
      delete nextPathItem["parameters"]
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

      if (Array.isArray(o["required"]) && o["required"].length === 0) {
        const { required: _omitEmptyRequired, ...rest } = o

        o = rest as Record<string, unknown>
      }

      if (Array.isArray(o["parameters"]) && o["parameters"].length === 0) {
        const { parameters: _omitEmptyParameters, ...rest } = o

        o = rest as Record<string, unknown>
      }

      if ("responses" in o && o["deprecated"] === false) {
        const { deprecated: _omitFalseDeprecated, ...rest } = o

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

    if (k === "security" && Array.isArray(raw)) {
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion
      normalizedObject[k as keyof T] = normalizeSecurityRequirements(
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
