import { AmbientLight, BoxGeometry, BufferGeometry, Color, DirectionalLight, GridHelper, Group, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, MOUSE, PerspectiveCamera, Plane, Raycaster, Scene, TubeGeometry, Vector2, Vector3, QuadraticBezierCurve3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { applyPose, buildComponent, disposeObject, portAnchor } from './ComponentModel'
import { getDefinition } from '../data/editorCatalog'
import type { CircuitGraph, CircuitModule } from '../types/circuit'

export interface SceneRenderer { setSize(width: number, height: number, updateStyle?: boolean): void; render(scene: Scene, camera: PerspectiveCamera): void; dispose(): void }
interface SceneOptions { renderer: SceneRenderer; canvas?: HTMLCanvasElement; onRender?: () => void; requestFrame?: (callback: FrameRequestCallback) => number; cancelFrame?: (id: number) => void }
export type PickResult = ({ kind: 'module'; id: string } | { kind: 'port'; id: string; endpoint: string } | { kind: 'wire'; source: string; destination: string }) & { point: Vector3 }
export interface OrientationAxis { label: 'X' | 'Y' | 'Z'; x: number; y: number; depth: number; color: string }

// Geometry is a projection of graph IDs and named logical ports, never a source of nets.
export function createSceneManager({ renderer, canvas, onRender, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }: SceneOptions) {
  const scene = new Scene(); scene.background = new Color('#101925')
  const camera = new PerspectiveCamera(42, 1, 0.1, 150); camera.position.set(0, 11, 10); camera.lookAt(0, 0, 0); camera.updateMatrixWorld()
  const grid = new GridHelper(30, 60, '#415a70', '#253747'); grid.position.y = -0.01
  const ambient = new AmbientLight('#c9def4', 2)
  const light = new DirectionalLight('#fff5dc', 3); light.position.set(-5, 10, 5)
  const fillLight = new DirectionalLight('#a8c7e8', 1.2); fillLight.position.set(6, 8, -6)
  const wires = new Group(), content = new Group(), models = new Map<string, Group>()
  scene.add(grid, ambient, light, fillLight, content, wires)
  const raycaster = new Raycaster(), plane = new Plane(new Vector3(0, 1, 0), 0)
  let width = 1, height = 1, frame: number | null = null, disposed = false, visible = false, suspended = false, pointerLocked = false
  let graph: CircuitGraph | null = null, ghost: Group | null = null
  const schedule = () => {
    if (disposed || !visible || suspended || frame !== null) return
    frame = requestFrame(() => { frame = null; if (!disposed && visible && !suspended) { scene.updateMatrixWorld(true); renderer.render(scene, camera); onRender?.() } })
  }
  const controls = canvas ? new OrbitControls(camera, canvas) : undefined
  const viewTarget = new Vector3()
  if (controls) {
    controls.mouseButtons = { LEFT: null, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE }
    controls.touches = { ONE: null, TWO: null }; controls.screenSpacePanning = false
    controls.minDistance = 3; controls.maxDistance = 45; controls.maxPolarAngle = Math.PI / 2 - 0.05
    controls.addEventListener('change', schedule); controls.saveState()
  }
  const endpointPosition = (endpoint: string): Vector3 | null => {
    const [id, name] = endpoint.split('.'), model = models.get(id), module = graph?.modules.find((item) => item.id === id)
    const port = module && getDefinition(module.type)?.ports.find((item) => item.id === name)
    return model && module && port ? model.localToWorld(portAnchor(module.type, port)) : null
  }
  const refreshWires = () => {
    disposeObject(wires); wires.clear()
    for (const connection of graph?.connections ?? []) {
      const a = endpointPosition(connection.source), b = endpointPosition(connection.destination)
      if (!a || !b) continue // Unknown imported endpoints remain in graph and Inspector.
      const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += Math.min(1.2, a.distanceTo(b) * 0.2 + 0.3)
      const curve = new QuadraticBezierCurve3(a, mid, b)
      const wire = new Mesh(new TubeGeometry(curve, 24, 0.035, 6, false), new MeshStandardMaterial({ color: '#71b3ce', roughness: 0.65 }))
      const pickLine = new Line(new BufferGeometry().setFromPoints(curve.getPoints(24)), new LineBasicMaterial()); pickLine.visible = false
      // Invisible ray target uses a pixel-scaled margin; electrical geometry stays unchanged.
      wire.userData = { kind: 'wire', ...connection }; pickLine.userData = { ...wire.userData }; wire.add(pickLine); wires.add(wire)
    }
  }
  const ray = (x: number, y: number) => { camera.updateMatrixWorld(); raycaster.params.Line.threshold = camera.position.distanceTo(controls?.target ?? viewTarget) * 2 * Math.tan(camera.fov * Math.PI / 360) / (height * camera.zoom) * 6; raycaster.setFromCamera(new Vector2(x / width * 2 - 1, -(y / height) * 2 + 1), camera) }
  const translateView = (delta: Vector3) => { camera.position.add(delta); (controls?.target ?? viewTarget).add(delta); camera.updateMatrixWorld(); controls?.update(); schedule() }
  let activeOutline: { id: string; group: Group } | null = null
  const removeActiveOutline = () => {
    if (activeOutline) {
      if (activeOutline.group.parent) activeOutline.group.parent.remove(activeOutline.group)
      disposeObject(activeOutline.group)
      activeOutline = null
    }
  }
  const createSelectionOutline = (size: [number, number, number]): Group => {
    const [w, h, d] = size
    const outline = new Group()
    outline.userData = { ignorePick: true, isOutline: true }
    const pad = 0.02
    const W = w + pad * 2, D = d + pad * 2
    const yBot = 0.015, yTop = h + 0.025
    const H = Math.max(0.05, yTop - yBot), yMid = (yTop + yBot) / 2
    const t = 0.038
    const outlineMat = new MeshStandardMaterial({
      color: '#fbbf24',
      emissive: '#f59e0b',
      emissiveIntensity: 1.0,
      roughness: 0.25,
      metalness: 0.15
    })
    const addBar = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
      const mesh = new Mesh(new BoxGeometry(sx, sy, sz), outlineMat)
      mesh.position.set(x, y, z)
      mesh.userData = { ignorePick: true }
      outline.add(mesh)
    }
    // Top perimeter loop
    addBar(0, yTop, -D / 2, W + t, t, t)
    addBar(0, yTop, D / 2, W + t, t, t)
    addBar(-W / 2, yTop, 0, t, t, D + t)
    addBar(W / 2, yTop, 0, t, t, D + t)
    // Bottom perimeter loop
    addBar(0, yBot, -D / 2, W + t, t, t)
    addBar(0, yBot, D / 2, W + t, t, t)
    addBar(-W / 2, yBot, 0, t, t, D + t)
    addBar(W / 2, yBot, 0, t, t, D + t)
    // 4 Vertical corner posts
    addBar(-W / 2, yMid, -D / 2, t, H, t)
    addBar(W / 2, yMid, -D / 2, t, H, t)
    addBar(-W / 2, yMid, D / 2, t, H, t)
    addBar(W / 2, yMid, D / 2, t, H, t)
    return outline
  }
  return {
    scene, camera, grid, models, wires,
    endpointPosition,
    syncGraph(next: CircuitGraph | null) {
      if (disposed) return
      graph = next
      const ids = new Set(next?.modules.map((module) => module.id))
      for (const [id, model] of models) if (!ids.has(id)) { disposeObject(model); content.remove(model); models.delete(id) }
      for (const module of next?.modules ?? []) {
        let model = models.get(module.id)
        const signature = JSON.stringify([module.type, module.properties])
        if (model && model.userData.signature !== signature) { disposeObject(model); content.remove(model); models.delete(module.id); model = undefined }
        if (!model) { model = buildComponent(module); models.set(module.id, model); content.add(model) }
        applyPose(model, module)
      }
      if (activeOutline) {
        if (!next || !next.modules.some((module) => module.id === activeOutline?.id)) {
          removeActiveOutline()
        } else {
          const model = models.get(activeOutline.id)
          if (model && !model.children.includes(activeOutline.group)) {
            model.add(activeOutline.group)
          }
        }
      }
      refreshWires(); schedule()
    },
    previewMove(id: string, position: Required<NonNullable<CircuitModule['position']>>) { const model = models.get(id); if (model && !disposed) { model.position.set(position.x, position.y, position.z); model.updateMatrixWorld(true); refreshWires(); schedule() } },
    setGhost(type: string | null, position?: Vector3) {
      if (ghost && type && position && ghost.userData.type === type) { ghost.position.copy(position); ghost.updateMatrixWorld(true); schedule(); return }
      if (ghost) { disposeObject(ghost); scene.remove(ghost); ghost = null }
      if (type && position && getDefinition(type)) {
        ghost = buildComponent({ id: 'PLACE', type, position }); ghost.userData.type = type
        ghost.traverse((object) => {
          if (object instanceof Mesh) {
            const mats = Array.isArray(object.material) ? object.material : [object.material]
            mats.forEach((m) => { if ('transparent' in m) { m.transparent = true; m.opacity = 0.4 } })
          }
        })
        scene.add(ghost)
      }
      schedule()
    },
    highlight(id: string | null, wire?: { source: string; destination: string } | null) {
      if (activeOutline && activeOutline.id !== id) removeActiveOutline()
      if (id && (!activeOutline || activeOutline.id !== id)) {
        const model = models.get(id)
        if (model) {
          const size = (model.userData.size as [number, number, number] | undefined) ?? [1.5, 0.5, 1]
          const outline = createSelectionOutline(size)
          model.add(outline)
          activeOutline = { id, group: outline }
        }
      }
      models.forEach((model, key) => model.traverse((object) => {
        if (object instanceof Mesh && !object.userData.ignorePick) {
          const mats = Array.isArray(object.material) ? object.material : [object.material]
          const isBreadboard = typeof model.userData.type === 'string' && model.userData.type.startsWith('breadboard')
          mats.forEach((m) => { if ('emissive' in m) (m as MeshStandardMaterial).emissive.set(key === id ? (isBreadboard ? '#151311' : '#244639') : '#000000') })
        }
      }))
      wires.children.forEach((object) => { const mesh = object as Mesh; (mesh.material as MeshStandardMaterial).color.set(wire && object.userData.source === wire.source && object.userData.destination === wire.destination ? '#f1cd77' : '#71b3ce') })
      schedule()
    },
    pick(x: number, y: number): PickResult | null {
      if (disposed) return null
      scene.updateMatrixWorld(true); ray(x, y)
      const hits = raycaster.intersectObjects([...content.children, ...wires.children], true)
      for (const hit of hits) {
        if (hit.object.userData.ignorePick) continue
        let object = hit.object
        while (object.parent && !object.userData.kind) object = object.parent
        if (object.userData.kind) return { ...object.userData, point: hit.point.clone() } as PickResult
      }
      return null
    },
    groundPoint(x: number, y: number, elevation = 0) { if (disposed) return null; ray(x, y); plane.constant = -elevation; return raycaster.ray.intersectPlane(plane, new Vector3()) },
    panGrab(anchor: Vector3, x: number, y: number) {
      if (disposed || suspended) return
      ray(x, y); plane.constant = 0
      const current = raycaster.ray.intersectPlane(plane, new Vector3())
      if (current) translateView(anchor.clone().sub(current).setY(0))
    },
    lockPointer(value: boolean) { pointerLocked = value; if (controls) controls.enabled = !disposed && !suspended && !pointerLocked },
    orientationAxes(): OrientationAxis[] {
      const inverse = camera.quaternion.clone().invert()
      const axes = [
        { label: 'X' as const, direction: new Vector3(1, 0, 0), color: '#ff5a43' },
        { label: 'Y' as const, direction: new Vector3(0, 1, 0), color: '#00e676' },
        { label: 'Z' as const, direction: new Vector3(0, 0, 1), color: '#398bff' },
      ]
      return axes.map(({ label, direction, color }) => { direction.applyQuaternion(inverse); return { label, x: direction.x, y: -direction.y, depth: direction.z, color } }).sort((a, b) => a.depth - b.depth)
    },
    project(point: Vector3) { camera.updateMatrixWorld(); const p = point.clone().project(camera); return { x: (p.x + 1) * width / 2, y: (1 - p.y) * height / 2, visible: p.z >= -1 && p.z <= 1 && Math.abs(p.x) < 1 && Math.abs(p.y) < 1 } },
    resize(w: number, h: number) { if (disposed) return; visible = w > 0 && h > 0; if (!visible) { if (frame !== null) cancelFrame(frame); frame = null; return }; width = w; height = h; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); schedule() },
    setZoom(percent: number) { if (disposed) return; camera.zoom = Math.min(200, Math.max(50, percent)) / 100; camera.updateProjectionMatrix(); schedule() },
    orbit(degrees: number) { if (disposed || !Number.isFinite(degrees)) return; const target = controls?.target ?? viewTarget; camera.position.sub(target).applyAxisAngle(new Vector3(0, 1, 0), degrees * Math.PI / 180).add(target); camera.lookAt(target); controls?.update(); schedule() },
    pan(horizontal: number, forward: number) {
      if (disposed || !Number.isFinite(horizontal) || !Number.isFinite(forward)) return
      camera.updateMatrixWorld()
      const right = new Vector3().setFromMatrixColumn(camera.matrixWorld, 0).setY(0).normalize()
      const ahead = new Vector3().crossVectors(new Vector3(0, 1, 0), right)
      translateView(right.multiplyScalar(horizontal).add(ahead.multiplyScalar(-forward)))
    },
    resetView() { if (disposed) return; controls?.reset(); viewTarget.set(0, 0, 0); camera.position.set(0, 11, 10); controls?.target.set(0, 0, 0); camera.lookAt(0, 0, 0); camera.zoom = 1; camera.updateProjectionMatrix(); controls?.update(); schedule() },
    suspend(value: boolean) { suspended = value; if (value && frame !== null) { cancelFrame(frame); frame = null }; if (controls) controls.enabled = !disposed && !value && !pointerLocked; if (!value) schedule() },
    dispose() { if (disposed) return; disposed = true; if (frame !== null) cancelFrame(frame); frame = null; controls?.removeEventListener('change', schedule); controls?.dispose(); removeActiveOutline(); disposeObject(scene); models.clear(); scene.clear(); renderer.dispose() },
  }
}
