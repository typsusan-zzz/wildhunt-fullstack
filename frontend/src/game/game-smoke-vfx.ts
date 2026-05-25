import * as THREE from 'three';

type SmokeParticle = {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
  velocity: THREE.Vector3;
  age: number;
  lifetime: number;
  startScale: number;
  endScale: number;
  startOpacity: number;
};

export class SmokeVfxSystem {
  private readonly particles: SmokeParticle[] = [];
  private readonly loader = new THREE.TextureLoader();
  private readonly scene: THREE.Scene;
  private texture: THREE.Texture;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.texture = createFallbackSmokeTexture();
    this.loader.load(
      '/textures/vfx/smoke.png',
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.texture = texture;
      },
      undefined,
      () => {
        this.texture = createFallbackSmokeTexture();
      },
    );
  }

  emit(position: THREE.Vector3, options: { count?: number; radius?: number; duration?: number } = {}) {
    const count = Math.round(options.count ?? 32);
    const radius = options.radius ?? 2.1;
    const duration = options.duration ?? 1.2;
    for (let i = 0; i < count; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.sqrt(Math.random()) * radius;
      const material = new THREE.SpriteMaterial({
        map: this.texture,
        color: 0xf0f0ea,
        transparent: true,
        opacity: 0.58,
        depthWrite: false,
      });
      const sprite = new THREE.Sprite(material);
      sprite.position.set(
        position.x + Math.cos(angle) * distance,
        position.y + 0.28 + Math.random() * 0.8,
        position.z + Math.sin(angle) * distance,
      );
      const startScale = 1.2 + Math.random() * 1.35;
      sprite.scale.setScalar(startScale);
      this.scene.add(sprite);
      this.particles.push({
        sprite,
        material,
        velocity: new THREE.Vector3(
          Math.cos(angle) * (0.65 + Math.random() * 1.25),
          1.55 + Math.random() * 1.4,
          Math.sin(angle) * (0.65 + Math.random() * 1.25),
        ),
        age: 0,
        lifetime: duration * (0.82 + Math.random() * 0.42),
        startScale,
        endScale: startScale * (2.1 + Math.random() * 0.9),
        startOpacity: 0.42 + Math.random() * 0.24,
      });
    }
  }

  update(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) {
      const particle = this.particles[i];
      particle.age += dt;
      const t = Math.min(1, particle.age / particle.lifetime);
      particle.sprite.position.addScaledVector(particle.velocity, dt);
      particle.sprite.position.x += Math.sin((particle.age + i) * 5.1) * 0.018;
      particle.sprite.position.z += Math.cos((particle.age + i) * 4.7) * 0.018;
      const scale = THREE.MathUtils.lerp(particle.startScale, particle.endScale, t);
      particle.sprite.scale.setScalar(scale);
      particle.material.opacity = particle.startOpacity * Math.pow(1 - t, 1.55);
      if (t >= 1) this.removeParticle(i);
    }
  }

  clear() {
    for (let i = this.particles.length - 1; i >= 0; i -= 1) this.removeParticle(i);
  }

  dispose() {
    this.clear();
    this.texture.dispose();
  }

  private removeParticle(index: number) {
    const [particle] = this.particles.splice(index, 1);
    this.scene.remove(particle.sprite);
    particle.material.dispose();
  }
}

function createFallbackSmokeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(64, 64, 4, 64, 64, 58);
    gradient.addColorStop(0, 'rgba(245, 245, 238, 0.78)');
    gradient.addColorStop(0.42, 'rgba(210, 212, 205, 0.46)');
    gradient.addColorStop(1, 'rgba(190, 196, 188, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
