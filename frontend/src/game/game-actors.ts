export type RemoteActorSnapshot = {
  userId: string | number;
  x: number;
  z: number;
  yaw?: number;
};

export function interpolateActor(current: RemoteActorSnapshot, next: RemoteActorSnapshot, alpha: number): RemoteActorSnapshot {
  return {
    userId: next.userId,
    x: current.x + (next.x - current.x) * alpha,
    z: current.z + (next.z - current.z) * alpha,
    yaw: next.yaw ?? current.yaw,
  };
}
