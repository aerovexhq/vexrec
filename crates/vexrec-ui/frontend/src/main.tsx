import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { StrataThemeProvider } from "@aerovex/strata-ui";
import { FreezeOverlay } from "./components/overlay/FreezeOverlay";
import { RecordingFrame } from "./components/frame/RecordingFrame";
import { RecordingIndicator } from "./components/indicator/RecordingIndicator";
import { SettingsModal } from "./components/settings/SettingsModal";
import "./index.css";

// Disable default right-click context menu across minimalist overlay
window.addEventListener("contextmenu", (e) => {
  e.preventDefault();
  e.stopPropagation();
  return false;
}, true);

let windowLabel = "overlay";
try {
  windowLabel = getCurrentWebviewWindow().label;
} catch {
  // Running in standard browser or fallback
}

const renderWindow = () => {
  if (windowLabel === "recording_frame") {
    return <RecordingFrame />;
  }
  if (windowLabel === "recording_indicator") {
    return <RecordingIndicator />;
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
  return <FreezeOverlay />;
};

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <StrataThemeProvider theme="aerovex" preset="vexrec">
      {renderWindow()}
    </StrataThemeProvider>
  </React.StrictMode>
);
