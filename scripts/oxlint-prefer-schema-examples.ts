type Range = readonly [number, number]

interface Ranged {
  range: Range
}

interface Identifier extends Ranged {
  type: "Identifier"
  name: string
}

interface StringLiteral extends Ranged {
  type: "Literal"
  value: string
}

type Expression =
  | Identifier
  | ObjectExpression
  | StringLiteral
  | ParenthesizedExpression
  | Ranged

interface ParenthesizedExpression extends Ranged {
  type: "ParenthesizedExpression"
  expression: Expression
}

interface CallExpression extends Ranged {
  type: "CallExpression"
  callee: Expression
  arguments: readonly Expression[]
}

interface SpreadElement extends Ranged {
  type: "SpreadElement"
}

interface Property extends Ranged {
  type: "Property"
  kind: "init" | "get" | "set"
  key: Expression
  value: Expression
  computed: boolean
  method: boolean
  shorthand: boolean
}

type ObjectPropertyKind = Property | SpreadElement

interface ObjectExpression extends Ranged {
  type: "ObjectExpression"
  properties: readonly ObjectPropertyKind[]
}

interface ImportSpecifier {
  type: "ImportSpecifier"
  imported: Identifier | StringLiteral
  local: Identifier
}

interface ImportDefaultSpecifier {
  type: "ImportDefaultSpecifier"
  local: Identifier
}

interface ImportNamespaceSpecifier {
  type: "ImportNamespaceSpecifier"
  local: Identifier
}

type ImportDeclarationSpecifier =
  | ImportSpecifier
  | ImportDefaultSpecifier
  | ImportNamespaceSpecifier

interface ImportDeclaration {
  type: "ImportDeclaration"
  source: StringLiteral
  specifiers: readonly ImportDeclarationSpecifier[]
}

interface SourceCode {
  getText(node: Ranged): string
}

interface Fix {
  range: Range
  text: string
}

interface Fixer {
  replaceText(node: Ranged, text: string): Fix
}

interface Context {
  sourceCode: SourceCode
  report(diagnostic: {
    node: Ranged
    messageId: "preferExamples"
    fix: (fixer: Fixer) => Fix
  }): void
}

interface Rule {
  meta: {
    type: "suggestion"
    docs: {
      description: string
    }
    fixable: "code"
    messages: {
      preferExamples: string
    }
  }
  create(context: Context): {
    ImportDeclaration(node: ImportDeclaration): void
    CallExpression(node: CallExpression): void
  }
}

type Plugin = {
  meta: {
    name: string
  }
  rules: {
    "prefer-schema-examples": Rule
  }
}

const SCHEMA_HELPERS = new Set([
  "string",
  "array",
  "object",
  "dict",
  "integer",
  "int32",
  "int64",
  "uint32",
  "uint64",
  "number",
  "float",
  "double",
  "boolean",
  "oneOf",
  "anyOf",
  "allOf",
])

const OPTIONS_ARG_INDEX: Readonly<Record<string, number>> = {
  string: 0,
  array: 1,
  object: 1,
  dict: 2,
  integer: 0,
  int32: 0,
  int64: 0,
  uint32: 0,
  uint64: 0,
  number: 0,
  float: 0,
  double: 0,
  boolean: 0,
  oneOf: 1,
  anyOf: 1,
  allOf: 1,
}

const isIdentifier = (value: unknown): value is Identifier =>
  isObject(value) &&
  value["type"] === "Identifier" &&
  typeof value["name"] === "string" &&
  hasRange(value)

const isStringLiteral = (value: unknown): value is StringLiteral =>
  isObject(value) &&
  value["type"] === "Literal" &&
  typeof value["value"] === "string" &&
  hasRange(value)

const isObjectExpression = (value: unknown): value is ObjectExpression =>
  isObject(value) &&
  value["type"] === "ObjectExpression" &&
  Array.isArray(value["properties"]) &&
  hasRange(value)

const isProperty = (value: unknown): value is Property =>
  isObject(value) &&
  value["type"] === "Property" &&
  typeof value["kind"] === "string" &&
  hasRange(value)

const isSchemaImportSource = (source: string): boolean =>
  source === "./schema.ts" || source.endsWith("/dsl/schema.ts")

const isObject = (
  value: unknown,
): value is Record<string, unknown> & Partial<Ranged> =>
  typeof value === "object" && value !== null

const hasRange = (value: unknown): value is Ranged =>
  isObject(value) &&
  Array.isArray(value.range) &&
  value.range.length === 2 &&
  typeof value.range[0] === "number" &&
  typeof value.range[1] === "number"

const getImportName = (
  specifier: ImportDeclarationSpecifier,
): string | undefined => {
  if (specifier.type !== "ImportSpecifier") {
    return undefined
  }

  if (isIdentifier(specifier.imported)) {
    return specifier.imported.name
  }

  if (isStringLiteral(specifier.imported)) {
    return specifier.imported.value
  }

  return undefined
}

const getPropertyName = (property: Property): string | undefined => {
  if (property.computed || property.kind !== "init" || property.method) {
    return undefined
  }

  if (isIdentifier(property.key)) {
    return property.key.name
  }

  return undefined
}

const getOptionsObject = (
  node: CallExpression,
  helperName: string,
): ObjectExpression | undefined => {
  const argIndex = OPTIONS_ARG_INDEX[helperName]

  if (argIndex === undefined) {
    return undefined
  }

  const arg = node.arguments[argIndex]

  if (arg === undefined) {
    return undefined
  }

  if (
    isObject(arg) &&
    arg["type"] === "ParenthesizedExpression" &&
    "expression" in arg &&
    isObjectExpression(arg["expression"])
  ) {
    return arg["expression"]
  }

  return isObjectExpression(arg) ? arg : undefined
}

const findExampleProperty = (
  object: ObjectExpression,
): Property | undefined => {
  if (object.properties.some(property => property.type === "SpreadElement")) {
    return undefined
  }

  const directProperties = object.properties.filter(isProperty)

  if (
    directProperties.some(property => getPropertyName(property) === "examples")
  ) {
    return undefined
  }

  const exampleProperties = directProperties.filter(
    property => getPropertyName(property) === "example" && !property.shorthand,
  )

  return exampleProperties.length === 1 ? exampleProperties[0] : undefined
}

export const preferSchemaExamplesRule: Rule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Rewrite deprecated schema DSL `example` options to `examples: [value]`.",
    },
    fixable: "code",
    messages: {
      preferExamples:
        "Use `examples: [value]` instead of deprecated schema option `example`.",
    },
  },
  create(context) {
    const schemaHelperBindings = new Set<string>()

    return {
      ImportDeclaration(node) {
        if (!isSchemaImportSource(node.source.value)) {
          return
        }

        for (const specifier of node.specifiers) {
          const importedName = getImportName(specifier)

          if (
            importedName === undefined ||
            !SCHEMA_HELPERS.has(importedName) ||
            specifier.type !== "ImportSpecifier"
          ) {
            continue
          }

          schemaHelperBindings.add(specifier.local.name)
        }
      },
      CallExpression(node) {
        if (!isIdentifier(node.callee)) {
          return
        }

        const helperName = node.callee.name

        if (!schemaHelperBindings.has(helperName)) {
          return
        }

        const optionsObject = getOptionsObject(node, helperName)

        if (optionsObject === undefined) {
          return
        }

        const exampleProperty = findExampleProperty(optionsObject)

        if (exampleProperty === undefined) {
          return
        }

        context.report({
          node: exampleProperty,
          messageId: "preferExamples",
          fix: fixer =>
            fixer.replaceText(
              exampleProperty,
              `examples: [${context.sourceCode.getText(exampleProperty.value)}]`,
            ),
        })
      },
    }
  },
}

const plugin: Plugin = {
  meta: {
    name: "local",
  },
  rules: {
    "prefer-schema-examples": preferSchemaExamplesRule,
  },
}

export default plugin
