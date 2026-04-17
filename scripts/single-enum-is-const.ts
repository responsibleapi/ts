#!/usr/bin/env bun
import { readFileSync, writeFileSync } from "node:fs"
import ts from "typescript"

type Replacement = Readonly<{
  end: number
  start: number
  text: string
}>

const isSchemaImportSource = (source: string): boolean =>
  source === "./schema.ts" || source.endsWith("/dsl/schema.ts")

const getPropertyName = (name: ts.PropertyName): string | undefined => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) {
    return name.text
  }

  if (ts.isNoSubstitutionTemplateLiteral(name)) {
    return name.text
  }

  return undefined
}

const unwrapParentheses = (node: ts.Expression): ts.Expression => {
  let current = node

  while (ts.isParenthesizedExpression(current)) {
    current = current.expression
  }

  return current
}

const getStringBindings = (sourceFile: ts.SourceFile): ReadonlySet<string> => {
  const bindings = new Set<string>()

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      !isSchemaImportSource(statement.moduleSpecifier.text)
    ) {
      continue
    }

    const namedBindings = statement.importClause?.namedBindings

    if (!namedBindings || !ts.isNamedImports(namedBindings)) {
      continue
    }

    for (const element of namedBindings.elements) {
      const importedName = element.propertyName?.text ?? element.name.text

      if (importedName === "string") {
        bindings.add(element.name.text)
      }
    }
  }

  return bindings
}

const hasPropertyNamed = (
  objectLiteral: ts.ObjectLiteralExpression,
  name: string,
): boolean =>
  objectLiteral.properties.some(property => {
    if (
      !ts.isPropertyAssignment(property) &&
      !ts.isShorthandPropertyAssignment(property) &&
      !ts.isMethodDeclaration(property)
    ) {
      return false
    }

    return getPropertyName(property.name) === name
  })

const getEnumReplacement = (
  objectLiteral: ts.ObjectLiteralExpression,
  sourceFile: ts.SourceFile,
): Replacement | undefined => {
  if (hasPropertyNamed(objectLiteral, "const")) {
    return undefined
  }

  for (const property of objectLiteral.properties) {
    if (!ts.isPropertyAssignment(property)) {
      continue
    }

    if (getPropertyName(property.name) !== "enum") {
      continue
    }

    const initializer = unwrapParentheses(property.initializer)

    if (!ts.isArrayLiteralExpression(initializer)) {
      continue
    }

    if (initializer.elements.length !== 1) {
      continue
    }

    const [element] = initializer.elements

    if (!element || ts.isSpreadElement(element)) {
      continue
    }

    return {
      start: property.getStart(sourceFile),
      end: property.getEnd(),
      text: `const: ${element.getText(sourceFile)}`,
    }
  }

  return undefined
}

export const rewriteSingleEnumIsConst = (input: string): string => {
  const sourceFile = ts.createSourceFile(
    "input.ts",
    input,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  )
  const stringBindings = getStringBindings(sourceFile)

  if (stringBindings.size === 0) {
    return input
  }

  const replacements: Replacement[] = []

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      stringBindings.has(node.expression.text)
    ) {
      const [firstArg] = node.arguments

      if (firstArg) {
        const value = unwrapParentheses(firstArg)

        if (ts.isObjectLiteralExpression(value)) {
          const replacement = getEnumReplacement(value, sourceFile)

          if (replacement !== undefined) {
            replacements.push(replacement)
          }
        }
      }
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)

  if (replacements.length === 0) {
    return input
  }

  let output = input

  for (const replacement of replacements.toSorted((a, b) => b.start - a.start)) {
    output =
      output.slice(0, replacement.start) +
      replacement.text +
      output.slice(replacement.end)
  }

  return output
}

if (import.meta.main) {
  const paths = Bun.argv.slice(2)

  if (paths.length === 0) {
    console.error(
      "Usage: bun scripts/single-enum-is-const.ts <file.ts> [more-files.ts]",
    )
    process.exit(1)
  }

  let changedFiles = 0

  for (const path of paths) {
    const input = readFileSync(path, "utf8")
    const output = rewriteSingleEnumIsConst(input)

    if (output === input) {
      continue
    }

    writeFileSync(path, output)
    changedFiles += 1
    console.log(path)
  }

  if (changedFiles === 0) {
    process.exit(0)
  }
}
