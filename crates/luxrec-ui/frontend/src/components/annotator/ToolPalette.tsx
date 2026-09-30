import React from "react";
import {
  MousePointer,
  ArrowUpRight,
  Square,
  Circle,
  EyeOff,
  Hash,
  Undo2,
  Redo2,
  Check,
  X,
} from "lucide-react";

export type ToolType = "select" | "arrow" | "rect" | "ellipse" | "blur" | "step";

interface ToolPaletteProps {
  activeTool: ToolType;
  activeColor: string;
  onSelectTool: (tool: ToolType) => void;
  onSelectColor: (color: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

const COLORS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#a855f7", // Purple
  "#ffffff", // White
];

export const ToolPalette: React.FC<ToolPaletteProps> = ({
  activeTool,
  activeColor,
  onSelectTool,
  onSelectColor,
  onUndo,
  onRedo,
  onFinish,
  onCancel,
}) => {
  return (
    <div className="glass-pill flex items-center gap-2 px-3 py-1.5 rounded-full shadow-modal border border-surface-border select-none">
      {/* Tool Selection Group */}
      <div className="flex items-center gap-1 pr-2 border-r border-surface-border">
        <button
          onClick={() => onSelectTool("select")}
          title="Select (V)"
          className={`p-1.5 rounded-md tactile-btn ${
            activeTool === "select" ? "bg-surface-active text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          <MousePointer className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool("arrow")}
          title="Arrow (A)"
          className={`p-1.5 rounded-md tactile-btn ${
            activeTool === "arrow" ? "bg-surface-active text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool("rect")}
          title="Rectangle (R)"
          className={`p-1.5 rounded-md tactile-btn ${
            activeTool === "rect" ? "bg-surface-active text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          <Square className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool("ellipse")}
          title="Ellipse (E)"
          className={`p-1.5 rounded-md tactile-btn ${
            activeTool === "ellipse" ? "bg-surface-active text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          <Circle className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool("blur")}
          title="Privacy Redaction / Blur (B)"
          className={`p-1.5 rounded-md tactile-btn ${
            activeTool === "blur" ? "bg-surface-active text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          <EyeOff className="w-4 h-4" />
        </button>

        <button
          onClick={() => onSelectTool("step")}
          title="Step Badge (S)"
          className={`p-1.5 rounded-md tactile-btn ${
            activeTool === "step" ? "bg-surface-active text-white" : "text-neutral-400 hover:text-white"
          }`}
        >
          <Hash className="w-4 h-4" />
        </button>
      </div>

      {/* Color Palette */}
      <div className="flex items-center gap-1.5 pr-2 border-r border-surface-border">
        {COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onSelectColor(c)}
            className={`w-3.5 h-3.5 rounded-full transition-transform ${
              activeColor === c ? "scale-125 ring-2 ring-white/50" : "hover:scale-110"
            }`}
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      {/* Undo / Redo */}
      <div className="flex items-center gap-1 pr-2 border-r border-surface-border">
        <button
          onClick={onUndo}
          title="Undo (Ctrl+Z)"
          className="p-1.5 rounded-md text-neutral-400 hover:text-white tactile-btn"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onRedo}
          title="Redo (Ctrl+Y)"
          className="p-1.5 rounded-md text-neutral-400 hover:text-white tactile-btn"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Done & Cancel */}
      <div className="flex items-center gap-1">
        <button
          onClick={onFinish}
          title="Save & Copy"
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white text-neutral-900 text-xs font-medium hover:bg-neutral-200 tactile-btn"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Done</span>
        </button>

        <button
          onClick={onCancel}
          title="Discard changes"
          className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-300 tactile-btn"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
