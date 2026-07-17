import type { SourceFile } from 'ts-morph'
import { Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { ExtensionClient } from '@/schema'
import type { RemoveResult, UpdateResult } from '@/utils/updaters/update-app'

export interface UpdateServerOptions {
  /** Path to the server bootstrap file (e.g. dashfy.server.ts). */
  serverFile: string
  /** Extension id used as the API id (e.g. "github"). */
  extensionKey: string
  /** Client setup info from the registry. */
  client: ExtensionClient
}

/**
 * Adds the client factory import and a `dashfy.registerApi(...)` call to the
 * server bootstrap file. Idempotent: skips if the API is already registered.
 */
export async function updateServer(options: UpdateServerOptions): Promise<UpdateResult> {
  const { serverFile, extensionKey, client } = options

  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
  })
  const sourceFile = project.addSourceFileAtPath(serverFile)

  if (hasRegisterApiCall(sourceFile, extensionKey)) {
    return 'skipped'
  }

  ensureNamedImport(sourceFile, client.import, client.factory)

  const instanceName = findDashfyInstanceName(sourceFile) ?? 'dashfy'
  const optionsArg = client.options ?? ''
  const modeArg = client.mode === 'push' ? `, 'push'` : ''
  const registration = `${instanceName}.registerApi('${extensionKey}', ${client.factory}(${optionsArg})${modeArg})`

  const insertIndex = getRegistrationInsertIndex(sourceFile, instanceName)
  sourceFile.insertStatements(insertIndex, `${registration}\n`)

  sourceFile.formatText()
  await sourceFile.save()

  return 'added'
}

export interface RemoveFromServerOptions {
  /** Path to the server bootstrap file (e.g. dashfy.server.ts). */
  serverFile: string
  /** Extension id used as the API id (e.g. "github"). */
  extensionKey: string
  /** Client setup info from the registry. */
  client: ExtensionClient
}

/**
 * Reverses {@link updateServer}: removes the `dashfy.registerApi('<id>', ...)`
 * call and the client factory import (when no longer used). Idempotent: skips if
 * the API is not registered.
 */
export async function removeFromServer(options: RemoveFromServerOptions): Promise<RemoveResult> {
  const { serverFile, extensionKey, client } = options

  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
  })
  const sourceFile = project.addSourceFileAtPath(serverFile)

  if (!hasRegisterApiCall(sourceFile, extensionKey)) {
    return 'skipped'
  }

  removeRegisterApiStatement(sourceFile, extensionKey)
  removeNamedImport(sourceFile, client.import, client.factory)

  sourceFile.formatText()
  await sourceFile.save()

  return 'removed'
}

/** Removes the statement containing the matching registerApi call. */
function removeRegisterApiStatement(sourceFile: SourceFile, extensionKey: string): void {
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (!call.getExpression().getText().endsWith('.registerApi')) {
      continue
    }
    const firstArg = call.getArguments()[0]
    if (firstArg?.getText().replace(/['"]/g, '') !== extensionKey) {
      continue
    }
    const statement = call.getFirstAncestorByKind(SyntaxKind.ExpressionStatement)
    if (statement) {
      statement.remove()
    }
    return
  }
}

/** Removes a named import, dropping the declaration if it empties. */
function removeNamedImport(sourceFile: SourceFile, moduleSpecifier: string, name: string): void {
  const existing = sourceFile.getImportDeclaration(
    (declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier,
  )
  if (!existing) {
    return
  }

  for (const named of existing.getNamedImports()) {
    if (named.getName() === name) {
      named.remove()
    }
  }

  if (existing.getNamedImports().length === 0 && !existing.getDefaultImport()) {
    existing.remove()
  }
}

function hasRegisterApiCall(sourceFile: SourceFile, extensionKey: string): boolean {
  return sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
    if (!call.getExpression().getText().endsWith('.registerApi')) {
      return false
    }
    const firstArg = call.getArguments()[0]
    return firstArg?.getText().replace(/['"]/g, '') === extensionKey
  })
}

function ensureNamedImport(sourceFile: SourceFile, moduleSpecifier: string, name: string): void {
  const existing = sourceFile.getImportDeclaration(
    (declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier,
  )

  if (!existing) {
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: [{ name }],
    })
    return
  }

  const alreadyImported = existing.getNamedImports().some((named) => named.getName() === name)
  if (!alreadyImported) {
    existing.addNamedImport({ name })
  }
}

function findDashfyInstanceName(sourceFile: SourceFile): string | undefined {
  for (const declaration of sourceFile.getDescendantsOfKind(SyntaxKind.VariableDeclaration)) {
    const initializer = declaration.getInitializer()
    if (initializer?.getText().startsWith('new Dashfy(')) {
      return declaration.getName()
    }
  }
  return undefined
}

function getRegistrationInsertIndex(sourceFile: SourceFile, instanceName: string): number {
  const statements = sourceFile.getStatements()

  const startIndex = statements.findIndex((statement) =>
    statement.getText().includes(`${instanceName}.start(`),
  )
  if (startIndex !== -1) {
    return startIndex
  }

  let lastImportIndex = -1
  statements.forEach((statement, index) => {
    if (statement.getKind() === SyntaxKind.ImportDeclaration) {
      lastImportIndex = index
    }
  })
  return lastImportIndex + 1
}
