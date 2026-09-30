import React, { useEffect, useState } from "react";
import { Copy, Download, Edit3, X, Check } from "lucide-react";
import { CaptureResult } from "../../types";

interface PreviewCardProps {
  capture: CaptureResult;
  onCopy: () => void;
  onSave: () => void;
  onAnnotate: () => void;
  onDismiss: () => void;
}

export const PreviewCard: React.FC<PreviewCardProps> = ({
  capture,
  onCopy,
  onSave,
  onAnnotate,
  onDismiss,
}) => {
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [paused, onDismiss]);

  const handleCopy = () => {
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="glass-panel w-72 rounded-xl overflow-hidden shadow-modal border border-surface-border text-xs animate-in slide-in-from-bottom-2 duration-200"
    >
      {/* Thumbnail and metadata */}
      <div className="relative h-32 bg-neutral-900 flex items-center justify-center overflow-hidden border-b border-surface-border">
        {capture.thumbnailUrl ? (
          <img
            src={capture.thumbnailUrl}
            alt="Captured"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-neutral-500 font-mono text-[10px]">
            {capture.width} × {capture.height} px
          </div>
        )}

        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Info & Action Bar */}
      <div className="p-2.5 flex items-center justify-between">
        <div className="font-mono text-[10px] text-neutral-400 truncate max-w-[120px]">
          {capture.filePath.split("/").pop()}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            className="p-1.5 rounded-md hover:bg-surface-hover text-neutral-300 hover:text-white tactile-btn"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onAnnotate}
            title="Open annotator"
            className="p-1.5 rounded-md hover:bg-surface-hover text-neutral-300 hover:text-white tactile-btn"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onSave}
            title="Save to folder"
            className="p-1.5 rounded-md hover:bg-surface-hover text-neutral-300 hover:text-white tactile-btn"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Countdown progress line */}
      <div className="h-0.5 bg-neutral-800">
        <div
          className="h-full bg-neutral-400 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
