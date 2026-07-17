/**
 * Type guard and utility functions for safe error message extraction.
 *
 * TypeScript's catch blocks receive `unknown` types, not `Error` types.
 * These utilities provide type-safe ways to extract error messages from any thrown value.
 *
 * @link https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
 */

interface ErrorWithMessage {
  message: string
}

/**
 * Type guard to check if a value is an object with a string message property.
 *
 * @param error - The value to check
 * @returns True if the value has a string message property
 */
function isErrorWithMessage(error: unknown): error is ErrorWithMessage {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as Record<string, unknown>).message === 'string'
  )
}

/**
 * Converts any value to an object with a message property.
 *
 * Handles edge cases like circular references and non-serializable objects.
 *
 * @param maybeError - The value to convert
 * @returns An object with a message property
 */
function toErrorWithMessage(maybeError: unknown): ErrorWithMessage {
  if (isErrorWithMessage(maybeError)) {
    return maybeError
  }

  try {
    return new Error(JSON.stringify(maybeError))
  } catch {
    // Fallback in case there's an error stringifying the maybeError
    // like with circular references for example.
    return new Error(String(maybeError))
  }
}

/**
 * Safely extracts an error message from any thrown value.
 *
 * Use this in catch blocks to get a string message regardless of what was thrown.
 *
 * @param error - The caught error (of type unknown)
 * @returns A string error message
 *
 * @example
 * ```ts
 * try {
 *   // some code that might throw
 * } catch (error) {
 *   const message = getErrorMessage(error)
 *   console.error(message)
 * }
 * ```
 */
export function getErrorMessage(error: unknown): string {
  return toErrorWithMessage(error).message
}
