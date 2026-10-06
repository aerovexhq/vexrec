# Vexrec

Modern, minimalistic screenshot and screen recorder app with full desktop audio, microphone, and camera support for Linux written in Rust.

---

## Features

- **Wayland & X11 Native**: Zero-copy screen and window capture via XDG Desktop Portal (`org.freedesktop.portal.ScreenCast`) and PipeWire, with transparent direct X11 fallback.
- **Audio Capture**: Simultaneous desktop loopback audio (`@DEFAULT_SINK@.monitor`) and microphone recording with automatic drift compensation and live VU metering.
- **Camera Picture-in-Picture (PiP)**: Draggable, customizable webcam overlay (circular mask, rounded rectangle, aspect ratio lock) powered by V4L2.
- **Hardware-Accelerated Encoding**: Zero-copy encoding via VA-API (Intel/AMD) and NVENC (NVIDIA), with low-latency software fallback (`x264`, `openh264`, `vpx`).
- **Flexible Formats**: Export to MP4, MKV (crash-safe), WebM, and high-quality animated GIFs.
- **Minimalist Floating HUD**: Modern interface built with Tauri v2, React, TypeScript, and PostCSS. Monochromatic slate aesthetic, micro-LED toggles, in-flight recording bar, and vector annotation studio.
- **Shell Autocompletion**: Built-in autocompletion support for Bash, Zsh, and Fish shells (`vexrec completions --install`).

---

## Installation

### 1. One-Line Universal Quick Install (All Distros)

Installs the latest release binary, `.desktop` application launcher, and icons into your user environment (`~/.local/bin` — no root required):

```bash
curl -fsSL https://raw.githubusercontent.com/aerovexhq/vexrec/main/install.sh | bash
```

To install system-wide into `/usr/local/bin`:
```bash
curl -fsSL https://raw.githubusercontent.com/aerovexhq/vexrec/main/install.sh | sudo bash -s -- --system
```

---

### 2. Ubuntu / Debian (`.deb`)

Download the latest `.deb` package from the [GitHub Releases](https://github.com/aerovexhq/vexrec/releases):

```bash
# Install via apt (automatically resolves PipeWire and GStreamer dependencies)
sudo apt install ./vexrec_0.1.0_amd64.deb
```

Or using `dpkg`:
```bash
sudo dpkg -i vexrec_0.1.0_amd64.deb
sudo apt install -f
```

---

### 3. Arch Linux (`PKGBUILD` / AUR)

```bash
git clone https://github.com/aerovexhq/vexrec.git
cd vexrec/packaging/arch
makepkg -si
```

---

### 4. Fedora / RHEL

Ensure runtime multimedia dependencies are present, then use the universal installer:

```bash
sudo dnf install gstreamer1-pipewire gstreamer1-plugins-good pipewire xdg-desktop-portal
curl -fsSL https://raw.githubusercontent.com/aerovexhq/vexrec/main/install.sh | bash
```

---

### 5. Building from Source

```bash
# Clone the repository
git clone https://github.com/aerovexhq/vexrec.git
cd vexrec

# Build release binaries
cargo build --release -p vexrec-cli

# Run installer
./install.sh
```

---

## Usage

### Desktop Floating GUI
Launch the floating interface from your application menu or via terminal:
```bash
vexrec gui
```

### Background Daemon
Start background daemon mode with system tray and global hotkeys:
```bash
vexrec daemon
```

### CLI Quick Actions & Shortcuts

```bash
# Capture still screenshot (copies directly to clipboard)
vexrec screenshot --clipboard

# Direct X11 fast capture with custom rectangular crop
vexrec screenshot --x11 --crop 100,100,800,600 --output screenshot.png

# Record screen at 60 FPS with desktop audio and microphone
vexrec record --fps 60 --format mp4 --output recording.mp4

# Trigger freeze-screen interactive capture overlay
vexrec freeze

# Stop active recording immediately
vexrec stop-recording

# Run system capability diagnostics (probes VA-API, NVENC, Wayland/X11)
vexrec doctor

# Install shell completions for bash, zsh, fish
vexrec completions --install
```

---

## Architecture

Vexrec is organized as a modular Rust workspace:

- `vexrec-core`: Shared types, session management, configuration, audio/video synchronization clocks.
- `vexrec-portal`: XDG Desktop Portal integration (ScreenCast, Screenshot, GlobalShortcuts).
- `vexrec-pipeline`: PipeWire audio/video capture, V4L2 camera overlay, GStreamer hardware encoding.
- `vexrec-ui`: Minimalist Tauri v2 + React 18 + TSX + PostCSS desktop interface.
- `vexrec-cli`: CLI utility, shell completion generator, and daemon IPC client.

---

## License

MIT License. See [LICENSE](LICENSE) for details.
