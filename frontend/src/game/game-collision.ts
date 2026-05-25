import * as THREE from 'three';
import type { Collider } from './game-scene-types';

export class SpatialHash {
  private readonly cells = new Map<string, Collider[]>();
  private readonly cellSize: number;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
  }

  clear() {
    this.cells.clear();
  }

  insert(collider: Collider) {
    const minX = Math.floor((collider.center.x - collider.radius) / this.cellSize);
    const maxX = Math.floor((collider.center.x + collider.radius) / this.cellSize);
    const minZ = Math.floor((collider.center.y - collider.radius) / this.cellSize);
    const maxZ = Math.floor((collider.center.y + collider.radius) / this.cellSize);
    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        const key = `${x},${z}`;
        const bucket = this.cells.get(key) ?? [];
        bucket.push(collider);
        this.cells.set(key, bucket);
      }
    }
  }

  query(center: THREE.Vector2, radius: number) {
    const found = new Set<Collider>();
    const minX = Math.floor((center.x - radius) / this.cellSize);
    const maxX = Math.floor((center.x + radius) / this.cellSize);
    const minZ = Math.floor((center.y - radius) / this.cellSize);
    const maxZ = Math.floor((center.y + radius) / this.cellSize);
    for (let x = minX; x <= maxX; x += 1) {
      for (let z = minZ; z <= maxZ; z += 1) {
        const bucket = this.cells.get(`${x},${z}`);
        if (!bucket) continue;
        for (const collider of bucket) found.add(collider);
      }
    }
    return [...found];
  }
}
