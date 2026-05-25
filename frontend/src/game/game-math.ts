import * as THREE from 'three';

export function randomPoint(radius: number) {
  const angle = Math.random() * Math.PI * 2;
  const distance = Math.sqrt(Math.random()) * radius;
  return new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
}

export function randomRingPoint(minRadius: number, maxRadius: number) {
  const angle = Math.random() * Math.PI * 2;
  const distance = randomRange(minRadius, maxRadius);
  return new THREE.Vector3(Math.cos(angle) * distance, 0, Math.sin(angle) * distance);
}

export function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function seededRandom(seed: number) {
  let value = Math.trunc(seed) || 1;
  return () => {
    value |= 0;
    value = (value + 0x6d2b79f5) | 0;
    let t = Math.imul(value ^ (value >>> 15), 1 | value);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function yawFromDirection(direction: THREE.Vector3, offset = 0) {
  return Math.atan2(direction.x, direction.z) + offset;
}

export function wrapAngle(angle: number) {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

export function lerpAngle(from: number, to: number, alpha: number) {
  return from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * alpha;
}

export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  return `${Math.floor(safe / 60).toString().padStart(2, '0')}:${(safe % 60).toString().padStart(2, '0')}`;
}
