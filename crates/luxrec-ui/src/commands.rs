use std::sync::Mutex;
use luxrec_core::config::LuxrecConfig;
use luxrec_core::geometry::Rect;
use luxrec_pipeline::encoders::EncoderConfig;
use luxrec_pipeline::recorder::RecordingPipeline;
use luxrec_pipeline::snapshot::SnapshotEngine;
use luxrec_pipeline::x11_capture::X11CaptureEngine;
use luxrec_portal::PortalClient;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStatusDto {
    pub session_type: String,
    pub has_vaapi: bool,
    pub has_nvenc: bool,
    pub x11_available: bool,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CaptureResultDto {
    pub file_path: String,
    pub width: u32,
    pub height: u32,
    pub file_size_bytes: u64,
    pub timestamp: String,
}

pub struct AppRecordingState {
    pub active_pipeline: Mutex<Option<RecordingPipeline>>,
}

impl Default for AppRecordingState {
    fn default() -> Self {
        Self {
            active_pipeline: Mutex::new(None),
        }
    }
}

#[tauri::command]
pub async fn get_system_status() -> Result<SystemStatusDto, String> {
    Ok(SystemStatusDto {
        session_type: std::env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| "unknown".into()),
        has_vaapi: EncoderConfig::has_vaapi(),
        has_nvenc: EncoderConfig::has_nvenc(),
        x11_available: X11CaptureEngine::is_available(),
    })
}

#[tauri::command]
pub async fn get_config() -> Result<LuxrecConfig, String> {
    LuxrecConfig::load().map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn save_config(config: LuxrecConfig) -> Result<(), String> {
    let path = LuxrecConfig::config_path();
    config.save(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn capture_screenshot(
    crop: Option<Rect>,
    direct_x11: bool,
) -> Result<CaptureResultDto, String> {
    let config = LuxrecConfig::load().unwrap_or_default();
    let dir = config.storage.screenshot_dir;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let out_path = dir.join(format!("Luxrec_{}.png", now));

    let img = if direct_x11 && X11CaptureEngine::is_available() {
        X11CaptureEngine::capture_screen(crop).map_err(|e| e.to_string())?
    } else {
        let portal = PortalClient::new();
        let uri = portal.request_screenshot(false).await.map_err(|e| e.to_string())?;
        let file_path = uri.to_file_path().map_err(|_| "Invalid file URI".to_string())?;
        let mut loaded = image::open(&file_path).map_err(|e| e.to_string())?.to_rgba8();
        if let Some(r) = crop {
            loaded = SnapshotEngine::crop_image(&loaded, r).map_err(|e| e.to_string())?;
        }
        loaded
    };

    let (width, height) = img.dimensions();
    SnapshotEngine::save_image(&img, &out_path).map_err(|e| e.to_string())?;

    let meta = std::fs::metadata(&out_path).map_err(|e| e.to_string())?;

    Ok(CaptureResultDto {
        file_path: out_path.to_string_lossy().to_string(),
        width,
        height,
        file_size_bytes: meta.len(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub async fn copy_image_to_clipboard(path: String) -> Result<(), String> {
    let img = image::open(&path).map_err(|e| e.to_string())?.to_rgba8();
    SnapshotEngine::copy_to_clipboard(&img).map_err(|e| e.to_string())
}
