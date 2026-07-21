import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { findUnknownTypes, searchRegistries } from '@/registry/search'
import type { RegistryConfig } from '@/schema'
import { buildLocalRegistry, localRegistries } from '@/test/local-registry'

let registries: RegistryConfig

beforeAll(async () => {
  const dir = await buildLocalRegistry()
  registries = localRegistries(dir)
})

afterAll(() => {
  delete process.env.DASHFY_REGISTRY_URL
})

describe('findUnknownTypes', () => {
  it('flags types outside the searchable set', () => {
    expect(findUnknownTypes(['registry:extension'])).toEqual([])
    expect(findUnknownTypes(['ui', 'block'])).toEqual(['ui', 'block'])
  })
})

describe('searchRegistries', () => {
  it('returns all items for a registry with no query', async () => {
    const { results } = await searchRegistries(['@getdashfy'], { registries })
    expect(results).toHaveLength(1)
    expect(results[0]?.registry).toBe('@getdashfy')
    expect(results[0]?.items.length ?? 0).toBeGreaterThan(0)
  })

  it('filters items by query', async () => {
    const { results } = await searchRegistries(['@getdashfy'], { registries, query: 'github' })
    const names = results[0]?.items.map((item) => item.name) ?? []
    expect(names).toContain('github')
    expect(names).not.toContain('nba')
  })

  it('applies limit and offset', async () => {
    const all = await searchRegistries(['@getdashfy'], { registries })
    const total = all.results[0]?.items.length ?? 0
    expect(total).toBeGreaterThan(1)

    const limited = await searchRegistries(['@getdashfy'], { registries, limit: 1 })
    expect(limited.results[0]?.items).toHaveLength(1)

    const offset = await searchRegistries(['@getdashfy'], { registries, offset: 1 })
    expect(offset.results[0]?.items.length).toBe(total - 1)
  })

  it('reports total matches before offset/limit slicing', async () => {
    const all = await searchRegistries(['@getdashfy'], { registries })
    const total = all.results[0]?.total ?? 0
    expect(total).toBeGreaterThan(1)

    const limited = await searchRegistries(['@getdashfy'], { registries, limit: 1 })
    expect(limited.results[0]?.items).toHaveLength(1)
    expect(limited.results[0]?.total).toBe(total)
  })

  it('fuzzy-ranks the closest match first', async () => {
    const { results } = await searchRegistries(['@getdashfy'], { registries, query: 'github' })
    expect(results[0]?.items[0]?.name).toBe('github')
  })

  it('collects per-registry errors when continueOnError is set', async () => {
    const { results, errors } = await searchRegistries(['@getdashfy', '@missing'], {
      registries,
      continueOnError: true,
    })
    expect(results.some((group) => group.registry === '@getdashfy')).toBe(true)
    expect(errors?.some((failure) => failure.registry === '@missing')).toBe(true)
  })

  it('throws on a bad registry when continueOnError is not set', async () => {
    await expect(searchRegistries(['@missing'], { registries })).rejects.toThrow()
  })
})
