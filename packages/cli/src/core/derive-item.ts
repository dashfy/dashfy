import type { SourceFile } from 'ts-morph'
import { Project, QuoteKind, SyntaxKind } from 'ts-morph'

import type { ExtensionClient, RegistryItem } from '@/schema'
import type { DashfyProject } from '@/utils/preflight'

/**
 * Reconstructs a minimal {@link RegistryItem} for an extension by parsing the
 * project, used as an offline fallback when the registry cannot be reached.
 *
 * It reads the widget registration from the app file (widgets + package) and the
 * server registration (client factory + import), keyed by the extension id
 * derived from the address. Returns `null` when the extension is not set up in
 * the app, since there is then nothing to remove. Env vars cannot be derived
 * offline, so they are left untouched by callers.
 */
export function deriveItemFromProject(
  project: DashfyProject,
  address: string,
): RegistryItem | null {
  const extensionKey = extensionKeyFromAddress(address)

  const tsProject = createTsProject()
  const app = tsProject.addSourceFileAtPath(project.appFile)

  const widgetInfo = findWidgetRegistration(app, extensionKey)
  if (!widgetInfo) {
    return null
  }

  let client: ExtensionClient | undefined
  if (project.serverFile) {
    const serverFile = tsProject.addSourceFileAtPath(project.serverFile)
    client = findClientRegistration(serverFile, extensionKey)
  }

  return {
    name: address,
    type: 'registry:extension',
    title: extensionKey,
    dependencies: widgetInfo.widgetPackage ? [widgetInfo.widgetPackage] : [],
    envVars: [],
    meta: {
      extensionKey,
      widgets: widgetInfo.widgets,
      client,
      // Sentinel so the (extension-keyed) config removal step runs; the value is
      // not used by removeFromConfig.
      starter: [{ widget: '__derived__' }],
    },
  }
}

/** Derives the extension id from an address (last path segment, sans ref). */
export function extensionKeyFromAddress(address: string): string {
  const withoutRef = address.split('#')[0] ?? address
  const trimmed = withoutRef.replace(/\.json$/i, '')
  const segments = trimmed.split('/').filter(Boolean)
  return segments[segments.length - 1] ?? trimmed
}

/** Shared ts-morph project factory using the repo's single-quote convention. */
function createTsProject(): Project {
  return new Project({
    manipulationSettings: { quoteKind: QuoteKind.Single },
  })
}

/**
 * Returns true when the app file registers the given extension key via
 * `WidgetRegistry.addExtension('<key>', ...)`. Used by `dashfy doctor` to verify
 * widget setup without reconstructing the whole item.
 */
export function isExtensionSetupInApp(project: DashfyProject, extensionKey: string): boolean {
  const tsProject = createTsProject()
  const app = tsProject.addSourceFileAtPath(project.appFile)
  return findWidgetRegistration(app, extensionKey) !== null
}

/**
 * Returns true when the server file registers the given extension key via
 * `dashfy.registerApi('<key>', ...)`. Returns false when there is no server file.
 */
export function isApiSetupInServer(project: DashfyProject, extensionKey: string): boolean {
  if (!project.serverFile) {
    return false
  }
  const tsProject = createTsProject()
  const server = tsProject.addSourceFileAtPath(project.serverFile)
  return findClientRegistration(server, extensionKey) !== undefined
}

interface WidgetRegistration {
  widgets: string[]
  widgetPackage?: string
}

function findWidgetRegistration(
  sourceFile: SourceFile,
  extensionKey: string,
): WidgetRegistration | null {
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (call.getExpression().getText() !== 'WidgetRegistry.addExtension') {
      continue
    }
    const firstArg = call.getArguments()[0]
    if (firstArg?.getText().replace(/['"]/g, '') !== extensionKey) {
      continue
    }

    const objectArg = call.getArguments()[1]
    const widgets = objectArg
      ? (objectArg
          .asKind(SyntaxKind.ObjectLiteralExpression)
          ?.getProperties()
          .map((property) => property.getFirstChild()?.getText() ?? property.getText().trim())
          .filter((name): name is string => Boolean(name)) ?? [])
      : []

    const widgetPackage = widgets[0] ? findImportModuleFor(sourceFile, widgets[0]) : undefined

    return { widgets, widgetPackage }
  }
  return null
}

function findClientRegistration(
  sourceFile: SourceFile,
  extensionKey: string,
): ExtensionClient | undefined {
  for (const call of sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression)) {
    if (!call.getExpression().getText().endsWith('.registerApi')) {
      continue
    }
    const args = call.getArguments()
    if (args[0]?.getText().replace(/['"]/g, '') !== extensionKey) {
      continue
    }

    const factoryCall = args[1]?.asKind(SyntaxKind.CallExpression)
    const factory = factoryCall?.getExpression().getText()
    if (!factory) {
      return undefined
    }

    const importModule = findImportModuleFor(sourceFile, factory)
    if (!importModule) {
      return undefined
    }

    const mode = args[2]?.getText().replace(/['"]/g, '') === 'push' ? 'push' : 'poll'
    return { import: importModule, factory, mode }
  }
  return undefined
}

/** Finds the module specifier that a named import comes from. */
function findImportModuleFor(sourceFile: SourceFile, name: string): string | undefined {
  for (const declaration of sourceFile.getImportDeclarations()) {
    if (declaration.getNamedImports().some((named) => named.getName() === name)) {
      return declaration.getModuleSpecifierValue()
    }
  }
  return undefined
}
