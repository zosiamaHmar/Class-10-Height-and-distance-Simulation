import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Diagram } from "./Diagram";
import { PEDESTAL_HEIGHT_M, DISTANCE_M } from "./geometry";

const steps = [
  "Let h = pedestal height, d = distance from the point.",
  "tan 45° = h / d  ⇒  1 = h / d  ⇒  h = d",
  "tan 60° = (h + 1.6) / d",
  "Substitute d = h:  √3 = (h + 1.6) / h",
  "h√3 − h = 1.6  ⇒  h(√3 − 1) = 1.6",
  "h = 1.6 / (√3 − 1)",
];

export const Scene4Reveal: React.FC = () => {
  const frame = useCurrentFrame();

  const clamped = (range: [number, number]) =>
    interpolate(frame, range, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const headingOpacity = clamped([0, 20]);
  const answerFrame = 190;
  const glow = clamped([answerFrame, answerFrame + 30]);
  const answerScale = interpolate(
    frame,
    [answerFrame, answerFrame + 20],
    [0.85, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.spring({ damping: 10 }),
      output: "perceptual-scale",
    },
  );
  const answerOpacity = clamped([answerFrame, answerFrame + 15]);

  return (
    <AbsoluteFill
      style={{ background: "#FAFAF5", fontFamily: 'Georgia, "Times New Roman", serif' }}
    >
      <div
        style={{
          position: "absolute",
          top: 70,
          left: 0,
          right: 0,
          textAlign: "center",
          fontSize: 54,
          fontWeight: 700,
          color: "#1C1917",
          opacity: headingOpacity,
        }}
      >
        Solving with Trigonometry
      </div>

      <AbsoluteFill style={{ flexDirection: "row", padding: "190px 90px 90px" }}>
        <div style={{ flex: 1.1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 22 }}>
          {steps.map((step, i) => {
            const start = 10 + i * 28;
            const opacity = clamped([start, start + 18]);
            const x = interpolate(frame, [start, start + 18], [-30, 0], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });
            return (
              <div
                key={step}
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: 32,
                  color: i === steps.length - 1 ? "#3B5B8C" : "#1C1917",
                  fontWeight: i === steps.length - 1 ? 700 : 400,
                  background: "#F4EFE9",
                  border: "1px solid #E4DBCF",
                  borderRadius: 20,
                  padding: "16px 24px",
                  opacity,
                  translate: `${x}px 0px`,
                }}
              >
                {step}
              </div>
            );
          })}
          <div
            style={{
              fontSize: 46,
              fontWeight: 700,
              color: "#3B5B8C",
              opacity: answerOpacity,
              scale: answerScale,
              marginTop: 8,
            }}
          >
            h ≈ {PEDESTAL_HEIGHT_M.toFixed(2)} m &nbsp;|&nbsp; d ≈{" "}
            {DISTANCE_M.toFixed(2)} m
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Diagram
            pedestalProgress={1}
            statueProgress={1}
            sightlinePedProgress={1}
            sightlineStatProgress={1}
            anglePedProgress={1}
            angleStatProgress={1}
            showLabels
            glow={glow}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
