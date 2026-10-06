use std::path::PathBuf;
use std::sync::Mutex;
use base64::Engine;
use image::ImageEncoder;
use luxrec_core::config::LuxrecConfig;
use luxrec_core::formats::ContainerFormat;
use luxrec_core::geometry::Rect;
use luxrec_pipeline::encoders::EncoderConfig;
use luxrec_pipeline::recorder::RecordingPipeline;
use luxrec_pipeline::snapshot::SnapshotEngine;
use luxrec_pipeline::x11_capture::X11CaptureEngine;
use luxrec_portal::PortalClient;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemStatusDto {
    pub session_type: String,
    pub has_vaapi: bool,
    pub has_nvenc: bool,
    pub x11_available: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CaptureResultDto {
    pub file_path: String,
    pub width: u32,
    pub height: u32,
    pub file_size_bytes: u64,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FreezeDataDto {
    pub image_path: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    pub width: u32,
    pub height: u32,
    pub last_mode: Option<String>,
    pub last_region: Option<Rect>,
}

pub struct AppRecordingState {
    pub active_pipeline: Mutex<Option<RecordingPipeline>>,
    pub freeze_data: Mutex<Option<FreezeDataDto>>,
}

impl Default for AppRecordingState {
    fn default() -> Self {
        Self {
            active_pipeline: Mutex::new(None),
            freeze_data: Mutex::new(None),
        }
    }
}

pub fn expand_path(p: &std::path::Path) -> PathBuf {
    let s = p.to_string_lossy();
    if s.starts_with("~/") || s == "~" {
        if let Some(home) = dirs::home_dir() {
            return home.join(s.strip_prefix("~/").unwrap_or(""));
        }
    }
    p.to_path_buf()
}

pub fn create_red_circle_icon() -> tauri::image::Image<'static> {
    const SIZE: u32 = 32;
    let mut rgba = Vec::with_capacity((SIZE * SIZE * 4) as usize);
    let center = (SIZE as f32 - 1.0) / 2.0;
    let radius = 11.0;

    for y in 0..SIZE {
        for x in 0..SIZE {
            let dx = x as f32 - center;
            let dy = y as f32 - center;
            let dist = (dx * dx + dy * dy).sqrt();
            if dist <= radius - 0.5 {
                rgba.extend_from_slice(&[239, 68, 68, 255]);
            } else if dist <= radius + 0.5 {
                let alpha = ((radius + 0.5 - dist) * 255.0).clamp(0.0, 255.0) as u8;
                rgba.extend_from_slice(&[239, 68, 68, alpha]);
            } else {
                rgba.extend_from_slice(&[0, 0, 0, 0]);
            }
        }
    }

    tauri::image::Image::new_owned(rgba, SIZE, SIZE)
}

pub fn show_recording_tray(app: &tauri::AppHandle) -> Result<(), String> {
    let _ = app.remove_tray_by_id("recording_tray");
    let icon = create_red_circle_icon();
    let app_handle = app.clone();

    tauri::tray::TrayIconBuilder::with_id("recording_tray")
        .icon(icon)
        .tooltip("Recording in progress - Click to stop")
        .on_tray_icon_event(move |_tray, event| {
            if let tauri::tray::TrayIconEvent::Click { button_state: tauri::tray::MouseButtonState::Up, .. } = event {
                let app = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    if let Some(state) = app.try_state::<AppRecordingState>() {
                        let _ = stop_recording_internal(&app, &state).await;
                    }
                });
            }
        })
        .build(app)
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn hide_recording_tray(app: &tauri::AppHandle) {
    let _ = app.remove_tray_by_id("recording_tray");
}

pub async fn stop_recording_internal(
    app: &tauri::AppHandle,
    state: &AppRecordingState,
) -> Result<Option<CaptureResultDto>, String> {
    hide_recording_tray(app);

    let pipeline_opt = state.active_pipeline.lock().unwrap().take();
    if let Some(pipeline) = pipeline_opt {
        let out_path = pipeline.output_path().clone();
        pipeline.stop().map_err(|e| e.to_string())?;

        let meta = std::fs::metadata(&out_path).ok();
        let file_size = meta.as_ref().map(|m| m.len()).unwrap_or(0);

        let _ = std::process::Command::new("notify-send")
            .args([
                "-a", "Luxrec",
                "-i", "video-x-generic",
                "Recording Saved",
                &format!("Video saved to {}", out_path.display()),
            ])
            .spawn();

        let res = CaptureResultDto {
            file_path: out_path.to_string_lossy().to_string(),
            width: 1920,
            height: 1080,
            file_size_bytes: file_size,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };

        let _ = app.emit("luxrec://recording-stopped", &res);
        Ok(Some(res))
    } else {
        Ok(None)
    }
}

pub fn trigger_freeze(
    app: &tauri::AppHandle,
    state: &AppRecordingState,
) -> Result<(), String> {
    let img = X11CaptureEngine::capture_screen(None).map_err(|e| e.to_string())?;
    let (width, height) = img.dimensions();

    let freeze_path = PathBuf::from("/tmp/luxrec_freeze.png");
    SnapshotEngine::save_image(&img, &freeze_path).map_err(|e| e.to_string())?;

    let mut png_bytes = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut png_bytes);
    encoder
        .write_image(&img, width, height, image::ExtendedColorType::Rgba8)
        .map_err(|e| e.to_string())?;

    let b64 = base64::engine::general_purpose::STANDARD.encode(&png_bytes);
    let image_url = Some(format!("data:image/png;base64,{}", b64));

    let config = LuxrecConfig::load().unwrap_or_default();
    let freeze_dto = FreezeDataDto {
        image_path: freeze_path.to_string_lossy().to_string(),
        image_url,
        width,
        height,
        last_mode: config.screenshot.last_mode,
        last_region: config.screenshot.last_region,
    };

    *state.freeze_data.lock().unwrap() = Some(freeze_dto.clone());

    let _ = app.emit("luxrec://freeze-ready", &freeze_dto);

    if let Some(overlay) = app.get_webview_window("overlay") {
        #[cfg(target_os = "linux")]
        {
            if let Ok(gtk_win) = overlay.gtk_window() {
                use gtk::prelude::GtkWindowExt;
                gtk_win.set_type_hint(gdk::WindowTypeHint::Dock);
                gtk_win.set_skip_taskbar_hint(true);
                gtk_win.set_skip_pager_hint(true);
                gtk_win.set_keep_above(true);
                gtk_win.present();
            }
        }
        overlay.show().map_err(|e| e.to_string())?;
        overlay.set_focus().map_err(|e| e.to_string())?;
    }

    // Configure all X11 windows of this process to dock layer so GNOME never shows "is ready" banner
    if let Ok(windows) = X11CaptureEngine::find_all_windows_by_pid(std::process::id()) {
        for win in windows {
            let _ = X11CaptureEngine::configure_dock_overlay(win);
            let _ = X11CaptureEngine::grab_input_focus(win);
        }
    }

    Ok(())
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
pub async fn get_autostart() -> Result<bool, String> {
    let autostart_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from(".")).join("autostart");
    let desktop_file = autostart_dir.join("luxrec.desktop");
    Ok(desktop_file.exists())
}

#[tauri::command]
pub async fn set_autostart(enabled: bool) -> Result<(), String> {
    let autostart_dir = dirs::config_dir().unwrap_or_else(|| PathBuf::from(".")).join("autostart");
    let desktop_file = autostart_dir.join("luxrec.desktop");

    if enabled {
        let _ = std::fs::create_dir_all(&autostart_dir);
        let content = "[Desktop Entry]\nType=Application\nName=Luxrec\nExec=luxrec daemon\nIcon=luxrec\nTerminal=false\nCategories=Utility;AudioVideo;Recorder;\nX-GNOME-Autostart-enabled=true\n";
        std::fs::write(&desktop_file, content).map_err(|e| e.to_string())?;
    } else if desktop_file.exists() {
        let _ = std::fs::remove_file(&desktop_file);
    }
    Ok(())
}

#[tauri::command]
pub async fn get_system_screenshot_status() -> Result<bool, String> {
    let output = std::process::Command::new("gsettings")
        .args([
            "get",
            "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-screenshot/",
            "binding",
        ])
        .output();

    if let Ok(out) = output {
        let s = String::from_utf8_lossy(&out.stdout);
        return Ok(s.contains("Print"));
    }
    Ok(false)
}

#[tauri::command]
pub async fn replace_system_screenshot(enabled: bool) -> Result<(), String> {
    if enabled {
        let _ = std::process::Command::new("gsettings")
            .args(["set", "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-screenshot/", "name", "Luxrec Interactive Screenshot"])
            .status();
        let _ = std::process::Command::new("gsettings")
            .args(["set", "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-screenshot/", "command", "luxrec freeze"])
            .status();
        let _ = std::process::Command::new("gsettings")
            .args(["set", "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-screenshot/", "binding", "Print"])
            .status();

        let _ = std::process::Command::new("gsettings")
            .args(["set", "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-area/", "name", "Luxrec Stop Recording"])
            .status();
        let _ = std::process::Command::new("gsettings")
            .args(["set", "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-area/", "command", "luxrec stop-recording"])
            .status();
        let _ = std::process::Command::new("gsettings")
            .args(["set", "org.gnome.settings-daemon.plugins.media-keys.custom-keybinding:/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-area/", "binding", "<Shift>Print"])
            .status();

        let list_out = std::process::Command::new("gsettings")
            .args(["get", "org.gnome.settings-daemon.plugins.media-keys", "custom-keybindings"])
            .output();
        if let Ok(out) = list_out {
            let s = String::from_utf8_lossy(&out.stdout).trim().to_string();
            let mut paths: Vec<String> = s
                .trim_start_matches('[')
                .trim_end_matches(']')
                .split(',')
                .map(|p| p.trim().trim_matches('\'').to_string())
                .filter(|p| !p.is_empty())
                .collect();

            let p1 = "/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-screenshot/".to_string();
            let p2 = "/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/luxrec-area/".to_string();

            if !paths.contains(&p1) {
                paths.push(p1);
            }
            if !paths.contains(&p2) {
                paths.push(p2);
            }

            let formatted = format!("[{}]", paths.iter().map(|p| format!("'{}'", p)).collect::<Vec<_>>().join(", "));
            let _ = std::process::Command::new("gsettings")
                .args(["set", "org.gnome.settings-daemon.plugins.media-keys", "custom-keybindings", &formatted])
                .status();
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_window_position(window: tauri::WebviewWindow) -> Result<[i32; 2], String> {
    let pos = window.outer_position().map_err(|e| e.to_string())?;
    Ok([pos.x, pos.y])
}

#[tauri::command]
pub async fn set_window_position(window: tauri::WebviewWindow, x: i32, y: i32) -> Result<(), String> {
    window
        .set_position(tauri::Position::Physical(tauri::PhysicalPosition { x, y }))
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn open_settings_window(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(settings) = app.get_webview_window("settings") {
        settings.show().map_err(|e| e.to_string())?;
        settings.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn get_freeze_data(
    state: tauri::State<'_, AppRecordingState>,
) -> Result<Option<FreezeDataDto>, String> {
    Ok(state.freeze_data.lock().unwrap().clone())
}

#[tauri::command]
pub async fn cancel_freeze(app: tauri::AppHandle) -> Result<(), String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }
    Ok(())
}

#[tauri::command]
pub async fn confirm_freeze_capture(
    app: tauri::AppHandle,
    _state: tauri::State<'_, AppRecordingState>,
    crop: Option<Rect>,
    copy_to_clipboard: Option<bool>,
    custom_path: Option<String>,
) -> Result<CaptureResultDto, String> {
    if let Some(overlay) = app.get_webview_window("overlay") {
        let _ = overlay.hide();
    }

    let base_img = image::open("/tmp/luxrec_freeze.png")
        .map_err(|e| e.to_string())?
        .to_rgba8();

    let cropped = if let Some(r) = crop {
        SnapshotEngine::crop_image(&base_img, r).map_err(|e| e.to_string())?
    } else {
        base_img
    };

    let config = LuxrecConfig::load().unwrap_or_default();
    let save_dir = expand_path(&config.storage.screenshot_dir);
    let out_path = if let Some(ref p) = custom_path {
        if p == "PROMPT_SAVE" || p.is_empty() {
            let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
            save_dir.join(format!("Luxrec_{}.png", now))
        } else {
            expand_path(&PathBuf::from(p))
        }
    } else {
        let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
        save_dir.join(format!("Luxrec_{}.png", now))
    };

    if let Some(parent) = out_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }

    SnapshotEngine::save_image(&cropped, &out_path).map_err(|e| e.to_string())?;

    if copy_to_clipboard.unwrap_or(true) {
        let _ = SnapshotEngine::copy_to_clipboard(&cropped);
    }

    let mut updated_config = config.clone();
    if let Some(r) = crop {
        updated_config.screenshot.last_region = Some(r);
        updated_config.screenshot.last_mode = Some("region".to_string());
    } else {
        updated_config.screenshot.last_mode = Some("fullscreen".to_string());
    }
    let _ = updated_config.save(&LuxrecConfig::config_path());

    let meta = std::fs::metadata(&out_path).map_err(|e| e.to_string())?;
    let (w, h) = cropped.dimensions();

    let _ = std::process::Command::new("notify-send")
        .args([
            "-a", "Luxrec",
            "-i", "camera-photo",
            "Screenshot Saved",
            &format!("Saved to {}\nCopied to clipboard", out_path.display()),
        ])
        .spawn();

    Ok(CaptureResultDto {
        file_path: out_path.to_string_lossy().to_string(),
        width: w,
        height: h,
        file_size_bytes: meta.len(),
        timestamp: chrono::Utc::now().to_rfc3339(),
    })
}

#[tauri::command]
pub async fn start_recording(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppRecordingState>,
    _target: Option<String>,
    crop: Option<Rect>,
    fps: Option<u32>,
    format: Option<String>,
    mic: Option<bool>,
    desktop_audio: Option<bool>,
) -> Result<(), String> {
    let mut config = LuxrecConfig::load().unwrap_or_default();
    if let Some(f) = fps {
        config.recording.framerate = f;
    }
    if let Some(m) = mic {
        config.audio.capture_microphone = m;
    }
    if let Some(d) = desktop_audio {
        config.audio.capture_desktop = d;
    }
    if let Some(fmt) = format {
        config.recording.container = match fmt.to_lowercase().as_str() {
            "mkv" => ContainerFormat::Mkv,
            "webm" => ContainerFormat::Webm,
            "gif" => ContainerFormat::Gif,
            _ => ContainerFormat::Mp4,
        };
    }

    let out_dir = expand_path(&config.storage.recording_dir);
    let _ = std::fs::create_dir_all(&out_dir);
    let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
    let out_path = out_dir.join(format!("Luxrec_{}.{}", now, config.recording.container.extension()));

    let pipeline = if X11CaptureEngine::is_available() {
        RecordingPipeline::new_x11(crop, out_path, &config).map_err(|e| e.to_string())?
    } else {
        let portal = PortalClient::new();
        let streams = portal
            .request_screencast(config.recording.show_cursor)
            .await
            .map_err(|e| e.to_string())?;
        let primary_stream = streams
            .into_iter()
            .next()
            .ok_or_else(|| "No active screen stream granted by portal".to_string())?;
        use std::os::fd::AsRawFd;
        RecordingPipeline::new(
            primary_stream.pipewire_fd.as_raw_fd(),
            primary_stream.node_id,
            out_path,
            &config,
        ).map_err(|e| e.to_string())?
    };

    pipeline.start().map_err(|e| e.to_string())?;
    *state.active_pipeline.lock().unwrap() = Some(pipeline);

    // Show top-right reddish circle tray icon when actively recording
    show_recording_tray(&app)?;

    Ok(())
}

#[tauri::command]
pub async fn stop_recording(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppRecordingState>,
) -> Result<Option<CaptureResultDto>, String> {
    stop_recording_internal(&app, &state).await
}

#[tauri::command]
pub async fn pause_recording(
    state: tauri::State<'_, AppRecordingState>,
) -> Result<(), String> {
    if let Some(pipeline) = state.active_pipeline.lock().unwrap().as_ref() {
        pipeline.pause().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn resume_recording(
    state: tauri::State<'_, AppRecordingState>,
) -> Result<(), String> {
    if let Some(pipeline) = state.active_pipeline.lock().unwrap().as_ref() {
        pipeline.resume().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub async fn discard_recording(
    app: tauri::AppHandle,
    state: tauri::State<'_, AppRecordingState>,
) -> Result<(), String> {
    hide_recording_tray(&app);
    let pipeline_opt = state.active_pipeline.lock().unwrap().take();
    if let Some(pipeline) = pipeline_opt {
        let _ = pipeline.discard();
    }
    Ok(())
}

#[tauri::command]
pub async fn capture_screenshot(
    crop: Option<Rect>,
    direct_x11: bool,
) -> Result<CaptureResultDto, String> {
    let config = LuxrecConfig::load().unwrap_or_default();
    let dir = expand_path(&config.storage.screenshot_dir);
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
