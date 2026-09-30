import React from "react";
import { Mic, MicOff, Volume2, VolumeX, Webhook, MousePointer } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";

export const DeviceToggles: React.FC = () => {
  const {
    micEnabled,
    desktopAudioEnabled,
    cameraPipEnabled,
    cursorVisible,
    toggleMic,
    toggleDesktopAudio,
    toggleCameraPip,
    toggleCursor,
  } = useAppStore();

  return (
    <div className="flex items-center gap-1 px-1 border-x border-surface-border">
      {/* Desktop Audio */}
      <button
        onClick={toggleDesktopAudio}
        title={desktopAudioEnabled ? "System audio: Active" : "System audio: Muted"}
        className={`relative p-2 rounded-lg tactile-btn ${
          desktopAudioEnabled ? "text-neutral-200" : "text-neutral-500"
        }`}
      >
        {desktopAudioEnabled ? (
          <Volume2 className="w-4 h-4" />
        ) : (
          <VolumeX className="w-4 h-4 text-neutral-600" />
        )}
        <span
          className={`absolute bottom-1 right-1 w-1 h-1 rounded-full ${
            desktopAudioEnabled ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        />
      </button>

      {/* Microphone */}
      <button
        onClick={toggleMic}
        title={micEnabled ? "Microphone: Live" : "Microphone: Muted"}
        className={`relative p-2 rounded-lg tactile-btn ${
          micEnabled ? "text-neutral-200" : "text-neutral-500"
        }`}
      >
        {micEnabled ? (
          <Mic className="w-4 h-4" />
        ) : (
          <MicOff className="w-4 h-4 text-neutral-600" />
        )}
        <span
          className={`absolute bottom-1 right-1 w-1 h-1 rounded-full ${
            micEnabled ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        />
      </button>

      {/* Webcam PiP */}
      <button
        onClick={toggleCameraPip}
        title={cameraPipEnabled ? "Webcam overlay: Enabled" : "Webcam overlay: Disabled"}
        className={`relative p-2 rounded-lg tactile-btn ${
          cameraPipEnabled ? "text-neutral-200" : "text-neutral-500"
        }`}
      >
        <Webhook className="w-4 h-4" />
        <span
          className={`absolute bottom-1 right-1 w-1 h-1 rounded-full ${
            cameraPipEnabled ? "bg-blue-500" : "bg-neutral-600"
          }`}
        />
      </button>

      {/* Mouse Cursor */}
      <button
        onClick={toggleCursor}
        title={cursorVisible ? "Capture cursor: Yes" : "Capture cursor: Hidden"}
        className={`relative p-2 rounded-lg tactile-btn ${
          cursorVisible ? "text-neutral-200" : "text-neutral-500"
        }`}
      >
        <MousePointer className="w-4 h-4" />
        <span
          className={`absolute bottom-1 right-1 w-1 h-1 rounded-full ${
            cursorVisible ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        />
      </button>
    </div>
  );
};
