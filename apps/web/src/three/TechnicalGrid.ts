import { Color, Mesh, PerspectiveCamera, PlaneGeometry, ShaderMaterial, Vector2, Vector3 } from 'three'

export function createTechnicalGrid() {
  const material = new ShaderMaterial({
    transparent: true, depthWrite: false, toneMapped: false,
    uniforms: {
      minorStep: { value: 0.5 }, majorStep: { value: 2.5 }, minorVisibility: { value: 1 },
      focus: { value: new Vector2() },
      minorColor: { value: new Color('#263a49') }, majorColor: { value: new Color('#3b5260') },
    },
    vertexShader: `
      varying vec3 world;
      void main() {
        vec4 positionWorld = modelMatrix * vec4(position, 1.0);
        world = positionWorld.xyz;
        gl_Position = projectionMatrix * viewMatrix * positionWorld;
      }
    `,
    fragmentShader: `
      varying vec3 world;
      uniform float minorStep, majorStep, minorVisibility;
      uniform vec2 focus;
      uniform vec3 minorColor, majorColor;
      float grid(float stepSize, float width) {
        vec2 cell = world.xz / stepSize;
        vec2 pixels = abs(fract(cell + 0.5) - 0.5) / max(fwidth(cell), vec2(0.00001));
        return 1.0 - smoothstep(width * 0.5, width * 0.5 + 1.0, min(pixels.x, pixels.y));
      }
      void main() {
        vec2 footprint = max(fwidth(world.xz), vec2(0.00001));
        float cellPixels = minorStep / max(footprint.x, footprint.y);
        float minor = grid(minorStep, 0.45) * minorVisibility * smoothstep(6.0, 14.0, cellPixels);
        float major = grid(majorStep, 0.8);
        float distanceFade = 1.0 - smoothstep(12.0, 52.0, distance(cameraPosition, world));
        float localFade = 1.0 - smoothstep(8.0, 38.0, distance(world.xz, focus));
        float fade = distanceFade * localFade;
        vec2 axisPixels = abs(world.xz) / footprint;
        float axis = (1.0 - smoothstep(0.3, 1.3, min(axisPixels.x, axisPixels.y))) * 0.12;
        float alpha = max(max(minor * 0.28, major * 0.48), axis) * fade;
        if (alpha < 0.002) discard;
        gl_FragColor = vec4(mix(minorColor, majorColor, step(minor * 0.28, major * 0.48)), alpha);
        #include <colorspace_fragment>
      }
    `,
  })
  const mesh = new Mesh(new PlaneGeometry(300, 300), material)
  mesh.rotation.x = -Math.PI / 2; mesh.position.y = -0.015; mesh.userData.ignorePick = true
  mesh.raycast = () => {}
  return mesh
}

// Global zoom suppression complements per-fragment derivative filtering toward the horizon.
export function updateTechnicalGrid(grid: ReturnType<typeof createTechnicalGrid>, camera: PerspectiveCamera, target: Vector3, focus: Vector3, height: number) {
  const distance = Math.max(0.1, camera.position.distanceTo(target))
  const pixels = 0.5 * height * camera.zoom / (2 * Math.tan(camera.fov * Math.PI / 360) * distance)
  const t = Math.min(1, Math.max(0, (pixels - 6) / 8))
  grid.material.uniforms.minorVisibility.value = t * t * (3 - 2 * t)
  grid.material.uniforms.focus.value.set(focus.x, focus.z)
  // Follow navigation without moving the world-aligned lattice or exposing plane edges.
  grid.position.x = Math.round(target.x / 20) * 20; grid.position.z = Math.round(target.z / 20) * 20
}
