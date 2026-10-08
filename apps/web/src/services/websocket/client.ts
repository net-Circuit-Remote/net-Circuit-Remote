import { parseServerEvent, type ServerEvent } from './events'

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'reconnecting' | 'closed'
export interface SocketLike {
  onopen: ((event: Event) => void) | null
  onclose: ((event: CloseEvent) => void) | null
  onerror: ((event: Event) => void) | null
  onmessage: ((event: MessageEvent) => void) | null
  close(): void
}
export interface EventClient { connect(): void; disconnect(): void }
export interface EventClientOptions {
  url: string
  onEvent: (event: ServerEvent) => void
  onState?: (state: ConnectionState) => void
  createSocket?: (url: string) => SocketLike
  schedule?: (callback: () => void, delay: number) => ReturnType<typeof setTimeout>
  cancel?: (timer: ReturnType<typeof setTimeout>) => void
  random?: () => number
}

export function eventSocketUrl(location: Pick<Location, 'protocol' | 'host'>): string {
  return `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/events`
}

export function createEventClient(options: EventClientOptions): EventClient {
  let active = false
  let socket: SocketLike | null = null
  let timer: ReturnType<typeof setTimeout> | null = null
  let attempts = 0
  const schedule = options.schedule ?? setTimeout
  const cancel = options.cancel ?? clearTimeout
  const state = (value: ConnectionState) => options.onState?.(value)
  function retire() {
    if (!socket) return
    const previous = socket
    socket = null
    previous.onopen = previous.onclose = previous.onerror = previous.onmessage = null
    previous.close()
  }
  function reconnect() {
    if (!active || timer !== null) return
    retire()
    state('reconnecting')
    const base = Math.min(30_000, 1000 * 2 ** Math.min(attempts++, 15))
    const delay = Math.min(30_000, Math.round(base * (1 + (options.random ?? Math.random)() * 0.25)))
    timer = schedule(() => { timer = null; open() }, delay)
  }
  function open() {
    if (!active) return
    state(attempts ? 'reconnecting' : 'connecting')
    try {
      const current = (options.createSocket ?? ((url) => new WebSocket(url)))(options.url)
      socket = current
      current.onopen = () => { if (active && socket === current) { attempts = 0; state('connected') } }
      current.onclose = current.onerror = () => { if (active && socket === current) reconnect() }
      current.onmessage = (message) => {
        if (!active || socket !== current || typeof message.data !== 'string') return
        let data: unknown
        try { data = JSON.parse(message.data) } catch { return }
        const event = parseServerEvent(data)
        if (event) options.onEvent(event)
      }
    } catch { reconnect() }
  }
  return {
    connect() { if (active) return; active = true; attempts = 0; open() },
    disconnect() {
      active = false
      if (timer !== null) { cancel(timer); timer = null }
      retire()
      state('closed')
    },
  }
}
