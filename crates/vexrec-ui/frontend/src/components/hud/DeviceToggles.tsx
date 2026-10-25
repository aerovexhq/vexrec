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
    <div className="flex items-center gap-0.5 px-1.5 border-x border-border/50">
      {/* Desktop Audio */}
      <button
        type="button"
        onClick={toggleDesktopAudio}
        title={desktopAudioEnabled ? "System audio: Active" : "System audio: Muted"}
        className={`relative p-2 rounded-md transition-colors cursor-pointer ${
          desktopAudioEnabled ? "text-fg hover:bg-raised" : "text-muted hover:text-fg hover:bg-raised"
        }`}
      >
        {desktopAudioEnabled ? (
          <Volume2 className="w-3.5 h-3.5" />
        ) : (
          <VolumeX className="w-3.5 h-3.5 text-muted/60" />
        )}
        <span
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            desktopAudioEnabled ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        />
      </button>

      {/* Microphone */}
      <button
        type="button"
        onClick={toggleMic}
        title={micEnabled ? "Microphone: Live" : "Microphone: Muted"}
        className={`relative p-2 rounded-md transition-colors cursor-pointer ${
          micEnabled ? "text-fg hover:bg-raised" : "text-muted hover:text-fg hover:bg-raised"
        }`}
      >
        {micEnabled ? (
          <Mic className="w-3.5 h-3.5" />
        ) : (
          <MicOff className="w-3.5 h-3.5 text-muted/60" />
        )}
        <span
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            micEnabled ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        />
      </button>

      {/* Webcam PiP */}
      <button
        type="button"
        onClick={toggleCameraPip}
        title={cameraPipEnabled ? "Webcam overlay: Enabled" : "Webcam overlay: Disabled"}
        className={`relative p-2 rounded-md transition-colors cursor-pointer ${
          cameraPipEnabled ? "text-fg hover:bg-raised" : "text-muted hover:text-fg hover:bg-raised"
        }`}
      >
        <Webhook className="w-3.5 h-3.5" />
        <span
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            cameraPipEnabled ? "bg-blue-500" : "bg-neutral-600"
          }`}
        />
      </button>

      {/* Mouse Cursor */}
      <button
        type="button"
        onClick={toggleCursor}
        title={cursorVisible ? "Capture cursor: Yes" : "Capture cursor: Hidden"}
        className={`relative p-2 rounded-md transition-colors cursor-pointer ${
          cursorVisible ? "text-fg hover:bg-raised" : "text-muted hover:text-fg hover:bg-raised"
        }`}
      >
        <MousePointer className="w-3.5 h-3.5" />
        <span
          className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${
            cursorVisible ? "bg-emerald-500" : "bg-neutral-600"
          }`}
        />
      </button>
    </div>
  );
};
