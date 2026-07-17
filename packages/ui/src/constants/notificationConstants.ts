// Notification durations (in milliseconds)
export const NOTIFICATION_DURATION_SHORT = 2_000
export const NOTIFICATION_DURATION_MEDIUM = 4_000
export const NOTIFICATION_DURATION_LONG = 6_000
export const NOTIFICATION_DURATION_PERSIST = -1 // Never auto-dismiss

// Default durations by type
export const NOTIFICATION_DEFAULT_DURATIONS = {
  success: NOTIFICATION_DURATION_SHORT,
  info: NOTIFICATION_DURATION_MEDIUM,
  warning: NOTIFICATION_DURATION_LONG,
  error: NOTIFICATION_DURATION_PERSIST,
} as const

// Maximum notifications to show at once
export const MAX_NOTIFICATIONS = 5

// Animation durations (in milliseconds)
export const NOTIFICATION_ANIMATION_ENTER = 200
export const NOTIFICATION_ANIMATION_EXIT = 150
