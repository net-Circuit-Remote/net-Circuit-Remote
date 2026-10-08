import { onMounted, onUnmounted } from 'vue'
import { createEventClient, eventSocketUrl } from '../services/websocket/client'
import { useStationStore } from '../stores/station'
import { useUiStore } from '../stores/ui'
import { useInstrumentStore } from '../stores/instrument'

export function useLabConnection() {
  const station = useStationStore()
  const ui = useUiStore()
  const instrument = useInstrumentStore()
  const controller = new AbortController()
  let disposed = false
  const client = createEventClient({
    url: import.meta.env.VITE_WS_URL || eventSocketUrl(window.location),
    onState(state) {
      if (disposed) return
      if (ui.connectionState !== state) {
        if (state === 'connected') instrument.log('Event connection established.')
        if (state === 'reconnecting') instrument.log('Event connection lost. Retrying automatically.', 'error')
      }
      ui.connectionState = state
      station.setEventsConnected(state === 'connected')
      if (state === 'connected') void station.refresh(controller.signal)
    },
    onEvent(event) {
      if (disposed) return
      if (event.type === 'hello') instrument.log(`Connected to ${event.service}.`)
      if (event.type === 'station.updated') station.updateStation(event.station)
    },
  })
  onMounted(() => { void station.refresh(controller.signal); client.connect() })
  onUnmounted(() => {
    disposed = true
    controller.abort()
    client.disconnect()
    station.setEventsConnected(false)
  })
}
