import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { invoke, convertFileSrc } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  Camera,
  Video,
  Crop,
  AppWindow,
  Monitor,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Check,
  Save,
  Settings,
  X,
} from "lucide-react";

interface FreezeWindowInfo {
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
}

interface FreezeData {
  image_path: string;
  image_url?: string;
  width: number;
  height: number;
  last_mode?: string;
  last_region?: { x: number; y: number; width: number; height: number };
  windows?: FreezeWindowInfo[];
}

interface SelectionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const FreezeOverlay: React.FC = () => {
  const [data, setData] = useState<FreezeData | null>(null);
  const [actionMode, setActionMode] = useState<"screenshot" | "record">("screenshot");
  const [targetMode, setTargetMode] = useState<"region" | "window" | "fullscreen">("region");
  const [crop, setCrop] = useState<SelectionRect | null>(null);
  const [hoveredWindow, setHoveredWindow] = useState<FreezeWindowInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [, setDragHandle] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [micEnabled, setMicEnabled] = useState(true);
  const [desktopAudioEnabled, setDesktopAudioEnabled] = useState(true);

  const dragStart = useRef({ x: 0, y: 0 });
  const initialRect = useRef<SelectionRect | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { scaleX, scaleY, winW, winH } = useMemo(() => {
    const w = window.innerWidth || 1920;
    const h = window.innerHeight || 1080;
    const imgW = data ? data.width : w;
    const imgH = data ? data.height : h;
    return {
      scaleX: w / imgW,
      scaleY: h / imgH,
      winW: w,
      winH: h,
    };
  }, [data]);

  const applyFreezeData = useCallback((dto: FreezeData) => {
    const url = dto.image_url || (dto.image_path ? convertFileSrc(dto.image_path) : "");
    setData({ ...dto, image_url: url });
    setIsSubmitting(false);

    const w = window.innerWidth || dto.width;
    const h = window.innerHeight || dto.height;
    const sx = w / dto.width;
    const sy = h / dto.height;

    if (dto.last_mode === "fullscreen") {
      setTargetMode("fullscreen");
      setCrop({ x: 0, y: 0, width: w, height: h });
    } else if (dto.last_region) {
      setTargetMode("region");
      setCrop({
        x: Math.round(dto.last_region.x * sx),
        y: Math.round(dto.last_region.y * sy),
        width: Math.round(dto.last_region.width * sx),
        height: Math.round(dto.last_region.height * sy),
      });
    } else {
      setTargetMode("region");
      const defaultW = Math.min(800, w - 120);
      const defaultH = Math.min(500, h - 120);
      setCrop({
        x: Math.round((w - defaultW) / 2),
        y: Math.round((h - defaultH) / 2),
        width: defaultW,
        height: defaultH,
      });
    }
  }, []);

  useEffect(() => {
    const fetchFreeze = () => {
      invoke<FreezeData | null>("get_freeze_data").then((res) => {
        if (res) {
          applyFreezeData(res);
          window.focus();
          containerRef.current?.focus();
        }
      });
    };

    fetchFreeze();
    window.addEventListener("focus", fetchFreeze);
    const handler = (event: { payload: FreezeData }) => {
      applyFreezeData(event.payload);
      window.focus();
      containerRef.current?.focus();
    };

    const unlistenVexrec = listen<FreezeData>("vexrec://freeze-ready", handler);
    const unlistenLuxrec = listen<FreezeData>("luxrec://freeze-ready", handler);

    return () => {
      window.removeEventListener("focus", fetchFreeze);
      document.removeEventListener("visibilitychange", fetchFreeze);
      unlistenVexrec.then((fn) => fn());
      unlistenLuxrec.then((fn) => fn());
    };
  }, [applyFreezeData]);

  useEffect(() => {
    if (targetMode === "fullscreen") {
      setCrop({ x: 0, y: 0, width: winW, height: winH });
      setHoveredWindow(null);
    } else if (targetMode === "window") {
      setCrop(null);
    }
  }, [targetMode, winW, winH]);

  const getActualCropRect = useCallback(() => {
    if (targetMode === "fullscreen" || !crop || crop.width <= 5 || crop.height <= 5) {
      return null;
    }
    const maxW = data ? data.width : winW;
    const maxH = data ? data.height : winH;
    return {
      x: Math.max(0, Math.round(crop.x / scaleX)),
      y: Math.max(0, Math.round(crop.y / scaleY)),
      width: Math.min(maxW, Math.round(crop.width / scaleX)),
      height: Math.min(maxH, Math.round(crop.height / scaleY)),
    };
  }, [crop, data, scaleX, scaleY, targetMode, winW, winH]);

  const handleCancelFreeze = useCallback(async () => {
    try {
      await invoke("cancel_freeze");
    } catch (err) {
      console.error("Failed to cancel freeze:", err);
    }
  }, []);

  const handleConfirmScreenshot = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const actualCrop = getActualCropRect();
      await invoke("confirm_freeze_capture", {
        crop: actualCrop,
        copyToClipboard: true,
        customPath: null,
      });
    } catch (err) {
      console.error("Failed to confirm screenshot:", err);
      setIsSubmitting(false);
    }
  }, [getActualCropRect, isSubmitting]);

  const handleSaveScreenshotAs = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const actualCrop = getActualCropRect();
      await invoke("confirm_freeze_capture", {
        crop: actualCrop,
        copyToClipboard: true,
        customPath: "PROMPT_SAVE",
      });
    } catch (err) {
      console.error("Failed to save screenshot as:", err);
      setIsSubmitting(false);
    }
  }, [getActualCropRect, isSubmitting]);

  const handleStartRecording = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const actualCrop = getActualCropRect();
      await invoke("start_recording", {
        target: targetMode === "fullscreen" ? "fullscreen" : "area",
        crop: actualCrop,
        fps: 60,
        format: "mp4",
        mic: micEnabled,
        desktopAudio: desktopAudioEnabled,
      });
      // Close freeze overlay immediately
      await invoke("cancel_freeze");
    } catch (err) {
      console.error("Failed to start recording:", err);
      setIsSubmitting(false);
    }
  }, [getActualCropRect, isSubmitting, targetMode, micEnabled, desktopAudioEnabled]);

  const handleOpenSettings = useCallback(async () => {
    try {
      await invoke("open_settings_window");
    } catch (err) {
      console.error("Failed to open settings window:", err);
    }
  }, []);

  // Global Keyboard Shortcuts (Esc cancels anytime, Enter confirms/records)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (isDragging) {
          setIsDragging(false);
          setDragHandle(null);
        } else {
          handleCancelFreeze();
        }
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        if (actionMode === "screenshot") {
          handleConfirmScreenshot();
        } else {
          handleStartRecording();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c") {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmScreenshot();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        e.stopPropagation();
        handleSaveScreenshotAs();
      } else if (e.key === "1") {
        setTargetMode("region");
      } else if (e.key === "2") {
        setTargetMode("window");
      } else if (e.key === "3") {
        setTargetMode("fullscreen");
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [
    isDragging,
    handleCancelFreeze,
    handleConfirmScreenshot,
    handleSaveScreenshotAs,
    handleStartRecording,
    actionMode,
  ]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (targetMode !== "window" || !data?.windows?.length) return;
      const x = e.clientX / scaleX;
      const y = e.clientY / scaleY;
      const win = data.windows.find(
        (w) =>
          x >= w.x &&
          x <= w.x + w.width &&
          y >= w.y &&
          y <= w.y + w.height &&
          w.width > 30 &&
          w.height > 30 &&
          !w.title.includes("Luxrec") &&
          !w.title.includes("Vexrec")
      );
      setHoveredWindow(win || null);
    },
    [targetMode, data, scaleX, scaleY]
  );

  const startDrag = (e: React.PointerEvent, handle: string) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (targetMode === "window") {
      if (hoveredWindow) {
        setCrop({
          x: Math.round(hoveredWindow.x * scaleX),
          y: Math.round(hoveredWindow.y * scaleY),
          width: Math.round(hoveredWindow.width * scaleX),
          height: Math.round(hoveredWindow.height * scaleY),
        });
      }
      return;
    }
    if (targetMode === "fullscreen") return;

    const target = e.currentTarget as HTMLElement;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {}

    setIsDragging(true);
    setDragHandle(handle);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialRect.current = crop ? { ...crop } : null;

    if (handle === "new") {
      setCrop({ x: e.clientX, y: e.clientY, width: 0, height: 0 });
      initialRect.current = { x: e.clientX, y: e.clientY, width: 0, height: 0 };
    }

    const onPointerMove = (ev: PointerEvent) => {
      const dx = ev.clientX - dragStart.current.x;
      const dy = ev.clientY - dragStart.current.y;
      const init = initialRect.current;
      const curW = window.innerWidth;
      const curH = window.innerHeight;

      if (handle === "new") {
        const x1 = Math.min(dragStart.current.x, ev.clientX);
        const y1 = Math.min(dragStart.current.y, ev.clientY);
        const x2 = Math.max(dragStart.current.x, ev.clientX);
        const y2 = Math.max(dragStart.current.y, ev.clientY);
        setCrop({
          x: Math.max(0, x1),
          y: Math.max(0, y1),
          width: Math.min(curW - x1, x2 - x1),
          height: Math.min(curH - y1, y2 - y1),
        });
      } else if (handle === "move" && init) {
        const nx = Math.max(0, Math.min(curW - init.width, init.x + dx));
        const ny = Math.max(0, Math.min(curH - init.height, init.y + dy));
        setCrop({ x: Math.round(nx), y: Math.round(ny), width: init.width, height: init.height });
      } else if (init) {
        let { x, y, width, height } = init;
        if (handle.includes("e")) width = Math.max(16, Math.min(curW - x, init.width + dx));
        if (handle.includes("s")) height = Math.max(16, Math.min(curH - y, init.height + dy));
        if (handle.includes("w") && init.width - dx >= 16) {
          x = Math.max(0, init.x + dx);
          width = init.width + (init.x - x);
        }
        if (handle.includes("n") && init.height - dy >= 16) {
          y = Math.max(0, init.y + dy);
          height = init.height + (init.y - y);
        }
        setCrop({
          x: Math.round(x),
          y: Math.round(y),
          width: Math.round(width),
          height: Math.round(height),
        });
      }
    };

    const onPointerUp = (ev: PointerEvent) => {
      setIsDragging(false);
      setDragHandle(null);
      try {
        target.releasePointerCapture(ev.pointerId);
      } catch {}
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
  };

  const svgPath =
    targetMode === "fullscreen"
      ? ""
      : crop
      ? `M 0 0 H ${winW} V ${winH} H 0 Z M ${crop.x} ${crop.y} V ${crop.y + crop.height} H ${
          crop.x + crop.width
        } V ${crop.y} Z`
      : `M 0 0 H ${winW} V ${winH} H 0 Z`;

  if (!data) {
    return <div className="w-screen h-screen bg-transparent pointer-events-none" />;
  }

  return (
    <div
      ref={containerRef}
      tabIndex={-1}
      autoFocus
      onPointerDown={(e) => startDrag(e, "new")}
      onMouseMove={handleMouseMove}
      className={`relative w-screen h-screen overflow-hidden select-none bg-black outline-none ${
        targetMode === "window"
          ? "cursor-pointer"
          : targetMode === "fullscreen"
          ? "cursor-default"
          : "cursor-crosshair"
      }`}
    >
      {/* Frozen Screenshot Layer */}
      {data.image_url && (
        <img
          src={data.image_url}
          alt="Frozen screen"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />
      )}

      {/* Dimming Vignette Mask */}
      {targetMode !== "fullscreen" && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d={svgPath} fill="rgba(0, 0, 0, 0.45)" fillRule="evenodd" />
        </svg>
      )}

      {/* Fullscreen Selection Highlight */}
      {targetMode === "fullscreen" && (
        <div className="absolute inset-0 border-4 border-indigo-500/70 pointer-events-none z-20 shadow-[inset_0_0_30px_rgba(99,102,241,0.25)]" />
      )}

      {/* Window Detection Hover Box */}
      {targetMode === "window" && hoveredWindow && (
        <div
          style={{
            transform: `translate3d(${Math.round(hoveredWindow.x * scaleX)}px, ${Math.round(
              hoveredWindow.y * scaleY
            )}px, 0)`,
            width: `${Math.round(hoveredWindow.width * scaleX)}px`,
            height: `${Math.round(hoveredWindow.height * scaleY)}px`,
          }}
          className="absolute top-0 left-0 z-20 border-2 border-indigo-400 bg-indigo-500/20 backdrop-blur-[1px] shadow-[0_0_20px_rgba(99,102,241,0.4)] pointer-events-none transition-all duration-75"
        >
          <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-neutral-900/90 backdrop-blur-md border border-white/15 text-white font-sans text-[11px] font-semibold tracking-tight shadow-lg pointer-events-none whitespace-nowrap flex items-center gap-1.5">
            <AppWindow className="w-3 h-3 text-indigo-400" />
            <span className="max-w-xs truncate">{hoveredWindow.title || "Window"}</span>
            <span className="text-neutral-400 font-mono text-[10px]">
              ({Math.round(hoveredWindow.width)} × {Math.round(hoveredWindow.height)})
            </span>
          </div>
        </div>
      )}

      {/* Interactive Crop Selection Box */}
      {targetMode !== "fullscreen" && crop && crop.width > 2 && crop.height > 2 && (
        <div
          style={{
            transform: `translate3d(${crop.x}px, ${crop.y}px, 0)`,
            width: `${crop.width}px`,
            height: `${crop.height}px`,
          }}
          className="absolute top-0 left-0 z-20 border-2 border-indigo-400/90 shadow-[0_0_15px_rgba(99,102,241,0.25)]"
        >
          {/* Draggable Interior */}
          <div
            onPointerDown={(e) => startDrag(e, "move")}
            className="w-full h-full cursor-move touch-none"
            title="Drag to reposition crop region"
          />

          {/* Dimension Badge */}
          <div className="absolute -top-7 left-0 px-2 py-0.5 rounded bg-neutral-900/90 backdrop-blur-md border border-white/10 text-white font-mono text-[11px] font-semibold tracking-tight shadow-lg pointer-events-none whitespace-nowrap">
            {Math.round(crop.width / scaleX)} × {Math.round(crop.height / scaleY)} px
          </div>

          {/* 8 Resize Handles */}
          {targetMode === "region" && (
            <>
              <div
                onPointerDown={(e) => startDrag(e, "nw")}
                className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm cursor-nwse-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "n")}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-indigo-600 rounded-full cursor-ns-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "ne")}
                className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "e")}
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2 h-4 bg-white border border-indigo-600 rounded-full cursor-ew-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "se")}
                className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm cursor-nwse-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "s")}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border border-indigo-600 rounded-full cursor-ns-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "sw")}
                className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-indigo-600 rounded-sm cursor-nesw-resize shadow-sm hover:scale-125 transition-transform"
              />
              <div
                onPointerDown={(e) => startDrag(e, "w")}
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-2 h-4 bg-white border border-indigo-600 rounded-full cursor-ew-resize shadow-sm hover:scale-125 transition-transform"
              />
            </>
          )}
        </div>
      )}

      {/* Floating Bottom Control Pill */}
      <div
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-neutral-900/90 backdrop-blur-2xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.6)] select-none text-white text-xs font-medium"
      >
        {/* Mode Switcher: Screenshot vs Record */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setActionMode("screenshot")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              actionMode === "screenshot"
                ? "bg-white text-neutral-950 font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Screenshot</span>
          </button>
          <button
            type="button"
            onClick={() => setActionMode("record")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              actionMode === "record"
                ? "bg-accent-record text-white font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Record</span>
          </button>
        </div>

        <div className="h-5 w-px bg-white/15" />

        {/* Target Switcher: Selection / Window / Fullscreen */}
        <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={() => setTargetMode("region")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              targetMode === "region"
                ? "bg-white/20 text-white font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Select Area (1)"
          >
            <Crop className="w-3.5 h-3.5" />
            <span>Selection</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetMode("window")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              targetMode === "window"
                ? "bg-white/20 text-white font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Select Window (2)"
          >
            <AppWindow className="w-3.5 h-3.5" />
            <span>Window</span>
          </button>
          <button
            type="button"
            onClick={() => setTargetMode("fullscreen")}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer ${
              targetMode === "fullscreen"
                ? "bg-white/20 text-white font-semibold shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
            title="Full Screen (3)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Full Screen</span>
          </button>
        </div>

        {/* Audio Toggles (Shown in Record Mode) */}
        {actionMode === "record" && (
          <>
            <div className="h-5 w-px bg-white/15" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMicEnabled(!micEnabled)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  micEnabled ? "bg-white/15 text-white" : "text-neutral-500 hover:text-neutral-300"
                }`}
                title={micEnabled ? "Microphone Enabled" : "Microphone Muted"}
              >
                {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4 text-neutral-500" />}
              </button>
              <button
                type="button"
                onClick={() => setDesktopAudioEnabled(!desktopAudioEnabled)}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  desktopAudioEnabled
                    ? "bg-white/15 text-white"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
                title={desktopAudioEnabled ? "Desktop Audio Enabled" : "Desktop Audio Muted"}
              >
                {desktopAudioEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4 text-neutral-500" />
                )}
              </button>
            </div>
          </>
        )}

        <div className="h-5 w-px bg-white/15" />

        {/* Action Trigger Buttons */}
        {actionMode === "screenshot" ? (
          <>
            <button
              type="button"
              onClick={handleConfirmScreenshot}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-neutral-950 hover:bg-neutral-100 font-semibold text-xs transition-colors shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
              title="Done & Copy (Enter / Ctrl+C)"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Done</span>
              <kbd className="ml-0.5 px-1 py-0.2 text-[10px] font-mono bg-neutral-200 text-neutral-800 rounded">
                ↵
              </kbd>
            </button>
            <button
              type="button"
              onClick={handleSaveScreenshotAs}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Save As (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save As</span>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleStartRecording}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-accent-record hover:bg-accent-record-hover text-white font-semibold text-xs transition-all shadow-lg shadow-red-500/25 active:scale-95 cursor-pointer disabled:opacity-50"
            title="Start Recording (Enter)"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
            <span>Record</span>
            <kbd className="ml-0.5 px-1 py-0.2 text-[10px] font-mono bg-red-700/50 text-white rounded">
              ↵
            </kbd>
          </button>
        )}

        {/* Preferences Button */}
        <button
          type="button"
          onClick={handleOpenSettings}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Preferences"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={handleCancelFreeze}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          title="Cancel (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Helper Guide for Window Mode */}
      {targetMode === "window" && !hoveredWindow && !crop && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute bottom-24 left-1/2 -translate-x-1/2 z-40 px-4 py-1.5 rounded-full bg-neutral-900/90 backdrop-blur-md border border-white/15 text-neutral-200 text-xs font-medium shadow-2xl flex items-center gap-2 pointer-events-none"
        >
          <AppWindow className="w-3.5 h-3.5 text-indigo-400" />
          <span>Hover and click any window to select it</span>
        </div>
      )}
    </div>
  );
};

export default FreezeOverlay;
