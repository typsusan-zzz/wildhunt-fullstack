export type SeededPoint = { x: number; z: number };

export function pointFromSeed(seed: number, index: number, radius: number): SeededPoint {
  const angle = ((seed + index * 9301) % 6283) / 1000;
  const distance = Math.sqrt(((seed + index * 49297) % 233280) / 233280) * radius;
  return { x: Math.cos(angle) * distance, z: Math.sin(angle) * distance };
}
