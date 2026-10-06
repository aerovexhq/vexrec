import React from "react";
import { Camera, Video } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const ModeSelector: React.FC = () => {
  const { mode, setMode } = useAppStore();

  return (
    <div className="flex items-center p-1 rounded-full bg-surface-base border border-surface-border">
      <button
        onClick={() => setMode("capture")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          mode === "capture"
            ? "bg-neutral-100 text-neutral-900 shadow-sm"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-surface-hover"
        }`}
      >
        <Camera className="w-3.5 h-3.5" />
        <span>Capture</span>
      </button>

      <button
        onClick={() => setMode("record")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
          mode === "record"
            ? "bg-accent-record text-white shadow-sm"
            : "text-neutral-400 hover:text-neutral-200 hover:bg-surface-hover"
        }`}
      >
        <Video className="w-3.5 h-3.5" />
        <span>Record</span>
      </button>
    </div>
  );
};
