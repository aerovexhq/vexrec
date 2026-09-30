# luxrec

Modern, minimalistic screenshot and screen recorder app with full desktop audio, microphone, and camera support for Linux written in Rust.

## Features

- **Wayland & X11 Native**: Zero-copy screen and window capture via XDG Desktop Portal (`org.freedesktop.portal.ScreenCast`) and PipeWire, with transparent X11 fallback.
- **Audio Capture**: Simultaneous desktop loopback audio (`@DEFAULT_SINK@.monitor`) and microphone recording with automatic drift compensation and live VU metering.
- **Camera Picture-in-Picture (PiP)**: Draggable, customizable webcam overlay (circular mask, rounded rectangle, aspect ratio lock) powered by V4L2.
- **Hardware-Accelerated Encoding**: Zero-copy encoding via VA-API (Intel/AMD) and NVENC (NVIDIA), with software fallback (`x264`, `openh264`, `vpx`).
- **Flexible Formats**: Export to MP4, MKV (crash-safe), WebM, and high-quality animated GIFs.
- **Minimalist Floating HUD**: macOS CleanShot-inspired floating controls, magnifier loupe, window boundary snapping, and instant annotation tools.

## Architecture

Luxrec is organized as a modular Rust workspace:

- `luxrec-core`: Shared types, session management, configuration, audio/video synchronization clocks.
- `luxrec-portal`: XDG Desktop Portal integration (ScreenCast, Screenshot, GlobalShortcuts).
- `luxrec-pipeline`: PipeWire audio/video capture, V4L2 camera overlay, GStreamer hardware encoding.
- `luxrec-ui`: Native GTK4/Libadwaita user interface with Wayland layer-shell floating HUD.
- `luxrec-cli`: Headless CLI for scripting and global keyboard shortcuts.

## License

MIT License. See [LICENSE](LICENSE) for details.
