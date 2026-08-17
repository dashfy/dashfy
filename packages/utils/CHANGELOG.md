# @getdashfy/utils

## 0.2.0

### Minor Changes

- Add timezone-aware date helpers: `formatDateInTimeZone`, `getTimeZoneParts`, `formatTimeZoneLabel`, `parseTimeOfDay`, and `isDaytime`, backed by `@date-fns/tz`. These support extensions (such as clock widgets) that need to format and reason about time in an arbitrary IANA timezone rather than only the local one.
- Add `timezone`/`tz` format strings to the main `format()` dispatcher, a timezone-aware counterpart to `date` that delegates to `formatDateInTimeZone` and accepts a `timeZone` option. The existing `date`/`short`/`long`/`iso` format strings remain local-time only.

## 0.1.1

### Patch Changes

- Fix npm publish by resolving workspace dependencies to semver ranges

## 0.1.0

### Initial Release

- Formatting and utility functions for the Dashfy ecosystem
- Number, currency, bytes, date, time, and string formatters
- Error, function, object, platform, and string helpers
