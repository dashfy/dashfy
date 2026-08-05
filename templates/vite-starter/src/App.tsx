import { Dashfy } from '@getdashfy/ui'

export const App = () => {
  // In production the UI is served by the Dashfy server itself, so connect to
  // the same origin. In dev, leave undefined to use the default localhost:5001.
  const serverUrl = import.meta.env.PROD ? window.location.origin : undefined

  return <Dashfy serverUrl={serverUrl} />
}
