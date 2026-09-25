import React from "react";
import {
  ANGLE_PEDESTAL_DEG,
  ANGLE_STATUE_DEG,
  DISTANCE_PX,
  EYE_X,
  GROUND_Y,
  PEDESTAL_HEIGHT_PX,
  PEDESTAL_TOP_X,
  STATUE_HEIGHT_PX,
  arcPath,
  clamp01,
  lerpPoint,
} from "./geometry";

const INK = "#1C1917";
const ACCENT = "#3B5B8C";
const ACCENT_WARM = "#C4622D";
const HIGHLIGHT = "#D4A843";

export type DiagramProps = {
  pedestalProgress: number;
  statueProgress: number;
  sightlinePedProgress?: number;
  sightlineStatProgress?: number;
  anglePedProgress?: number;
  angleStatProgress?: number;
  showLabels?: boolean;
  showQuestionMarks?: boolean;
  glow?: number;
  dimmed?: boolean;
};

export const Diagram: React.FC<DiagramProps> = ({
  pedestalProgress,
  statueProgress,
  sightlinePedProgress = 0,
  sightlineStatProgress = 0,
  anglePedProgress = 0,
  angleStatProgress = 0,
  showLabels = false,
  showQuestionMarks = false,
  glow = 0,
  dimmed = false,
}) => {
  const pedestalH = PEDESTAL_HEIGHT_PX * clamp01(pedestalProgress);
  const pedestalTopY = GROUND_Y - pedestalH;
  const statueH = STATUE_HEIGHT_PX * clamp01(statueProgress);
  const statueTopY = pedestalTopY - statueH;
  const pedestalHalfWidth = 60;

  const [pedSightX, pedSightY] = lerpPoint(
    EYE_X,
    GROUND_Y,
    PEDESTAL_TOP_X,
    GROUND_Y - PEDESTAL_HEIGHT_PX,
    sightlinePedProgress,
  );
  const [statSightX, statSightY] = lerpPoint(
    EYE_X,
    GROUND_Y,
    PEDESTAL_TOP_X,
    GROUND_Y - PEDESTAL_HEIGHT_PX - STATUE_HEIGHT_PX,
    sightlineStatProgress,
  );

  return (
    <svg
      viewBox="0 0 1600 900"
      width="100%"
      height="100%"
      style={{ opacity: dimmed ? 0.35 : 1 }}
    >
      <rect x={0} y={GROUND_Y} width={1600} height={12} fill="#C5B59B" />
      <line
        x1={0}
        y1={GROUND_Y}
        x2={1600}
        y2={GROUND_Y}
        stroke="#8B7A6B"
        strokeWidth={3}
      />

      {/* observer */}
      <circle cx={EYE_X} cy={GROUND_Y - 10} r={16} fill={ACCENT} />
      <circle cx={EYE_X - 4} cy={GROUND_Y - 16} r={2.6} fill="white" />
      <circle cx={EYE_X + 4} cy={GROUND_Y - 16} r={2.6} fill="white" />
      <rect
        x={EYE_X - 10}
        y={GROUND_Y - 2}
        width={20}
        height={30}
        rx={6}
        fill={ACCENT}
      />

      {/* pedestal */}
      <rect
        x={PEDESTAL_TOP_X - pedestalHalfWidth}
        y={pedestalTopY}
        width={pedestalHalfWidth * 2}
        height={pedestalH}
        fill="#BCAA7A"
        style={{
          filter:
            glow > 0
              ? `drop-shadow(0 0 ${18 * glow}px rgba(212,168,67,${glow}))`
              : undefined,
        }}
      />
      <rect
        x={PEDESTAL_TOP_X - pedestalHalfWidth + 8}
        y={pedestalTopY - 8}
        width={pedestalHalfWidth * 2 - 16}
        height={16}
        fill="#B8926C"
      />

      {/* statue */}
      <rect
        x={PEDESTAL_TOP_X - 24}
        y={statueTopY}
        width={48}
        height={statueH}
        fill="#8B6C42"
      />
      <circle
        cx={PEDESTAL_TOP_X}
        cy={statueTopY - 16}
        r={18}
        fill={HIGHLIGHT}
      />

      {sightlinePedProgress > 0 ? (
        <line
          x1={EYE_X}
          y1={GROUND_Y - 10}
          x2={pedSightX}
          y2={pedSightY}
          stroke={ACCENT}
          strokeWidth={3}
          strokeDasharray="10 8"
        />
      ) : null}
      {sightlineStatProgress > 0 ? (
        <line
          x1={EYE_X}
          y1={GROUND_Y - 10}
          x2={statSightX}
          y2={statSightY}
          stroke={ACCENT_WARM}
          strokeWidth={3}
          strokeDasharray="10 8"
        />
      ) : null}
      {sightlinePedProgress > 0 || sightlineStatProgress > 0 ? (
        <line
          x1={EYE_X}
          y1={GROUND_Y - 10}
          x2={PEDESTAL_TOP_X}
          y2={GROUND_Y - 10}
          stroke={INK}
          strokeOpacity={0.35}
          strokeWidth={2}
          strokeDasharray="6 8"
        />
      ) : null}

      {anglePedProgress > 0 ? (
        <path
          d={arcPath(EYE_X, GROUND_Y - 10, 130, 0, ANGLE_PEDESTAL_DEG, anglePedProgress)}
          fill="none"
          stroke={ACCENT}
          strokeWidth={4}
        />
      ) : null}
      {angleStatProgress > 0 ? (
        <path
          d={arcPath(EYE_X, GROUND_Y - 10, 175, 0, ANGLE_STATUE_DEG, angleStatProgress)}
          fill="none"
          stroke={ACCENT_WARM}
          strokeWidth={4}
        />
      ) : null}

      {showLabels ? (
        <>
          <text
            x={EYE_X + 155}
            y={GROUND_Y - 40}
            fontFamily="Georgia, serif"
            fontSize={30}
            fontWeight={700}
            fill={ACCENT}
            opacity={anglePedProgress}
          >
            {ANGLE_PEDESTAL_DEG.toFixed(0)}°
          </text>
          <text
            x={EYE_X + 195}
            y={GROUND_Y - 100}
            fontFamily="Georgia, serif"
            fontSize={30}
            fontWeight={700}
            fill={ACCENT_WARM}
            opacity={angleStatProgress}
          >
            {ANGLE_STATUE_DEG.toFixed(0)}°
          </text>
          <text
            x={(EYE_X + PEDESTAL_TOP_X) / 2 - 30}
            y={GROUND_Y + 46}
            fontFamily="'Courier New', monospace"
            fontSize={28}
            fill={INK}
            opacity={Math.max(anglePedProgress, angleStatProgress)}
          >
            {showQuestionMarks ? "d = ?" : `d ≈ ${(DISTANCE_PX / 130).toFixed(2)} m`}
          </text>
          <text
            x={PEDESTAL_TOP_X + 44}
            y={pedestalTopY + pedestalH / 2}
            fontFamily="'Courier New', monospace"
            fontSize={28}
            fill={INK}
            opacity={pedestalProgress}
          >
            {showQuestionMarks ? "h = ?" : `h ≈ ${(PEDESTAL_HEIGHT_PX / 130).toFixed(2)} m`}
          </text>
          <text
            x={PEDESTAL_TOP_X + 44}
            y={statueTopY + statueH / 2}
            fontFamily="'Courier New', monospace"
            fontSize={26}
            fill={INK}
            opacity={statueProgress}
          >
            1.6 m
          </text>
        </>
      ) : null}
    </svg>
  );
};
