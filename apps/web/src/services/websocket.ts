export function openEventSocket(onMessage: (data: unknown) => void): WebSocket {
  const scheme = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const socket = new WebSocket(`${scheme}://${window.location.host}/ws/events`)
  socket.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data))
    } catch {
      onMessage(event.data)
    }
  }
  return socket
}
