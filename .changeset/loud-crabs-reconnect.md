---
'@getdashfy/types': minor
'@getdashfy/ui': minor
---

Fix WebSocket reconnection giving up permanently after a short outage

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
