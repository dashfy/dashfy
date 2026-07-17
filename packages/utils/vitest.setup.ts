import { beforeAll } from 'vitest'

import { setDefaultLocale } from './src/format/core'

beforeAll(() => {
  // Set NODE_ENV to 'test' to ensure consistent test behavior
  process.env.NODE_ENV = 'test'

  // Set default locale to 'en-US' to ensure consistent test behavior
  setDefaultLocale('en-US')
})
