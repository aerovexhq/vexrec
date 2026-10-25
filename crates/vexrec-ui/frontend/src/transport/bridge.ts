import { bridge as strataBridge } from "@aerovex/strata-bridge";
import type { SystemStatus, CaptureResult, VexrecSettings } from "../types";

/**
 * Enterprise IPC transport layer for Vexrec.
 * Built on @aerovex/strata-bridge for cross-platform IPC dispatch.
 */
export class VexrecBridge {
  static get platform() {
    return strataBridge.platform;
  }

  static get isNative() {
    return strataBridge.isNative;
  }

  static async invoke<T = unknown>(command: string, args?: Record<string, unknown>): Promise<T> {
    return strataBridge.invoke<T>(command, args);
  }

  static listen<T = unknown>(event: string, handler: (payload: T) => void): () => void {
    return strataBridge.listen<T>(event, handler);
  }

  static async getSystemStatus(): Promise<SystemStatus> {
    try {
      return await strataBridge.invoke<SystemStatus>("get_system_status");
    } catch {
      return {
        sessionType: "wayland",
        hasVaapi: true,
        hasNvenc: false,
        x11Available: true,
      };
    }
  }

  static async startRecording(options: {
    target: "area" | "fullscreen" | "window";
    framerate: number;
    container: string;
    audio: boolean;
  }): Promise<{ recordingId: string }> {
    return strataBridge.invoke<{ recordingId: string }>("start_recording", options);
  }

  static async stopRecording(): Promise<CaptureResult> {
    return strataBridge.invoke<CaptureResult>("stop_recording");
  }

  static async captureSnapshot(options: {
    target: "area" | "fullscreen" | "window";
    format: string;
  }): Promise<CaptureResult> {
    return strataBridge.invoke<CaptureResult>("capture_snapshot", options);
  }

  static async saveSettings(settings: VexrecSettings): Promise<void> {
    return strataBridge.invoke<void>("save_settings", { settings });
  }
}

export const bridge = VexrecBridge;
