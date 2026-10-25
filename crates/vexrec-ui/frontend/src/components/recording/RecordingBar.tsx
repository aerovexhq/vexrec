import React from "react";
import { Pause, Play, Square, Trash2, GripVertical } from "lucide-react";
import { HudPill, Button } from "@aerovex/strata-ui";
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
    <HudPill
      status={isPaused ? "warning" : "recording"}
      statusLabel={isPaused ? "PAUSED" : "REC"}
      dragRegion={true}
      className="cursor-move gap-3 px-3 py-1.5"
      controls={
        <div className="flex items-center gap-1.5">
          {/* Pause / Resume Button */}
          <Button
            variant="icon"
            onClick={onPauseResume}
            title={isPaused ? "Resume (Space)" : "Pause (Space)"}
            className="h-7 w-7 text-neutral-300 hover:text-white"
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </Button>

          {/* Stop and Save Button */}
          <Button
            variant="primary"
            onClick={onStop}
            title="Stop & Save (Esc / Enter)"
            className="h-7 px-3 text-xs bg-accent-record hover:bg-accent-record-hover text-white rounded-full flex items-center gap-1.5"
          >
            <Square className="w-3 h-3 fill-current" />
            <span>Stop</span>
          </Button>

          {/* Discard Button */}
          <Button
            variant="icon"
            onClick={onDiscard}
            title="Discard recording (Ctrl+Backspace)"
            className="h-7 w-7 text-muted hover:text-danger"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      }
    >
      <div className="flex items-center gap-2">
        <div className="text-muted pointer-events-none select-none pl-0.5">
          <GripVertical className="w-3.5 h-3.5 opacity-50" />
        </div>

        {/* Monospace Jitter-Free Timer */}
        <span className="font-mono text-xs font-semibold tracking-tight text-fg">
          {formatTime(elapsedSeconds)}
        </span>

        {/* Audio Meter */}
        <AudioMeter level={audioLevelLeft} />
      </div>
    </HudPill>
  );
};
