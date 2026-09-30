use std::os::fd::AsRawFd;
use std::path::PathBuf;
use clap::{Parser, Subcommand};
use luxrec_core::config::LuxrecConfig;
use luxrec_core::formats::ContainerFormat;
use luxrec_pipeline::encoders::EncoderConfig;
use luxrec_pipeline::recorder::RecordingPipeline;
use luxrec_portal::PortalClient;
use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[derive(Parser)]
#[command(name = "luxrec")]
#[command(about = "Modern, minimalistic screenshot and screen recorder for Linux written in Rust", long_about = None)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Capture a still screenshot
    Screenshot {
        /// Interactive region selection
        #[arg(short, long)]
        interactive: bool,

        /// Output file path (defaults to ~/Pictures/Luxrec/...)
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Record screen with audio and optional camera overlay
    Record {
        /// Target framerate (default: 60)
        #[arg(short, long, default_value_t = 60)]
        fps: u32,

        /// Video container format (mp4, mkv, webm)
        #[arg(short, long, default_value = "mp4")]
        format: String,

        /// Enable microphone recording
        #[arg(long, default_value_t = true)]
        mic: bool,

        /// Enable desktop audio recording
        #[arg(long, default_value_t = true)]
        desktop_audio: bool,

        /// Output video file path
        #[arg(short, long)]
        output: Option<PathBuf>,
    },
    /// Print system and multimedia capabilities diagnostics
    Doctor,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber).ok();

    let cli = Cli::parse();
    let config = LuxrecConfig::load().unwrap_or_default();

    match cli.command {
        Commands::Doctor => {
            println!("=== Luxrec Diagnostic Report ===");
            println!("Session type: {:?}", std::env::var("XDG_SESSION_TYPE").unwrap_or_else(|_| "unknown".into()));
            println!("Wayland display: {:?}", std::env::var("WAYLAND_DISPLAY").ok());
            println!("X11 display: {:?}", std::env::var("DISPLAY").ok());
            println!("VA-API Available: {}", EncoderConfig::has_vaapi());
            println!("NVENC Available: {}", EncoderConfig::has_nvenc());
            println!("Config Path: {}", LuxrecConfig::config_path().display());
        }
        Commands::Screenshot { interactive, output } => {
            info!("Initiating screenshot workflow");
            let portal = PortalClient::new();
            let uri = portal.request_screenshot(interactive).await?;
            println!("Screenshot successfully captured: {}", uri);

            if let Some(dest) = output {
                if let Ok(file_path) = uri.to_file_path() {
                    if let Some(parent) = dest.parent() {
                        std::fs::create_dir_all(parent).ok();
                    }
                    std::fs::copy(&file_path, &dest)?;
                    println!("Saved to requested location: {}", dest.display());
                }
            }
        }
        Commands::Record {
            fps,
            format,
            mic,
            desktop_audio,
            output,
        } => {
            let portal = PortalClient::new();
            println!("Please select the screen or window to record in the system portal dialog...");
            let streams = portal.request_screencast(config.recording.show_cursor).await?;
            let primary_stream = streams
                .into_iter()
                .next()
                .ok_or_else(|| anyhow::anyhow!("No active streams received from portal"))?;

            let mut run_config = config.clone();
            run_config.recording.framerate = fps;
            run_config.audio.capture_microphone = mic;
            run_config.audio.capture_desktop = desktop_audio;
            run_config.recording.container = match format.to_lowercase().as_str() {
                "mkv" => ContainerFormat::Mkv,
                "webm" => ContainerFormat::Webm,
                _ => ContainerFormat::Mp4,
            };

            let out_path = output.unwrap_or_else(|| {
                let dir = &run_config.storage.recording_dir;
                std::fs::create_dir_all(dir).ok();
                let now = chrono::Local::now().format("%Y-%m-%d_%H-%M-%S");
                dir.join(format!("Luxrec_{}.{}", now, run_config.recording.container.extension()))
            });

            if let Some(parent) = out_path.parent() {
                std::fs::create_dir_all(parent)?;
            }

            println!("Recording will be saved to: {}", out_path.display());
            let pipeline = RecordingPipeline::new(
                primary_stream.pipewire_fd.as_raw_fd(),
                primary_stream.node_id,
                out_path.clone(),
                &run_config,
            )?;

            pipeline.start()?;
            println!("Recording started! Press Ctrl+C to stop recording...");

            tokio::signal::ctrl_c().await?;

            println!("Stopping recording and finalizing video container...");
            pipeline.stop()?;
            println!("Recording successfully finalized: {}", out_path.display());
        }
    }

    Ok(())
}
