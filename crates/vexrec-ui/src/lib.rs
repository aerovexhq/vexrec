pub mod annotator;
pub mod commands;
pub mod hud;
pub mod renderer;
pub mod selection;

pub use annotator::{AnnotationCanvas, AnnotationTool};
pub use commands::*;
pub use hud::{CaptureMode, FloatingHudState};
pub use renderer::AnnotationRenderer;
pub use selection::SelectionManager;

use std::path::Path;
use tauri::Manager;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UnixListener;
use tracing::{error, info};

pub const SOCKET_PATH: &str = "/tmp/vexrec.sock";
pub const LEGACY_SOCKET_PATH: &str = "/tmp/luxrec.sock";

/// Sends a command to the running background daemon over UNIX socket
pub async fn send_daemon_command(cmd: &str) -> Result<String, String> {
    use tokio::net::UnixStream;
    let stream_res = UnixStream::connect(SOCKET_PATH).await;
    let mut stream = match stream_res {
        Ok(s) => s,
        Err(_) => UnixStream::connect(LEGACY_SOCKET_PATH)
            .await
            .map_err(|e| format!("Could not connect to vexrec daemon socket at {SOCKET_PATH}: {e}"))?,
    };

    stream
        .write_all(format!("{cmd}\n").as_bytes())
        .await
        .map_err(|e| e.to_string())?;

    let mut reader = BufReader::new(stream);
    let mut response = String::new();
    let _ = reader.read_line(&mut response).await;
    Ok(response.trim().to_string())
}

/// Helper to start the UNIX domain socket server
fn spawn_socket_server(app_handle: tauri::AppHandle) {
    tauri::async_runtime::spawn(async move {
        let socket_path = Path::new(SOCKET_PATH);
        if socket_path.exists() {
            // Check if socket is active
            if send_daemon_command("ping").await.is_ok() {
                info!("Another daemon instance is active on socket");
                return;
            }
            let _ = std::fs::remove_file(socket_path);
        }
        let legacy_path = Path::new(LEGACY_SOCKET_PATH);
        let _ = std::fs::remove_file(legacy_path);

        let listener = match UnixListener::bind(socket_path) {
            Ok(l) => {
                // Symlink legacy socket to current socket for backwards compatibility
                let _ = std::os::unix::fs::symlink(socket_path, legacy_path);
                l
            }
            Err(e) => {
                error!("Failed to bind UNIX socket at {}: {}", SOCKET_PATH, e);
                return;
            }
        };

        info!("Vexrec daemon socket listening on {}", SOCKET_PATH);

        loop {
            match listener.accept().await {
                Ok((mut stream, _)) => {
                    let app = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        let (reader, mut writer) = stream.split();
                        let mut buf_reader = BufReader::new(reader);
                        let mut line = String::new();
                        if buf_reader.read_line(&mut line).await.is_ok() {
                            let cmd = line.trim();
                            info!(cmd, "Received socket command");
                            match cmd {
                                "freeze" => {
                                    if let Some(state) = app.try_state::<AppRecordingState>() {
                                        if let Err(e) = trigger_freeze(&app, &state) {
                                            error!("Error triggering freeze: {e}");
                                            let _ = writer.write_all(format!("ERR: {e}\n").as_bytes()).await;
                                        } else {
                                            let _ = writer.write_all(b"OK: freeze\n").await;
                                        }
                                    }
                                }
                                "start_recording" => {
                                    if let Some(state) = app.try_state::<AppRecordingState>() {
                                        match start_recording(
                                            app.clone(),
                                            state,
                                            None,
                                            None,
                                            Some(60),
                                            Some("mp4".into()),
                                            Some(true),
                                            Some(true),
                                        ).await {
                                            Ok(_) => {
                                                let _ = writer.write_all(b"OK: recording started\n").await;
                                            }
                                            Err(e) => {
                                                let _ = writer.write_all(format!("ERR: {e}\n").as_bytes()).await;
                                            }
                                        }
                                    }
                                }
                                "stop_recording" => {
                                    if let Some(state) = app.try_state::<AppRecordingState>() {
                                        match stop_recording_internal(&app, &state).await {
                                            Ok(Some(res)) => {
                                                let _ = writer.write_all(format!("OK: {}\n", res.file_path).as_bytes()).await;
                                            }
                                            Ok(None) => {
                                                let _ = writer.write_all(b"OK: no active recording\n").await;
                                            }
                                            Err(e) => {
                                                let _ = writer.write_all(format!("ERR: {e}\n").as_bytes()).await;
                                            }
                                        }
                                    }
                                }
                                "cancel_freeze" => {
                                    if let Some(overlay) = app.get_webview_window("overlay") {
                                        let _ = overlay.hide();
                                    }
                                    let _ = writer.write_all(b"OK: freeze cancelled\n").await;
                                }
                                "ping" => {
                                    let _ = writer.write_all(b"pong\n").await;
                                }
                                other => {
                                    let _ = writer.write_all(format!("UNKNOWN: {other}\n").as_bytes()).await;
                                }
                            }
                        }
                    });
                }
                Err(e) => {
                    error!("Error accepting socket connection: {e}");
                }
            }
        }
    });
}

/// Runs the Tauri application in either standard GUI mode or background daemon mode
pub fn run_app_mode(is_daemon: bool) {
    let app = tauri::Builder::default()
        .manage(AppRecordingState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_system_status,
            commands::get_config,
            commands::save_config,
            commands::capture_screenshot,
            commands::copy_image_to_clipboard,
            commands::get_autostart,
            commands::set_autostart,
            commands::get_system_screenshot_status,
            commands::replace_system_screenshot,
            commands::get_window_position,
            commands::set_window_position,
            commands::open_settings_window,
            commands::get_freeze_data,
            commands::confirm_freeze_capture,
            commands::cancel_freeze,
            commands::start_recording,
            commands::stop_recording,
            commands::pause_recording,
            commands::resume_recording,
            commands::discard_recording,
        ])
        .setup(move |app| {
            let app_handle = app.handle().clone();
            spawn_socket_server(app_handle);

            if !is_daemon {
                if let Some(main_win) = app.get_webview_window("main") {
                    let _ = main_win.show();
                }
            }

            #[cfg(target_os = "linux")]
            {
                std::thread::spawn(|| {
                    let _ = std::process::Command::new("gsettings")
                        .args(["set", "org.gnome.shell.keybindings", "screenshot", "[]"])
                        .status();
                });

                if let Some(overlay_win) = app.get_webview_window("overlay") {
                    if let Ok(gtk_win) = overlay_win.gtk_window() {
                        use gtk::prelude::*;
                        gtk_win.set_type_hint(gdk::WindowTypeHint::Utility);
                        gtk_win.set_skip_taskbar_hint(true);
                        gtk_win.set_skip_pager_hint(true);
                        gtk_win.set_keep_above(true);
                        gtk_win.set_accept_focus(true);
                    }
                }
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building vexrec tauri application");

    app.run(move |_app_handle, event| {
        eprintln!("Tauri event: {event:?}");
        if is_daemon {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                api.prevent_exit();
            }
        }
    });
}

/// Runs the interactive GUI
pub fn run_app() {
    run_app_mode(false);
}

/// Runs as background daemon (starts hidden with socket server, no tray icon until recording)
pub fn run_daemon() {
    run_app_mode(true);
}
