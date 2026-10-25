import React, { useState } from "react";
import { CategorySettingsModal } from "@aerovex/strata-ui";
import { getVexrecSettingsSchema, type SettingUpdater } from "../../config/settingsSchema";
import type { VexrecSettings } from "../../types";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_SETTINGS: VexrecSettings = {
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
  const [settings, setSettings] = useState<VexrecSettings>(DEFAULT_SETTINGS);

  const updateSetting: SettingUpdater = (section, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const groups = getVexrecSettingsSchema(settings, updateSetting);

  return (
    <CategorySettingsModal
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title="Vexrec Preferences"
      groups={groups}
      searchPlaceholder="Search capture, audio, and encoder settings..."
      footer={
        <div className="flex items-center justify-between text-[11px] text-muted w-full font-mono">
          <span>Enterprise Linux Capture Kernel</span>
          <span className="text-fg">v0.1.0</span>
        </div>
      }
    />
  );
};
