import { beforeAll } from 'vitest'

beforeAll(() => {
  // Set NODE_ENV to 'test' to ensure consistent test behavior
  process.env.NODE_ENV = 'test'

  // Set LOG_LEVEL to 'silent' to suppress Pino logger output during tests
  process.env.LOG_LEVEL = 'silent'
})
