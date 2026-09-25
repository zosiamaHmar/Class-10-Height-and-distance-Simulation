import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Diagram } from "./Diagram";

export const Scene1Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const titleOpacity = interpolate(frame, [0, 22], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const titleY = interpolate(frame, [0, 22], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const subtitleOpacity = interpolate(frame, [18, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardOpacity = interpolate(frame, [55, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cardY = interpolate(frame, [55, 80], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const diagramOpacity = interpolate(frame, [0, 45], [0, 0.32], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{ background: "#FAFAF5", fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <AbsoluteFill style={{ opacity: diagramOpacity }}>
        <Diagram
          pedestalProgress={1}
          statueProgress={1}
          sightlinePedProgress={1}
          sightlineStatProgress={1}
          anglePedProgress={1}
          angleStatProgress={1}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          padding: 120,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            color: "#1C1917",
            opacity: titleOpacity,
            translate: `0px ${titleY}px`,
            textAlign: "center",
          }}
        >
          The Statue on the Pedestal
        </div>
        <div
          style={{
            fontSize: 44,
            color: "#6B6560",
            marginTop: 24,
            opacity: subtitleOpacity,
            textAlign: "center",
          }}
        >
          A Height &amp; Distance puzzle in trigonometry
        </div>
        <div
          style={{
            marginTop: 56,
            maxWidth: 1180,
            background: "#F2EDE5",
            border: "1px solid #DDD5C8",
            borderRadius: 32,
            padding: "32px 48px",
            opacity: cardOpacity,
            translate: `0px ${cardY}px`,
            fontSize: 38,
            lineHeight: 1.5,
            color: "#1C1917",
            textAlign: "center",
          }}
        >
          From one point on the ground, the top of a pedestal appears at{" "}
          <strong style={{ color: "#3B5B8C" }}>45°</strong>, and the top of
          the statue on it appears at{" "}
          <strong style={{ color: "#C4622D" }}>60°</strong>.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
