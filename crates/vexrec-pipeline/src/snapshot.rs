use std::borrow::Cow;
use std::os::fd::RawFd;
use std::path::Path;
use arboard::{Clipboard, ImageData};
use gstreamer as gst;
use gstreamer::prelude::*;
use gstreamer_app as gst_app;
use image::{imageops, ImageBuffer, Rgba};
use vexrec_core::error::{VexrecError, Result};
use vexrec_core::geometry::Rect;
use tracing::info;

pub struct SnapshotEngine;

impl SnapshotEngine {
    /// Captures a single pristine frame from PipeWire stream into an RGBA image buffer
    pub fn capture_single_frame(
        pipewire_fd: RawFd,
        node_id: u32,
    ) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        gst::init().map_err(|e| VexrecError::Pipeline(format!("Failed to init GStreamer: {e}")))?;

        let pipe_desc = format!(
            "pipewiresrc fd={pipewire_fd} path={node_id} ! \
             videoconvert ! video/x-raw,format=RGBA ! \
             appsink name=sink max-buffers=1 drop=true",
            pipewire_fd = pipewire_fd,
            node_id = node_id,
        );

        let element = gst::parse::launch(&pipe_desc)
            .map_err(|e| VexrecError::Pipeline(format!("Failed to build snapshot pipeline: {e}")))?;

        let pipeline = element
            .dynamic_cast::<gst::Pipeline>()
            .map_err(|_| VexrecError::Pipeline("Element is not a GStreamer Pipeline".to_string()))?;

        let sink = pipeline
            .by_name("sink")
            .ok_or_else(|| VexrecError::Pipeline("Missing sink element".to_string()))?
            .dynamic_cast::<gst_app::AppSink>()
            .map_err(|_| VexrecError::Pipeline("Sink is not an AppSink".to_string()))?;

        pipeline
            .set_state(gst::State::Playing)
            .map_err(|e| VexrecError::Pipeline(format!("Cannot play pipeline: {e:?}")))?;

        let sample = sink
            .pull_sample()
            .map_err(|e| VexrecError::Pipeline(format!("Failed to pull frame sample: {e}")))?;

        let caps = sample
            .caps()
            .ok_or_else(|| VexrecError::Pipeline("Sample has no caps".to_string()))?;

        let s = caps
            .structure(0)
            .ok_or_else(|| VexrecError::Pipeline("Caps structure missing".to_string()))?;

        let width = s
            .get::<i32>("width")
            .map_err(|e| VexrecError::Pipeline(format!("Width missing: {e}")))? as u32;

        let height = s
            .get::<i32>("height")
            .map_err(|e| VexrecError::Pipeline(format!("Height missing: {e}")))? as u32;

        let buffer = sample
            .buffer()
            .ok_or_else(|| VexrecError::Pipeline("Sample has no buffer".to_string()))?;

        let map = buffer
            .map_readable()
            .map_err(|e| VexrecError::Pipeline(format!("Buffer map error: {e}")))?;

        let img = ImageBuffer::from_raw(width, height, map.as_slice().to_vec())
            .ok_or_else(|| VexrecError::Pipeline("Failed to construct image buffer from frame data".to_string()))?;

        pipeline.set_state(gst::State::Null).ok();

        info!(width, height, "Captured single frame snapshot successfully");
        Ok(img)
    }

    /// Crops an RGBA image buffer to the specified rectangle
    pub fn crop_image(
        img: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        rect: Rect,
    ) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        let (img_w, img_h) = img.dimensions();
        let x = (rect.x.max(0) as u32).min(img_w);
        let y = (rect.y.max(0) as u32).min(img_h);
        let width = rect.width.min(img_w.saturating_sub(x));
        let height = rect.height.min(img_h.saturating_sub(y));

        if width == 0 || height == 0 {
            return Err(VexrecError::Pipeline(
                "Crop region has zero width or height".to_string(),
            ));
        }

        let cropped = imageops::crop_imm(img, x, y, width, height).to_image();
        Ok(cropped)
    }

    /// Copies an RGBA image buffer to the system clipboard
    pub fn copy_to_clipboard(img: &ImageBuffer<Rgba<u8>, Vec<u8>>) -> Result<()> {
        let mut clipboard = Clipboard::new()
            .map_err(|e| VexrecError::Pipeline(format!("Failed to access clipboard: {e}")))?;

        let (width, height) = img.dimensions();
        let image_data = ImageData {
            width: width as usize,
            height: height as usize,
            bytes: Cow::Borrowed(img.as_raw()),
        };

        clipboard
            .set_image(image_data)
            .map_err(|e| VexrecError::Pipeline(format!("Failed to copy image to clipboard: {e}")))?;

        info!(width, height, "Screenshot copied to clipboard");
        Ok(())
    }

    /// Saves image buffer to specified output path
    pub fn save_image<P: AsRef<Path>>(
        img: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        path: P,
    ) -> Result<()> {
        img.save(path)
            .map_err(|e| VexrecError::Pipeline(format!("Failed to save image: {e}")))?;
        Ok(())
    }
}
