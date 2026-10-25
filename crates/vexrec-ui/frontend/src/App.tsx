import React, { useEffect, useState, useMemo, useCallback } from "react";
import { FloatingPill } from "./components/hud/FloatingPill";
import { RecordingBar } from "./components/recording/RecordingBar";
import { PreviewCard } from "./components/preview/PreviewCard";
import { SettingsModal } from "./components/settings/SettingsModal";
import {
  ShortcutLegendModal,
  useKeyboardShortcuts,
  type ShortcutDefinition,
} from "@aerovex/strata-ui";
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

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

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

  const handleTriggerAction = useCallback(() => {
    if (mode === "capture") {
      // Simulate snapshot
      setLastCapture({
        filePath: "/home/usr/Pictures/Vexrec/Vexrec_Snapshot.png",
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
  }, [mode, resetTimer, setRecordingStatus, setLastCapture]);

  const handlePauseResume = useCallback(() => {
    if (recordingStatus === "recording") {
      setRecordingStatus("paused");
    } else if (recordingStatus === "paused") {
      setRecordingStatus("recording");
    }
  }, [recordingStatus, setRecordingStatus]);

  const handleStopRecording = useCallback(() => {
    setRecordingStatus("idle");
    setLastCapture({
      filePath: "/home/usr/Videos/Vexrec/Vexrec_Recording.mp4",
      width: 1920,
      height: 1080,
      fileSizeBytes: 18400000,
      timestamp: new Date().toISOString(),
    });
  }, [setRecordingStatus, setLastCapture]);

  const handleDiscard = useCallback(() => {
    setRecordingStatus("idle");
    resetTimer();
  }, [setRecordingStatus, resetTimer]);

  const shortcutDefs = useMemo<ShortcutDefinition[]>(
    () => [
      {
        id: "action.trigger",
        category: "Capture",
        description: "Trigger Snapshot or Start Recording",
        defaultKey: "Space",
        action: () => {
          if (recordingStatus === "idle") {
            handleTriggerAction();
          } else {
            handlePauseResume();
          }
        },
      },
      {
        id: "action.stop",
        category: "Capture",
        description: "Stop and Save Active Recording",
        defaultKey: "Esc",
        action: () => {
          if (recordingStatus !== "idle") {
            handleStopRecording();
          }
        },
      },
      {
        id: "action.settings",
        category: "Preferences",
        description: "Open Vexrec Preferences",
        defaultKey: "Mod+,",
        action: () => setSettingsOpen(true),
      },
      {
        id: "action.shortcuts",
        category: "Help",
        description: "Show Keyboard Shortcuts Legend",
        defaultKey: "?",
        action: () => setShortcutsOpen((prev) => !prev),
      },
    ],
    [
      recordingStatus,
      handleTriggerAction,
      handlePauseResume,
      handleStopRecording,
      setSettingsOpen,
    ]
  );

  useKeyboardShortcuts(shortcutDefs);

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

      {/* Dynamic Category Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      {/* Global Keyboard Shortcut Legend Modal */}
      <ShortcutLegendModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        definitions={shortcutDefs}
        title="Vexrec Keyboard Shortcuts"
      />
    </div>
  );
};

export default App;
