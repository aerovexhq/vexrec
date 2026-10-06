import React, { useState, useEffect, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

export const RecordingIndicator: React.FC = () => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    setSeconds(0);
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    const unlistenVexrec = listen("vexrec://recording-started", () => {
      setSeconds(0);
    });
    const unlistenLuxrec = listen("luxrec://recording-started", () => {
      setSeconds(0);
    });

    return () => {
      clearInterval(interval);
      unlistenVexrec.then((unlisten) => unlisten());
      unlistenLuxrec.then((unlisten) => unlisten());
    };
  }, []);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStopRecording = useCallback(async () => {
    try {
      await invoke("stop_recording");
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
  }, []);

  return (
    <div className="w-screen h-screen flex items-center justify-center p-0.5 bg-transparent overflow-hidden">
      <button
        type="button"
        onClick={handleStopRecording}
        title="Stop Recording (Shift+PrtSc)"
        className="w-full h-full flex items-center justify-center gap-2 px-2.5 py-1 bg-[#18181b]/95 hover:bg-[#27272a] active:bg-[#3f3f46] text-white border border-white/20 hover:border-white/35 rounded-full shadow-lg transition-all duration-150 cursor-pointer select-none group outline-none"
      >
        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse group-hover:scale-110 transition-transform flex-shrink-0" />
        <span className="font-mono text-xs font-semibold tracking-wider text-white/95">
          {formatTime(seconds)}
        </span>
      </button>
    </div>
  );
};
