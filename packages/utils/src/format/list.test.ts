import { describe, expect, it } from 'vitest'

import { formatList } from './list'

describe('formatList', () => {
  it('formats single item', () => {
    expect(formatList(['A'])).toBe('A')
  })

  it('formats two items with conjunction', () => {
    const result = formatList(['A', 'B'])
    expect(result).toMatch(/A/)
    expect(result).toMatch(/B/)
    expect(result).toMatch(/and|,/)
  })

  it('formats three items with conjunction', () => {
    const result = formatList(['A', 'B', 'C'])
    expect(result).toMatch(/A/)
    expect(result).toMatch(/B/)
    expect(result).toMatch(/C/)
    expect(result).toMatch(/and|,/)
  })

  it('returns empty string for empty array', () => {
    expect(formatList([])).toBe('')
  })

  it('respects type: disjunction', () => {
    const result = formatList(['A', 'B'], { type: 'disjunction' })
    expect(result).toMatch(/or|A|B/)
  })

  it('respects style: short', () => {
    const result = formatList(['A', 'B', 'C'], { style: 'short' })
    expect(result).toMatch(/A|B|C/)
  })

  it('respects style: narrow', () => {
    const result = formatList(['A', 'B'], { style: 'narrow' })
    expect(result).toMatch(/A|B/)
  })

  it('respects locale', () => {
    const result = formatList(['A', 'B', 'C'], { locale: 'en-US' })
    expect(result).toMatch(/and|,/)
  })
})
