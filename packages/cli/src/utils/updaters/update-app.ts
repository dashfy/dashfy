import type { SourceFile } from 'ts-morph'
import { Project, QuoteKind, SyntaxKind } from 'ts-morph'

export interface UpdateAppOptions {
  /** Path to the app file (e.g. src/App.tsx). */
  appFile: string
  /** Extension id used as the WidgetRegistry namespace (e.g. "github"). */
  extensionKey: string
  /** Package to import widgets from (e.g. "@getdashfy/ext-github"). */
  widgetPackage: string
  /** Widget component names to register. */
  widgets: string[]
}

export type UpdateResult = 'added' | 'skipped'

/** Result of a reverse (remove) updater step. */
export type RemoveResult = 'removed' | 'skipped'

/**
 * Adds widget imports and a `WidgetRegistry.addExtension('<id>', { ... })` call
 * to the app file. Idempotent: skips if the extension is already registered.
 */
export async function updateApp(options: UpdateAppOptions): Promise<UpdateResult> {
  const { appFile, extensionKey, widgetPackage, widgets } = options

  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
  })
  const sourceFile = project.addSourceFileAtPath(appFile)

  if (hasAddExtensionCall(sourceFile, extensionKey)) {
    return 'skipped'
  }

  ensureNamedImports(sourceFile, '@getdashfy/ui', ['WidgetRegistry'])
  ensureNamedImports(sourceFile, widgetPackage, widgets)

  const registration = `WidgetRegistry.addExtension('${extensionKey}', {\n${widgets
    .map((widget) => `  ${widget},`)
    .join('\n')}\n})`

  const insertIndex = getInsertIndexAfterImports(sourceFile)
  sourceFile.insertStatements(insertIndex, `\n${registration}\n`)

  sourceFile.formatText()
  await sourceFile.save()

  return 'added'
}

export interface RemoveFromAppOptions {
  /** Path to the app file (e.g. src/App.tsx). */
  appFile: string
  /** Extension id used as the WidgetRegistry namespace (e.g. "github"). */
  extensionKey: string
  /** Package the widgets were imported from (e.g. "@getdashfy/ext-github"). */
  widgetPackage: string
  /** Widget component names that were registered. */
  widgets: string[]
}

/**
 * Reverses {@link updateApp}: removes the `WidgetRegistry.addExtension('<id>')`
 * call, the widget imports, and the `WidgetRegistry` import when no longer used.
 * Idempotent: skips if the extension is not registered.
 */
export async function removeFromApp(options: RemoveFromAppOptions): Promise<RemoveResult> {
  const { appFile, extensionKey, widgetPackage, widgets } = options

  const project = new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
  })
  const sourceFile = project.addSourceFileAtPath(appFile)

  if (!hasAddExtensionCall(sourceFile, extensionKey)) {
    return 'skipped'
  }

  removeAddExtensionStatement(sourceFile, extensionKey)
  removeNamedImports(sourceFile, widgetPackage, widgets)

  if (!usesIdentifierMember(sourceFile, 'WidgetRegistry')) {
    removeNamedImports(sourceFile, '@getdashfy/ui', ['WidgetRegistry'])
  }

  sourceFile.formatText()
  await sourceFile.save()

  return 'removed'
}

/** Removes the statement containing the matching addExtension call. */
function removeAddExtensionStatement(sourceFile: SourceFile, extensionKey: string): void {
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (call.getExpression().getText() !== 'WidgetRegistry.addExtension') {
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

/** Removes named imports from a module, dropping the declaration if it empties. */
function removeNamedImports(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  names: string[],
): void {
  const existing = sourceFile.getImportDeclaration(
    (declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier,
  )
  if (!existing) {
    return
  }

  const toRemove = new Set(names)
  for (const named of existing.getNamedImports()) {
    if (toRemove.has(named.getName())) {
      named.remove()
    }
  }

  if (existing.getNamedImports().length === 0 && !existing.getDefaultImport()) {
    existing.remove()
  }
}

/** Whether the file still references `<identifier>.<member>` anywhere. */
function usesIdentifierMember(sourceFile: SourceFile, identifier: string): boolean {
  return sourceFile
    .getDescendantsOfKind(SyntaxKind.PropertyAccessExpression)
    .some((access) => access.getExpression().getText() === identifier)
}

function hasAddExtensionCall(sourceFile: SourceFile, extensionKey: string): boolean {
  return sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression).some((call) => {
    const expression = call.getExpression().getText()
    if (expression !== 'WidgetRegistry.addExtension') {
      return false
    }
    const firstArg = call.getArguments()[0]
    return firstArg?.getText().replace(/['"]/g, '') === extensionKey
  })
}

function ensureNamedImports(
  sourceFile: SourceFile,
  moduleSpecifier: string,
  names: string[],
): void {
  const existing = sourceFile.getImportDeclaration(
    (declaration) => declaration.getModuleSpecifierValue() === moduleSpecifier,
  )

  if (!existing) {
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports: names.map((name) => ({ name })),
    })
    return
  }

  const alreadyImported = new Set(existing.getNamedImports().map((named) => named.getName()))
  const missing = names.filter((name) => !alreadyImported.has(name))
  if (missing.length > 0) {
    existing.addNamedImports(missing.map((name) => ({ name })))
  }
}

function getInsertIndexAfterImports(sourceFile: SourceFile): number {
  const statements = sourceFile.getStatements()
  let index = 0
  for (const statement of statements) {
    if (statement.getKind() === SyntaxKind.ImportDeclaration) {
      index = statement.getChildIndex() + 1
    }
  }
  return index
}
