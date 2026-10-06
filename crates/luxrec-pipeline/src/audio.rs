use luxrec_core::config::AudioConfig;
use luxrec_core::formats::AudioCodec;

pub struct AudioPipelineBuilder;

impl AudioPipelineBuilder {
    /// Builds GStreamer audio pipeline string for mixing desktop loopback and microphone
    pub fn build_audio_pipeline(config: &AudioConfig) -> Option<String> {
        if !config.capture_desktop && !config.capture_microphone {
            return None;
        }

        let audio_enc = match config.codec {
            AudioCodec::Opus => "opusenc bitrate=128000 ! opusparse",
            _ => "avenc_aac bitrate=192000 ! aacparse",
        };

        let mut pipeline = String::new();

        if config.capture_desktop && config.capture_microphone {
            pipeline.push_str(
                "audiomixer name=amix ! audioconvert ! audioresample ! "
            );
            pipeline.push_str(audio_enc);
            pipeline.push_str(" ! queue ! mux. ");

            // Desktop audio loopback branch
            let desktop_device = config.desktop_device.as_deref().unwrap_or("@DEFAULT_SINK@.monitor");
            pipeline.push_str(&format!(
                "pulsesrc device=\"{}\" ! audio/x-raw,channels=2,rate=48000 ! volume volume={} ! audioconvert ! audioresample ! queue ! amix. ",
                desktop_device, config.desktop_volume
            ));

            // Microphone branch
            let mic_device = config.microphone_device.as_deref().unwrap_or("@DEFAULT_SOURCE@");
            pipeline.push_str(&format!(
                "pulsesrc device=\"{}\" ! audio/x-raw,channels=1,rate=48000 ! volume volume={} ! audioconvert ! audioresample ! queue ! amix. ",
                mic_device, config.microphone_volume
            ));
        } else if config.capture_desktop {
            let desktop_device = config.desktop_device.as_deref().unwrap_or("@DEFAULT_SINK@.monitor");
            pipeline.push_str(&format!(
                "pulsesrc device=\"{}\" ! audio/x-raw,channels=2,rate=48000 ! volume volume={} ! audioconvert ! audioresample ! {} ! queue ! mux. ",
                desktop_device, config.desktop_volume, audio_enc
            ));
        } else {
            let mic_device = config.microphone_device.as_deref().unwrap_or("@DEFAULT_SOURCE@");
            pipeline.push_str(&format!(
                "pulsesrc device=\"{}\" ! audio/x-raw,channels=1,rate=48000 ! volume volume={} ! audioconvert ! audioresample ! {} ! queue ! mux. ",
                mic_device, config.microphone_volume, audio_enc
            ));
        }

        Some(pipeline)
    }
}
