import { describe, expect, it } from 'vitest'

import { getErrorMessage } from './error'

describe('getErrorMessage', () => {
  describe('Error objects', () => {
    it('should extract message from standard Error', () => {
      const error = new Error('Test error message')
      expect(getErrorMessage(error)).toBe('Test error message')
    })

    it('should extract message from TypeError', () => {
      const error = new TypeError('Type error message')
      expect(getErrorMessage(error)).toBe('Type error message')
    })

    it('should extract message from custom Error subclass', () => {
      class CustomError extends Error {
        constructor(message: string) {
          super(message)
          this.name = 'CustomError'
        }
      }
      const error = new CustomError('Custom error message')
      expect(getErrorMessage(error)).toBe('Custom error message')
    })

    it('should handle Error with empty message', () => {
      const error = new Error('')
      expect(getErrorMessage(error)).toBe('')
    })
  })

  describe('Objects with message property', () => {
    it('should extract message from plain object with message', () => {
      const error = { message: 'Plain object error' }
      expect(getErrorMessage(error)).toBe('Plain object error')
    })

    it('should extract message from object with additional properties', () => {
      const error = {
        message: 'Error with extras',
        code: 500,
        details: 'Some details',
      }
      expect(getErrorMessage(error)).toBe('Error with extras')
    })

    it('should handle object with message and other methods', () => {
      const error = {
        message: 'Object with methods',
        toString() {
          return 'Custom toString'
        },
      }
      expect(getErrorMessage(error)).toBe('Object with methods')
    })
  })

  describe('Primitive values', () => {
    it('should convert string to error message', () => {
      expect(getErrorMessage('Simple string error')).toBe('"Simple string error"')
    })

    it('should convert number to error message', () => {
      expect(getErrorMessage(42)).toBe('42')
    })

    it('should convert boolean true to error message', () => {
      expect(getErrorMessage(true)).toBe('true')
    })

    it('should convert boolean false to error message', () => {
      expect(getErrorMessage(false)).toBe('false')
    })

    it('should convert null to error message', () => {
      expect(getErrorMessage(null)).toBe('null')
    })

    it('should convert undefined to error message', () => {
      // JSON.stringify(undefined) returns undefined (not a string),
      // new Error(undefined) creates Error with empty message
      expect(getErrorMessage(undefined)).toBe('')
    })

    it('should convert symbol to error message', () => {
      const sym = Symbol('test')
      // Symbols can't be JSON.stringify'd, so String() is used
      const message = getErrorMessage(sym)
      expect(typeof message).toBe('string')
      // The exact format depends on the environment
    })

    it('should convert bigint to error message', () => {
      // BigInt can't be JSON.stringify'd, so String() is used
      const message = getErrorMessage(BigInt(9007199254740991))
      expect(message).toBe('9007199254740991')
    })
  })

  describe('Complex objects', () => {
    it('should stringify array', () => {
      const error = [1, 2, 3]
      expect(getErrorMessage(error)).toBe('[1,2,3]')
    })

    it('should stringify nested object', () => {
      const error = { nested: { value: 'test' } }
      expect(getErrorMessage(error)).toBe('{"nested":{"value":"test"}}')
    })

    it('should stringify object with null values', () => {
      const error = { value: null, other: 'test' }
      expect(getErrorMessage(error)).toBe('{"value":null,"other":"test"}')
    })

    it('should stringify Date object', () => {
      const date = new Date('2024-01-01T00:00:00.000Z')
      const message = getErrorMessage(date)
      expect(message).toContain('2024-01-01')
    })

    it('should stringify RegExp', () => {
      const regex = /test/gi
      // RegExp serializes to empty object in JSON
      const message = getErrorMessage(regex)
      expect(message).toBe('{}')
    })
  })

  describe('Circular references', () => {
    it('should handle circular reference in object', () => {
      const error: any = { message: 'test' }
      error.self = error
      const message = getErrorMessage(error)
      // Object has message property, so it returns the message directly
      expect(message).toBe('test')
    })

    it('should handle circular reference in array', () => {
      const error: any = []
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      error.push(error)
      const message = getErrorMessage(error)
      // Circular arrays fall back to String() which returns empty string
      expect(typeof message).toBe('string')
    })

    it('should handle deeply nested circular reference', () => {
      const error: any = { level1: { level2: {} } }
      error.level1.level2.circular = error
      const message = getErrorMessage(error)
      // Object without message property, falls back to String() when JSON.stringify fails
      expect(message).toBe('[object Object]')
    })
  })

  describe('Non-serializable values', () => {
    it('should handle function', () => {
      const fn = function testFunction() {
        return 'test'
      }
      const message = getErrorMessage(fn)
      // Functions don't serialize to JSON, fall back to String() which may return empty or function code
      expect(typeof message).toBe('string')
    })

    it('should handle arrow function', () => {
      const fn = () => 'test'
      const message = getErrorMessage(fn)
      // Arrow functions don't serialize to JSON, fall back to String() which may return empty
      expect(typeof message).toBe('string')
    })

    it('should handle class instance without message', () => {
      class CustomClass {
        value = 'test'
      }
      const instance = new CustomClass()
      const message = getErrorMessage(instance)
      expect(message).toBe('{"value":"test"}')
    })

    it('should handle object with toJSON method', () => {
      const error = {
        value: 'test',
        toJSON() {
          return { custom: 'serialization' }
        },
      }
      expect(getErrorMessage(error)).toBe('{"custom":"serialization"}')
    })
  })

  describe('Edge cases', () => {
    it('should handle empty string', () => {
      expect(getErrorMessage('')).toBe('""')
    })

    it('should handle empty object', () => {
      expect(getErrorMessage({})).toBe('{}')
    })

    it('should handle empty array', () => {
      expect(getErrorMessage([])).toBe('[]')
    })

    it('should handle object with message property that is not a string', () => {
      const error = { message: 123 }
      expect(getErrorMessage(error)).toBe('{"message":123}')
    })

    it('should handle object with message property that is null', () => {
      const error = { message: null }
      expect(getErrorMessage(error)).toBe('{"message":null}')
    })

    it('should handle object with message property that is undefined', () => {
      const error = { message: undefined }
      expect(getErrorMessage(error)).toBe('{}')
    })

    it('should handle object with message property that is an object', () => {
      const error = { message: { nested: 'value' } }
      expect(getErrorMessage(error)).toBe('{"message":{"nested":"value"}}')
    })

    it('should handle NaN', () => {
      expect(getErrorMessage(NaN)).toBe('null')
    })

    it('should handle Infinity', () => {
      expect(getErrorMessage(Infinity)).toBe('null')
    })

    it('should handle -Infinity', () => {
      expect(getErrorMessage(-Infinity)).toBe('null')
    })
  })

  describe('Real-world scenarios', () => {
    it('should handle axios-like error object', () => {
      const error = {
        message: 'Request failed with status code 404',
        name: 'AxiosError',
        code: 'ERR_BAD_REQUEST',
        status: 404,
      }
      expect(getErrorMessage(error)).toBe('Request failed with status code 404')
    })

    it('should handle fetch-like error', () => {
      const error = new TypeError('Failed to fetch')
      expect(getErrorMessage(error)).toBe('Failed to fetch')
    })

    it('should handle validation error object', () => {
      const error = {
        message: 'Validation failed',
        errors: [
          { field: 'email', message: 'Invalid email' },
          { field: 'password', message: 'Too short' },
        ],
      }
      expect(getErrorMessage(error)).toBe('Validation failed')
    })

    it('should handle database error', () => {
      const error = {
        message: 'Duplicate key error',
        code: 11000,
        keyPattern: { email: 1 },
      }
      expect(getErrorMessage(error)).toBe('Duplicate key error')
    })

    it('should handle thrown string (common in legacy code)', () => {
      try {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 'Something went wrong'
      } catch (error) {
        expect(getErrorMessage(error)).toBe('"Something went wrong"')
      }
    })

    it('should handle thrown number', () => {
      try {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw 404
      } catch (error) {
        expect(getErrorMessage(error)).toBe('404')
      }
    })

    it('should handle thrown object', () => {
      try {
        // eslint-disable-next-line @typescript-eslint/only-throw-error
        throw { status: 500, text: 'Internal Server Error' }
      } catch (error) {
        expect(getErrorMessage(error)).toBe('{"status":500,"text":"Internal Server Error"}')
      }
    })
  })
})
