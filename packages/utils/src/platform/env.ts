/** Check if the code is running in development mode. */
export const isDevelopment = process.env.NODE_ENV === 'development'

/** Check if the code is running in production mode. */
export const isProduction = process.env.NODE_ENV === 'production'

/** Check if the code is running in test mode. */
export const isTest = process.env.NODE_ENV === 'test'
