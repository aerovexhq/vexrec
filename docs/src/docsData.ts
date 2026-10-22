export interface DocSectionContent {
  title: string;
  badge: string;
  description: string;
  configJson?: string;
  rustCode?: string;
  tsCode?: string;
  callout?: {
    type: 'note' | 'tip' | 'warning' | 'spec';
    title: string;
    text: string;
  };
  specs?: { param: string; val: string; note: string }[];
  steps?: { title: string; desc: string; cmd?: string }[];
}

export interface DocSection {
  id: string;
  title: string;
  badge: string;
  content: DocSectionContent;
}

export interface DocCategory {
  id: string;
  title: string;
  badge: string;
  sections: DocSection[];
}

export const VEXREC_DOC_TREE: DocCategory[] = [
  {
    id: 'getting_started',
    title: '1. Getting Started',
    badge: 'CORE',
    sections: [
      {
        id: 'why_vexrec',
        title: 'Why Vexrec',
        badge: 'OVERVIEW',
        content: {
          title: 'Hardware-Accelerated Linux Screen Recorder & Audio Capture',
          badge: 'ARCHITECTURE',
          description: 'Vexrec is a high-performance Linux screen recording suite engineered for developers, robotics engineers, and content creators. It couples zero-copy VA-API/NVENC hardware video encoding with PipeWire desktop loopback audio capture, delivering crystal clear 4K 60FPS recordings with <4% CPU utilization.',
          callout: {
            type: 'spec',
            title: 'Zero CPU Bottlenecking',
            text: 'By mapping compositor surfaces directly to fixed-function GPU encoding silicon via DMA-BUF, Vexrec eliminates 80%+ CPU core saturation and prevents frame drops during resource-intensive robotics simulations.'
          },
          specs: [
            { param: 'Distributable AppImage Size', val: '<6.2 MB', note: 'Self-contained executable with embedded codecs' },
            { param: 'Encoding CPU Utilization', val: '<4%', note: 'Hardware VA-API / NVENC offload at 4K 60FPS' },
            { param: 'Audio Synchronization Offset', val: '0 ms', note: 'PipeWire sample clock phase lock' },
            { param: 'Startup Latency', val: '<15 ms', note: 'Instant CLI and hotkey recording initiation' }
          ],
          steps: [
            { title: 'Download Binary', desc: 'Download the universal AppImage or install via the single-line script', cmd: 'curl -sSL https://raw.githubusercontent.com/aerovexhq/vexrec/main/install.sh | bash' },
            { title: 'Full Screen Recording', desc: 'Record entire active desktop display with default desktop audio loopback', cmd: 'vexrec output.mp4' },
            { title: 'Region Selection', desc: 'Interactively select a rectangular screen region to record', cmd: 'vexrec --select output.mp4' }
          ]
        }
      },
      {
        id: 'installation',
        title: 'Installation & Packages',
        badge: 'SETUP',
        content: {
          title: 'Linux Distribution Packages & Binaries',
          badge: 'DEPLOYMENT',
          description: 'Vexrec is distributed in three official release formats: Universal Linux AppImage (runs across all modern Linux systems), Debian/Ubuntu package (.deb) with CLI path symlinks and shell autocompletions, and portable tarball (.tar.gz).',
          callout: {
            type: 'tip',
            title: 'Zero Dependencies on AppImage',
            text: 'The AppImage includes all necessary PipeWire, FFmpeg, and VA-API loader libraries. Simply chmod +x and run.'
          },
          steps: [
            { title: 'Ubuntu / Debian (.deb)', desc: 'Install via dpkg with automatic terminal symlink linking', cmd: 'sudo dpkg -i vexrec_0.1.0_amd64.deb' },
            { title: 'Universal AppImage', desc: 'Make executable and launch from anywhere', cmd: 'chmod +x vexrec_0.1.0_amd64.AppImage && ./vexrec_0.1.0_amd64.AppImage' },
            { title: 'Portable Tarball', desc: 'Extract anywhere and execute standalone', cmd: 'tar -xzf vexrec-0.1.0-linux-x86_64.tar.gz && ./vexrec/vexrec' }
          ]
        }
      }
    ]
  },
  {
    id: 'engines',
    title: '2. Core Subsystems',
    badge: 'SYSTEMS',
    sections: [
      {
        id: 'hardware_encoding',
        title: 'Hardware GPU Video Encoding',
        badge: 'GPU',
        content: {
          title: 'Direct VA-API & NVENC Fixed-Function Encoding',
          badge: 'SILICON',
          description: 'Vexrec communicates directly with graphics hardware via VA-API (Intel QuickSync, AMD AMF) and NVIDIA NVENC, encoding raw screen frames in hardware with configurable CBR and CQP rate control.',
          specs: [
            { param: 'Supported Codecs', val: 'H.264, HEVC / H.265, AV1', note: 'Hardware profile autodetection' },
            { param: 'Frame Presentation', val: 'DMA-BUF PipeWire Stream', note: 'Zero host memory readbacks' },
            { param: 'Bitrate Range', val: '2 Mbps - 120 Mbps', note: 'Configurable via --bitrate flag' }
          ]
        }
      },
      {
        id: 'audio_loopback',
        title: 'PipeWire Audio Loopback',
        badge: 'AUDIO',
        content: {
          title: 'Sample-Accurate Desktop Loopback & Mic Mixing',
          badge: 'PIPEWIRE',
          description: 'Connects natively to the PipeWire and PulseAudio sound graph, capturing application audio playback without physical patch cables and synchronizing microphone commentary with sub-millisecond precision.',
          callout: {
            type: 'spec',
            title: 'Clock Phase Lock',
            text: 'Audio frames are stamped against the compositor monotonic video frame clock, eliminating lip-sync drift even during multi-hour recording sessions.'
          }
        }
      },
      {
        id: 'region_capture',
        title: 'Wayland & X11 Ingestion',
        badge: 'COMPOSITOR',
        content: {
          title: 'XDG Desktop Portal & XComposite Capture',
          badge: 'WINDOWING',
          description: 'Universal capture support across GNOME, KDE Plasma, Sway, Hyprland, and X11 desktop environments with interactive rectangular boundary selection and multi-monitor scaling.'
        }
      },
      {
        id: 'cli_daemon',
        title: 'CLI Options & Shortcuts',
        badge: 'CONTROL',
        content: {
          title: 'Command Line Interface & Keyboard Hotkeys',
          badge: 'CLI',
          description: 'Vexrec provides full command-line control: --fps 60, --bitrate 20M, --audio-source, --webcam, and global hotkeys for starting, pausing, and finalizing recordings cleanly.'
        }
      }
    ]
  }
];
