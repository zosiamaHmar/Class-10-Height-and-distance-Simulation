import React from "react";

export const Caption: React.FC<{
  children: React.ReactNode;
  opacity: number;
}> = ({ children, opacity }) => (
  <div
    style={{
      position: "absolute",
      left: 120,
      right: 120,
      bottom: 90,
      textAlign: "center",
      fontSize: 34,
      fontStyle: "italic",
      color: "#6B6560",
      opacity,
    }}
  >
    {children}
  </div>
);
