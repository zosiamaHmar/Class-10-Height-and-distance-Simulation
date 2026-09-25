import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const Scene5Master: React.FC = () => {
  const frame = useCurrentFrame();

  const clamped = (range: [number, number]) =>
    interpolate(frame, range, [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

  const headingOpacity = clamped([0, 20]);
  const bodyOpacity = clamped([18, 38]);
  const answerOpacity = clamped([50, 70]);
  const brandOpacity = clamped([95, 120]);
  const fadeOut = 1 - clamped([135, 150]);

  return (
    <AbsoluteFill
      style={{
        background: "#FAFAF5",
        fontFamily: 'Georgia, "Times New Roman", serif',
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        opacity: fadeOut,
        padding: 140,
      }}
    >
      <div
        style={{
          fontSize: 60,
          fontWeight: 700,
          color: "#1C1917",
          opacity: headingOpacity,
          marginBottom: 28,
        }}
      >
        Now Try This
      </div>
      <div
        style={{
          fontSize: 38,
          color: "#1C1917",
          textAlign: "center",
          maxWidth: 1200,
          lineHeight: 1.5,
          opacity: bodyOpacity,
        }}
      >
        If the statue were 2.0 m tall, with angles 45° and 65°, the same
        method finds the pedestal height:
      </div>
      <div
        style={{
          marginTop: 32,
          background: "#E9F0EA",
          borderRadius: 24,
          padding: "24px 44px",
          fontFamily: "'Courier New', monospace",
          fontSize: 36,
          color: "#2A7C6F",
          opacity: answerOpacity,
        }}
      >
        h = 2.0 / (tan 65° − 1) ≈ 1.75 m
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 90,
          fontSize: 28,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#6B6560",
          opacity: brandOpacity,
        }}
      >
        APEX-EDU · Height &amp; Distance Series
      </div>
    </AbsoluteFill>
  );
};
