import { RegistryError } from '@/registry/errors'
import { logger } from '@/utils/logger'
import { isJson } from '@/utils/output'

/**
 * Prints an error in a consistent format and exits the process. In JSON mode the
 * error is emitted as a structured object on stderr so machine consumers can
 * parse failures while stdout stays clean.
 */
export function handleError(error: unknown): never {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.'

  if (isJson()) {
    const payload: { error?: string; message: string } = { message }
    if (error instanceof RegistryError) {
      payload.error = error.code
    }
    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`)
    process.exit(1)
  }

  logger.break()
  logger.error(message)
  logger.break()
  process.exit(1)
}
