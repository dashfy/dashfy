/**
 * How a template is consumed by `dashfy init`.
 *
 * - `interactive`: a minimal base; the CLI prompts for extensions and sets
 *   them up (App.tsx / server / config / env).
 * - `asis`: a complete, pre-configured project copied verbatim (no prompts).
 */
import type { DashfyPaths } from '@/schema'

export type TemplateKind = 'interactive' | 'asis'

export interface TemplateConfig {
  /** Identifier used with `-t/--template`. */
  name: string
  title: string
  description?: string
  /** Directory name under the repo's top-level `templates/` folder. */
  templateDir: string
  defaultProjectName: string
  kind: TemplateKind
  /**
   * Framework-specific overrides for the project `paths` written to
   * `dashfy.json`. Merged over {@link DEFAULT_PATHS} during `dashfy init` so
   * codemods target the right files (e.g. Astro's `src/components/DashfyApp.tsx`).
   */
  paths?: Partial<DashfyPaths>
}

export const templates: Record<string, TemplateConfig> = {
  'vite-starter': {
    name: 'vite-starter',
    title: 'Vite Starter (minimal)',
    description: 'A minimal Dashfy app; choose which extensions to add.',
    templateDir: 'vite-starter',
    defaultProjectName: 'my-dashfy-app',
    kind: 'interactive',
  },
  'vite-app': {
    name: 'vite-app',
    title: 'Vite App (full demo)',
    description: 'A full Dashfy demo with GitHub, NBA, System and Market Live.',
    templateDir: 'vite-app',
    defaultProjectName: 'my-dashfy-app',
    kind: 'asis',
  },
  'astro-starter': {
    name: 'astro-starter',
    title: 'Astro Starter (minimal)',
    description: 'A minimal Astro + Dashfy app; choose which extensions to add.',
    templateDir: 'astro-starter',
    defaultProjectName: 'my-dashfy-app',
    kind: 'interactive',
    paths: { app: 'src/components/DashfyApp.tsx' },
  },
  'astro-app': {
    name: 'astro-app',
    title: 'Astro App (full demo)',
    description: 'A full Astro + Dashfy demo with GitHub, NBA, System and Market Live.',
    templateDir: 'astro-app',
    defaultProjectName: 'my-dashfy-app',
    kind: 'asis',
    paths: { app: 'src/components/DashfyApp.tsx' },
  },
  'next-starter': {
    name: 'next-starter',
    title: 'Next.js Starter (minimal)',
    description: 'A minimal Next.js + Dashfy app; choose which extensions to add.',
    templateDir: 'next-starter',
    defaultProjectName: 'my-dashfy-app',
    kind: 'interactive',
    paths: { app: 'components/DashfyApp.tsx' },
  },
  'next-app': {
    name: 'next-app',
    title: 'Next.js App (full demo)',
    description: 'A full Next.js + Dashfy demo with GitHub, NBA, System and Market Live.',
    templateDir: 'next-app',
    defaultProjectName: 'my-dashfy-app',
    kind: 'asis',
    paths: { app: 'components/DashfyApp.tsx' },
  },
  'react-router-starter': {
    name: 'react-router-starter',
    title: 'React Router Starter (minimal)',
    description: 'A minimal React Router + Dashfy app; choose which extensions to add.',
    templateDir: 'react-router-starter',
    defaultProjectName: 'my-dashfy-app',
    kind: 'interactive',
    paths: { app: 'app/components/DashfyApp.tsx' },
  },
  'react-router-app': {
    name: 'react-router-app',
    title: 'React Router App (full demo)',
    description: 'A full React Router + Dashfy demo with GitHub, NBA, System and Market Live.',
    templateDir: 'react-router-app',
    defaultProjectName: 'my-dashfy-app',
    kind: 'asis',
    paths: { app: 'app/components/DashfyApp.tsx' },
  },
  'start-starter': {
    name: 'start-starter',
    title: 'TanStack Start Starter (minimal)',
    description: 'A minimal TanStack Start + Dashfy app; choose which extensions to add.',
    templateDir: 'start-starter',
    defaultProjectName: 'my-dashfy-app',
    kind: 'interactive',
    paths: { app: 'src/components/DashfyApp.tsx' },
  },
  'start-app': {
    name: 'start-app',
    title: 'TanStack Start App (full demo)',
    description: 'A full TanStack Start + Dashfy demo with GitHub, NBA, System and Market Live.',
    templateDir: 'start-app',
    defaultProjectName: 'my-dashfy-app',
    kind: 'asis',
    paths: { app: 'src/components/DashfyApp.tsx' },
  },
}

export const DEFAULT_TEMPLATE = 'vite-starter'

export function getTemplate(name: string): TemplateConfig | undefined {
  return templates[name]
}

export function listTemplateNames(): string[] {
  return Object.keys(templates)
}
