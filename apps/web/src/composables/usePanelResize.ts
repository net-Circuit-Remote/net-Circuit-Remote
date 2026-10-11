import { onScopeDispose, ref, watch } from 'vue'

export function usePanelResize(options: {
  axis: 'x' | 'y'
  enabled: () => boolean
  size: () => number
  limits: () => { min: number; max: number }
  setSize: (size: number) => void
}) {
  const dragging = ref(false)
  let gesture: { pointer: number; start: number; size: number; original: number; handle: HTMLElement } | null = null
  const coordinate = (event: PointerEvent) => options.axis === 'x' ? event.clientX : event.clientY
  function clamp(size: number) { const { min, max } = options.limits(); return Math.max(min, Math.min(max, size)) }
  function end(restore: boolean) {
    const active = gesture
    gesture = null; dragging.value = false
    if (!active) return
    if (restore) options.setSize(active.original)
    if (active.handle.hasPointerCapture(active.pointer)) active.handle.releasePointerCapture(active.pointer)
  }
  function cancel(event?: PointerEvent) { if (!event || gesture?.pointer === event.pointerId) end(true) }
  function pointerDown(event: PointerEvent) {
    const handle = event.currentTarget as HTMLElement | null, start = coordinate(event), original = options.size()
    if (!options.enabled() || gesture || event.button !== 0 || event.isPrimary === false || !Number.isFinite(start) || !Number.isFinite(original) || handle?.getAttribute('role') !== 'separator') return
    event.preventDefault(); event.stopPropagation(); handle.focus()
    handle.setPointerCapture(event.pointerId)
    gesture = { pointer: event.pointerId, start, original, size: clamp(original), handle }; dragging.value = true
  }
  function apply(event: PointerEvent) {
    if (!gesture || gesture.pointer !== event.pointerId) return
    const position = coordinate(event)
    if (!Number.isFinite(position) || !options.enabled()) { cancel(); return }
    options.setSize(clamp(gesture.size + position - gesture.start))
  }
  function pointerMove(event: PointerEvent) {
    if (gesture?.pointer !== event.pointerId) return
    if (event.buttons === 0) { cancel(); return }
    apply(event)
  }
  function pointerUp(event: PointerEvent) { if (gesture?.pointer === event.pointerId) { apply(event); end(false) } }
  function lostPointerCapture(event: PointerEvent) { if (gesture?.pointer === event.pointerId) cancel() }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && gesture) { event.preventDefault(); event.stopPropagation(); cancel(); return }
    if (!options.enabled() || gesture) return
    const keys = options.axis === 'x' ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown']
    const { min, max } = options.limits(), size = clamp(options.size()), step = event.shiftKey ? 20 : 8
    const next = event.key === keys[0] ? size - step : event.key === keys[1] ? size + step : event.key === 'Home' ? min : event.key === 'End' ? max : null
    if (next === null) return
    event.preventDefault(); event.stopPropagation(); options.setSize(clamp(next))
  }
  watch(options.enabled, (enabled) => { if (!enabled) cancel() }, { flush: 'sync' })
  onScopeDispose(cancel)
  return { dragging, pointerDown, pointerMove, pointerUp, cancel, lostPointerCapture, keydown }
}
