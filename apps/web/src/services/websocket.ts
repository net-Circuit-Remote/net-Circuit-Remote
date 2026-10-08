import { createEventClient, eventSocketUrl } from './websocket/client'
import type { ServerEvent } from './websocket/events'
export { createEventClient, eventSocketUrl } from './websocket/client'
export type { EventClient, ConnectionState } from './websocket/client'
export function openEventSocket(onMessage: (data: ServerEvent) => void) {
  const client = createEventClient({ url: eventSocketUrl(window.location), onEvent: onMessage })
  client.connect()
  return client
}
