import { computed, onMounted, onUnmounted, ref, watch, type Ref } from 'vue'
import type { Vector3 } from 'three'
import type { createSceneManager } from '../three/SceneManager'
import { getDefinition } from '../data/editorCatalog'
import { useCircuitStore } from '../stores/circuit'
import { useWorkspaceStore } from '../stores/workspace'
import { useUiStore } from '../stores/ui'
import type { CircuitModule } from '../types/circuit'
import type { TransformHandle } from '../three/ComponentTransformGizmo'
import { supplyControlMaximum, supplyControlValue, type SupplyControl } from '../three/PowerSupplyModel'
type Manager = ReturnType<typeof createSceneManager>
export type Position = { x: number; y: number; z: number }
interface DragGesture { pointer: number; start: { x: number; y: number }; dragged: boolean }
interface MoveGesture extends DragGesture { kind: 'move'; id: string; draft: string | null; planeHeight: number; offset: Position; position: Position }
interface PanGesture extends DragGesture { kind: 'pan'; anchor: Vector3 }
interface ControlGesture extends DragGesture {
  kind: 'control'; id: string; draft: string | null; control: SupplyControl; initial: number | boolean; value: number | boolean
  axis: 'x' | 'y' | null; last: { x: number; y: number }; raw: number
}
const voltageDetents = [3, 3.3, 5, 6, 9, 12, 15] as const
interface TransformGesture extends DragGesture {
  kind: 'transform'; id: string; draft: string | null; handle: TransformHandle; anchor: Vector3; center: Vector3
  initial: Position; position: Position; initialRotation: number; rotation: number; lastAngle: number; angle: number
}

function footprint(size: readonly number[], degrees: number) {
  const angle = degrees * Math.PI / 180, c = Math.abs(Math.cos(angle)), s = Math.abs(Math.sin(angle))
  return [size[0] * c + size[2] * s, size[0] * s + size[2] * c]
}

export function snapPosition(
  point: { x: number; y?: number; z: number },
  snapEnabled: boolean,
  modules: CircuitModule[],
  activeType?: string | null,
  activeId?: string | null,
  elevation = 0
): Position {
  const clean = (n: number) => Math.round(n * 10000) / 10000
  const baseX = snapEnabled ? Math.round(point.x * 2) / 2 : Math.round(point.x * 100) / 100
  const baseZ = snapEnabled ? Math.round(point.z * 2) / 2 : Math.round(point.z * 100) / 100

  if (!snapEnabled || !activeType) return { x: clean(baseX), y: elevation, z: clean(baseZ) }

  const activeDef = getDefinition(activeType)
  if (!activeDef?.visual?.startsWith('breadboard')) return { x: clean(baseX), y: elevation, z: clean(baseZ) }

  const otherBoards = modules.filter((m) => {
    if (activeId && m.id === activeId) return false
    const def = getDefinition(m.type)
    return def?.visual?.startsWith('breadboard')
  })
  if (otherBoards.length === 0) return { x: clean(baseX), y: elevation, z: clean(baseZ) }

  const activeModule = activeId ? modules.find((m) => m.id === activeId) : null
  const activeRot = activeModule?.rotation ?? 0
  const [activeW, activeD] = footprint(activeDef.size, activeRot)

  // 1. Magnetic docking candidates
  let bestCandidate: { x: number; z: number } | null = null
  let minDist = Infinity

  for (const m of otherBoards) {
    const mDef = getDefinition(m.type)
    if (!mDef) continue
    const mRot = m.rotation ?? 0
    const [mW, mD] = footprint(mDef.size, mRot)
    const mX = m.position?.x ?? 0
    const mZ = m.position?.z ?? 0

    const sites = [
      // Top (North)
      { x: mX, z: mZ - (mD + activeD) / 2, threshZ: 0.65, threshX: 1.5 },
      // Bottom (South)
      { x: mX, z: mZ + (mD + activeD) / 2, threshZ: 0.65, threshX: 1.5 },
      // Left (West)
      { x: mX - (mW + activeW) / 2, z: mZ, threshZ: 1.2, threshX: 0.65 },
      // Right (East)
      { x: mX + (mW + activeW) / 2, z: mZ, threshZ: 1.2, threshX: 0.65 }
    ]

    for (const s of sites) {
      const eps = 0.005
      const siteOverlapsOther = otherBoards.some((b) => {
        if (b.id === m.id) return false
        const bDef = getDefinition(b.type)
        if (!bDef) return false
        const bRot = b.rotation ?? 0
        const [bW, bD] = footprint(bDef.size, bRot)
        const bX = b.position?.x ?? 0
        const bZ = b.position?.z ?? 0
        return (s.x - activeW / 2 < bX + bW / 2 - eps) &&
               (s.x + activeW / 2 > bX - bW / 2 + eps) &&
               (s.z - activeD / 2 < bZ + bD / 2 - eps) &&
               (s.z + activeD / 2 > bZ - bD / 2 + eps)
      })
      if (siteOverlapsOther) continue

      const dx = Math.abs(point.x - s.x)
      const dz = Math.abs(point.z - s.z)
      if (dx <= s.threshX && dz <= s.threshZ) {
        const dist = Math.hypot(dx, dz)
        if (dist < minDist) {
          minDist = dist
          bestCandidate = { x: s.x, z: s.z }
        }
      }
    }
  }

  let candX = bestCandidate ? bestCandidate.x : baseX
  let candZ = bestCandidate ? bestCandidate.z : baseZ

  // 2. Anti-overlap resolution: if active board collides with any other board, push out to nearest edge
  for (let iter = 0; iter < 3; iter++) {
    let collided = false
    for (const m of otherBoards) {
      const mDef = getDefinition(m.type)
      if (!mDef) continue
      const mRot = m.rotation ?? 0
      const [mW, mD] = footprint(mDef.size, mRot)
      const mX = m.position?.x ?? 0
      const mZ = m.position?.z ?? 0

      const eps = 0.005
      const overlapX = (candX - activeW / 2 < mX + mW / 2 - eps) && (candX + activeW / 2 > mX - mW / 2 + eps)
      const overlapZ = (candZ - activeD / 2 < mZ + mD / 2 - eps) && (candZ + activeD / 2 > mZ - mD / 2 + eps)

      if (overlapX && overlapZ) {
        collided = true
        const pushes = [
          { dir: 'south', target: mZ + (mD + activeD) / 2, dist: Math.abs(candZ - (mZ + (mD + activeD) / 2)) },
          { dir: 'north', target: mZ - (mD + activeD) / 2, dist: Math.abs(candZ - (mZ - (mD + activeD) / 2)) },
          { dir: 'east', target: mX + (mW + activeW) / 2, dist: Math.abs(candX - (mX + (mW + activeW) / 2)) },
          { dir: 'west', target: mX - (mW + activeW) / 2, dist: Math.abs(candX - (mX - (mW + activeW) / 2)) }
        ]
        pushes.sort((a, b) => a.dist - b.dist)
        const best = pushes[0]
        if (best.dir === 'north' || best.dir === 'south') {
          candZ = best.target
          if (Math.abs(candX - mX) < 1.5) candX = mX
        } else {
          candX = best.target
          if (Math.abs(candZ - mZ) < 1.2) candZ = mZ
        }
      }
    }
    if (!collided) break
  }

  return { x: clean(candX), y: elevation, z: clean(candZ) }
}

export function useCircuitEditor(canvas: Ref<HTMLCanvasElement | undefined>, manager: () => Manager | undefined) {
  const circuit = useCircuitStore(), workspace = useWorkspaceStore(), ui = useUiStore()
  let gesture: MoveGesture | PanGesture | TransformGesture | ControlGesture | null = null
  const dragging = ref<'move' | 'pan' | 'transform' | 'control' | null>(null)
  const hoveredHandle = ref<TransformHandle | null>(null)
  const hoveredControl = ref<SupplyControl | null>(null)
  const controlHint = computed(() => hoveredControl.value === 'power_on' ? 'Click to toggle power On/Off' : hoveredControl.value ? `Drag ${hoveredControl.value === 'voltage_v' ? 'Voltage (0–15 V)' : 'Ampe (0–5 A)'} knob up/right to increase, down/left to decrease. Hold Shift for fine adjustment.` : '')
  const ports = ref<{ endpoint: string; x: number; y: number; direction: string }[]>([])
  const selected = computed(() => circuit.graph?.modules.find((module) => module.id === workspace.selectedModuleId))
  const attempt = (action: () => void) => { try { action(); workspace.editError = '' } catch (error) { workspace.editError = error instanceof Error ? error.message : 'Circuit edit failed.' } }
  const coordinates = (event: { clientX: number; clientY: number }) => { const rect = canvas.value!.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top } }
  const snap = (point: { x: number; y?: number; z: number } | Vector3, activeType?: string | null, activeId?: string | null, elevation = 0): Position =>
    snapPosition(point, workspace.snap, circuit.graph?.modules ?? [], activeType, activeId, elevation)
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
    if (gesture) { const pointer = gesture.pointer; gesture = null; dragging.value = null; manager()?.activateGizmo(null); manager()?.lockPointer(false); if (canvas.value?.hasPointerCapture(pointer)) canvas.value.releasePointerCapture(pointer); sync() }
    hoveredHandle.value = null; hoveredControl.value = null; manager()?.clearGizmoHover()
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
    if (event.button === 2 && workspace.placementType) {
      event.preventDefault?.()
      event.stopPropagation?.()
      event.stopImmediatePropagation?.()
      cancel()
      workspace.cancelPlacement()
      workspace.editError = ''
      return
    }
    if (event.button !== 0 || gesture || !manager() || !canvas.value) return
    canvas.value.focus(); const { x, y } = coordinates(event), point = manager()!.groundPoint(x, y)
    if (workspace.placementType) { if (point) place(workspace.placementType, snap(point, workspace.placementType)); return }
    const transform = manager()!.pickGizmo(x, y), module = selected.value
    if (transform && module && transform.id === module.id) {
      const center = manager()!.gizmoOrigin()!, anchor = manager()!.groundPoint(x, y, center.y)
      if (!anchor) return
      const initial = { x: module.position?.x ?? 0, y: module.position?.y ?? 0, z: module.position?.z ?? 0 }
      gesture = { kind: 'transform', pointer: event.pointerId, start: { x, y }, dragged: false, id: module.id, draft: circuit.activeId, handle: transform.handle, center, anchor, initial, position: initial, initialRotation: module.rotation ?? 0, rotation: module.rotation ?? 0, lastAngle: Math.atan2(-(anchor.z - center.z), anchor.x - center.x), angle: 0 }
      manager()!.activateGizmo(transform.handle); manager()!.lockPointer(true); canvas.value.setPointerCapture(event.pointerId); event.preventDefault?.(); return
    }
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
    if (!(workspace.tool === 'select' && hit.kind === 'control')) ui.openWindow('component-info', { activate: false })
    if (workspace.tool === 'select' && hit.kind === 'control') {
      const initial = supplyControlValue(selected.value?.properties, hit.control)
      gesture = { kind: 'control', pointer: event.pointerId, start: { x, y }, dragged: false, id: hit.id, draft: circuit.activeId, control: hit.control, initial, value: initial, axis: null, last: { x, y }, raw: typeof initial === 'number' ? initial : 0 }
      manager()!.lockPointer(true); canvas.value.setPointerCapture(event.pointerId); event.preventDefault?.()
    }
    else if (workspace.tool === 'rotate') attempt(() => circuit.rotateModule(hit.id))
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
      const threshold = gesture.kind === 'control' && gesture.control !== 'power_on' ? 1 : 4
      if (!gesture.dragged && Math.hypot(x - gesture.start.x, y - gesture.start.y) < threshold) return
      gesture.dragged = true; dragging.value = gesture.kind
      if (gesture.kind === 'control') {
        if (gesture.control !== 'power_on') {
          const maximum = supplyControlMaximum(gesture.control)
          // Lock the intended drag axis so diagonal jitter does not double the gain.
          // Voltage: 0.05 V/pixel, Shift: 0.01 V/pixel. Apply modifier changes only
          // to new travel; keep the unsnapped accumulator so detents never trap a drag.
          gesture.axis ??= Math.abs(x - gesture.start.x) > Math.abs(y - gesture.start.y) ? 'x' : 'y'
          const delta = gesture.axis === 'x' ? x - gesture.last.x : gesture.last.y - y
          gesture.last = { x, y }
          // A modifier change or mouse release alone must not re-snap a fine value.
          if (delta === 0) return
          const rate = (gesture.control === 'voltage_v' ? 0.05 : 0.02) * (event.shiftKey ? 0.2 : 1)
          gesture.raw = Math.max(0, Math.min(maximum, gesture.raw + delta * rate))
          const raw = gesture.raw
          const detent = gesture.control === 'voltage_v' && !event.shiftKey ? voltageDetents.find((value) => Math.abs(value - raw) <= 0.06) : undefined
          gesture.value = detent ?? Math.round(gesture.raw * 100) / 100
          manager()!.previewSupplyControl(gesture.id, gesture.control, gesture.value)
        }
        return
      }
      if (gesture.kind === 'pan') { manager()!.panGrab(gesture.anchor, x, y); return }
      if (gesture.kind === 'transform') {
        const transform = gesture, point = manager()!.groundPoint(x, y, transform.center.y)
        if (!point) return
        if (transform.handle === 'rotate-y') {
          const dx = point.x - transform.center.x, dz = point.z - transform.center.z
          if (Math.hypot(dx, dz) < 0.001) return
          const currentAngle = Math.atan2(-dz, dx)
          transform.angle += Math.atan2(Math.sin(currentAngle - transform.lastAngle), Math.cos(currentAngle - transform.lastAngle))
          transform.lastAngle = currentAngle
          const raw = transform.initialRotation + transform.angle * 180 / Math.PI
          transform.rotation = workspace.snap ? Math.round(raw / 15) * 15 : Math.round(raw * 100) / 100
          manager()!.previewRotation(transform.id, transform.rotation)
        } else {
          point.sub(transform.anchor); point.x += transform.initial.x; point.z += transform.initial.z
          const type = circuit.graph?.modules.find((m) => m.id === transform.id)?.type
          transform.position = snap(point, transform.handle === 'xz' ? type : undefined, transform.id, transform.initial.y)
          if (transform.handle === 'x') transform.position.z = transform.initial.z
          if (transform.handle === 'z') transform.position.x = transform.initial.x
          manager()!.previewMove(transform.id, transform.position)
        }
        updatePorts(); return
      }
    }
    if (!gesture) {
      hoveredHandle.value = workspace.placementType ? null : manager()!.hoverGizmo(x, y)
      const hit = !workspace.placementType && !hoveredHandle.value && workspace.tool === 'select' ? manager()!.pick(x, y) : null
      hoveredControl.value = hit?.kind === 'control' ? hit.control : null
    }
    const point = manager()!.groundPoint(x, y, gesture?.kind === 'move' ? gesture.planeHeight : 0)
    if (!point) return
    if (gesture?.kind === 'move') {
      const move = gesture
      point.x += move.offset.x; point.z += move.offset.z
      const module = circuit.graph?.modules.find((m) => m.id === move.id)
      move.position = snap(point, module?.type, move.id, move.offset.y)
      manager()!.previewMove(move.id, move.position)
      updatePorts()
    } else if (workspace.placementType) {
      const snapped = snap(point, workspace.placementType)
      manager()!.setGhost(workspace.placementType, point.set(snapped.x, 0, snapped.z))
    }
  }
  function pointerUp(event: PointerEvent) {
    if (!gesture || event.pointerId !== gesture.pointer) return
    pointerMove(event)
    const completed = gesture; gesture = null; dragging.value = null; manager()?.activateGizmo(null); manager()?.lockPointer(false)
    if (canvas.value?.hasPointerCapture(event.pointerId)) canvas.value.releasePointerCapture(event.pointerId)
    if (completed.kind === 'control' && completed.draft === circuit.activeId) {
      if (completed.control !== 'power_on' && completed.dragged) attempt(() => circuit.updateModuleProperties(completed.id, { [completed.control]: completed.value }))
      else if (completed.control === 'power_on' && !completed.dragged && canvas.value) {
        const { x, y } = coordinates(event), hit = manager()?.pick(x, y)
        if (hit?.kind === 'control' && hit.id === completed.id && hit.control === 'power_on') attempt(() => circuit.updateModuleProperties(completed.id, { power_on: !completed.initial }))
      }
    }
    else if (completed.kind === 'move' && completed.dragged && completed.draft === circuit.activeId) attempt(() => circuit.moveModule(completed.id, completed.position))
    else if (completed.kind === 'transform' && completed.dragged && completed.draft === circuit.activeId) attempt(() => {
      if (completed.handle === 'rotate-y') circuit.rotateModule(completed.id, completed.rotation - completed.initialRotation)
      else circuit.moveModule(completed.id, completed.position)
    })
    else if (completed.kind === 'pan' && !completed.dragged) workspace.clearSelection()
    sync()
  }
  function drop(event: DragEvent) {
    event.preventDefault(); cancel()
    const type = event.dataTransfer?.getData('application/x-netcircuit-component')
    if (!type || !getDefinition(type) || !manager() || !canvas.value) return
    const { x, y } = coordinates(event), point = manager()!.groundPoint(x, y)
    if (point) { ui.activeRibbonGroup = null; place(type, snap(point, type)); canvas.value.focus() }
  }
  function keydown(event: KeyboardEvent) {
    if (event.key === 'Escape') { cancel(); workspace.cancelPlacement(); workspace.editError = ''; return }
    if (event.ctrlKey || event.metaKey || event.altKey) return
    if (gesture && ['Delete', 'Backspace', 'r', 'R', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) cancel()
    const id = workspace.selectedModuleId
    if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); attempt(() => { if (id) circuit.removeModule(id); else if (workspace.selectedWire) circuit.disconnectPorts(workspace.selectedWire.source, workspace.selectedWire.destination) }) }
    else if (id && event.key.toLowerCase() === 'r') attempt(() => circuit.rotateModule(id))
    else if (id && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); const module = selected.value!; const step = workspace.snap ? 0.5 : 0.1
      const rawTarget = {
        x: (module.position?.x ?? 0) + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
        y: module.position?.y ?? 0,
        z: (module.position?.z ?? 0) + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)
      }
      attempt(() => circuit.moveModule(id, snap(rawTarget, module.type, id, module.position?.y ?? 0)))
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
  watch(() => [workspace.selectedModuleId, workspace.selectedWire], () => {
    if (gesture && gesture.kind !== 'pan' && gesture.id !== workspace.selectedModuleId) cancel()
    manager()?.highlight(workspace.selectedModuleId, workspace.selectedWire); updatePorts()
  })
  watch(() => selected.value?.id, (id) => {
    if (id) ui.openWindow('component-info', { activate: false })
    else ui.closeWindow('component-info')
  }, { immediate: true })
  onUnmounted(cancel)
  function pointerLeave() { if (!gesture) { hoveredHandle.value = null; hoveredControl.value = null; manager()?.clearGizmoHover(); manager()?.setGhost(null) } }
  return { ports, selected, dragging, hoveredHandle, hoveredControl, controlHint, updatePorts, sync, cancel, connect, pointerDown, pointerMove, pointerUp, pointerLeave, drop, keydown, selectModule }
}
