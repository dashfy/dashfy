import { describe, expect, it } from 'vitest'

import { getDefaultLocale, setDefaultLocale } from './core'

describe('core', () => {
  describe('setDefaultLocale', () => {
    it('sets default locale', () => {
      setDefaultLocale('en-US')
      expect(getDefaultLocale()).toBe('en-US')
    })

    it('accepts undefined to reset', () => {
      setDefaultLocale('pt-BR')
      setDefaultLocale(undefined)
      expect(getDefaultLocale()).toBeUndefined()
    })

    it('accepts array of locales', () => {
      setDefaultLocale(['en-US', 'pt-BR'])
      expect(getDefaultLocale()).toEqual(['en-US', 'pt-BR'])
      setDefaultLocale(undefined)
    })
  })

  describe('getDefaultLocale', () => {
    it('returns undefined when not set', () => {
      setDefaultLocale(undefined)
      expect(getDefaultLocale()).toBeUndefined()
    })
  })
})
