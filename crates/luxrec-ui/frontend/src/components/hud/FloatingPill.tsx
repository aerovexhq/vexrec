import React from "react";
import { Crop, Monitor, Settings, GripVertical } from "lucide-react";
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
    <div
      data-tauri-drag-region
      className="glass-pill flex items-center gap-2.5 px-3 py-2 rounded-full cursor-move"
      style={{ width: "470px" }}
    >
      {/* Drag handle icon */}
      <div className="text-neutral-500 hover:text-neutral-400 pl-0.5 pointer-events-none">
        <GripVertical className="w-4 h-4" />
      </div>

      {/* Mode Switcher */}
      <ModeSelector />

      {/* Target Selector (Area vs Fullscreen) */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => setTarget("area")}
          title="Select Region"
          className={`p-1.5 rounded-md tactile-btn ${
            target === "area"
              ? "bg-surface-active text-neutral-100"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Crop className="w-4 h-4" />
        </button>

        <button
          onClick={() => setTarget("fullscreen")}
          title="Full Display"
          className={`p-1.5 rounded-md tactile-btn ${
            target === "fullscreen"
              ? "bg-surface-active text-neutral-100"
              : "text-neutral-400 hover:text-neutral-200"
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>
      </div>

      {/* Hardware / Audio / Camera Toggles */}
      <DeviceToggles />

      {/* Action Trigger Button */}
      <button
        onClick={onTriggerAction}
        className={`flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-full font-medium text-xs transition-all ${
          mode === "capture"
            ? "bg-white text-neutral-950 hover:bg-neutral-200 shadow-sm"
            : "bg-accent-record text-white hover:bg-accent-record-hover shadow-sm"
        }`}
      >
        <span>{mode === "capture" ? "Capture" : "Record"}</span>
        <span className="kbd-hint">{mode === "capture" ? "↵" : "␣"}</span>
      </button>

      {/* Settings */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-200 tactile-btn"
      >
        <Settings className="w-4 h-4" />
      </button>
    </div>
  );
};
