/** Check if the code is running on the client. */
export const isClient = typeof window !== 'undefined'

/** Check if the code is running on the server. */
export const isServer = typeof window === 'undefined'
