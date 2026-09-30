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

/// Runs the Tauri v2 GUI application
pub fn run_app() {
    tauri::Builder::default()
        .manage(AppRecordingState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_system_status,
            commands::get_config,
            commands::save_config,
            commands::capture_screenshot,
            commands::copy_image_to_clipboard,
        ])
        .run(tauri::generate_context!())
        .expect("error while running luxrec tauri application");
}
