use gstreamer as gst;
use vexrec_core::formats::{ContainerFormat, VideoCodec, VideoQuality};
use tracing::info;

pub struct EncoderConfig {
    pub video_codec: VideoCodec,
    pub quality: VideoQuality,
    pub container: ContainerFormat,
    pub framerate: u32,
    pub hardware_accel: bool,
}

impl EncoderConfig {
    /// Constructs a GStreamer pipeline string chunk for video encoding and muxing
    pub fn build_encoder_and_muxer_elements(&self) -> (String, String) {
        let video_enc = if self.hardware_accel && Self::has_vaapi() {
            info!("Using VA-API hardware video acceleration");
            match self.video_codec {
                VideoCodec::H265 => "vaapih265enc rate-control=cbr ! h265parse",
                _ => "vaapih264enc rate-control=cbr ! h264parse",
            }
        } else if self.hardware_accel && Self::has_nvenc() {
            info!("Using NVENC hardware video acceleration");
            match self.video_codec {
                VideoCodec::H265 => "nvh265enc ! h265parse",
                _ => "nvh264enc ! h264parse",
            }
        } else {
            info!("Using software CPU video encoding");
            match self.video_codec {
                VideoCodec::H265 => "x265enc speed-preset=ultrafast tune=zerolatency ! h265parse",
                VideoCodec::Vp9 => "vp9enc deadline=1 cpu-used=4",
                VideoCodec::Av1 => "rav1e speed=10",
                _ => "x264enc speed-preset=ultrafast tune=zerolatency bitrate=4000 ! h264parse",
            }
        };

        let muxer = match self.container {
            ContainerFormat::Mp4 => "mp4mux faststart=true",
            ContainerFormat::Mkv => "matroskamux",
            ContainerFormat::Webm => "webmmux",
            ContainerFormat::Gif => "gifenc",
        };

        (video_enc.to_string(), muxer.to_string())
    }

    pub fn has_vaapi() -> bool {
        gst::init().ok();
        gst::ElementFactory::find("vaapih264enc").is_some()
    }

    pub fn has_nvenc() -> bool {
        gst::init().ok();
        gst::ElementFactory::find("nvh264enc").is_some()
    }
}
