import React from "react";
import { Camera, Video } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const ModeSelector: React.FC = () => {
  const { mode, setMode } = useAppStore();

  return (
    <div className="flex items-center p-0.5 rounded-full bg-surface border border-border/50">
      <button
        type="button"
        onClick={() => setMode("capture")}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
          mode === "capture"
            ? "bg-fg text-bg shadow-sm font-semibold"
            : "text-muted hover:text-fg"
        }`}
      >
        <Camera className="w-3.5 h-3.5" />
        <span>Capture</span>
      </button>

      <button
        type="button"
        onClick={() => setMode("record")}
        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
          mode === "record"
            ? "bg-accent-record text-white shadow-sm font-semibold"
            : "text-muted hover:text-fg"
        }`}
      >
        <Video className="w-3.5 h-3.5" />
        <span>Record</span>
      </button>
    </div>
  );
};
