function isJsonObject(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x)
}

/**
 * Deep equality for plain JSON-like objects (OpenAPI component payloads). Key
 * order is ignored; arrays compare element-wise in order.
 */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) {
    return true
  }

  if (a === null || b === null) {
    return false
  }

  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      return false
    }

    return a.every((v, i) => deepEqualJson(v, b[i]))
  }

  if (Array.isArray(b)) {
    return false
  }

  if (!isJsonObject(a) || !isJsonObject(b)) {
    return false
  }

  const keysA = Object.keys(a).sort()
  const keysB = Object.keys(b).sort()

  if (keysA.length !== keysB.length) {
    return false
  }

  for (let i = 0; i < keysA.length; i++) {
    if (keysA[i] !== keysB[i]) {
      return false
    }
  }

  return keysA.every(k => deepEqualJson(a[k], b[k]))
}
