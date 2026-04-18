import fastDeepEqual from "fast-deep-equal"

export const equal: (a: unknown, b: unknown) => boolean = fastDeepEqual
