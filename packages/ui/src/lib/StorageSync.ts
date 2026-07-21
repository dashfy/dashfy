import { isClient } from '@getdashfy/utils'

import { STORAGE_KEY } from '@/constants/storageConstants'

export interface StorageSyncOptions {
  /**
   * Namespace prefix for all keys
   * @default 'dashfy'
   */
  namespace?: string
  /**
   * Use sessionStorage instead of localStorage
   * @default false
   */
  useSession?: boolean
  /**
   * Enable basic encryption for stored values
   * @default false
   */
  encrypt?: boolean
  /**
   * Secret key used for encryption
   * @default ''
   */
  secret?: string
}

interface StoragePayload {
  value: string
  expiry: number | null
}

/**
 * Synchronous storage wrapper with namespacing, TTL, and encryption support.
 *
 * Provides a consistent API for working with localStorage/sessionStorage,
 * adding features like automatic key namespacing, expiration (TTL),
 * and optional value encryption.
 *
 * Supports:
 * - Automatic key namespacing to avoid collisions
 * - TTL (time-to-live) for automatic expiration
 * - Basic encryption for sensitive values
 * - Storage change event listeners
 * - Session or local storage backends
 *
 * @example
 * ```tsx
 * // Create a namespaced storage instance
 * const storage = new StorageSyncClass({ namespace: 'myApp' })
 *
 * // Store a value with TTL (expires in 1 hour)
 * storage.set('user', { name: 'John' }, 3600)
 *
 * // Retrieve a value
 * const user = storage.get('user')
 *
 * // Remove a value
 * storage.remove('user')
 *
 * // Clear all namespaced values
 * storage.clear()
 *
 * // With encryption
 * const secureStorage = new StorageSyncClass({
 *   namespace: 'secure',
 *   encrypt: true,
 *   secret: 'my-secret-key'
 * })
 * ```
 */
class StorageSyncClass {
  private storage: Storage | null = null
  private namespace: string
  private encrypt: boolean
  private secret: string

  constructor(options: StorageSyncOptions = {}) {
    const { namespace = '', useSession = false, encrypt = false, secret = '' } = options

    if (isClient) {
      this.storage = useSession ? sessionStorage : localStorage
    }

    this.namespace = namespace
    this.encrypt = encrypt
    this.secret = secret
  }

  /**
   * Store a value with optional TTL.
   *
   * @param key - Storage key
   * @param value - Value to store (will be JSON serialized)
   * @param ttlInSeconds - Optional TTL in seconds
   */
  public set<T>(key: string, value: T, ttlInSeconds: number | null = null): void {
    const payload: StoragePayload = {
      value: this.encryptValue(JSON.stringify(value)),
      expiry: ttlInSeconds ? Date.now() + ttlInSeconds * 1000 : null,
    }
    this.storage?.setItem(this.withNamespace(key), JSON.stringify(payload))
  }

  /**
   * Retrieve a stored value.
   *
   * @param key - Storage key
   * @returns Parsed value or null if not found/expired
   */
  public get<T>(key: string): T | null {
    const item = this.storage?.getItem(this.withNamespace(key))
    if (!item) {
      return null
    }

    try {
      const { value, expiry } = JSON.parse(item) as StoragePayload

      if (expiry && Date.now() > expiry) {
        this.remove(key)
        return null
      }

      return JSON.parse(this.decryptValue(value)) as T
    } catch {
      return null
    }
  }

  /**
   * Check if a key exists and is not expired.
   *
   * @param key - Storage key
   * @returns true if key exists and is valid
   */
  public has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Remove a single key from storage.
   *
   * @param key - Storage key to remove
   */
  public remove(key: string): void {
    this.storage?.removeItem(this.withNamespace(key))
  }

  /**
   * Clear all keys within the namespace.
   */
  public clear(): void {
    const keysToRemove: string[] = []

    for (let i = 0; i < (this.storage?.length ?? 0); i++) {
      const key = this.storage?.key(i)
      if (key && (this.namespace === '' || key.startsWith(`${this.namespace}:`))) {
        keysToRemove.push(key)
      }
    }

    keysToRemove.forEach((key) => this.storage?.removeItem(key))
  }

  /**
   * Listen for storage changes within the namespace.
   *
   * @param callback - Function called when storage changes
   * @returns Cleanup function to remove the listener
   */
  public onChange(callback: (event: StorageEvent) => void): () => void {
    const handler = (event: StorageEvent) => {
      if (event.key && this.namespace && !event.key.startsWith(`${this.namespace}:`)) {
        return
      }
      callback(event)
    }

    window.addEventListener('storage', handler)

    return () => window.removeEventListener('storage', handler)
  }

  /**
   * Get the current namespace.
   *
   * @returns Namespace string
   */
  public getNamespace(): string {
    return this.namespace
  }

  /**
   * Get count of keys within the namespace.
   *
   * @returns Number of stored keys
   */
  public get size(): number {
    let count = 0

    for (let i = 0; i < (this.storage?.length ?? 0); i++) {
      const key = this.storage?.key(i)
      if (key && (this.namespace === '' || key.startsWith(`${this.namespace}:`))) {
        count++
      }
    }

    return count
  }

  /**
   * Build a namespaced key.
   *
   * @param key - Original key
   * @returns Namespaced key
   */
  private withNamespace(key: string): string {
    return this.namespace ? `${this.namespace}:${key}` : key
  }

  /**
   * Encrypt a string value.
   *
   * @param str - String to encrypt
   * @returns Encrypted string or original if encryption disabled
   */
  private encryptValue(str: string): string {
    if (!this.encrypt || !this.secret) {
      return str
    }
    return btoa(unescape(encodeURIComponent(str + this.secret)))
  }

  /**
   * Decrypt a string value.
   *
   * @param str - String to decrypt
   * @returns Decrypted string or original if encryption disabled
   */
  private decryptValue(str: string): string {
    if (!this.encrypt || !this.secret) {
      return str
    }
    const raw = decodeURIComponent(escape(atob(str)))
    return raw.replace(this.secret, '')
  }
}

export { StorageSyncClass }

// Export singleton instance
export const StorageSync = new StorageSyncClass({ namespace: STORAGE_KEY })
