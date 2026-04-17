import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { afterEach, describe, expect, test } from "vitest"

const repoRoot = fileURLToPath(new URL("../", import.meta.url))
const pluginPath = fileURLToPath(new URL("./oxlint-plugin.ts", import.meta.url))
const oxlintBinPath = fileURLToPath(new URL("../node_modules/oxlint/bin/oxlint", import.meta.url))
const createdDirs: string[] = []

afterEach(() => {
  while (createdDirs.length > 0) {
    const dir = createdDirs.pop()

    if (dir !== undefined) {
      rmSync(dir, { recursive: true, force: true })
    }
  }
})

const createTempDir = (prefix = join(tmpdir(), "responsibleapi-oxlint-")): string => {
  const dir = mkdtempSync(prefix)
  createdDirs.push(dir)
  return dir
}

const runOxlint = async (args: readonly string[]) => {
  const proc = Bun.spawn({
    cmd: ["bun", oxlintBinPath, ...args],
    cwd: repoRoot,
    stdout: "pipe",
    stderr: "pipe",
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ])

  return { exitCode, stdout, stderr }
}

describe("oxlint-plugin", () => {
  test("does not flag raw OpenAPI example fields", async () => {
    const dir = createTempDir()
    const configPath = join(dir, "oxlint.jsonc")
    const fixturePath = join(dir, "fixture.ts")

    writeFileSync(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          "local/prefer-schema-examples": "warn",
        },
      }),
    )
    writeFileSync(
      fixturePath,
      [
        'import { string } from "../src/dsl/schema.ts"',
        "",
        'queryParam({ example: "x", schema: string() })',
        "",
      ].join("\n"),
    )

    const result = await runOxlint(["-c", configPath, fixturePath])

    expect(result.exitCode).toEqual(0)
    expect(result.stdout).not.toContain("local(prefer-schema-examples)")
    expect(result.stderr).toEqual("")
  })

  test("fixes inline schema DSL examples with the local plugin config", async () => {
    const dir = createTempDir()
    const configPath = join(dir, "oxlint.jsonc")
    const fixturePath = join(dir, "fixture.ts")

    writeFileSync(
      configPath,
      JSON.stringify({
        jsPlugins: [pluginPath],
        rules: {
          "local/prefer-schema-examples": "warn",
        },
      }),
    )
    writeFileSync(
      fixturePath,
      [
        'import { dict, string } from "../src/dsl/schema.ts"',
        "",
        'dict(string(), string(), { example: makeValue() })',
        "",
      ].join("\n"),
    )

    const result = await runOxlint(["-c", configPath, "--fix", fixturePath])

    expect(result.exitCode).toEqual(0)
    expect(readFileSync(fixturePath, "utf8")).toContain(
      "examples: [makeValue()]",
    )
  })

  test("repo oxlint config loads the local plugin", async () => {
    const dir = createTempDir(join(repoRoot, "scripts/.tmp-oxlint-"))
    const fixturePath = join(dir, "plugin-smoke.ts")

    writeFileSync(
      fixturePath,
      [
        'import { string } from "../src/dsl/schema.ts"',
        "",
        'string({ example: "x" })',
        "",
      ].join("\n"),
    )

    const result = await runOxlint([
      "-c",
      join(repoRoot, "oxlint.config.ts"),
      fixturePath,
    ])

    expect(result.exitCode).toEqual(0)
    expect(result.stdout).toContain("local(prefer-schema-examples)")
  })
})
