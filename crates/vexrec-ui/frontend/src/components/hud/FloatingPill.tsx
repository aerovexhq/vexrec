import React from "react";
import { Crop, Monitor, Settings, GripVertical } from "lucide-react";
import { HudPill, Button } from "@aerovex/strata-ui";
import { ModeSelector } from "./ModeSelector";
import { DeviceToggles } from "./DeviceToggles";
import { useAppStore } from "../../store/useAppStore";

interface FloatingPillProps {
  onTriggerAction: () => void;
  onOpenSettings: () => void;
}

export const FloatingPill: React.FC<FloatingPillProps> = ({
  onTriggerAction,
  onOpenSettings,
}) => {
  const { mode, target, setTarget } = useAppStore();

  return (
    <HudPill
      dragRegion={true}
      className="gap-2 px-3 py-2 cursor-move"
      controls={
        <div className="flex items-center gap-2">
          {/* Action Trigger Button */}
          <Button
            variant={mode === "record" ? "primary" : "secondary"}
            onClick={onTriggerAction}
            className={`h-8 px-4 text-xs font-medium rounded-full ${
              mode === "record"
                ? "bg-accent-record text-white hover:bg-accent-record-hover"
                : "bg-fg text-bg hover:brightness-110"
            }`}
          >
            <span>{mode === "capture" ? "Capture" : "Record"}</span>
            <span className="opacity-60 text-[10px] font-mono ml-1">
              {mode === "capture" ? "Enter" : "Space"}
            </span>
          </Button>

          {/* Settings */}
          <Button
            variant="icon"
            onClick={onOpenSettings}
            className="h-8 w-8 text-muted hover:text-fg hover:bg-raised"
            title="Settings (Ctrl+,)"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      }
    >
      {/* Drag handle icon */}
      <div className="text-muted hover:text-fg pl-0.5 pointer-events-none select-none">
        <GripVertical className="w-4 h-4 opacity-50" />
      </div>

      {/* Mode Switcher */}
      <ModeSelector />

      {/* Target Selector (Area vs Fullscreen) */}
      <div className="flex items-center gap-1 p-0.5 rounded-lg bg-surface border border-border/40">
        <button
          type="button"
          onClick={() => setTarget("area")}
          title="Area selection"
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            target === "area"
              ? "bg-raised text-fg shadow-sm"
              : "text-muted hover:text-fg"
          }`}
        >
          <Crop className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setTarget("fullscreen")}
          title="Fullscreen display"
          className={`p-1.5 rounded-md transition-all cursor-pointer ${
            target === "fullscreen"
              ? "bg-raised text-fg shadow-sm"
              : "text-muted hover:text-fg"
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hardware / Audio / Camera Toggles */}
      <DeviceToggles />
    </HudPill>
  );
};
