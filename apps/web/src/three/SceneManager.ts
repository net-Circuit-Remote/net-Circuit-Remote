import { Color, GridHelper, PerspectiveCamera, Scene } from 'three'

export interface SceneRenderer {
  setSize(width: number, height: number, updateStyle?: boolean): void
  render(scene: Scene, camera: PerspectiveCamera): void
  dispose(): void
}
interface SceneOptions {
  renderer: SceneRenderer
  requestFrame?: (callback: FrameRequestCallback) => number
  cancelFrame?: (id: number) => void
}

// Graphics ownership only. No geometry is an electrical node or logical module.
export function createSceneManager({ renderer, requestFrame = requestAnimationFrame, cancelFrame = cancelAnimationFrame }: SceneOptions) {
  const scene = new Scene()
  scene.background = new Color('#101925')
  const camera = new PerspectiveCamera(42, 1, 0.1, 100)
  camera.position.set(0, 11, 10)
  camera.lookAt(0, 0, 0)
  const grid = new GridHelper(30, 60, '#415a70', '#253747')
  scene.add(grid)
  let frame: number | null = null
  let disposed = false
  let visible = false
  const schedule = () => {
    if (disposed || !visible || frame !== null) return
    frame = requestFrame(() => { frame = null; if (!disposed && visible) renderer.render(scene, camera) })
  }
  return {
    grid,
    resize(width: number, height: number) {
      if (disposed) return
      visible = width > 0 && height > 0
      if (!visible) return
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      schedule()
    },
    setZoom(percent: number) {
      if (disposed) return
      camera.zoom = Math.min(200, Math.max(50, percent)) / 100
      camera.updateProjectionMatrix()
      schedule()
    },
    dispose() {
      if (disposed) return
      disposed = true
      if (frame !== null) cancelFrame(frame)
      frame = null
      grid.geometry.dispose()
      const materials = Array.isArray(grid.material) ? grid.material : [grid.material]
      materials.forEach((material) => material.dispose())
      scene.clear()
      renderer.dispose()
    },
  }
}
