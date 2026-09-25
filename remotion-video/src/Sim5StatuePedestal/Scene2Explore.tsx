import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Diagram } from "./Diagram";
import { Caption } from "./Caption";

export const Scene2Explore: React.FC = () => {
  const frame = useCurrentFrame();

  const clamped = (range: [number, number]) =>
    interpolate(frame, range, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const pedestalProgress = clamped([0, 55]);
  const statueProgress = clamped([50, 95]);
  const sightlinePedProgress = clamped([100, 128]);
  const anglePedProgress = clamped([110, 145]);
  const sightlineStatProgress = clamped([130, 158]);
  const angleStatProgress = clamped([148, 178]);
  const captionOpacity = clamped([0, 20]);
  const headingOpacity = clamped([0, 20]);

  return (
    <AbsoluteFill
      style={{ background: "#FAFAF5", fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <div
        style={{
          position: "absolute",
          top: 90,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 54,
          fontWeight: 700,
          color: "#1C1917",
          opacity: headingOpacity,
        }}
      >
        Building the Picture
      </div>
      <AbsoluteFill style={{ padding: "220px 140px 180px" }}>
        <Diagram
          pedestalProgress={pedestalProgress}
          statueProgress={statueProgress}
          sightlinePedProgress={sightlinePedProgress}
          sightlineStatProgress={sightlineStatProgress}
          anglePedProgress={anglePedProgress}
          angleStatProgress={angleStatProgress}
          showLabels
        />
      </AbsoluteFill>
      <Caption opacity={captionOpacity}>
        Two lines of sight from the same spot — one to the pedestal top, one
        to the statue's crown.
      </Caption>
    </AbsoluteFill>
  );
};
