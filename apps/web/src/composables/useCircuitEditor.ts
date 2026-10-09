import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import type { Vector3 } from 'three'
import type { createSceneManager } from '../three/SceneManager'
import { getDefinition } from '../data/editorCatalog'
import { useCircuitStore } from '../stores/circuit'
import { useWorkspaceStore } from '../stores/workspace'
import { useUiStore } from '../stores/ui'
type Manager = ReturnType<typeof createSceneManager>
type Position = { x: number; y: number; z: number }
interface DragGesture { pointer: number; start: { x: number; y: number }; dragged: boolean }
interface MoveGesture extends DragGesture { kind: 'move'; id: string; draft: string | null; planeHeight: number; offset: Position; position: Position }
interface PanGesture extends DragGesture { kind: 'pan'; anchor: Vector3 }

export function useCircuitEditor(canvas: Ref<HTMLCanvasElement | undefined>, manager: () => Manager | undefined) {
  const circuit = useCircuitStore(), workspace = useWorkspaceStore(), ui = useUiStore()
  let gesture: MoveGesture | PanGesture | null = null
  const dragging = ref<'move' | 'pan' | null>(null)
  const ports = ref<{ endpoint: string; x: number; y: number; direction: string }[]>([])
  const selected = computed(() => circuit.graph?.modules.find((module) => module.id === workspace.selectedModuleId))
  const attempt = (action: () => void) => { try { action(); workspace.editError = '' } catch (error) { workspace.editError = error instanceof Error ? error.message : 'Circuit edit failed.' } }
  const coordinates = (event: { clientX: number; clientY: number }) => { const rect = canvas.value!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } }
  const snap = (point: Vector3, elevation = 0): Position => ({ x: workspace.snap ? Math.round(point.x * 2) / 2 : Math.round(point.x * 100) / 100, y: elevation, z: workspace.snap ? Math.round(point.z * 2) / 2 : Math.round(point.z * 100) / 100 })
  function updatePorts() {
    const next: typeof ports.value = []
    for (const module of circuit.graph?.modules ?? []) {
      if (workspace.tool !== 'wire' && module.id !== workspace.selectedModuleId) continue
      for (const port of getDefinition(module.type)?.ports ?? []) {
        const anchor = manager()?.endpointPosition(`${module.id}.${port.id}`)
        if (!anchor) continue
        const point = manager()!.project(anchor)
        if (point.visible) next.push({ endpoint: `${module.id}.${port.id}`, x: point.x, y: point.y, direction: port.direction })
      }
    }
    ports.value = next
  }
  function sync() { manager()?.syncGraph(circuit.graph); manager()?.highlight(workspace.selectedModuleId, workspace.selectedWire); updatePorts() }
  function cancel() {
    if (gesture) { const pointer = gesture.pointer; gesture = null; dragging.value = null; manager()?.lockPointer(false); if (canvas.value?.hasPointerCapture(pointer)) canvas.value.releasePointerCapture(pointer); sync() }
    manager()?.setGhost(null)
  }
  function connect(endpoint: string) {
    if (workspace.tool !== 'wire') { workspace.setTool('wire'); workspace.pendingPort = endpoint; return }
    if (!workspace.pendingPort) workspace.pendingPort = endpoint
    else if (workspace.pendingPort === endpoint) workspace.pendingPort = null
    else attempt(() => { circuit.connectPorts(workspace.pendingPort!, endpoint); workspace.pendingPort = null })
  }
  function place(type: string, position: Position) { attempt(() => { const id = circuit.placeModule(type, position); workspace.selectModule(id); manager()?.setGhost(null); sync() }) }
  function pointerDown(event: PointerEvent) {
    if (event.button !== 0 || gesture || !manager() || !canvas.value) return
    canvas.value.focus(); const { x, y } = coordinates(event), point = manager()!.groundPoint(x, y)
    if (workspace.placementType) { if (point) place(workspace.placementType, snap(point)); return }
    const hit = manager()!.pick(x, y)
    if (workspace.tool === 'wire' && hit?.kind === 'port') { connect(hit.endpoint); return }
    if (hit?.kind === 'wire') {
      workspace.selectWire(hit.source, hit.destination)
      if (workspace.tool === 'delete') attempt(() => circuit.disconnectPorts(hit.source, hit.destination))
      sync(); return
    }
    if (!hit) {
      if (point) {
        gesture = { kind: 'pan', pointer: event.pointerId, start: { x, y }, dragged: false, anchor: point }
        manager()!.lockPointer(true); canvas.value.setPointerCapture(event.pointerId)
      } else { workspace.clearSelection(); sync() }
      return
    }
    workspace.selectModule(hit.id)
    if (workspace.tool === 'rotate') attempt(() => circuit.rotateModule(hit.id))
    else if (workspace.tool === 'delete') attempt(() => circuit.removeModule(hit.id))
    else if (workspace.tool === 'scope' || workspace.tool === 'probe') ui.openWindow(workspace.tool === 'scope' ? 'oscilloscope' : 'monitor')
    else if (workspace.tool === 'move') {
      const module = selected.value!, position = { x: module.position?.x ?? 0, y: module.position?.y ?? 0, z: module.position?.z ?? 0 }
      // Drag through the picked surface, including bodies above a low camera's ground horizon.
      const dragPoint = manager()!.groundPoint(x, y, hit.point.y)
      if (!dragPoint) { sync(); return }
      gesture = { kind: 'move', pointer: event.pointerId, start: { x, y }, dragged: false, id: hit.id, draft: circuit.activeId, planeHeight: hit.point.y, offset: { x: position.x - dragPoint.x, y: position.y, z: position.z - dragPoint.z }, position }
      manager()!.lockPointer(true)
      canvas.value.setPointerCapture(event.pointerId)
    }
    sync()
  }
  function pointerMove(event: PointerEvent) {
    if (!manager() || !canvas.value) return
    const { x, y } = coordinates(event)
    if (gesture) {
      if (event.pointerId !== gesture.pointer) return
      if (!gesture.dragged && Math.hypot(x - gesture.start.x, y - gesture.start.y) < 4) return
      gesture.dragged = true; dragging.value = gesture.kind
      if (gesture.kind === 'pan') { manager()!.panGrab(gesture.anchor, x, y); return }
    }
    const point = manager()!.groundPoint(x, y, gesture?.kind === 'move' ? gesture.planeHeight : 0)
    if (!point) return
    if (gesture?.kind === 'move') {
      point.x += gesture.offset.x; point.z += gesture.offset.z
      gesture.position = snap(point, gesture.offset.y); manager()!.previewMove(gesture.id, gesture.position); updatePorts()
    } else if (workspace.placementType) manager()!.setGhost(workspace.placementType, point.set(snap(point).x, 0, snap(point).z))
  }
  function pointerUp(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointer) return
    pointerMove(event)
    const completed = gesture; gesture = null; dragging.value = null; manager()?.lockPointer(false)
    if (canvas.value?.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId)
    if (completed.kind === 'move' && completed.dragged && completed.draft === circuit.activeId) attempt(() => circuit.moveModule(completed.id, completed.position))
    else if (completed.kind === 'pan' && !completed.dragged) workspace.clearSelection()
    sync()
  }
  function drop(event: DragEvent) {
    event.preventDefault(); cancel()
    const type = event.dataTransfer?.getData('application/x-netcircuit-component')
    if (!type || !getDefinition(type) || !manager() || !canvas.value) return
    const { x, y } = coordinates(event), point = manager()!.groundPoint(x, y)
    if (point) { ui.activeRibbonGroup = null; place(type, snap(point)); canvas.value.focus() }
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { cancel(); workspace.cancelPlacement(); workspace.editError = ''; return }
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const id = workspace.selectedModuleId
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); attempt(() => { if (id) circuit.removeModule(id); else if (workspace.selectedWire) circuit.disconnectPorts(workspace.selectedWire.source, workspace.selectedWire.destination) }) }
    else if (id && event.key.toLowerCase() === 'r') attempt(() => circuit.rotateModule(id))
    else if (id && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); const module = selected.value!; const step = workspace.snap ? 0.5 : 0.1
      attempt(() => circuit.moveModule(id, { x: (module.position?.x ?? 0) + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0), y: module.position?.y ?? 0, z: (module.position?.z ?? 0) + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0) }))
    }
  }
  const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') keydown(event) }
  onMounted(() => document.addEventListener('keydown', escape, true))
  onUnmounted(() => document.removeEventListener('keydown', escape, true))
  function selectModule(id: string) { cancel(); workspace.selectModule(id); sync() }
  watch(() => circuit.graph, () => {
    cancel()
    if (workspace.selectedModuleId && !circuit.graph?.modules.some((module) => module.id === workspace.selectedModuleId)) workspace.selectedModuleId = null
    if (workspace.pendingPort && !circuit.graph?.modules.some((module) => module.id === workspace.pendingPort!.split('.')[0])) workspace.pendingPort = null
    if (workspace.selectedWire && !circuit.graph?.connections.some((wire) => wire.source === workspace.selectedWire!.source && wire.destination === workspace.selectedWire!.destination)) workspace.selectedWire = null
    sync()
  }, { deep: true })
  watch(() => [workspace.tool, workspace.placementType], () => { cancel(); updatePorts() })
  watch(() => [workspace.selectedModuleId, workspace.selectedWire], () => { manager()?.highlight(workspace.selectedModuleId, workspace.selectedWire); updatePorts() })
  onUnmounted(cancel)
  return { ports, selected, dragging, updatePorts, sync, cancel, connect, pointerDown, pointerMove, pointerUp, drop, keydown, selectModule }
}
