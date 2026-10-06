use std::os::fd::RawFd;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use gstreamer as gst;
use gstreamer::prelude::*;
use luxrec_core::config::LuxrecConfig;
use luxrec_core::error::{LuxrecError, Result};
use tracing::{error, info};

use crate::audio::AudioPipelineBuilder;
use crate::encoders::EncoderConfig;

pub struct RecordingPipeline {
    pipeline: gst::Pipeline,
    output_path: PathBuf,
    is_paused: Arc<AtomicBool>,
}

impl RecordingPipeline {
    /// Builds a full GStreamer recording pipeline from PipeWire stream fd & node_id
    pub fn new(
        pipewire_fd: RawFd,
        node_id: u32,
        output_path: PathBuf,
        config: &LuxrecConfig,
    ) -> Result<Self> {
        gst::init().map_err(|e| LuxrecError::Pipeline(format!("Failed to initialize GStreamer: {e}")))?;

        let enc_config = EncoderConfig {
            video_codec: config.recording.video_codec,
            quality: config.recording.quality,
            container: config.recording.container,
            framerate: config.recording.framerate,
            hardware_accel: config.recording.hardware_accel,
        };

        let (video_enc, muxer) = enc_config.build_encoder_and_muxer_elements();
        let audio_pipeline = AudioPipelineBuilder::build_audio_pipeline(&config.audio);

        let mut pipe_desc = format!(
            "pipewiresrc fd={pipewire_fd} path={node_id} keepalive-time=1000 ! \
             videoconvert ! videorate ! video/x-raw,framerate={fps}/1 ! \
             {video_enc} ! queue ! mux. ",
            pipewire_fd = pipewire_fd,
            node_id = node_id,
            fps = config.recording.framerate,
            video_enc = video_enc,
        );

        if let Some(audio_branch) = audio_pipeline {
            pipe_desc.push_str(&audio_branch);
        }

        pipe_desc.push_str(&format!(
            "{muxer} name=mux ! filesink location=\"{path}\"",
            muxer = muxer,
            path = output_path.to_string_lossy(),
        ));

        info!(pipeline = %pipe_desc, "Launching GStreamer pipeline");

        let element = gst::parse::launch(&pipe_desc)
            .map_err(|e| LuxrecError::Pipeline(format!("GStreamer parse error: {e}")))?;

        let pipeline = element
            .dynamic_cast::<gst::Pipeline>()
            .map_err(|_| LuxrecError::Pipeline("Element is not a GStreamer Pipeline".to_string()))?;

        Ok(Self {
            pipeline,
            output_path,
            is_paused: Arc::new(AtomicBool::new(false)),
        })
    }

    /// Builds a direct X11 GStreamer recording pipeline using ximagesrc
    pub fn new_x11(
        crop: Option<luxrec_core::geometry::Rect>,
        output_path: PathBuf,
        config: &LuxrecConfig,
    ) -> Result<Self> {
        gst::init().map_err(|e| LuxrecError::Pipeline(format!("Failed to initialize GStreamer: {e}")))?;

        let enc_config = EncoderConfig {
            video_codec: config.recording.video_codec,
            quality: config.recording.quality,
            container: config.recording.container,
            framerate: config.recording.framerate,
            hardware_accel: config.recording.hardware_accel,
        };

        let (video_enc, muxer) = enc_config.build_encoder_and_muxer_elements();
        let audio_pipeline = AudioPipelineBuilder::build_audio_pipeline(&config.audio);

        let video_src = match crop {
            Some(r) => {
                let x = r.x.max(0);
                let y = r.y.max(0);
                let w = (r.width.max(32) / 2) * 2;
                let h = (r.height.max(32) / 2) * 2;
                let endx = x + w as i32 - 1;
                let endy = y + h as i32 - 1;
                format!(
                    "ximagesrc startx={} starty={} endx={} endy={} use-damage=0 show-pointer={} ! \
                     videoconvert ! videorate ! video/x-raw,framerate={}/1 ! \
                     {} ! queue ! mux. ",
                    x, y, endx, endy, config.recording.show_cursor, config.recording.framerate, video_enc
                )
            }
            None => {
                format!(
                    "ximagesrc use-damage=0 show-pointer={} ! \
                     videoconvert ! videorate ! video/x-raw,framerate={}/1 ! \
                     {} ! queue ! mux. ",
                    config.recording.show_cursor, config.recording.framerate, video_enc
                )
            }
        };

        let mut pipe_desc = video_src;

        if let Some(audio_branch) = audio_pipeline {
            pipe_desc.push_str(&audio_branch);
        }

        pipe_desc.push_str(&format!(
            "{muxer} name=mux ! filesink location=\"{path}\"",
            muxer = muxer,
            path = output_path.to_string_lossy(),
        ));

        info!(pipeline = %pipe_desc, "Launching X11 GStreamer recording pipeline");

        let element = gst::parse::launch(&pipe_desc)
            .map_err(|e| LuxrecError::Pipeline(format!("GStreamer parse error: {e}")))?;

        let pipeline = element
            .dynamic_cast::<gst::Pipeline>()
            .map_err(|_| LuxrecError::Pipeline("Element is not a GStreamer Pipeline".to_string()))?;

        Ok(Self {
            pipeline,
            output_path,
            is_paused: Arc::new(AtomicBool::new(false)),
        })
    }

    pub fn output_path(&self) -> &PathBuf {
        &self.output_path
    }

    pub fn discard(&self) -> Result<()> {
        let _ = self.stop();
        if self.output_path.exists() {
            let _ = std::fs::remove_file(&self.output_path);
        }
        Ok(())
    }

    pub fn start(&self) -> Result<()> {
        info!("Starting recording pipeline");
        self.pipeline
            .set_state(gst::State::Playing)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to start pipeline: {e:?}")))?;
        Ok(())
    }

    pub fn pause(&self) -> Result<()> {
        info!("Pausing recording pipeline");
        self.pipeline
            .set_state(gst::State::Paused)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to pause pipeline: {e:?}")))?;
        self.is_paused.store(true, Ordering::SeqCst);
        Ok(())
    }

    pub fn resume(&self) -> Result<()> {
        info!("Resuming recording pipeline");
        self.pipeline
            .set_state(gst::State::Playing)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to resume pipeline: {e:?}")))?;
        self.is_paused.store(false, Ordering::SeqCst);
        Ok(())
    }

    pub fn stop(&self) -> Result<()> {
        info!("Stopping recording pipeline gracefully via EOS");
        self.pipeline.send_event(gst::event::Eos::new());

        let bus = self.pipeline.bus().ok_or_else(|| {
            LuxrecError::Pipeline("Pipeline does not have an attached bus".to_string())
        })?;

        let start_time = std::time::Instant::now();
        for msg in bus.iter_timed(gst::ClockTime::from_mseconds(250)) {
            if start_time.elapsed() >= std::time::Duration::from_secs(3) {
                tracing::warn!("Timed out waiting for EOS, proceeding with pipeline termination");
                break;
            }
            match msg.view() {
                gst::MessageView::Eos(..) => {
                    info!("Received EOS event from pipeline");
                    break;
                }
                gst::MessageView::Error(err) => {
                    error!(
                        "Error from {}: {} ({:?})",
                        msg.src()
                            .map(|s| s.path_string().to_string())
                            .unwrap_or_else(|| "unknown".into()),
                        err.error(),
                        err.debug()
                    );
                    break;
                }
                _ => (),
            }
        }

        self.pipeline
            .set_state(gst::State::Null)
            .map_err(|e| LuxrecError::Pipeline(format!("Failed to set pipeline to Null: {e:?}")))?;

        info!(path = %self.output_path.display(), "Recording successfully finished and saved");
        Ok(())
    }
}
