import React, { useEffect, useState } from "react";
import { Copy, Download, Edit3, X, Check } from "lucide-react";
import { GlassPanel, Button } from "@aerovex/strata-ui";
import type { CaptureResult } from "../../types";

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
    <GlassPanel
      intensity="deep"
      glow={true}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      className="w-72 rounded-xl overflow-hidden shadow-modal border border-border select-none"
    >
      {/* Thumbnail and metadata */}
      <div className="relative h-32 bg-surface/80 flex items-center justify-center overflow-hidden border-b border-border">
        {capture.thumbnailUrl ? (
          <img
            src={capture.thumbnailUrl}
            alt="Captured preview"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-muted font-mono text-[10px]">
            {capture.width} x {capture.height} px
          </div>
        )}

        <Button
          variant="icon"
          onClick={onDismiss}
          className="absolute top-2 right-2 h-6 w-6 rounded-full bg-surface/80 text-muted hover:text-fg"
          title="Dismiss"
        >
          <X className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Info & Action Bar */}
      <div className="p-2.5 flex items-center justify-between bg-surface/40">
        <div className="font-mono text-[10px] text-muted truncate max-w-[120px]">
          {capture.filePath.split("/").pop()}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="icon"
            onClick={handleCopy}
            title="Copy to clipboard"
            className="h-7 w-7 text-muted hover:text-fg"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </Button>

          <Button
            variant="icon"
            onClick={onAnnotate}
            title="Open annotator"
            className="h-7 w-7 text-muted hover:text-fg"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>

          <Button
            variant="icon"
            onClick={onSave}
            title="Save to folder"
            className="h-7 w-7 text-muted hover:text-fg"
          >
            <Download className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Countdown progress line */}
      <div className="h-0.5 bg-surface">
        <div
          className="h-full bg-accent transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </GlassPanel>
  );
};
