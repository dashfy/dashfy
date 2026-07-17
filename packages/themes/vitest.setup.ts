import { afterEach } from 'vitest'

// Clean up DOM after each test
afterEach(() => {
  // Reset document root styles and attributes
  if (typeof document !== 'undefined') {
    document.documentElement.removeAttribute('style')
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.className = ''
  }
})
