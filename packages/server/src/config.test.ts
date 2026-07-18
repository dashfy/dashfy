import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { loadConfig } from './config'

// Test fixtures directory
const TEST_DIR = join(tmpdir(), 'dashfy-config-tests')

describe('loadConfig', () => {
  beforeEach(async () => {
    // Create test directory
    await mkdir(TEST_DIR, { recursive: true })
  })

  afterEach(async () => {
    // Clean up test directory
    await rm(TEST_DIR, { recursive: true, force: true })
  })

  describe('Format Detection', () => {
    it('should detect and load JSON format (.json)', async () => {
      const configPath = join(TEST_DIR, 'config.json')
      const jsonContent = JSON.stringify({
        port: 3000,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(3000)
      expect(config.host).toBe('localhost')
    })

    it('should detect and load YAML format (.yml)', async () => {
      const configPath = join(TEST_DIR, 'config.yml')
      const yamlContent = `
port: 3000
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(3000)
      expect(config.host).toBe('localhost')
    })

    it('should detect and load YAML format (.yaml)', async () => {
      const configPath = join(TEST_DIR, 'config.yaml')
      const yamlContent = `
port: 3000
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(3000)
      expect(config.host).toBe('localhost')
    })

    it('should throw error for unsupported file format (.txt)', async () => {
      const configPath = join(TEST_DIR, 'config.txt')
      await writeFile(configPath, 'some content', 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow(
        'Unsupported configuration file format: .txt',
      )
    })

    it('should throw error for unsupported file format (.xml)', async () => {
      const configPath = join(TEST_DIR, 'config.xml')
      await writeFile(configPath, '<config></config>', 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow(
        'Unsupported configuration file format: .xml',
      )
    })

    it('should throw error for file without extension', async () => {
      const configPath = join(TEST_DIR, 'config')
      await writeFile(configPath, '{}', 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Unsupported configuration file format')
    })
  })

  describe('Valid Configuration - JSON', () => {
    it('should load and validate a valid minimal JSON config', async () => {
      const configPath = join(TEST_DIR, 'valid-minimal.json')
      const jsonContent = JSON.stringify({
        port: 3000,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(3000)
      expect(config.host).toBe('localhost')
      expect(config.dashboards).toHaveLength(1)
      expect(config.dashboards[0]!.columns).toBe(4)
      expect(config.dashboards[0]!.rows).toBe(3)
      expect(config.dashboards[0]!.widgets).toEqual([])
    })

    it('should use default values when not provided in JSON', async () => {
      const configPath = join(TEST_DIR, 'defaults.json')
      const jsonContent = JSON.stringify({
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(5001) // Default port
      expect(config.host).toBe('0.0.0.0') // Default host
    })

    it('should load JSON config with complete dashboard and widgets', async () => {
      const configPath = join(TEST_DIR, 'complete.json')
      const jsonContent = JSON.stringify({
        port: 8080,
        host: '0.0.0.0',
        rotationDuration: 10000,
        dashboards: [
          {
            title: 'Main Dashboard',
            columns: 4,
            rows: 3,
            widgets: [
              {
                extension: 'github',
                widget: 'UserBadge',
                title: 'My Profile',
                columns: 1,
                rows: 1,
                x: 0,
                y: 0,
                user: 'testuser',
              },
              {
                extension: 'time',
                widget: 'Clock',
                columns: 1,
                rows: 1,
                x: 1,
                y: 0,
                timezone: 'America/New_York',
              },
            ],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(8080)
      expect(config.host).toBe('0.0.0.0')
      expect(config.rotationDuration).toBe(10000)
      expect(config.dashboards).toHaveLength(1)
      expect(config.dashboards[0]!.title).toBe('Main Dashboard')
      expect(config.dashboards[0]!.widgets).toHaveLength(2)

      // Check first widget
      const widget1 = config.dashboards[0]!.widgets[0]!
      expect(widget1.extension).toBe('github')
      expect(widget1.widget).toBe('UserBadge')
      expect(widget1.title).toBe('My Profile')
      expect(widget1.columns).toBe(1)
      expect(widget1.rows).toBe(1)
      expect(widget1.x).toBe(0)
      expect(widget1.y).toBe(0)
      expect((widget1 as any).user).toBe('testuser')

      // Check second widget
      const widget2 = config.dashboards[0]!.widgets[1]!
      expect(widget2.extension).toBe('time')
      expect(widget2.widget).toBe('Clock')
      expect((widget2 as any).timezone).toBe('America/New_York')
    })

    it('should load JSON config with multiple dashboards', async () => {
      const configPath = join(TEST_DIR, 'multiple-dashboards.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
        dashboards: [
          {
            title: 'Dashboard 1',
            columns: 4,
            rows: 3,
            widgets: [],
          },
          {
            title: 'Dashboard 2',
            columns: 3,
            rows: 2,
            widgets: [],
          },
          {
            title: 'Dashboard 3',
            columns: 5,
            rows: 4,
            widgets: [],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards).toHaveLength(3)
      expect(config.dashboards[0]!.title).toBe('Dashboard 1')
      expect(config.dashboards[1]!.title).toBe('Dashboard 2')
      expect(config.dashboards[2]!.title).toBe('Dashboard 3')
    })

    it('should load JSON config with APIs configuration', async () => {
      const configPath = join(TEST_DIR, 'with-apis.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [],
          },
        ],
        apis: {
          pollInterval: 15000,
          github: {
            token: 'abc123',
          },
          travis: {
            token: 'xyz789',
          },
        },
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.apis).toBeDefined()
      expect(config.apis?.pollInterval).toBe(15000)
      expect((config.apis as any)?.github?.token).toBe('abc123')
      expect((config.apis as any)?.travis?.token).toBe('xyz789')
    })

    it('should throw error for invalid JSON syntax', async () => {
      const configPath = join(TEST_DIR, 'invalid-json.json')
      const jsonContent = `{
        "port": 5001,
        "host": "localhost",
        "dashboards": [
          {
            "columns": 4,
            "rows": 3,
            "widgets": []
          }
        }
      ` // Missing closing brace
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Failed to parse JSON content')
    })

    it('should throw error for empty JSON file', async () => {
      const configPath = join(TEST_DIR, 'empty.json')
      await writeFile(configPath, '', 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow()
    })

    it('should preserve extension-specific properties in JSON', async () => {
      const configPath = join(TEST_DIR, 'custom-props.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [
              {
                extension: 'github',
                widget: 'UserBadge',
                columns: 1,
                rows: 1,
                x: 0,
                y: 0,
                customProp1: 'value1',
                customProp2: 123,
                customProp3: {
                  nested: true,
                  value: 'nested',
                },
              },
            ],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      const config = await loadConfig(configPath)
      const widget = config.dashboards[0]!.widgets[0]! as any

      expect(widget.customProp1).toBe('value1')
      expect(widget.customProp2).toBe(123)
      expect(widget.customProp3.nested).toBe(true)
      expect(widget.customProp3.value).toBe('nested')
    })
  })

  describe('Valid Configuration - YAML', () => {
    it('should load and validate a valid minimal config', async () => {
      const configPath = join(TEST_DIR, 'valid-minimal.yml')
      const yamlContent = `
port: 3000
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(3000)
      expect(config.host).toBe('localhost')
      expect(config.dashboards).toHaveLength(1)
      expect(config.dashboards[0]!.columns).toBe(4)
      expect(config.dashboards[0]!.rows).toBe(3)
      expect(config.dashboards[0]!.widgets).toEqual([])
    })

    it('should use default values when not provided', async () => {
      const configPath = join(TEST_DIR, 'defaults.yml')
      const yamlContent = `
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(5001) // Default port
      expect(config.host).toBe('0.0.0.0') // Default host
    })

    it('should load config with complete dashboard and widgets', async () => {
      const configPath = join(TEST_DIR, 'complete.yml')
      const yamlContent = `
port: 8080
host: 0.0.0.0
rotationDuration: 10000
dashboards:
  - title: Main Dashboard
    columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: UserBadge
        title: My Profile
        columns: 1
        rows: 1
        x: 0
        y: 0
        user: testuser
      - extension: time
        widget: Clock
        columns: 1
        rows: 1
        x: 1
        y: 0
        timezone: America/New_York
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.port).toBe(8080)
      expect(config.host).toBe('0.0.0.0')
      expect(config.rotationDuration).toBe(10000)
      expect(config.dashboards).toHaveLength(1)
      expect(config.dashboards[0]!.title).toBe('Main Dashboard')
      expect(config.dashboards[0]!.widgets).toHaveLength(2)

      // Check first widget
      const widget1 = config.dashboards[0]!.widgets[0]!
      expect(widget1.extension).toBe('github')
      expect(widget1.widget).toBe('UserBadge')
      expect(widget1.title).toBe('My Profile')
      expect(widget1.columns).toBe(1)
      expect(widget1.rows).toBe(1)
      expect(widget1.x).toBe(0)
      expect(widget1.y).toBe(0)
      expect((widget1 as any).user).toBe('testuser') // Extension-specific property

      // Check second widget
      const widget2 = config.dashboards[0]!.widgets[1]!
      expect(widget2.extension).toBe('time')
      expect(widget2.widget).toBe('Clock')
      expect((widget2 as any).timezone).toBe('America/New_York')
    })

    it('should load config with multiple dashboards', async () => {
      const configPath = join(TEST_DIR, 'multiple-dashboards.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - title: Dashboard 1
    columns: 4
    rows: 3
    widgets: []
  - title: Dashboard 2
    columns: 3
    rows: 2
    widgets: []
  - title: Dashboard 3
    columns: 5
    rows: 4
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards).toHaveLength(3)
      expect(config.dashboards[0]!.title).toBe('Dashboard 1')
      expect(config.dashboards[1]!.title).toBe('Dashboard 2')
      expect(config.dashboards[2]!.title).toBe('Dashboard 3')
    })

    it('should load config with APIs configuration', async () => {
      const configPath = join(TEST_DIR, 'with-apis.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
apis:
  pollInterval: 15000
  github:
    token: abc123
  travis:
    token: xyz789
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.apis).toBeDefined()
      expect(config.apis?.pollInterval).toBe(15000)
      expect((config.apis as any)?.github?.token).toBe('abc123')
      expect((config.apis as any)?.travis?.token).toBe('xyz789')
    })

    it('should allow widgets without optional title', async () => {
      const configPath = join(TEST_DIR, 'widget-no-title.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: UserBadge
        columns: 1
        rows: 1
        x: 0
        y: 0
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards[0]!.widgets[0]!.title).toBeUndefined()
    })

    it('should allow dashboards without optional title', async () => {
      const configPath = join(TEST_DIR, 'dashboard-no-title.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards[0]!.title).toBeUndefined()
    })

    it('should allow config without optional rotationDuration', async () => {
      const configPath = join(TEST_DIR, 'no-rotation.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.rotationDuration).toBeUndefined()
    })

    it('should allow config without optional apis', async () => {
      const configPath = join(TEST_DIR, 'no-apis.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.apis).toBeUndefined()
    })
  })

  describe('Invalid Configuration - YAML', () => {
    it('should throw error for missing dashboards', async () => {
      const configPath = join(TEST_DIR, 'no-dashboards.yml')
      const yamlContent = `
port: 5001
host: localhost
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for empty dashboards array', async () => {
      const configPath = join(TEST_DIR, 'empty-dashboards.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid port (negative)', async () => {
      const configPath = join(TEST_DIR, 'invalid-port-negative.yml')
      const yamlContent = `
port: -1
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid port (zero)', async () => {
      const configPath = join(TEST_DIR, 'invalid-port-zero.yml')
      const yamlContent = `
port: 0
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid port (non-number)', async () => {
      const configPath = join(TEST_DIR, 'invalid-port-string.yml')
      const yamlContent = `
port: "5001"
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for missing dashboard columns', async () => {
      const configPath = join(TEST_DIR, 'no-columns.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for missing dashboard rows', async () => {
      const configPath = join(TEST_DIR, 'no-rows.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for missing dashboard widgets', async () => {
      const configPath = join(TEST_DIR, 'no-widgets.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid dashboard columns (zero)', async () => {
      const configPath = join(TEST_DIR, 'zero-columns.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 0
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid dashboard rows (negative)', async () => {
      const configPath = join(TEST_DIR, 'negative-rows.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: -1
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for missing widget extension', async () => {
      const configPath = join(TEST_DIR, 'no-extension.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - widget: UserBadge
        columns: 1
        rows: 1
        x: 0
        y: 0
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for missing widget name', async () => {
      const configPath = join(TEST_DIR, 'no-widget-name.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - extension: github
        columns: 1
        rows: 1
        x: 0
        y: 0
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for negative widget x position', async () => {
      const configPath = join(TEST_DIR, 'negative-x.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: UserBadge
        columns: 1
        rows: 1
        x: -1
        y: 0
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for negative widget y position', async () => {
      const configPath = join(TEST_DIR, 'negative-y.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: UserBadge
        columns: 1
        rows: 1
        x: 0
        y: -1
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid widget columns (zero)', async () => {
      const configPath = join(TEST_DIR, 'widget-zero-columns.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: UserBadge
        columns: 0
        rows: 1
        x: 0
        y: 0
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid rotationDuration (negative)', async () => {
      const configPath = join(TEST_DIR, 'negative-rotation.yml')
      const yamlContent = `
port: 5001
host: localhost
rotationDuration: -1000
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid rotationDuration (zero)', async () => {
      const configPath = join(TEST_DIR, 'zero-rotation.yml')
      const yamlContent = `
port: 5001
host: localhost
rotationDuration: 0
dashboards:
  - columns: 4
    rows: 3
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid APIs pollInterval (negative)', async () => {
      const configPath = join(TEST_DIR, 'negative-poll.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
apis:
  pollInterval: -5000
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid YAML syntax', async () => {
      const configPath = join(TEST_DIR, 'invalid-yaml.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: [
      - extension: github
`
      await writeFile(configPath, yamlContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Failed to parse YAML content')
    })
  })

  describe('Invalid Configuration - JSON', () => {
    it('should throw error for missing dashboards in JSON', async () => {
      const configPath = join(TEST_DIR, 'no-dashboards.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for empty dashboards array in JSON', async () => {
      const configPath = join(TEST_DIR, 'empty-dashboards.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
        dashboards: [],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid port in JSON (negative)', async () => {
      const configPath = join(TEST_DIR, 'invalid-port.json')
      const jsonContent = JSON.stringify({
        port: -1,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for invalid port type in JSON (string)', async () => {
      const configPath = join(TEST_DIR, 'invalid-port-type.json')
      const jsonContent = `{
        "port": "5001",
        "host": "localhost",
        "dashboards": [
          {
            "columns": 4,
            "rows": 3,
            "widgets": []
          }
        ]
      }`
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for missing widget extension in JSON', async () => {
      const configPath = join(TEST_DIR, 'no-extension.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [
              {
                widget: 'UserBadge',
                columns: 1,
                rows: 1,
                x: 0,
                y: 0,
              },
            ],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for negative widget position in JSON', async () => {
      const configPath = join(TEST_DIR, 'negative-position.json')
      const jsonContent = JSON.stringify({
        port: 5001,
        host: 'localhost',
        dashboards: [
          {
            columns: 4,
            rows: 3,
            widgets: [
              {
                extension: 'github',
                widget: 'UserBadge',
                columns: 1,
                rows: 1,
                x: -1,
                y: -1,
              },
            ],
          },
        ],
      })
      await writeFile(configPath, jsonContent, 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })
  })

  describe('File System Errors', () => {
    it('should throw error for non-existent file', async () => {
      const configPath = join(TEST_DIR, 'non-existent.yml')

      await expect(loadConfig(configPath)).rejects.toThrow('Failed to load configuration')
    })

    it('should throw error for empty file', async () => {
      const configPath = join(TEST_DIR, 'empty.yml')
      await writeFile(configPath, '', 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })

    it('should throw error for file with only whitespace', async () => {
      const configPath = join(TEST_DIR, 'whitespace.yml')
      await writeFile(configPath, '   \n\n   ', 'utf-8')

      await expect(loadConfig(configPath)).rejects.toThrow('Configuration validation failed')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very large dashboard grid', async () => {
      const configPath = join(TEST_DIR, 'large-grid.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 100
    rows: 100
    widgets: []
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards[0]!.columns).toBe(100)
      expect(config.dashboards[0]!.rows).toBe(100)
    })

    it('should handle very large widget position values', async () => {
      const configPath = join(TEST_DIR, 'large-position.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 1000
    rows: 1000
    widgets:
      - extension: test
        widget: Widget
        columns: 1
        rows: 1
        x: 999
        y: 999
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards[0]!.widgets[0]!.x).toBe(999)
      expect(config.dashboards[0]!.widgets[0]!.y).toBe(999)
    })

    it('should handle unicode characters in strings', async () => {
      const configPath = join(TEST_DIR, 'unicode.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - title: "Dashboard 📊 测试"
    columns: 4
    rows: 3
    widgets:
      - extension: test
        widget: Widget
        title: "Widget 🎨 テスト"
        columns: 1
        rows: 1
        x: 0
        y: 0
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)

      expect(config.dashboards[0]!.title).toBe('Dashboard 📊 测试')
      expect(config.dashboards[0]!.widgets[0]!.title).toBe('Widget 🎨 テスト')
    })

    it('should preserve extension-specific widget properties', async () => {
      const configPath = join(TEST_DIR, 'custom-props.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets:
      - extension: github
        widget: UserBadge
        columns: 1
        rows: 1
        x: 0
        y: 0
        customProp1: "value1"
        customProp2: 123
        customProp3:
          nested: true
          value: "nested"
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)
      const widget = config.dashboards[0]!.widgets[0]! as any

      expect(widget.customProp1).toBe('value1')
      expect(widget.customProp2).toBe(123)
      expect(widget.customProp3.nested).toBe(true)
      expect(widget.customProp3.value).toBe('nested')
    })

    it('should preserve extension-specific api properties', async () => {
      const configPath = join(TEST_DIR, 'custom-api-props.yml')
      const yamlContent = `
port: 5001
host: localhost
dashboards:
  - columns: 4
    rows: 3
    widgets: []
apis:
  pollInterval: 10000
  github:
    token: abc123
    baseUrl: "https://api.github.com"
  customApi:
    apiKey: xyz789
    timeout: 5000
`
      await writeFile(configPath, yamlContent, 'utf-8')

      const config = await loadConfig(configPath)
      const apis = config.apis as any

      expect(apis.pollInterval).toBe(10000)
      expect(apis.github.token).toBe('abc123')
      expect(apis.github.baseUrl).toBe('https://api.github.com')
      expect(apis.customApi.apiKey).toBe('xyz789')
      expect(apis.customApi.timeout).toBe(5000)
    })
  })
})
