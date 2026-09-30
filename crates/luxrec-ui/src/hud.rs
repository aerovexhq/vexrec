use luxrec_core::geometry::Rect;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Serialize, Deserialize)]
pub enum CaptureMode {
    #[default]
    AreaScreenshot,
    FullscreenScreenshot,
    WindowScreenshot,
    AreaRecording,
    FullscreenRecording,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct FloatingHudState {
    pub active_mode: CaptureMode,
    pub is_recording: bool,
    pub is_paused: bool,
    pub mic_enabled: bool,
    pub desktop_audio_enabled: bool,
    pub camera_pip_enabled: bool,
    pub show_cursor: bool,
    pub selected_region: Option<Rect>,
    pub elapsed_recording_secs: u64,
}

impl FloatingHudState {
    pub fn new() -> Self {
        Self {
            active_mode: CaptureMode::AreaScreenshot,
            mic_enabled: true,
            desktop_audio_enabled: true,
            camera_pip_enabled: false,
            show_cursor: true,
            ..Default::default()
        }
    }

    pub fn toggle_mic(&mut self) -> bool {
        self.mic_enabled = !self.mic_enabled;
        self.mic_enabled
    }

    pub fn toggle_desktop_audio(&mut self) -> bool {
        self.desktop_audio_enabled = !self.desktop_audio_enabled;
        self.desktop_audio_enabled
    }

    pub fn toggle_camera_pip(&mut self) -> bool {
        self.camera_pip_enabled = !self.camera_pip_enabled;
        self.camera_pip_enabled
    }
}
