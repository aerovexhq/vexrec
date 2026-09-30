use std::os::fd::RawFd;
use std::path::Path;
use gstreamer as gst;
use gstreamer::prelude::*;
use gstreamer_app as gst_app;
use image::{ImageBuffer, Rgba};
use luxrec_core::error::{LuxrecError, Result};
use tracing::info;

pub struct SnapshotEngine;

impl SnapshotEngine {
    /// Captures a single pristine frame from PipeWire stream into an RGBA image buffer
    pub fn capture_single_frame(
        pipewire_fd: RawFd,
        node_id: u32,
    ) -> Result<ImageBuffer<Rgba<u8>, Vec<u8>>> {
        gst::init().map_err(|e| LuxrecError::Pipeline(format!("Failed to init GStreamer: {e}")))?;

        let pipe_desc = format!(
            "pipewiresrc fd={pipewire_fd} path={node_id} ! \
             videoconvert ! video/x-raw,format=RGBA ! \
             appsink name=sink max-buffers=1 drop=true",
            pipewire_fd = pipewire_fd,
            node_id = node_id,
        );

        let element = gst::parse::launch(&pipe_desc)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to build snapshot pipeline: {e}")))?;

        let pipeline = element
            .dynamic_cast::<gst::Pipeline>()
            .map_err(|_| LuxrecError::Pipeline("Element is not a GStreamer Pipeline".to_string()))?;

        let sink = pipeline
            .by_name("sink")
            .ok_or_else(|| LuxrecError::Pipeline("Missing sink element".to_string()))?
            .dynamic_cast::<gst_app::AppSink>()
            .map_err(|_| LuxrecError::Pipeline("Sink is not an AppSink".to_string()))?;

        pipeline
            .set_state(gst::State::Playing)
            .map_err(|e| LuxrecError::Pipeline(format!("Cannot play pipeline: {e:?}")))?;

        let sample = sink
            .pull_sample()
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to pull frame sample: {e}")))?;

        let caps = sample
            .caps()
            .ok_or_else(|| LuxrecError::Pipeline("Sample has no caps".to_string()))?;

        let s = caps
            .structure(0)
            .ok_or_else(|| LuxrecError::Pipeline("Caps structure missing".to_string()))?;

        let width = s
            .get::<i32>("width")
            .map_err(|e| LuxrecError::Pipeline(format!("Width missing: {e}")))? as u32;

        let height = s
            .get::<i32>("height")
            .map_err(|e| LuxrecError::Pipeline(format!("Height missing: {e}")))? as u32;

        let buffer = sample
            .buffer()
            .ok_or_else(|| LuxrecError::Pipeline("Sample has no buffer".to_string()))?;

        let map = buffer
            .map_readable()
            .map_err(|e| LuxrecError::Pipeline(format!("Buffer map error: {e}")))?;

        let img = ImageBuffer::from_raw(width, height, map.as_slice().to_vec())
            .ok_or_else(|| LuxrecError::Pipeline("Failed to construct image buffer from frame data".to_string()))?;

        pipeline.set_state(gst::State::Null).ok();

        info!(width, height, "Captured single frame snapshot successfully");
        Ok(img)
    }

    /// Saves image buffer to specified output path
    pub fn save_image<P: AsRef<Path>>(
        img: &ImageBuffer<Rgba<u8>, Vec<u8>>,
        path: P,
    ) -> Result<()> {
        img.save(path)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to save image: {e}")))?;
        Ok(())
    }
}
