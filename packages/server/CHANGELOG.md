# @getdashfy/server

## 0.2.0

### Minor Changes

- Add an optional `staticDir` config option for the directory the server serves the built
  client from. It is resolved against `baseDir` and defaults to `build`, so existing
  configurations are unaffected. Frameworks that emit the client into a nested directory —
  React Router's `build/client` or TanStack Start's `dist/client`, for example — can now
  point at it directly instead of moving files after the build.

## 0.1.1

### Patch Changes

- Fix npm publish by resolving workspace dependencies to semver ranges

- Updated dependencies []:
  - @getdashfy/utils@0.1.1

## 0.1.0

### Initial Release

- Dashfy server with real-time data streaming and multi-dashboard support
- Fastify HTTP server with Socket.IO WebSocket integration
- Pull and push polling modes with a configurable push interval
- YAML-based configuration with schema validation
