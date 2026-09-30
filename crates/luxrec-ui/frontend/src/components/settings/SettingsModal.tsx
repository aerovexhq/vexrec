import React, { useState } from "react";
import { X, Sliders, Video, Mic, Keyboard, Folder } from "lucide-react";
import { LuxrecSettings } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: LuxrecSettings = {
  recording: {
    framerate: 60,
    container: "mp4",
    videoCodec: "auto",
    quality: "medium",
    showCursor: true,
    hardwareAccel: true,
  },
  audio: {
    captureDesktop: true,
    captureMicrophone: true,
    desktopVolume: 1.0,
    microphoneVolume: 1.0,
    noiseSuppression: true,
  },
  camera: {
    enabled: false,
    shape: "circle",
    anchor: "bottom_right",
    width: 280,
    height: 280,
    mirror: true,
  },
  screenshot: {
    defaultFormat: "png",
    copyToClipboard: true,
    showPreviewHud: true,
    previewHudTimeoutSecs: 5,
  },
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<"general" | "video" | "audio" | "shortcuts">("video");
  const [settings, setSettings] = useState<LuxrecSettings>(DEFAULT_SETTINGS);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm select-none">
      <div className="glass-panel w-[580px] h-[400px] rounded-2xl flex overflow-hidden shadow-modal border border-surface-border text-xs">
        {/* Left Navigation Sidebar */}
        <div className="w-48 bg-neutral-900/90 p-3 border-r border-surface-border flex flex-col justify-between">
          <div className="space-y-1">
            <div className="px-2.5 py-1.5 font-semibold text-neutral-400 text-[11px] tracking-wider uppercase">
              Preferences
            </div>

            <button
              onClick={() => setActiveTab("video")}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg tactile-btn ${
                activeTab === "video" ? "bg-surface-active text-white font-medium" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video & Codecs</span>
            </button>

            <button
              onClick={() => setActiveTab("audio")}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg tactile-btn ${
                activeTab === "audio" ? "bg-surface-active text-white font-medium" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Audio & Devices</span>
            </button>

            <button
              onClick={() => setActiveTab("general")}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg tactile-btn ${
                activeTab === "general" ? "bg-surface-active text-white font-medium" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>General & Storage</span>
            </button>

            <button
              onClick={() => setActiveTab("shortcuts")}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg tactile-btn ${
                activeTab === "shortcuts" ? "bg-surface-active text-white font-medium" : "text-neutral-400 hover:text-white"
              }`}
            >
              <Keyboard className="w-4 h-4" />
              <span>Shortcuts</span>
            </button>
          </div>

          <div className="px-2 text-[10px] text-neutral-500 font-mono">
            Luxrec v0.1.0 • Linux Native
          </div>
        </div>

        {/* Right Settings Content */}
        <div className="flex-1 flex flex-col justify-between p-5 bg-surface-base">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-surface-border">
            <h2 className="text-sm font-semibold text-neutral-100 capitalize">
              {activeTab === "video" && "Video & Hardware Acceleration"}
              {activeTab === "audio" && "Audio Configuration"}
              {activeTab === "general" && "General Settings"}
              {activeTab === "shortcuts" && "Global Keyboard Shortcuts"}
            </h2>
            <button
              onClick={onClose}
              className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-surface-hover tactile-btn"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Form Body */}
          <div className="flex-1 py-4 space-y-4 overflow-y-auto">
            {activeTab === "video" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300">Target Framerate</label>
                  <select
                    value={settings.recording.framerate}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        recording: { ...settings.recording, framerate: Number(e.target.value) },
                      })
                    }
                    className="bg-neutral-800 border border-surface-border rounded px-2.5 py-1 text-neutral-200 outline-none"
                  >
                    <option value={30}>30 FPS</option>
                    <option value={60}>60 FPS</option>
                    <option value={120}>120 FPS</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-neutral-300">Container Format</label>
                  <select
                    value={settings.recording.container}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        recording: {
                          ...settings.recording,
                          container: e.target.value as "mp4" | "mkv" | "webm" | "gif",
                        },
                      })
                    }
                    className="bg-neutral-800 border border-surface-border rounded px-2.5 py-1 text-neutral-200 outline-none"
                  >
                    <option value="mp4">MP4 (H.264 / AAC)</option>
                    <option value="mkv">MKV (Crash-Resilient)</option>
                    <option value="webm">WebM (VP9 / Opus)</option>
                    <option value="gif">Animated GIF</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-neutral-200">Hardware Acceleration</div>
                    <div className="text-[11px] text-neutral-400">
                      Enable VA-API / NVENC zero-copy encoding
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.recording.hardwareAccel}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        recording: { ...settings.recording, hardwareAccel: e.target.checked },
                      })
                    }
                    className="rounded accent-accent-record"
                  />
                </div>
              </div>
            )}

            {activeTab === "audio" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-neutral-300">Desktop Sound Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={settings.audio.desktopVolume}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        audio: { ...settings.audio, desktopVolume: Number(e.target.value) },
                      })
                    }
                    className="w-32 accent-neutral-200"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <label className="text-neutral-300">Microphone Input Volume</label>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={settings.audio.microphoneVolume}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        audio: { ...settings.audio, microphoneVolume: Number(e.target.value) },
                      })
                    }
                    className="w-32 accent-neutral-200"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-neutral-200">Noise Suppression</div>
                    <div className="text-[11px] text-neutral-400">
                      Filter background noise via PipeWire
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.audio.noiseSuppression}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        audio: { ...settings.audio, noiseSuppression: e.target.checked },
                      })
                    }
                    className="rounded accent-accent-record"
                  />
                </div>
              </div>
            )}

            {activeTab === "general" && (
              <div className="space-y-3">
                <div>
                  <label className="text-neutral-300 block mb-1">Screenshots Directory</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="~/Pictures/Luxrec"
                      className="flex-1 bg-neutral-800 border border-surface-border rounded px-2.5 py-1 text-neutral-300 font-mono text-[11px]"
                    />
                    <button className="p-1.5 rounded bg-surface-panel hover:bg-surface-hover text-neutral-300">
                      <Folder className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-neutral-300 block mb-1">Recordings Directory</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value="~/Videos/Luxrec"
                      className="flex-1 bg-neutral-800 border border-surface-border rounded px-2.5 py-1 text-neutral-300 font-mono text-[11px]"
                    />
                    <button className="p-1.5 rounded bg-surface-panel hover:bg-surface-hover text-neutral-300">
                      <Folder className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "shortcuts" && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Capture Area</span>
                  <span className="kbd-hint">Super + Shift + 4</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Capture Full Screen</span>
                  <span className="kbd-hint">Super + Shift + 3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Record Region</span>
                  <span className="kbd-hint">Super + Shift + 5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Pause / Resume</span>
                  <span className="kbd-hint">Space</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-300">Stop Recording</span>
                  <span className="kbd-hint">Escape</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Save Button */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-surface-border">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-neutral-400 hover:text-white tactile-btn"
            >
              Cancel
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-white text-neutral-900 font-medium hover:bg-neutral-200 tactile-btn"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
