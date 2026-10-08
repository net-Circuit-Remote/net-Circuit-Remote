import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEventClient, type SocketLike } from '../src/services/websocket/client'
import { parseServerEvent } from '../src/services/websocket/events'

function harness() {
  const sockets: SocketLike[] = []
  const timers = new Map<number, { callback: () => void; delay: number }>()
  const states: string[] = []
  const messages: unknown[] = []
  let timerId = 0
  const client = createEventClient({
    url: 'ws://localhost/ws/events', random: () => 0,
    createSocket: () => {
      const socket = { onopen: null, onclose: null, onerror: null, onmessage: null, close() {} } as SocketLike
      sockets.push(socket)
      return socket
    },
    schedule: (callback, delay) => { timers.set(++timerId, { callback, delay }); return timerId as unknown as ReturnType<typeof setTimeout> },
    cancel: (id) => { timers.delete(id as unknown as number) },
    onState: (state) => states.push(state), onEvent: (event) => messages.push(event),
  })
  function retry() {
    const entry = [...timers.entries()][0]
    assert.ok(entry)
    timers.delete(entry[0]); entry[1].callback()
  }
  return { client, sockets, timers, states, messages, retry }
}

test('unexpected closes reconnect with exponential backoff, cap, and reset after open', () => {
  const h = harness()
  h.client.connect()
  for (const expected of [1000, 2000, 4000, 8000, 16000, 30000, 30000]) {
    h.sockets.at(-1)!.onclose?.({} as CloseEvent)
    assert.equal([...h.timers.values()][0].delay, expected)
    h.retry()
  }
  h.sockets.at(-1)!.onopen?.({} as Event)
  h.sockets.at(-1)!.onclose?.({} as CloseEvent)
  assert.equal([...h.timers.values()][0].delay, 1000)
  assert.ok(h.states.includes('reconnecting'))
  h.client.disconnect()
})

test('manual disconnect cancels retries and late socket callbacks cannot reconnect', () => {
  const h = harness()
  h.client.connect()
  const lateClose = h.sockets[0].onclose!
  h.sockets[0].onclose?.({} as CloseEvent)
  h.client.disconnect()
  lateClose({} as CloseEvent)
  assert.equal(h.timers.size, 0)
  assert.equal(h.states.at(-1), 'closed')
  h.client.connect()
  lateClose({} as CloseEvent)
  assert.equal(h.timers.size, 0)
  assert.equal(h.sockets.length, 2)
  h.client.disconnect()
})

test('duplicate connect and error/close callbacks create only one connection/retry', () => {
  const h = harness()
  h.client.connect(); h.client.connect()
  assert.equal(h.sockets.length, 1)
  const error = h.sockets[0].onerror!
  const close = h.sockets[0].onclose!
  error({} as Event); close({} as CloseEvent)
  assert.equal(h.timers.size, 1)
  h.client.disconnect()
})

test('malformed and unsupported events never reach state consumers', () => {
  const h = harness()
  h.client.connect()
  for (const data of ['not json', '{"type":"station.updated","station":{"station_id":"p1","mode":"hardware","state":"unknown"}}', '{"type":"station.updated","station":{"station_id":"p1","mode":"hardware","state":["error"]}}', '{"type":"unknown"}', 'null']) {
    h.sockets[0].onmessage?.({ data } as MessageEvent)
  }
  assert.equal(h.messages.length, 0)
  h.sockets[0].onmessage?.({ data: '{"type":"hello","service":"netcircuit-api"}' } as MessageEvent)
  assert.equal(h.messages.length, 1)
  assert.deepEqual(parseServerEvent({ type: 'station.updated', station: { station_id: 'p1', mode: 'hardware', state: 'error' } }),
    { type: 'station.updated', station: { station_id: 'p1', mode: 'hardware', state: 'error' } })
  h.client.disconnect()
})
