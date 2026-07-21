import { z } from 'zod'

/** Stable, machine-readable codes for programmatic error handling. */
export const RegistryErrorCode = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  GONE: 'GONE',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  FETCH_ERROR: 'FETCH_ERROR',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
  INVALID_CONFIG: 'INVALID_CONFIG',
  MISSING_ENV_VARS: 'MISSING_ENV_VARS',
  LOCAL_FILE_ERROR: 'LOCAL_FILE_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

export type RegistryErrorCode = (typeof RegistryErrorCode)[keyof typeof RegistryErrorCode]

interface RegistryErrorOptions {
  code?: RegistryErrorCode
  statusCode?: number
  cause?: unknown
  context?: Record<string, unknown>
  suggestion?: string
}

export class RegistryError extends Error {
  public readonly code: RegistryErrorCode
  public readonly statusCode?: number
  public readonly context?: Record<string, unknown>
  public readonly suggestion?: string

  constructor(message: string, options: RegistryErrorOptions = {}) {
    super(message)
    this.name = 'RegistryError'
    this.code = options.code ?? RegistryErrorCode.UNKNOWN_ERROR
    this.statusCode = options.statusCode
    this.cause = options.cause
    this.context = options.context
    this.suggestion = options.suggestion

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export class RegistryNotFoundError extends RegistryError {
  constructor(
    public readonly url: string,
    cause?: unknown,
  ) {
    super(`The item at ${url} was not found. It may not exist at the registry.`, {
      code: RegistryErrorCode.NOT_FOUND,
      statusCode: 404,
      cause,
      context: { url },
      suggestion: 'Check that the item name is correct and the registry URL is accessible.',
    })
    this.name = 'RegistryNotFoundError'
  }
}

export class RegistryUnauthorizedError extends RegistryError {
  constructor(
    public readonly url: string,
    cause?: unknown,
  ) {
    super(`You are not authorized to access ${url}. You may need to authenticate.`, {
      code: RegistryErrorCode.UNAUTHORIZED,
      statusCode: 401,
      cause,
      context: { url },
      suggestion: 'Check your authentication credentials and environment variables.',
    })
    this.name = 'RegistryUnauthorizedError'
  }
}

export class RegistryForbiddenError extends RegistryError {
  constructor(
    public readonly url: string,
    cause?: unknown,
  ) {
    super(`Access to ${url} is forbidden. You may need to authenticate.`, {
      code: RegistryErrorCode.FORBIDDEN,
      statusCode: 403,
      cause,
      context: { url },
      suggestion: 'Check your authentication credentials and environment variables.',
    })
    this.name = 'RegistryForbiddenError'
  }
}

export class RegistryFetchError extends RegistryError {
  constructor(
    public readonly url: string,
    statusCode?: number,
    cause?: unknown,
  ) {
    const base = statusCode
      ? `Failed to fetch from registry (${statusCode}): ${url}`
      : `Failed to fetch from registry: ${url}`
    const message = typeof cause === 'string' && cause ? `${base} - ${cause}` : base

    super(message, {
      code: RegistryErrorCode.FETCH_ERROR,
      statusCode,
      cause,
      context: { url },
      suggestion: 'Check your network connection and try again.',
    })
    this.name = 'RegistryFetchError'
  }
}

export class RegistryNotConfiguredError extends RegistryError {
  constructor(public readonly registryName: string | null) {
    const message = registryName
      ? `Unknown registry "${registryName}". Define it in dashfy.json:\n{\n  "registries": {\n    "${registryName}": "[URL_TO_REGISTRY]"\n  }\n}`
      : 'Unknown registry. Define it in dashfy.json under "registries".'

    super(message, {
      code: RegistryErrorCode.NOT_CONFIGURED,
      context: { registryName },
      suggestion: 'Add the registry configuration to your dashfy.json file.',
    })
    this.name = 'RegistryNotConfiguredError'
  }
}

export class RegistryLocalFileError extends RegistryError {
  constructor(
    public readonly filePath: string,
    cause?: unknown,
  ) {
    super(`Failed to read local registry file: ${filePath}`, {
      code: RegistryErrorCode.LOCAL_FILE_ERROR,
      cause,
      context: { filePath },
      suggestion: 'Check that the file exists and you have read permissions.',
    })
    this.name = 'RegistryLocalFileError'
  }
}

export class RegistryParseError extends RegistryError {
  constructor(
    public readonly item: string,
    parseError: unknown,
    options: { subject?: string } = {},
  ) {
    const subject = options.subject ?? 'registry item'
    let message = `Failed to parse ${subject}: ${item}`

    if (parseError instanceof z.ZodError) {
      message = `Failed to parse ${subject}: ${item}\n${parseError.errors
        .map((error) => `  - ${error.path.join('.')}: ${error.message}`)
        .join('\n')}`
    }

    super(message, {
      code: RegistryErrorCode.PARSE_ERROR,
      cause: parseError,
      context: { item },
      suggestion: 'The registry item may be corrupted or have an invalid format.',
    })
    this.name = 'RegistryParseError'
  }
}

export class RegistryValidationError extends RegistryError {
  constructor(message: string, options: { cause?: unknown; suggestion?: string } = {}) {
    super(message, {
      code: RegistryErrorCode.VALIDATION_ERROR,
      cause: options.cause,
      suggestion: options.suggestion ?? 'Fix the registry definition and try again.',
    })
    this.name = 'RegistryValidationError'
  }
}

export class RegistryItemNotFoundError extends RegistryError {
  constructor(public readonly itemName: string) {
    super(`Registry item "${itemName}" was not found.`, {
      code: RegistryErrorCode.NOT_FOUND,
      statusCode: 404,
      context: { itemName },
      suggestion: 'Check that the item name exists in the resolved registry catalog.',
    })
    this.name = 'RegistryItemNotFoundError'
  }
}

export class RegistryInvalidNamespaceError extends RegistryError {
  constructor(public readonly registryName: string) {
    super(
      `Invalid registry namespace: "${registryName}". Names must start with @ (e.g., @getdashfy, @acme).`,
      {
        code: RegistryErrorCode.VALIDATION_ERROR,
        context: { registryName },
        suggestion: 'Use a valid @-prefixed namespace or a direct URL to the registry.',
      },
    )
    this.name = 'RegistryInvalidNamespaceError'
  }
}

export class RegistryMissingEnvironmentVariablesError extends RegistryError {
  constructor(
    public readonly registryName: string,
    public readonly missingVars: string[],
  ) {
    super(
      `Registry "${registryName}" requires the following environment variables:\n\n${missingVars
        .map((value) => `  - ${value}`)
        .join('\n')}`,
      {
        code: RegistryErrorCode.MISSING_ENV_VARS,
        context: { registryName, missingVars },
        suggestion: 'Set the required environment variables in your .env file.',
      },
    )
    this.name = 'RegistryMissingEnvironmentVariablesError'
  }
}

export class ConfigParseError extends RegistryError {
  constructor(
    public readonly cwd: string,
    parseError: unknown,
  ) {
    let message = `Invalid dashfy.json configuration in ${cwd}.`

    if (parseError instanceof z.ZodError) {
      message = `Invalid dashfy.json configuration in ${cwd}:\n${parseError.errors
        .map((error) => `  - ${error.path.join('.')}: ${error.message}`)
        .join('\n')}`
    }

    super(message, {
      code: RegistryErrorCode.INVALID_CONFIG,
      cause: parseError,
      context: { cwd },
      suggestion: 'Check your dashfy.json for syntax errors or invalid configuration.',
    })
    this.name = 'ConfigParseError'
  }
}
