import fastDeepEqual from "fast-deep-equal"

/**
 * Deep equality for plain JSON-like objects (OpenAPI component payloads). Uses
 * [fast-deep-equal](https://github.com/epoberezkin/fast-deep-equal) (~1.1KB,
 * zero deps, widely used e.g. by React ecosystem).
 */
export function deepEqualJson(a: unknown, b: unknown): boolean {
  return fastDeepEqual(a, b)
}
