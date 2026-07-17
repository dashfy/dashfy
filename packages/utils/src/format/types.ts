/**
 * Base options shared across all format functions.
 */
export interface BaseFormatOptions {
  /** BCP 47 locale(s) for formatting (e.g. 'en-US', 'pt-BR') */
  locale?: string | string[]
  /** Custom output when value is 0 */
  zeroFormat?: string
  /** Custom output when value is null or undefined */
  nullFormat?: string
}

/**
 * Options for number formatting.
 */
export interface NumberFormatOptions extends BaseFormatOptions {
  /** Minimum number of decimal places */
  minimumFractionDigits?: number
  /** Maximum number of decimal places */
  maximumFractionDigits?: number
  /** Use compact notation (1K, 1.2M) */
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact'
  /** Compact display: 'short' (1K) or 'long' (1 thousand) */
  compactDisplay?: 'short' | 'long'
}

/**
 * Options for currency formatting.
 */
export interface CurrencyFormatOptions extends BaseFormatOptions {
  /** ISO 4217 currency code (e.g. 'USD', 'EUR') */
  currency?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Options for bytes formatting.
 */
export interface BytesFormatOptions extends BaseFormatOptions {
  /** Use binary units (KiB, MiB) instead of decimal (KB, MB) */
  binary?: boolean
  /** Format as bits instead of bytes */
  bits?: boolean
  /** Include +/- for positive/negative */
  signed?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Options for percentage formatting.
 */
export interface PercentFormatOptions extends BaseFormatOptions {
  /** Scale value by 100 (0.5 → 50%). Default: true */
  scaleBy100?: boolean
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Options for time/duration formatting.
 */
export interface TimeFormatOptions extends BaseFormatOptions {
  /** Include seconds in output */
  includeSeconds?: boolean
  /** Format style: 'short' (2h 30m) or 'long' (2 hours 30 minutes) */
  style?: 'short' | 'long'
}

/**
 * Options for temperature formatting.
 */
export interface TemperatureFormatOptions extends BaseFormatOptions {
  /** Temperature unit */
  unit?: 'celsius' | 'fahrenheit' | 'kelvin'
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Options for date formatting.
 */
export interface DateFormatOptions extends BaseFormatOptions {
  /** Date format pattern (date-fns tokens) */
  format?: string
  /** For relative time: add "ago" / "in" suffix */
  addSuffix?: boolean
}

/**
 * Options for list formatting.
 */
export interface ListFormatOptions extends BaseFormatOptions {
  /** Conjunction style: 'conjunction' (A, B, and C) or 'disjunction' (A, B, or C) */
  type?: 'conjunction' | 'disjunction' | 'unit'
  /** Style: 'long', 'short', or 'narrow' */
  style?: 'long' | 'short' | 'narrow'
}

/**
 * Options for ordinal formatting.
 */
export interface OrdinalFormatOptions extends BaseFormatOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Options for exponential/scientific formatting.
 */
export interface ExponentialFormatOptions extends BaseFormatOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}
