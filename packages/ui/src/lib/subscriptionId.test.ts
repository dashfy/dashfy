import { describe, expect, it } from 'vitest'

import { createSubscriptionId, serializeParams } from './subscriptionId'

describe('serializeParams', () => {
  it('should return empty string for empty params', () => {
    expect(serializeParams({})).toBe('')
  })

  it('should return key=value for single string param', () => {
    expect(serializeParams({ url: 'https://example.com' })).toBe('url=https://example.com')
  })

  it('should return key=value for single number param', () => {
    expect(serializeParams({ id: 123 })).toBe('id=123')
  })

  it('should stringify multiple params', () => {
    const result = serializeParams({ user: { name: 'John', age: 30 } })
    expect(result).toBe('user={"name":"John","age":30}')
  })

  it('should generate different results for different params', () => {
    const result1 = serializeParams({ a: 1, b: 2 })
    const result2 = serializeParams({ a: 1, b: 3 })
    expect(result1).not.toBe(result2)
    expect(result1).toBe('a=1.b=2')
    expect(result2).toBe('a=1.b=3')
  })
})

describe('createSubscriptionId', () => {
  it('should create ID without params', () => {
    expect(createSubscriptionId('demo', 'getCounter')).toBe('demo.getCounter')
  })

  it('should create ID with empty params', () => {
    expect(createSubscriptionId('demo', 'getCounter', {})).toBe('demo.getCounter')
  })

  it('should create ID with single simple param', () => {
    expect(createSubscriptionId('json', 'get', { url: 'https://api.com/data' })).toBe(
      'json.get.url=https://api.com/data',
    )
  })

  it('should create ID with multiple params', () => {
    const id = createSubscriptionId('github', 'repos', { user: 'john', sort: 'stars', limit: 10 })
    expect(id).toBe('github.repos.user=john.sort=stars.limit=10')
  })

  it('should create different IDs for different params', () => {
    const id1 = createSubscriptionId('api', 'method', { value: 1 })
    const id2 = createSubscriptionId('api', 'method', { value: 2 })
    expect(id1).not.toBe(id2)
    expect(id1).toBe('api.method.value=1')
    expect(id2).toBe('api.method.value=2')
  })

  it('should handle real-world examples', () => {
    // Demo counter - no params
    expect(createSubscriptionId('demo', 'getCounter')).toBe('demo.getCounter')

    // Demo data - empty params
    expect(createSubscriptionId('demo', 'getData', {})).toBe('demo.getData')

    // JSON with URL
    expect(
      createSubscriptionId('json', 'get', {
        url: 'https://jsonplaceholder.typicode.com/users/1',
      }),
    ).toBe('json.get.url=https://jsonplaceholder.typicode.com/users/1')

    // JSON status with URL
    expect(
      createSubscriptionId('json', 'status', {
        url: 'https://jsonplaceholder.typicode.com/posts/1',
      }),
    ).toBe('json.status.url=https://jsonplaceholder.typicode.com/posts/1')
  })
})
