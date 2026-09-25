import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Diagram } from "./Diagram";

const facts = [
  "Statue height = 1.6 m",
  "Angle to top of statue = 60°",
  "Angle to top of pedestal = 45°",
  "Find: height of the pedestal (h)",
];

export const Scene3Challenge: React.FC = () => {
  const frame = useCurrentFrame();

  const clamped = (range: [number, number]) =>
    interpolate(frame, range, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const headingOpacity = clamped([0, 20]);
  const cardOpacity = clamped([12, 32]);

  return (
    <AbsoluteFill
      style={{ background: "#FAFAF5", fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <AbsoluteFill style={{ opacity: 0.4, padding: "160px 140px 140px" }}>
        <Diagram
          pedestalProgress={1}
          statueProgress={1}
          sightlinePedProgress={1}
          sightlineStatProgress={1}
          anglePedProgress={1}
          angleStatProgress={1}
          showLabels
          showQuestionMarks
        />
      </AbsoluteFill>

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
        The Challenge
      </div>

      <div
        style={{
          position: "absolute",
          left: "50%",
          bottom: 110,
          translate: "-50% 0px",
          width: 1200,
          background: "white",
          borderRadius: 32,
          padding: "40px 56px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          opacity: cardOpacity,
        }}
      >
        {facts.map((fact, i) => {
          const start = 40 + i * 22;
          const opacity = clamped([start, start + 20]);
          const x = interpolate(frame, [start, start + 20], [-24, 0], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          return (
            <div
              key={fact}
              style={{
                fontSize: 34,
                color: i === facts.length - 1 ? "#C4622D" : "#1C1917",
                fontWeight: i === facts.length - 1 ? 700 : 400,
                opacity,
                translate: `${x}px 0px`,
                marginBottom: i === facts.length - 1 ? 0 : 14,
              }}
            >
              {i === facts.length - 1 ? "🏆 " : "• "}
              {fact}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
