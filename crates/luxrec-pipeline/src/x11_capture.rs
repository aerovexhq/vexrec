use image::{ImageBuffer, Rgba};
use luxrec_core::error::{LuxrecError, Result};
use luxrec_core::geometry::Rect;
use tracing::info;
use x11rb::connection::Connection;
use x11rb::protocol::xproto::{ConnectionExt, ImageFormat};

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
}
