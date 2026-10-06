import { create } from "zustand";
import { AppMode, CaptureResult, CaptureTarget, RecordingStatus } from "../types";

interface AppStore {
  // App Mode & Targets
  mode: AppMode;
  target: CaptureTarget;
  setMode: (mode: AppMode) => void;
  setTarget: (target: CaptureTarget) => void;

  // Device Toggles
  micEnabled: boolean;
  desktopAudioEnabled: boolean;
  cameraPipEnabled: boolean;
  cursorVisible: boolean;
  toggleMic: () => void;
  toggleDesktopAudio: () => void;
  toggleCameraPip: () => void;
  toggleCursor: () => void;

  // Recording State
  recordingStatus: RecordingStatus;
  elapsedSeconds: number;
  audioLevelLeft: number;
  audioLevelRight: number;
  setRecordingStatus: (status: RecordingStatus) => void;
  tickElapsed: () => void;
  resetTimer: () => void;
  setAudioLevels: (left: number, right: number) => void;

  // Capture & Preview
  lastCapture: CaptureResult | null;
  setLastCapture: (capture: CaptureResult | null) => void;

  // Modals & Panels
  settingsOpen: boolean;
  annotatorOpen: boolean;
  setSettingsOpen: (open: boolean) => void;
  setAnnotatorOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  mode: "capture",
  target: "area",
  setMode: (mode) => set({ mode }),
  setTarget: (target) => set({ target }),

  micEnabled: true,
  desktopAudioEnabled: true,
  cameraPipEnabled: false,
  cursorVisible: true,
  toggleMic: () => set((s) => ({ micEnabled: !s.micEnabled })),
  toggleDesktopAudio: () => set((s) => ({ desktopAudioEnabled: !s.desktopAudioEnabled })),
  toggleCameraPip: () => set((s) => ({ cameraPipEnabled: !s.cameraPipEnabled })),
  toggleCursor: () => set((s) => ({ cursorVisible: !s.cursorVisible })),

  recordingStatus: "idle",
  elapsedSeconds: 0,
  audioLevelLeft: 0,
  audioLevelRight: 0,
  setRecordingStatus: (recordingStatus) => set({ recordingStatus }),
  tickElapsed: () => set((s) => ({ elapsedSeconds: s.elapsedSeconds + 1 })),
  resetTimer: () => set({ elapsedSeconds: 0 }),
  setAudioLevels: (left, right) => set({ audioLevelLeft: left, audioLevelRight: right }),

  lastCapture: null,
  setLastCapture: (lastCapture) => set({ lastCapture }),

  settingsOpen: false,
  annotatorOpen: false,
  setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
  setAnnotatorOpen: (annotatorOpen) => set({ annotatorOpen }),
}));
