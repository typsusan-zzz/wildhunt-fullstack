import * as THREE from 'three';

export class TerrainSampler {
  private readonly sampleHeightAt: (x: number, z: number) => number;
  private readonly arenaRadius: number;
  private readonly defaultMaxSlope: number;

  constructor(
    sampleHeightAt: (x: number, z: number) => number,
    arenaRadius: number,
    defaultMaxSlope: number,
  ) {
    this.sampleHeightAt = sampleHeightAt;
    this.arenaRadius = arenaRadius;
    this.defaultMaxSlope = defaultMaxSlope;
  }

  sampleHeight(x: number, z: number) {
    return this.sampleHeightAt(x, z);
  }

  sampleNormal(x: number, z: number) {
    const e = 0.85;
    const left = this.sampleHeight(x - e, z);
    const right = this.sampleHeight(x + e, z);
    const down = this.sampleHeight(x, z - e);
    const up = this.sampleHeight(x, z + e);
    return new THREE.Vector3(left - right, e * 2, down - up).normalize();
  }

  sampleSlope(x: number, z: number) {
    return 1 - this.sampleNormal(x, z).y;
  }

  isWalkable(x: number, z: number, maxSlope = this.defaultMaxSlope) {
    return Math.hypot(x, z) <= this.arenaRadius + 3 && this.sampleSlope(x, z) <= maxSlope;
  }
}
