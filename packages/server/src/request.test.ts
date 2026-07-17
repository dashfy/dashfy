import type { FastifyInstance } from 'fastify'
import Fastify from 'fastify'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { request } from './request'

describe('request', () => {
  let server: FastifyInstance
  let baseUrl: string

  beforeAll(async () => {
    server = Fastify()

    // Mock endpoints
    server.get('/data', () => {
      return { message: 'Hello, World!', count: 42 }
    })

    server.post('/echo', (req) => {
      return { received: req.body }
    })

    server.get('/error', (_, reply) => {
      return reply.status(500).send({ message: 'Internal Server Error' })
    })

    server.get('/not-found', (_, reply) => {
      return reply.status(404).send({ error: 'Not found' })
    })

    server.get('/empty-error', (_, reply) => {
      return reply.status(400).send('')
    })

    await server.listen({ port: 0 })
    const address = server.addresses()[0]!
    baseUrl = `http://localhost:${address.port}`
  })

  afterAll(async () => {
    await server.close()
  })

  describe('GET requests', () => {
    it('should fetch JSON data from a URL', async () => {
      const data = await request({ url: `${baseUrl}/data` })

      expect(data).toEqual({ message: 'Hello, World!', count: 42 })
    })

    it('should throw error for 404 responses', async () => {
      await expect(request({ url: `${baseUrl}/not-found` })).rejects.toThrow('HTTP 404')
    })

    it('should throw error for 500 responses', async () => {
      await expect(request({ url: `${baseUrl}/error` })).rejects.toThrow('HTTP 500')
    })
  })

  describe('POST requests', () => {
    it('should send POST request with body', async () => {
      const data = await request({
        url: `${baseUrl}/echo`,
        method: 'POST',
        body: { name: 'Test', value: 123 },
      })

      expect(data).toEqual({ received: { name: 'Test', value: 123 } })
    })
  })

  describe('headers', () => {
    it('should include custom headers', async () => {
      // Just verify the request works with headers (server doesn't validate them)
      const data = await request({
        url: `${baseUrl}/data`,
        headers: {
          'X-Custom-Header': 'custom-value',
          Authorization: 'Bearer token123',
        },
      })

      expect(data).toEqual({ message: 'Hello, World!', count: 42 })
    })
  })

  describe('timeout', () => {
    it('should accept timeout option', async () => {
      // Just verify the option is accepted
      const data = await request({
        url: `${baseUrl}/data`,
        timeout: 5000,
      })

      expect(data).toEqual({ message: 'Hello, World!', count: 42 })
    })
  })

  describe('default values', () => {
    it('should use GET method by default', async () => {
      const data = await request({ url: `${baseUrl}/data` })
      expect(data).toBeDefined()
    })
  })

  describe('error handling edge cases', () => {
    it('should handle error when response body is empty', async () => {
      await expect(request({ url: `${baseUrl}/empty-error` })).rejects.toThrow(
        'HTTP 400: Request failed',
      )
    })
  })
})
