import React from "react";
import { Pause, Play, Square, Trash2, GripVertical } from "lucide-react";
import { AudioMeter } from "./AudioMeter";
import { useAppStore } from "../../store/useAppStore";

interface RecordingBarProps {
  onPauseResume: () => void;
  onStop: () => void;
  onDiscard: () => void;
}

export const RecordingBar: React.FC<RecordingBarProps> = ({
  onPauseResume,
  onStop,
  onDiscard,
}) => {
  const { recordingStatus, elapsedSeconds, audioLevelLeft } = useAppStore();

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isPaused = recordingStatus === "paused";

  return (
    <div
      data-tauri-drag-region
      className="glass-pill flex items-center justify-between gap-3 px-3 py-1.5 rounded-full cursor-move select-none"
      style={{ width: "300px" }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-neutral-500 pointer-events-none" />

        {/* Breathing recording dot */}
        <div className="relative flex items-center justify-center">
          <span
            className={`w-2 h-2 rounded-full ${
              isPaused ? "bg-amber-400" : "bg-accent-record animate-pulse-subtle"
            }`}
          />
        </div>

        {/* Monospace Jitter-Free Timer */}
        <span className="font-mono text-xs font-medium tracking-tight text-neutral-200">
          {formatTime(elapsedSeconds)}
        </span>

        {/* Audio Meter */}
        <AudioMeter level={audioLevelLeft} />
      </div>

      {/* Control Actions */}
      <div className="flex items-center gap-1">
        {/* Pause/Resume Button */}
        <button
          onClick={onPauseResume}
          title={isPaused ? "Resume (Space)" : "Pause (Space)"}
          className="p-1.5 rounded-md text-neutral-300 hover:text-white tactile-btn"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
        </button>

        {/* Stop and Save Button */}
        <button
          onClick={onStop}
          title="Stop & Save (Esc)"
          className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-record hover:bg-accent-record-hover text-white text-xs font-medium tactile-btn"
        >
          <Square className="w-3 h-3 fill-current" />
          <span>Stop</span>
        </button>

        {/* Discard Button */}
        <button
          onClick={onDiscard}
          title="Discard recording"
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 tactile-btn"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
