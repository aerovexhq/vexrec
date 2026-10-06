import React from "react";

export const RecordingFrame: React.FC = () => {
  return (
    <div
      className="w-screen h-screen pointer-events-none select-none"
      style={{
        boxSizing: "border-box",
        border: "3px solid #ef4444",
        borderRadius: "4px",
        boxShadow: "0 0 10px rgba(239, 68, 68, 0.7), inset 0 0 10px rgba(239, 68, 68, 0.3)",
        background: "transparent",
      }}
    />
  );
};

export default RecordingFrame;
