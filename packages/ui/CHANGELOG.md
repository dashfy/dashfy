# @getdashfy/ui

## 0.3.0

### Minor Changes

- [#3](https://github.com/dashfy/dashfy/pull/3) [`147ffcb`](https://github.com/dashfy/dashfy/commit/147ffcbc3a4830c9b91a5d2eea7f87bfb18a19e1) Thanks [@brenopolanski](https://github.com/brenopolanski)! - Fix WebSocket reconnection giving up permanently after a short outage

  Reconnection was capped at 5 attempts with a 5s delay ceiling, so roughly 25 seconds of downtime left the dashboard dead until someone reloaded the page. A container restart or deploy routinely exceeds that. Reconnection is now unbounded, with the delay ceiling raised to 30s so long outages do not retry aggressively.

  Reconnect events were also never wired up, because Socket.IO emits them on the Manager (`socket.io`) rather than the socket. As a result `WebSocketStatus.RECONNECTING` was unreachable and the connection panel showed "Disconnected" while retries were in flight. `setupWebSocketHandlers` now accepts `onReconnect`, `onReconnectAttempt`, `onReconnectError`, and `onReconnectFailed`, registered on the Manager and removed again by `cleanupWebSocketHandlers`.

  Also fixed a related bug that made a stale "Disconnected from server" toast appear a couple of seconds _after_ "Reconnected to server". `Notifications` toasted `notifications[length - 1]` on every change to the array, and error notifications default to `ttl: -1` so they never leave the store. Once the success notification's 2s ttl removed it, the array changed and the lingering error became the newest entry again and was re-toasted. Notifications are now toasted exactly once, tracked by id.

  Other changes:
  - `onError` now listens for `connect_error` instead of `error`, which never fired on the socket in socket.io-client v4, making `WebSocketStatus.ERROR` unreachable
  - A resolved outage notification is removed from the store on reconnect, so the notifications panel no longer lists a disconnect that has since recovered
  - The debounced outage toast re-checks `socket.connected` before firing, so a late stray disconnect cannot announce an outage that already recovered
  - Outage notifications are debounced and announced at most once per episode, so brief blips and server restarts no longer toast on every disconnect and retry
  - The connection panel's Reconnect button calls `socket.connect()` instead of reloading the page, and shows the current reconnect attempt count
  - Added `WebSocketEvent.CONNECT_ERROR`, plus the `WS_CONNECT_ERROR` and `WS_DISCONNECT_NOTIFY_DELAY` constants
  - Removed the unused `calculateBackoff` helper and `WS_RECONNECT_BACKOFF_MULTIPLIER` constant; Socket.IO's Manager already handles exponential backoff

### Patch Changes

- Updated dependencies []:
  - @getdashfy/themes@0.1.2

## 0.2.1

### Patch Changes

- [`a9cbd29`](https://github.com/dashfy/dashfy/commit/a9cbd297ac0a8818a3c7a801d7716ccb5c8c78ba) Thanks [@brenopolanski](https://github.com/brenopolanski)! - Re-export shadcn/ui primitives from the public API

## 0.2.0

### Minor Changes

- Remove shadcn UI primitives and types re-exports from public API

## 0.1.1

### Patch Changes

- Fix npm publish by resolving workspace dependencies to semver ranges

- Updated dependencies []:
  - @getdashfy/themes@0.1.1
  - @getdashfy/utils@0.1.1

## 0.1.0

### Initial Release

- Dashfy UI component library for building Dashfy dashboards
- React components for dashboards, widgets, panels, and settings
- Widget, theme, and WebSocket registries with a Zustand-based store
- Bundled styles via `@getdashfy/ui/styles.css`
