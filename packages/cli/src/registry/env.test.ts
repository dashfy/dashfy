import { afterEach, describe, expect, it } from 'vitest'

import { expandEnvVars, extractEnvVars } from '@/registry/env'

const TOKEN = 'DASHFY_TEST_TOKEN'

afterEach(() => {
  delete process.env[TOKEN]
})

describe('expandEnvVars', () => {
  it('replaces ${VAR} with the environment value', () => {
    process.env[TOKEN] = 'secret'
    expect(expandEnvVars(`Bearer \${${TOKEN}}`)).toBe('Bearer secret')
  })

  it('replaces missing variables with an empty string', () => {
    expect(expandEnvVars(`Bearer \${${TOKEN}}`)).toBe('Bearer ')
  })
})

describe('extractEnvVars', () => {
  it('collects all placeholder names', () => {
    expect(extractEnvVars('${A}/${B}/static/${A}')).toEqual(['A', 'B', 'A'])
  })

  it('returns an empty array when there are no placeholders', () => {
    expect(extractEnvVars('https://example.com/r/{name}.json')).toEqual([])
  })
})
