export interface Subsystem {
  id: string;
  name: string;
  domain: 'encoding' | 'audio' | 'capture' | 'cli';
  tierLabel: string;
  category: string;
  status: string;
  statusTone: 'emerald' | 'cyan' | 'amber' | 'indigo' | 'purple';
  tagline: string;
  metric: string;
  metricDetail: string;
  description: string;
  highlights: string[];
  tags: string[];
  docSectionId: string;
  architectureDetails: {
    pipelineDiagram: string;
    tradeoffs: { choice: string; why: string }[];
    codeSnippet: {
      language: string;
      title: string;
      code: string;
    };
  };
}

export const VEXREC_SUBSYSTEMS: Subsystem[] = [
  {
    id: 'hardware_video_encoder',
    name: 'Hardware GPU Video Encoder',
    domain: 'encoding',
    tierLabel: 'TIER 1 // VA-API / NVENC',
    category: 'Hardware Acceleration',
    status: 'ACTIVE',
    statusTone: 'cyan',
    tagline: 'Zero-copy GPU hardware encoding for H.264, HEVC, and AV1 with <4% CPU load.',
    metric: '60 FPS',
    metricDetail: 'Sustained 4K Resolution Hardware Encoding Throughput at <4% CPU Core Utilization',
    description: 'Hardware-accelerated video encoding engine that offloads raw screen frames directly to GPU encode blocks (Intel QuickSync, AMD AMF/VA-API, NVIDIA NVENC), bypassing CPU bottlenecking and thermal throttling.',
    highlights: [
      'Direct DMA-BUF to hardware encoder pipe with zero host RAM copies',
      'Configurable rate control algorithms (CBR, VBR, CQP) for lossless or streaming output',
      'Hardware AV1 and HEVC 10-bit color profile support'
    ],
    tags: ['VA-API', 'NVENC', '4K 60FPS', 'H.264 / HEVC / AV1', 'Low CPU'],
    docSectionId: 'hardware_encoding',
    architectureDetails: {
      pipelineDiagram: `Raw Compositor Surface (DMA-BUF)
           │
           ▼
[Hardware GPU Memory Map] ── Zero-Copy Surface Ingestion
           │
           ▼
[Hardware Silicon Encoder] ── VA-API / NVENC Fixed-Function Pipeline
           │
           ▼
[Muxer Output Stream] ── Instant MP4 / MKV Container Output`,
      tradeoffs: [
        { choice: 'Fixed-Function Silicon Encoder vs x264 CPU Encoding', why: 'Eliminates 80%+ CPU core saturation, keeping game and simulator FPS rock-solid during capture.' },
        { choice: 'Direct DMA-BUF Import vs Host Memory Readback', why: 'Avoids multi-gigabyte/sec PCIe bandwidth choking by never reading frame pixels back to RAM.' }
      ],
      codeSnippet: {
        language: 'rust',
        title: 'Hardware VA-API Encoder Initialization',
        code: `pub fn init_hardware_encoder(config: &EncoderConfig) -> Result<HardwareEncoder, VexError> {
    let va_context = VaContext::create_va_api(config.device_path)?;
    va_context.configure_rate_control(config.bitrate, RateControl::CBR)?;
    Ok(HardwareEncoder::new(va_context))
}`
      }
    }
  },
  {
    id: 'pipewire_audio_loopback',
    name: 'PipeWire Audio Loopback & Sync',
    domain: 'audio',
    tierLabel: 'TIER 1 // PIPEWIRE / PULSEAUDIO',
    category: 'Audio Architecture',
    status: 'ACTIVE',
    statusTone: 'cyan',
    tagline: 'Zero-latency desktop loopback audio capture with hardware microphone mixing.',
    metric: '0 ms',
    metricDetail: 'Sub-Millisecond Inter-Channel Audio/Video Synchronization Offset',
    description: 'Low-latency PipeWire audio graph client capturing monitor streams (desktop game/app audio) and microphone input simultaneously, interleaving PCM audio packets with accurate PTS timestamps.',
    highlights: [
      'Native PipeWire and PulseAudio monitor source auto-discovery',
      'Dual-stream mixing: Desktop Audio + Microphone with independent volume curves',
      'Sample-accurate timestamp synchronization with hardware video frames'
    ],
    tags: ['PipeWire', 'Audio Loopback', 'Microphone Mix', 'Sample-Accurate Sync'],
    docSectionId: 'audio_loopback',
    architectureDetails: {
      pipelineDiagram: `Desktop Audio Graph (PipeWire / ALSA)
           │
           ▼
[PipeWire Monitor Stream] ── 48kHz Stereo PCM Capture
           │
           ▼
[Audio Resampler & PTS Interleaver] ── Align with Video Clock
           │
           ▼
[Container AAC / Opus Muxer] ── Unified Lossless Audio Track`,
      tradeoffs: [
        { choice: 'Native PipeWire Graph vs ALSA Direct Capture', why: 'Permits non-exclusive access so multiple applications can play and record audio concurrently.' },
        { choice: 'Floating-Point Mixer vs Fixed-Point Integer', why: 'Prevents clipping distortion when desktop and microphone signals combine at peak volume.' }
      ],
      codeSnippet: {
        language: 'rust',
        title: 'PipeWire Monitor Stream Listener',
        code: `pub fn start_pipewire_monitor(sender: Sender<AudioFrame>) -> Result<(), VexError> {
    let pw_stream = PipeWireStream::connect_loopback(48000, 2)?;
    pw_stream.on_buffer(move |buf| {
        sender.send(AudioFrame::from_pcm(buf))?;
        Ok(())
    })?;
    Ok(())
}`
      }
    }
  },
  {
    id: 'region_window_capture',
    name: 'Wayland & X11 Region Grabber',
    domain: 'capture',
    tierLabel: 'TIER 2 // COMPOSITOR PORTAL',
    category: 'Screen Ingestion',
    status: 'ACTIVE',
    statusTone: 'cyan',
    tagline: 'XDG Desktop Portal ScreenCast and X11 XComposite area selection.',
    metric: '<120 μs',
    metricDetail: 'Mean Frame Acquisition Latency Across Wayland & X11 Surfaces',
    description: 'Universal screen capture engine supporting full desktop displays, specific application windows, and custom draggable rectangular bounding boxes across Wayland and X11.',
    highlights: [
      'Standardized org.freedesktop.portal.ScreenCast DBus portal integration',
      'X11 XComposite and MIT-SHM shared memory acceleration',
      'Dynamic multi-monitor DPI scaling and fractional display handling'
    ],
    tags: ['Wayland Portal', 'X11 XComposite', 'Window Grab', 'Region Select'],
    docSectionId: 'region_capture',
    architectureDetails: {
      pipelineDiagram: `Compositor Framebuffer (Wayland / X11)
           │
           ▼
[Portal ScreenCast Session] ── DMA-BUF PipeWire Stream Buffer
           │
           ▼
[Bounding Box Crop Kernel] ── Pixel Coordinate Offset Clamping
           │
           ▼
[Ingestion Ring Buffer] ── Lock-Free Frame Queue`,
      tradeoffs: [
        { choice: 'XDG Portal ScreenCast vs Direct KMS /dev/dri Grab', why: 'Guarantees security compliance across GNOME, KDE, and Sway without root permissions.' },
        { choice: 'Lock-Free Ring Buffer vs Mutex Queue', why: 'Ensures zero frame drops even during intense GPU frame spikes.' }
      ],
      codeSnippet: {
        language: 'rust',
        title: 'ScreenCast Frame Ingestion',
        code: `pub fn on_portal_frame(dma_buf: DmaBufHandle, crop: Rect) -> Result<RawFrame, VexError> {
    let cropped = dma_buf.crop_subregion(crop)?;
    Ok(cropped)
}`
      }
    }
  },
  {
    id: 'linux_cli_daemon',
    name: 'Minimalist CLI & Hotkey Engine',
    domain: 'cli',
    tierLabel: 'TIER 2 // LINUX SYSTEMS',
    category: 'System Integration',
    status: 'ACTIVE',
    statusTone: 'cyan',
    tagline: 'High-speed Unix daemon with global hotkeys and zero background overhead.',
    metric: '<6.2 MB',
    metricDetail: 'Self-Contained Standalone AppImage with Sub-15MB Resident Set Size',
    description: 'Clean command-line tool with POSIX signal handling (graceful finalization on SIGINT/Ctrl+C), background headless daemon mode, and global keyboard hotkey hooks.',
    highlights: [
      'Instant start/stop recording via configurable global hotkey',
      'Clean graceful container finalization on SIGINT without file corruption',
      'Draggable webcam Picture-in-Picture (PiP) hardware overlay'
    ],
    tags: ['CLI Engine', 'Global Hotkeys', 'Webcam PiP', '<6.2MB Binary'],
    docSectionId: 'cli_daemon',
    architectureDetails: {
      pipelineDiagram: `User Hotkey / Terminal Command
           │
           ▼
[POSIX Signal / Input Listener] ── Trigger Capture Lifecycle
           │
           ▼
[Vexrec Background Worker] ── Concurrent Audio/Video Ring Queues
           │
           ▼
[Clean Container Finalization] ── Moov Atom Placement & Flush`,
      tradeoffs: [
        { choice: 'Fast Moov Atom Placement vs Fragmented MP4', why: 'Ensures the recorded MP4 plays instantly in all editors and media players without indexing.' },
        { choice: 'Dedicated In-RAM Ring Queue vs Direct Disk Write', why: 'Absorbs disk I/O latency spikes so dropped frames remain strictly 0.' }
      ],
      codeSnippet: {
        language: 'rust',
        title: 'Graceful POSIX Signal Handler',
        code: `pub fn await_termination(muxer: Arc<Mutex<Muxer>>) {
    let mut sigs = Signals::new(&[SIGINT, SIGTERM]).unwrap();
    for _ in sigs.forever() {
        muxer.lock().unwrap().flush_and_close().unwrap();
        break;
    }
}`
      }
    }
  }
];
