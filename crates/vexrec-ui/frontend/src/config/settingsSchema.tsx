import {
  Video,
  Mic,
  Keyboard,
  Camera,
  Activity,
  HardDrive,
} from "lucide-react";
import {
  SettingRow,
  Switch,
  Select,
  Range,
  LogConsole,
  StatusBadge,
  type SettingsSectionGroup,
} from "@aerovex/strata-ui";
import type { VexrecSettings } from "../types";

export type SettingUpdater = <K extends keyof VexrecSettings, F extends keyof VexrecSettings[K]>(
  section: K,
  field: F,
  value: VexrecSettings[K][F]
) => void;

export function getVexrecSettingsSchema(
  settings: VexrecSettings,
  updateSetting: SettingUpdater,
  diagnosticLogs: string[] = []
): SettingsSectionGroup[] {
  return [
    {
      label: "Capture & Encoding",
      items: [
        {
          id: "video",
          label: "Video & Encoders",
          description: "Hardware acceleration, framerates, codecs, and container formats",
          icon: <Video className="w-4 h-4 text-accent" />,
          keywords: ["video", "fps", "codec", "vaapi", "nvenc", "mp4", "mkv", "quality", "crf"],
          content: (
            <div className="space-y-1">
              <SettingRow
                title="Hardware Acceleration"
                subtitle="Leverage VA-API or NVENC zero-copy DMA buffers for sub-millisecond frame handoff"
              >
                <Switch
                  checked={settings.recording.hardwareAccel}
                  onCheckedChange={(checked) =>
                    updateSetting("recording", "hardwareAccel", checked)
                  }
                  label="Hardware Acceleration"
                />
              </SettingRow>

              <SettingRow
                title="Target Framerate"
                subtitle="Capture cadence for display rendering and motion fluidity"
              >
                <Select
                  label="Target Framerate"
                  value={String(settings.recording.framerate)}
                  onValueChange={(val) =>
                    updateSetting("recording", "framerate", Number(val))
                  }
                  options={[
                    { value: "30", label: "30 FPS", subtitle: "Low bandwidth presentation" },
                    { value: "60", label: "60 FPS", subtitle: "Smooth fluid recording (Recommended)" },
                    { value: "120", label: "120 FPS", subtitle: "High-refresh display capture" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Video Codec"
                subtitle="Compression standard for real-time video encoding"
              >
                <Select
                  label="Video Codec"
                  value={settings.recording.videoCodec}
                  onValueChange={(val) =>
                    updateSetting("recording", "videoCodec", val as any)
                  }
                  options={[
                    { value: "auto", label: "Auto Detect", subtitle: "Optimal hardware capability" },
                    { value: "h264", label: "H.264 (AVC)", subtitle: "Universal device playback" },
                    { value: "h265", label: "H.265 (HEVC)", subtitle: "High compression efficiency" },
                    { value: "vp9", label: "VP9", subtitle: "Royalty-free open web codec" },
                    { value: "av1", label: "AV1", subtitle: "Next-gen royalty-free format" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Container Format"
                subtitle="Encapsulation wrapper for multiplexed audio and video streams"
              >
                <Select
                  label="Container Format"
                  value={settings.recording.container}
                  onValueChange={(val) =>
                    updateSetting("recording", "container", val as any)
                  }
                  options={[
                    { value: "mp4", label: "MP4 (MPEG-4)", subtitle: "Broadest playback compatibility" },
                    { value: "mkv", label: "MKV (Matroska)", subtitle: "Crash-resilient stream wrapper" },
                    { value: "webm", label: "WebM", subtitle: "Browser-native streaming" },
                    { value: "gif", label: "Animated GIF", subtitle: "Lossless looping animation" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Quality Profile"
                subtitle="Balance visual fidelity against output bitrate and CPU usage"
              >
                <Select
                  label="Quality Profile"
                  value={settings.recording.quality}
                  onValueChange={(val) =>
                    updateSetting("recording", "quality", val as any)
                  }
                  options={[
                    { value: "low", label: "Balanced (CRF 28)", subtitle: "Compact file size" },
                    { value: "medium", label: "Standard (CRF 23)", subtitle: "Balanced production master" },
                    { value: "high", label: "High Definition (CRF 18)", subtitle: "Studio quality" },
                    { value: "lossless", label: "Lossless (CRF 0)", subtitle: "Zero compression artifacts" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Capture Mouse Cursor"
                subtitle="Render the system pointer overlay in recorded video streams"
              >
                <Switch
                  checked={settings.recording.showCursor}
                  onCheckedChange={(checked) =>
                    updateSetting("recording", "showCursor", checked)
                  }
                  label="Capture Mouse Cursor"
                />
              </SettingRow>
            </div>
          ),
        },
        {
          id: "camera",
          label: "Camera PiP",
          description: "Webcam picture-in-picture placement, geometry, and mirror modes",
          icon: <Camera className="w-4 h-4 text-accent" />,
          keywords: ["camera", "webcam", "pip", "overlay", "mirror", "facecam"],
          content: (
            <div className="space-y-1">
              <SettingRow
                title="Camera Overlay"
                subtitle="Enable floating webcam picture-in-picture during active recording"
              >
                <Switch
                  checked={settings.camera.enabled}
                  onCheckedChange={(checked) =>
                    updateSetting("camera", "enabled", checked)
                  }
                  label="Camera Overlay"
                />
              </SettingRow>

              <SettingRow
                title="Window Geometry"
                subtitle="Visual contour and silhouette of the camera window"
              >
                <Select
                  label="Window Geometry"
                  value={settings.camera.shape}
                  onValueChange={(val) =>
                    updateSetting("camera", "shape", val as any)
                  }
                  options={[
                    { value: "circle", label: "Circular", subtitle: "Minimalist round portal" },
                    { value: "rounded", label: "Rounded Rectangle", subtitle: "Modern balanced corner radius" },
                    { value: "square", label: "Square", subtitle: "Clean linear aspect" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Screen Anchor"
                subtitle="Default quadrant pinning position for the camera frame"
              >
                <Select
                  label="Screen Anchor"
                  value={settings.camera.anchor}
                  onValueChange={(val) =>
                    updateSetting("camera", "anchor", val as any)
                  }
                  options={[
                    { value: "bottom_right", label: "Bottom Right", subtitle: "Standard presentation anchor" },
                    { value: "bottom_left", label: "Bottom Left", subtitle: "Alternative lower corner" },
                    { value: "top_right", label: "Top Right", subtitle: "Upper right placement" },
                    { value: "top_left", label: "Top Left", subtitle: "Upper left placement" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Mirror Camera Feed"
                subtitle="Horizontally flip incoming sensor feed for intuitive eye contact"
              >
                <Switch
                  checked={settings.camera.mirror}
                  onCheckedChange={(checked) =>
                    updateSetting("camera", "mirror", checked)
                  }
                  label="Mirror Camera Feed"
                />
              </SettingRow>
            </div>
          ),
        },
      ],
    },
    {
      label: "Audio & Input",
      items: [
        {
          id: "audio",
          label: "Audio Loopback",
          description: "System monitor loopback, microphone capture, and volume balancing",
          icon: <Mic className="w-4 h-4 text-accent" />,
          keywords: ["audio", "sound", "microphone", "loopback", "pipewire", "pulse", "volume"],
          content: (
            <div className="space-y-4 pt-1">
              <SettingRow
                title="System Audio Loopback"
                subtitle="Capture desktop speakers and application output via PipeWire monitor sink"
              >
                <Switch
                  checked={settings.audio.captureDesktop}
                  onCheckedChange={(checked) =>
                    updateSetting("audio", "captureDesktop", checked)
                  }
                  label="System Audio Loopback"
                />
              </SettingRow>

              <div className="px-1 py-1">
                <Range
                  label="Desktop Loopback Gain"
                  value={settings.audio.desktopVolume}
                  min={0}
                  max={1.5}
                  step={0.05}
                  format={(v) => `${Math.round(v * 100)}%`}
                  onValueChange={(val) =>
                    updateSetting("audio", "desktopVolume", val)
                  }
                />
              </div>

              <SettingRow
                title="Microphone Input"
                subtitle="Record voice commentary alongside application audio"
              >
                <Switch
                  checked={settings.audio.captureMicrophone}
                  onCheckedChange={(checked) =>
                    updateSetting("audio", "captureMicrophone", checked)
                  }
                  label="Microphone Input"
                />
              </SettingRow>

              <div className="px-1 py-1">
                <Range
                  label="Microphone Gain"
                  value={settings.audio.microphoneVolume}
                  min={0}
                  max={2.0}
                  step={0.05}
                  format={(v) => `${Math.round(v * 100)}%`}
                  onValueChange={(val) =>
                    updateSetting("audio", "microphoneVolume", val)
                  }
                />
              </div>

              <SettingRow
                title="Noise Suppression"
                subtitle="Apply real-time spectral suppression to filter background fan and typing noise"
              >
                <Switch
                  checked={settings.audio.noiseSuppression}
                  onCheckedChange={(checked) =>
                    updateSetting("audio", "noiseSuppression", checked)
                  }
                  label="Noise Suppression"
                />
              </SettingRow>
            </div>
          ),
        },
      ],
    },
    {
      label: "System & Storage",
      items: [
        {
          id: "output",
          label: "Output & Snapshots",
          description: "Snapshot encoding, clipboard sync, and floating preview HUD timeout",
          icon: <HardDrive className="w-4 h-4 text-accent" />,
          keywords: ["storage", "screenshot", "save", "clipboard", "preview", "hud"],
          content: (
            <div className="space-y-4 pt-1">
              <SettingRow
                title="Snapshot Format"
                subtitle="Image encoding standard for still area and screen captures"
              >
                <Select
                  label="Snapshot Format"
                  value={settings.screenshot.defaultFormat}
                  onValueChange={(val) =>
                    updateSetting("screenshot", "defaultFormat", val as any)
                  }
                  options={[
                    { value: "png", label: "PNG", subtitle: "Lossless crisp image output" },
                    { value: "webp", label: "WebP", subtitle: "High compression modern format" },
                    { value: "jpeg", label: "JPEG", subtitle: "Standard compressed photograph format" },
                  ]}
                />
              </SettingRow>

              <SettingRow
                title="Auto-Copy to Clipboard"
                subtitle="Automatically copy captured images to system clipboard on completion"
              >
                <Switch
                  checked={settings.screenshot.copyToClipboard}
                  onCheckedChange={(checked) =>
                    updateSetting("screenshot", "copyToClipboard", checked)
                  }
                  label="Auto-Copy to Clipboard"
                />
              </SettingRow>

              <SettingRow
                title="Show Preview Drawer"
                subtitle="Display floating preview card in bottom-right corner after capture"
              >
                <Switch
                  checked={settings.screenshot.showPreviewHud}
                  onCheckedChange={(checked) =>
                    updateSetting("screenshot", "showPreviewHud", checked)
                  }
                  label="Show Preview Drawer"
                />
              </SettingRow>

              <div className="px-1 py-1">
                <Range
                  label="Preview Drawer Dismiss Timeout"
                  value={settings.screenshot.previewHudTimeoutSecs}
                  min={2}
                  max={20}
                  step={1}
                  format={(v) => `${v}s`}
                  onValueChange={(val) =>
                    updateSetting("screenshot", "previewHudTimeoutSecs", val)
                  }
                />
              </div>
            </div>
          ),
        },
        {
          id: "shortcuts",
          label: "Shortcuts",
          description: "Keyboard trigger bindings for capture, pause, and stop commands",
          icon: <Keyboard className="w-4 h-4 text-accent" />,
          keywords: ["shortcuts", "hotkeys", "keyboard", "space", "enter", "escape"],
          content: (
            <div className="space-y-2 py-1">
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-sm font-medium text-fg">Trigger Action (Capture / Record)</span>
                <span className="font-mono text-xs px-2 py-1 rounded bg-raised border border-border text-muted">
                  Space / Enter
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-sm font-medium text-fg">Pause / Resume Recording</span>
                <span className="font-mono text-xs px-2 py-1 rounded bg-raised border border-border text-muted">
                  Space
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-sm font-medium text-fg">Stop and Finalize</span>
                <span className="font-mono text-xs px-2 py-1 rounded bg-raised border border-border text-muted">
                  Escape / Ctrl+Enter
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border/60">
                <span className="text-sm font-medium text-fg">Cancel and Discard</span>
                <span className="font-mono text-xs px-2 py-1 rounded bg-raised border border-border text-muted">
                  Ctrl+Backspace
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm font-medium text-fg">Toggle Preferences</span>
                <span className="font-mono text-xs px-2 py-1 rounded bg-raised border border-border text-muted">
                  Ctrl+,
                </span>
              </div>
            </div>
          ),
        },
        {
          id: "diagnostics",
          label: "Diagnostics & Pipeline",
          description: "Real-time hardware pipeline status, device probes, and system log",
          icon: <Activity className="w-4 h-4 text-accent" />,
          keywords: ["diagnostics", "pipeline", "gstreamer", "pipewire", "status", "logs"],
          content: (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 rounded-lg bg-raised border border-border space-y-1">
                  <div className="text-muted">Display Server</div>
                  <div className="font-mono font-medium text-fg flex items-center justify-between">
                    <span>Wayland / XWayland</span>
                    <StatusBadge status="online" label="ACTIVE" pulse={false} />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-raised border border-border space-y-1">
                  <div className="text-muted">Hardware Video Engine</div>
                  <div className="font-mono font-medium text-fg flex items-center justify-between">
                    <span>VA-API / DMA-BUF</span>
                    <StatusBadge status="online" label="ENABLED" pulse={false} />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-raised border border-border space-y-1">
                  <div className="text-muted">Audio Subsystem</div>
                  <div className="font-mono font-medium text-fg flex items-center justify-between">
                    <span>PipeWire Native</span>
                    <StatusBadge status="online" label="LOCKED" pulse={false} />
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-raised border border-border space-y-1">
                  <div className="text-muted">Zero-Copy Buffer Pool</div>
                  <div className="font-mono font-medium text-fg flex items-center justify-between">
                    <span>memfd / shm</span>
                    <StatusBadge status="online" label="OPTIMAL" pulse={false} />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="font-medium">Pipeline Telemetry Log</span>
                  <span className="font-mono text-[10px]">Realtime IPC Stream</span>
                </div>
                <LogConsole
                  logs={
                    diagnosticLogs.length > 0
                      ? diagnosticLogs
                      : [
                          "[info] GStreamer pipeline initialized with PipeWire screen source",
                          "[info] VA-API hardware encoder context established on /dev/dri/renderD128",
                          "[info] PipeWire loopback sink linked with null monitor endpoint",
                          "[info] Zero-copy memory mapped surface ready for frame presentation",
                        ]
                  }
                  height={160}
                />
              </div>
            </div>
          ),
        },
      ],
    },
  ];
}
