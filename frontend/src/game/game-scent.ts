import * as THREE from 'three';
import type { TerrainSampler } from './game-terrain-sampler';

type ScentWindUniforms = {
  time: { value: number };
  windDirection: { value: THREE.Vector2 };
};

export class ScentTrailSystem {
  private readonly maxParticles = 520;
  private readonly geometry = new THREE.BufferGeometry();
  private readonly positions = new Float32Array(this.maxParticles * 3);
  private readonly alphas = new Float32Array(this.maxParticles);
  private readonly sizes = new Float32Array(this.maxParticles);
  private readonly particles = Array.from({ length: this.maxParticles }, () => ({
    active: false,
    age: 0,
    life: 1,
    origin: new THREE.Vector3(),
    velocity: new THREE.Vector3(),
    phase: 0,
    size: 1,
  }));
  private readonly points: THREE.Points;
  private readonly sampler: TerrainSampler;
  private readonly windUniforms: ScentWindUniforms;
  private readonly randomRange: (min: number, max: number) => number;

  constructor(
    sceneRef: THREE.Scene,
    sampler: TerrainSampler,
    windUniforms: ScentWindUniforms,
    randomRange: (min: number, max: number) => number,
  ) {
    this.sampler = sampler;
    this.windUniforms = windUniforms;
    this.randomRange = randomRange;
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1));
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1));
    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      uniforms: { time: windUniforms.time },
      vertexShader: `
        attribute float aAlpha;
        attribute float aSize;
        varying float vAlpha;
        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (36.0 / max(18.0, -mvPosition.z));
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        void main() {
          vec2 uv = gl_PointCoord - 0.5;
          float soft = smoothstep(0.5, 0.05, length(uv));
          gl_FragColor = vec4(0.62, 0.86, 0.92, soft * vAlpha * 0.66);
        }
      `,
    });
    this.points = new THREE.Points(this.geometry, material);
    this.points.frustumCulled = false;
    sceneRef.add(this.points);
  }

  emit(from: THREE.Vector3, to: THREE.Vector3, intensity: number) {
    const dir = new THREE.Vector3().subVectors(to, from).setY(0);
    if (dir.lengthSq() < 0.001) dir.set(1, 0, 0);
    dir.normalize();
    const count = Math.round(THREE.MathUtils.clamp(90 * intensity, 48, 120));
    const side = new THREE.Vector3(-dir.z, 0, dir.x);
    for (let i = 0; i < count; i += 1) {
      const particle = this.particles.find((item) => !item.active);
      if (!particle) break;
      const nearBurst = i < count * 0.42;
      const t = nearBurst ? this.randomRange(0.04, 0.18) : Math.pow(Math.random(), 0.72) * 0.86;
      const curve = Math.sin(t * Math.PI * 2 + intensity * 1.7) * (nearBurst ? 1.2 : 4.2);
      particle.active = true;
      particle.age = 0;
      particle.life = this.randomRange(8, 11);
      particle.origin.copy(from).addScaledVector(dir, nearBurst ? this.randomRange(4, 14) : t * Math.min(72, from.distanceTo(to)));
      particle.origin.addScaledVector(side, curve + this.randomRange(-1.4, 1.4));
      particle.origin.y = this.sampler.sampleHeight(particle.origin.x, particle.origin.z) + this.randomRange(0.8, 2.6);
      particle.velocity.set(dir.x * this.randomRange(0.42, 1.1), this.randomRange(0.04, 0.2), dir.z * this.randomRange(0.42, 1.1));
      particle.velocity.x += this.windUniforms.windDirection.value.x * 0.34;
      particle.velocity.z += this.windUniforms.windDirection.value.y * 0.34;
      particle.phase = this.randomRange(0, Math.PI * 2);
      particle.size = this.randomRange(12, 28) * (0.78 + intensity * 0.42);
    }
  }

  update(dt: number) {
    let visible = 0;
    for (const particle of this.particles) {
      if (!particle.active) continue;
      particle.age += dt;
      if (particle.age >= particle.life) {
        particle.active = false;
        continue;
      }
      const wobble = Math.sin(particle.age * 2.4 + particle.phase);
      const fade = 1 - particle.age / particle.life;
      const i3 = visible * 3;
      this.positions[i3] = particle.origin.x + particle.velocity.x * particle.age + wobble * 0.85;
      this.positions[i3 + 1] = particle.origin.y + particle.velocity.y * particle.age + Math.sin(particle.age * 1.7 + particle.phase) * 0.28;
      this.positions[i3 + 2] = particle.origin.z + particle.velocity.z * particle.age + Math.cos(particle.age * 2.1 + particle.phase) * 0.85;
      this.alphas[visible] = Math.pow(fade, 1.35) * 0.52;
      this.sizes[visible] = particle.size * (0.7 + (1 - fade) * 0.8);
      visible += 1;
    }
    this.geometry.setDrawRange(0, visible);
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.attributes.aAlpha.needsUpdate = true;
    this.geometry.attributes.aSize.needsUpdate = true;
  }
}
