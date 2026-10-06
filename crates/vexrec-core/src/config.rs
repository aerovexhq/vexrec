use std::path::{Path, PathBuf};
use serde::{Deserialize, Serialize};
use crate::error::{VexrecError, Result};
use crate::formats::{AudioCodec, ContainerFormat, ImageFormat, VideoCodec, VideoQuality};
use crate::geometry::Rect;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeneralConfig {
    pub autostart: bool,
    pub close_to_tray: bool,
}

impl Default for GeneralConfig {
    fn default() -> Self {
        Self {
            autostart: true,
            close_to_tray: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VexrecConfig {
    #[serde(default)]
    pub general: GeneralConfig,
    pub recording: RecordingConfig,
    pub audio: AudioConfig,
    pub camera: CameraConfig,
    pub screenshot: ScreenshotConfig,
    pub storage: StorageConfig,
    pub hotkeys: HotkeyConfig,
}

pub type LuxrecConfig = VexrecConfig;

impl Default for VexrecConfig {
    fn default() -> Self {
        Self {
            general: GeneralConfig::default(),
            recording: RecordingConfig::default(),
            audio: AudioConfig::default(),
            camera: CameraConfig::default(),
            screenshot: ScreenshotConfig::default(),
            storage: StorageConfig::default(),
            hotkeys: HotkeyConfig::default(),
        }
    }
}

impl VexrecConfig {
    pub fn config_path() -> PathBuf {
        let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
        let vexrec_path = base.join("vexrec").join("config.toml");
        if vexrec_path.exists() {
            return vexrec_path;
        }
        let legacy_path = base.join("luxrec").join("config.toml");
        if legacy_path.exists() {
            return legacy_path;
        }
        vexrec_path
    }

    pub fn load() -> Result<Self> {
        let path = Self::config_path();
        if !path.exists() {
            let default_config = Self::default();
            default_config.save(&path)?;
            return Ok(default_config);
        }

        let content = std::fs::read_to_string(&path)?;
        toml::from_str(&content).map_err(|e| VexrecError::Config(e.to_string()))
    }

    pub fn save(&self, path: &Path) -> Result<()> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent)?;
        }
        let content = toml::to_string_pretty(self)
            .map_err(|e| VexrecError::Config(e.to_string()))?;
        std::fs::write(path, content)?;
        Ok(())
    }
}

fn default_true() -> bool {
    true
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordingConfig {
    pub framerate: u32,
    pub container: ContainerFormat,
    pub video_codec: VideoCodec,
    pub quality: VideoQuality,
    pub show_cursor: bool,
    #[serde(default = "default_true")]
    pub show_recording_frame: bool,
    pub hardware_accel: bool,
    pub capture_region: Option<Rect>,
}

impl Default for RecordingConfig {
    fn default() -> Self {
        Self {
            framerate: 60,
            container: ContainerFormat::Mp4,
            video_codec: VideoCodec::Auto,
            quality: VideoQuality::Medium,
            show_cursor: true,
            show_recording_frame: true,
            hardware_accel: true,
            capture_region: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioConfig {
    pub capture_desktop: bool,
    pub capture_microphone: bool,
    pub desktop_device: Option<String>,
    pub microphone_device: Option<String>,
    pub codec: AudioCodec,
    pub desktop_volume: f32,
    pub microphone_volume: f32,
    pub noise_suppression: bool,
}

impl Default for AudioConfig {
    fn default() -> Self {
        Self {
            capture_desktop: true,
            capture_microphone: true,
            desktop_device: None,
            microphone_device: None,
            codec: AudioCodec::Auto,
            desktop_volume: 1.0,
            microphone_volume: 1.0,
            noise_suppression: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CameraShape {
    Circle,
    RoundedRect(u32),
    Square,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CameraAnchor {
    TopLeft,
    TopRight,
    BottomLeft,
    BottomRight,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraConfig {
    pub enabled: bool,
    pub device_path: Option<String>,
    pub shape: CameraShape,
    pub anchor: CameraAnchor,
    pub width: u32,
    pub height: u32,
    pub margin: u32,
    pub mirror: bool,
}

impl Default for CameraConfig {
    fn default() -> Self {
        Self {
            enabled: false,
            device_path: None,
            shape: CameraShape::Circle,
            anchor: CameraAnchor::BottomRight,
            width: 280,
            height: 280,
            margin: 32,
            mirror: true,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenshotConfig {
    pub default_format: ImageFormat,
    pub copy_to_clipboard: bool,
    pub show_preview_hud: bool,
    pub preview_hud_timeout_secs: u32,
    pub include_cursor: bool,
    #[serde(default)]
    pub last_mode: Option<String>,
    #[serde(default)]
    pub last_region: Option<Rect>,
}

impl Default for ScreenshotConfig {
    fn default() -> Self {
        Self {
            default_format: ImageFormat::Png,
            copy_to_clipboard: true,
            show_preview_hud: true,
            preview_hud_timeout_secs: 5,
            include_cursor: false,
            last_mode: Some("area".to_string()),
            last_region: None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StorageConfig {
    pub screenshot_dir: PathBuf,
    pub recording_dir: PathBuf,
    pub filename_pattern: String,
}

impl Default for StorageConfig {
    fn default() -> Self {
        let pictures = dirs::picture_dir().unwrap_or_else(|| PathBuf::from("~/Pictures"));
        let videos = dirs::video_dir().unwrap_or_else(|| PathBuf::from("~/Videos"));
        Self {
            screenshot_dir: pictures.join("Vexrec"),
            recording_dir: videos.join("Vexrec"),
            filename_pattern: "Vexrec_{type}_{datetime}".to_string(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HotkeyConfig {
    pub screenshot_area: String,
    pub screenshot_fullscreen: String,
    pub record_area: String,
    pub record_fullscreen: String,
    pub toggle_pause: String,
    pub stop_recording: String,
}

impl Default for HotkeyConfig {
    fn default() -> Self {
        Self {
            screenshot_area: "<Super><Shift>4".to_string(),
            screenshot_fullscreen: "<Super><Shift>3".to_string(),
            record_area: "<Super><Shift>5".to_string(),
            record_fullscreen: "<Super><Shift>6".to_string(),
            toggle_pause: "<Super><Shift>Space".to_string(),
            stop_recording: "<Super><Shift>Escape".to_string(),
        }
    }
}
