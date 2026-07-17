import * as dateFns from 'date-fns'

// Error
export { getErrorMessage } from './error/error'

// Format
export { formatBytes, formatBytesPerSecond } from './format/bytes'
export { getDefaultLocale, setDefaultLocale } from './format/core'
export { formatCurrency } from './format/currency'
export { formatDate } from './format/date'
export { formatRelativeTime } from './format/date'
export { formatExponential } from './format/exponential'
export { format } from './format/format'
export { formatList } from './format/list'
export { formatNumber } from './format/number'
export { formatOrdinal } from './format/ordinal'
export { formatPercent } from './format/percent'
export { formatTemperature } from './format/temperature'
export { formatTime, formatTimeCompact } from './format/time'
export type { BaseFormatOptions } from './format/types'

// Function
export { debounce } from './function/debounce'

// Libs
export { dateFns }

// Object
export { get } from './object/get'

// Platform
export { isDevelopment, isProduction, isTest } from './platform/env'
export { isMac, modKey } from './platform/os'
export { isClient, isServer } from './platform/runtime'

// String
export { stringifyValue } from './string/stringifyValue'
export { truncate } from './string/truncate'
export { valueToDisplayString } from './string/valueToDisplayString'
