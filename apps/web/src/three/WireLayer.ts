import { BufferGeometry, Group, Line, LineBasicMaterial, Mesh, MeshStandardMaterial, QuadraticBezierCurve3, TubeGeometry, Vector3 } from 'three'
import type { CircuitConnection } from '../types/circuit'
import { disposeObject } from './ComponentModel'

interface WireRecord { mesh: Mesh<TubeGeometry, MeshStandardMaterial>; pick: Line; start: Vector3; end: Vector3 }
const keyOf = (connection: CircuitConnection) => JSON.stringify([connection.source, connection.destination])

// Reconcile logical connections independently of model/property synchronization.
export function createWireLayer(endpointPosition: (endpoint: string) => Vector3 | null) {
  const group = new Group(), records = new Map<string, WireRecord>()
  const incident = new Map<string, Map<string, CircuitConnection>>()
  let selected: { source: string; destination: string } | null = null
  const color = (connection: CircuitConnection) => selected?.source === connection.source && selected.destination === connection.destination ? '#f1cd77' : '#71b3ce'
  const remove = (key: string) => {
    const record = records.get(key)
    if (record) { group.remove(record.mesh); disposeObject(record.mesh); records.delete(key) }
  }
  const update = (connection: CircuitConnection) => {
    const key = keyOf(connection), a = endpointPosition(connection.source), b = endpointPosition(connection.destination)
    if (!a || !b) { remove(key); return } // Preserve unknown imported endpoints in the logical graph.
    const record = records.get(key)
    if (record && record.start.equals(a) && record.end.equals(b)) return
    const mid = a.clone().add(b).multiplyScalar(0.5); mid.y += Math.min(1.2, a.distanceTo(b) * 0.2 + 0.3)
    const curve = new QuadraticBezierCurve3(a, mid, b), geometry = new TubeGeometry(curve, 24, 0.035, 6, false)
    const pickGeometry = new BufferGeometry().setFromPoints(curve.getPoints(24))
    if (record) {
      record.mesh.geometry.dispose(); record.pick.geometry.dispose()
      record.mesh.geometry = geometry; record.pick.geometry = pickGeometry
      record.start.copy(a); record.end.copy(b)
    } else {
      const mesh = new Mesh(geometry, new MeshStandardMaterial({ color: color(connection), roughness: 0.65 }))
      const pick = new Line(pickGeometry, new LineBasicMaterial()); pick.visible = false
      // Invisible ray target provides a CSS-pixel margin without changing electrical geometry.
      mesh.userData = { kind: 'wire', source: connection.source, destination: connection.destination }; pick.userData = { ...mesh.userData }
      mesh.add(pick); group.add(mesh); records.set(key, { mesh, pick, start: a.clone(), end: b.clone() })
    }
  }
  return {
    group,
    sync(connections: CircuitConnection[]) {
      const keys = new Set(connections.map(keyOf))
      for (const key of records.keys()) if (!keys.has(key)) remove(key)
      incident.clear()
      for (const connection of connections) {
        const key = keyOf(connection)
        for (const endpoint of [connection.source, connection.destination]) {
          const id = endpoint.split('.')[0]
          let links = incident.get(id)
          if (!links) { links = new Map(); incident.set(id, links) }
          links.set(key, connection)
        }
        update(connection)
      }
    },
    updateModule(id: string) { for (const connection of incident.get(id)?.values() ?? []) update(connection) },
    highlight(connection?: { source: string; destination: string } | null) {
      selected = connection ? { ...connection } : null
      for (const record of records.values()) record.mesh.material.color.set(color(record.mesh.userData as CircuitConnection))
    },
    dispose() { for (const key of records.keys()) remove(key); incident.clear(); selected = null },
  }
}
