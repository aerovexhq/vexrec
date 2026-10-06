import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import App from "./App";
import { FreezeOverlay } from "./components/overlay/FreezeOverlay";
import { RecordingFrame } from "./components/frame/RecordingFrame";
import { SettingsModal } from "./components/settings/SettingsModal";
import "./index.css";

// Disable default right-click context menu across minimalist overlay and HUD windows
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, true);

let windowLabel = "main";
try {
  windowLabel = getCurrentWebviewWindow().label;
} catch {
  // Running in standard browser or fallback
}

const renderWindow = () => {
  if (windowLabel === "overlay") {
    return <FreezeOverlay />;
  }
  if (windowLabel === "recording_frame") {
    return <RecordingFrame />;
  }
  if (windowLabel === "settings") {
    return (
      <SettingsModal
        isOpen={true}
        onClose={() => {
          try {
            getCurrentWebviewWindow().hide();
          } catch {}
        }}
      />
    );
  }
  return <App />;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    {renderWindow()}
  </React.StrictMode>
);
