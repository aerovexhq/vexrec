import React, { useEffect } from "react";
import { FloatingPill } from "./components/hud/FloatingPill";
import { RecordingBar } from "./components/recording/RecordingBar";
import { PreviewCard } from "./components/preview/PreviewCard";
import { SettingsModal } from "./components/settings/SettingsModal";
import { useAppStore } from "./store/useAppStore";

export const App: React.FC = () => {
  const {
    mode,
    recordingStatus,
    setRecordingStatus,
    tickElapsed,
    resetTimer,
    setAudioLevels,
    lastCapture,
    setLastCapture,
    settingsOpen,
    setSettingsOpen,
  } = useAppStore();

  // Simulated recording timer & audio meter ticks when recording is active
  useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = null;
    let audioInterval: ReturnType<typeof setInterval> | null = null;

    if (recordingStatus === "recording") {
      timer = setInterval(() => {
        tickElapsed();
      }, 1000);

      audioInterval = setInterval(() => {
        const randomLeft = 0.2 + Math.random() * 0.7;
        const randomRight = 0.2 + Math.random() * 0.7;
        setAudioLevels(randomLeft, randomRight);
      }, 120);
    }

    return () => {
      if (timer) clearInterval(timer);
      if (audioInterval) clearInterval(audioInterval);
    };
  }, [recordingStatus, tickElapsed, setAudioLevels]);

  const handleTriggerAction = () => {
    if (mode === "capture") {
      // Simulate snapshot
      setLastCapture({
        filePath: "/home/usr/Pictures/Luxrec/Luxrec_Snapshot.png",
        width: 1920,
        height: 1080,
        fileSizeBytes: 442000,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Start recording
      resetTimer();
      setRecordingStatus("recording");
    }
  };

  const handlePauseResume = () => {
    if (recordingStatus === "recording") {
      setRecordingStatus("paused");
    } else if (recordingStatus === "paused") {
      setRecordingStatus("recording");
    }
  };

  const handleStopRecording = () => {
    setRecordingStatus("idle");
    setLastCapture({
      filePath: "/home/usr/Videos/Luxrec/Luxrec_Recording.mp4",
      width: 1920,
      height: 1080,
      fileSizeBytes: 18400000,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDiscard = () => {
    setRecordingStatus("idle");
    resetTimer();
  };

  return (
    <div className="w-screen h-screen flex flex-col items-center justify-end pb-8 p-4 bg-transparent select-none relative">
      {/* Floating HUD Bar (Switches dynamically between Pill and Active Recording Bar) */}
      {recordingStatus === "idle" ? (
        <FloatingPill
          onTriggerAction={handleTriggerAction}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      ) : (
        <RecordingBar
          onPauseResume={handlePauseResume}
          onStop={handleStopRecording}
          onDiscard={handleDiscard}
        />
      )}

      {/* Floating Preview Card Drawer (Lower Right) */}
      {lastCapture && (
        <div className="fixed bottom-6 right-6 z-40">
          <PreviewCard
            capture={lastCapture}
            onCopy={() => console.log("Copied to clipboard")}
            onSave={() => console.log("Saved to disk")}
            onAnnotate={() => console.log("Annotate")}
            onDismiss={() => setLastCapture(null)}
          />
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </div>
  );
};

export default App;
