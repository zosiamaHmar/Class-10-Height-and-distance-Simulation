export const SCALE = 130; // px per meter
export const STATUE_HEIGHT_M = 1.6;
const SQRT3 = Math.sqrt(3);
export const PEDESTAL_HEIGHT_M = STATUE_HEIGHT_M / (SQRT3 - 1);
export const DISTANCE_M = PEDESTAL_HEIGHT_M;

export const EYE_X = 300;
export const GROUND_Y = 780;
export const PEDESTAL_HEIGHT_PX = PEDESTAL_HEIGHT_M * SCALE;
export const STATUE_HEIGHT_PX = STATUE_HEIGHT_M * SCALE;
export const DISTANCE_PX = DISTANCE_M * SCALE;
export const PEDESTAL_TOP_X = EYE_X + DISTANCE_PX;

export const ANGLE_PEDESTAL_DEG =
  (Math.atan2(PEDESTAL_HEIGHT_PX, DISTANCE_PX) * 180) / Math.PI;
export const ANGLE_STATUE_DEG =
  (Math.atan2(PEDESTAL_HEIGHT_PX + STATUE_HEIGHT_PX, DISTANCE_PX) * 180) /
  Math.PI;

export const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const arcPath = (
  cx: number,
  cy: number,
  r: number,
  fromDeg: number,
  toDeg: number,
  progress: number,
  steps = 48,
) => {
  const p = clamp01(progress);
  const endDeg = fromDeg + (toDeg - fromDeg) * p;
  const n = Math.max(1, Math.round(steps * p));
  const points: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const t = fromDeg + (endDeg - fromDeg) * (i / n);
    const rad = (t * Math.PI) / 180;
    points.push([cx + r * Math.cos(rad), cy - r * Math.sin(rad)]);
  }
  return points
    .map((point, i) => `${i === 0 ? "M" : "L"}${point[0].toFixed(2)} ${point[1].toFixed(2)}`)
    .join(" ");
};

export const lerpPoint = (
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  progress: number,
) => {
  const p = clamp01(progress);
  return [fromX + (toX - fromX) * p, fromY + (toY - fromY) * p] as const;
};
