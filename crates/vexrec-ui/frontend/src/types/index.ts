export type AppMode = "capture" | "record";
export type CaptureTarget = "area" | "fullscreen" | "window";
export type RecordingStatus = "idle" | "preparing" | "recording" | "paused" | "finalizing";

export interface SystemStatus {
  sessionType: string;
  hasVaapi: boolean;
  hasNvenc: boolean;
  x11Available: boolean;
  defaultAudioDevice?: string;
  defaultMicDevice?: string;
}

export interface VexrecSettings {
  recording: {
    framerate: number;
    container: "mp4" | "mkv" | "webm" | "gif";
    videoCodec: "auto" | "h264" | "h265" | "vp9" | "av1";
    quality: "low" | "medium" | "high" | "lossless";
    showCursor: boolean;
    showRecordingFrame?: boolean;
    hardwareAccel: boolean;
  };
  audio: {
    captureDesktop: boolean;
    captureMicrophone: boolean;
    desktopVolume: number;
    microphoneVolume: number;
    noiseSuppression: boolean;
  };
  camera: {
    enabled: boolean;
    shape: "circle" | "rounded" | "square";
    anchor: "top_left" | "top_right" | "bottom_left" | "bottom_right";
    width: number;
    height: number;
    mirror: boolean;
  };
  screenshot: {
    defaultFormat: "png" | "jpeg" | "webp";
    copyToClipboard: boolean;
    showPreviewHud: boolean;
    previewHudTimeoutSecs: number;
  };
}

export type LuxrecSettings = VexrecSettings;

export interface CaptureResult {
  filePath: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  thumbnailUrl?: string;
  timestamp: string;
}
