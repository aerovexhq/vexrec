use image::{ImageBuffer, Rgba};
use luxrec_core::error::{LuxrecError, Result};
use luxrec_core::geometry::Rect;
use tracing::info;
use x11rb::connection::Connection;
use x11rb::protocol::xproto::{ConnectionExt, ImageFormat};
use x11rb::wrapper::ConnectionExt as _;

pub struct X11CaptureEngine;

impl X11CaptureEngine {
    /// Captures the full screen (root window) or a sub-region directly from X11 server
    pub fn capture_screen(region: Option<Rect>) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        let (conn, screen_num) = x11rb::connect(None)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to connect to X11 display: {e}")))?;

        let screen = &conn.setup().roots[screen_num];
        let root = screen.root;

        let (x, y, width, height) = match region {
            Some(r) => (r.x as i16, r.y as i16, r.width as u16, r.height as u16),
            None => (0, 0, screen.width_in_pixels, screen.height_in_pixels),
        };

        info!(x, y, width, height, "Capturing X11 screen buffer");

        let reply = conn
            .get_image(
                ImageFormat::Z_PIXMAP,
                root,
                x,
                y,
                width,
                height,
                !0, // All planes
            )
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to request X11 image: {e}")))?
            .reply()
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to receive X11 image reply: {e}")))?;

        let raw_data = reply.data;
        let mut rgba_buffer: Vec<u8> = Vec::with_capacity((width as usize) * (height as usize) * 4);

        // Convert X11 32-bit BGRA or BGR0 to RGBA
        for chunk in raw_data.chunks_exact(4) {
            let b = chunk[0];
            let g = chunk[1];
            let r = chunk[2];
            let a = 255u8;
            rgba_buffer.extend_from_slice(&[r, g, b, a]);
        }

        let img = ImageBuffer::from_raw(width as u32, height as u32, rgba_buffer)
            .ok_or_else(|| LuxrecError::Pipeline("Failed to create RGBA buffer from X11 image data".to_string()))?;

        Ok(img)
    }

    /// Checks if an active X11 display connection is available
    pub fn is_available() -> bool {
        x11rb::connect(None).is_ok()
    }

    /// Finds all top-level windows owned by the specified PID
    pub fn find_all_windows_by_pid(target_pid: u32) -> Result<Vec<u32>> {
        let (conn, screen_num) = x11rb::connect(None)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to connect to X11 display: {e}")))?;

        let screen = &conn.setup().roots[screen_num];
        let root = screen.root;

        let pid_atom = conn.intern_atom(false, b"_NET_WM_PID")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?
            .reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?
            .atom;

        let tree = conn.query_tree(root)
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?
            .reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?;

        let mut matched = Vec::new();
        for &child in &tree.children {
            if let Ok(reply) = conn.get_property(
                false,
                child,
                pid_atom,
                x11rb::protocol::xproto::AtomEnum::CARDINAL,
                0,
                1,
            ) {
                if let Ok(prop) = reply.reply() {
                    if let Some(val) = prop.value32().and_then(|mut it| it.next()) {
                        if val == target_pid {
                            matched.push(child);
                        }
                    }
                }
            }
        }

        Ok(matched)
    }

    /// Finds any window owned by current PID or matching class "luxrec"
    pub fn find_window_by_pid_or_class(target_pid: u32, target_class: &str) -> Result<Option<u32>> {
        let (conn, screen_num) = x11rb::connect(None)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to connect to X11 display: {e}")))?;

        let screen = &conn.setup().roots[screen_num];
        let root = screen.root;

        let pid_atom = conn.intern_atom(false, b"_NET_WM_PID")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?
            .reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?
            .atom;

        let tree = conn.query_tree(root)
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?
            .reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?;

        for &child in tree.children.iter().rev() {
            // Check PID property
            if let Ok(reply) = conn.get_property(
                false,
                child,
                pid_atom,
                x11rb::protocol::xproto::AtomEnum::CARDINAL,
                0,
                1,
            ) {
                if let Ok(prop) = reply.reply() {
                    if let Some(val) = prop.value32().and_then(|mut it| it.next()) {
                        if val == target_pid {
                            return Ok(Some(child));
                        }
                    }
                }
            }

            // Check WM_CLASS property
            if let Ok(reply) = conn.get_property(
                false,
                child,
                x11rb::protocol::xproto::AtomEnum::WM_CLASS,
                x11rb::protocol::xproto::AtomEnum::STRING,
                0,
                32,
            ) {
                if let Ok(prop) = reply.reply() {
                    let s = String::from_utf8_lossy(&prop.value);
                    if s.contains(target_class) {
                        return Ok(Some(child));
                    }
                }
            }
        }

        Ok(None)
    }

    /// Configures the overlay window with UTILITY type and ABOVE/FULLSCREEN states
    /// to eliminate GNOME Focus Stealing Prevention while preserving full keyboard focus and input.
    pub fn configure_dock_overlay(window: u32) -> Result<()> {
        let (conn, _) = x11rb::connect(None)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to connect to X11 display: {e}")))?;

        let wm_type_atom = conn.intern_atom(false, b"_NET_WM_WINDOW_TYPE")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let type_utility_atom = conn.intern_atom(false, b"_NET_WM_WINDOW_TYPE_UTILITY")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let wm_state_atom = conn.intern_atom(false, b"_NET_WM_STATE")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let state_above = conn.intern_atom(false, b"_NET_WM_STATE_ABOVE")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let state_fullscreen = conn.intern_atom(false, b"_NET_WM_STATE_FULLSCREEN")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let state_skip_taskbar = conn.intern_atom(false, b"_NET_WM_STATE_SKIP_TASKBAR")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let state_skip_pager = conn.intern_atom(false, b"_NET_WM_STATE_SKIP_PAGER")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        // Set UTILITY type
        conn.change_property32(
            x11rb::protocol::xproto::PropMode::REPLACE,
            window,
            wm_type_atom,
            x11rb::protocol::xproto::AtomEnum::ATOM,
            &[type_utility_atom],
        ).map_err(|e| LuxrecError::Pipeline(e.to_string()))?;

        // Set STATES
        conn.change_property32(
            x11rb::protocol::xproto::PropMode::REPLACE,
            window,
            wm_state_atom,
            x11rb::protocol::xproto::AtomEnum::ATOM,
            &[state_above, state_fullscreen, state_skip_taskbar, state_skip_pager],
        ).map_err(|e| LuxrecError::Pipeline(e.to_string()))?;

        // Also update _NET_WM_USER_TIME to current time
        let user_time_atom = conn.intern_atom(false, b"_NET_WM_USER_TIME")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let now_millis = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u32;

        conn.change_property32(
            x11rb::protocol::xproto::PropMode::REPLACE,
            window,
            user_time_atom,
            x11rb::protocol::xproto::AtomEnum::CARDINAL,
            &[now_millis],
        ).map_err(|e| LuxrecError::Pipeline(e.to_string()))?;

        // Clear DEMANDS_ATTENTION if present
        let demands_attention = conn.intern_atom(false, b"_NET_WM_STATE_DEMANDS_ATTENTION")
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.reply()
            .map_err(|e| LuxrecError::Pipeline(e.to_string()))?.atom;

        let _ = conn.delete_property(window, demands_attention);

        conn.flush().map_err(|e| LuxrecError::Pipeline(e.to_string()))?;
        Ok(())
    }

    /// Grabs input focus safely for the window
    pub fn grab_input_focus(window: u32) -> Result<()> {
        let (conn, _) = x11rb::connect(None)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to connect to X11 display: {e}")))?;

        let _ = conn.set_input_focus(
            x11rb::protocol::xproto::InputFocus::POINTER_ROOT,
            window,
            x11rb::protocol::xproto::Time::CURRENT_TIME,
        );

        conn.flush().map_err(|e| LuxrecError::Pipeline(e.to_string()))?;
        info!(win = window, "Successfully grabbed X11 keyboard focus for overlay");
        Ok(())
    }
}
