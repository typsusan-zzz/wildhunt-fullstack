import * as THREE from 'three';
import type { NatureCategory, PlaceOnTerrainOptions } from './game-scene-types';

type NatureBatcherOptions = {
  scene: THREE.Scene;
  templates: Map<NatureCategory, THREE.Object3D[]>;
  placeOnTerrain: (object: THREE.Object3D, options?: PlaceOnTerrainOptions) => void;
  terrainScaleVariation: (x: number, z: number) => number;
  randomRange: (min: number, max: number) => number;
};

export class NatureBatcher {
  private readonly batches = new Map<string, { mesh: THREE.Mesh; matrices: THREE.Matrix4[] }>();
  private readonly root = new THREE.Group();
  private readonly options: NatureBatcherOptions;

  constructor(options: NatureBatcherOptions) {
    this.options = options;
    this.root.name = 'nature-batches';
  }

  add(category: NatureCategory, point: THREE.Vector3, scale: number) {
    const templates = this.options.templates.get(category);
    if (!templates?.length) return;
    const templateIndex = Math.floor(Math.random() * templates.length);
    const template = templates[templateIndex];
    const root = new THREE.Object3D();
    root.position.copy(point);
    root.rotation.y = this.options.randomRange(0, Math.PI * 2);
    root.rotation.x = this.options.randomRange(-0.025, 0.025);
    root.rotation.z = this.options.randomRange(-0.025, 0.025);
    root.scale.setScalar(scale * this.options.terrainScaleVariation(point.x, point.z));
    this.options.placeOnTerrain(root, { mode: 'center', samples: 1, offset: 0.03, keepUpright: true });
    root.updateMatrixWorld(true);
    template.updateMatrixWorld(true);
    let meshIndex = 0;
    template.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const matrix = new THREE.Matrix4().multiplyMatrices(root.matrixWorld, child.matrixWorld);
      const key = `${category}:${templateIndex}:${meshIndex}`;
      const batch = this.batches.get(key) ?? { mesh: child, matrices: [] as THREE.Matrix4[] };
      batch.matrices.push(matrix);
      this.batches.set(key, batch);
      meshIndex += 1;
    });
  }

  flush() {
    if (!this.root.parent) this.options.scene.add(this.root);
    for (const { mesh, matrices } of this.batches.values()) {
      if (!matrices.length) continue;
      const material = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      const instanced = new THREE.InstancedMesh(mesh.geometry, material, matrices.length);
      instanced.name = `batch-${mesh.name || 'nature'}`;
      instanced.castShadow = false;
      instanced.receiveShadow = false;
      instanced.frustumCulled = true;
      matrices.forEach((matrix, index) => instanced.setMatrixAt(index, matrix));
      instanced.instanceMatrix.needsUpdate = true;
      this.root.add(instanced);
    }
    this.batches.clear();
  }
}
