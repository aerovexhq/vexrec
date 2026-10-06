#!/usr/bin/env bash
set -euo pipefail

# Vexrec Universal Linux Installer
# Installs binary, desktop launcher, application icons, and shell autocompletions.

REPO="aerovexhq/vexrec"
VERSION="0.1.0"

# Parse arguments
PREFIX="${HOME}/.local"
if [ "${1:-}" = "--system" ] || [ "${EUID}" -eq 0 ]; then
    PREFIX="/usr/local"
    SHARE_PREFIX="/usr/share"
else
    SHARE_PREFIX="${HOME}/.local/share"
fi

BIN_DIR="${PREFIX}/bin"
APP_DIR="${SHARE_PREFIX}/applications"
ICON_BASE="${SHARE_PREFIX}/icons/hicolor"

echo "=========================================="
echo "          Installing Vexrec v${VERSION}    "
echo "=========================================="
echo "Target binary directory: ${BIN_DIR}"
echo "Target desktop entry:    ${APP_DIR}"
echo "Target icons directory:  ${ICON_BASE}"
echo ""

# Check if running from release directory or if we need to fetch binary
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" 2>/dev/null && pwd || true)"

if [ -f "${SCRIPT_DIR}/target/release/vexrec" ]; then
    SRC_BIN="${SCRIPT_DIR}/target/release/vexrec"
    SRC_DIR="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/target/release/vexrec-cli" ]; then
    SRC_BIN="${SCRIPT_DIR}/target/release/vexrec-cli"
    SRC_DIR="${SCRIPT_DIR}"
elif [ -f "${SCRIPT_DIR}/vexrec" ]; then
    SRC_BIN="${SCRIPT_DIR}/vexrec"
    SRC_DIR="${SCRIPT_DIR}"
else
    echo "Fetching latest release from GitHub (${REPO})..."
    TMP_DIR="$(mktemp -d)"
    trap 'rm -rf "${TMP_DIR}"' EXIT

    ARCH="$(uname -m)"
    if [ "${ARCH}" != "x86_64" ]; then
        echo "Error: Only x86_64 architecture is supported at this time." >&2
        exit 1
    fi

    TAR_NAME="vexrec-v${VERSION}-linux-x86_64.tar.gz"
    URL="https://github.com/${REPO}/releases/download/v${VERSION}/${TAR_NAME}"

    echo "Downloading ${URL}..."
    curl -fsSL "${URL}" -o "${TMP_DIR}/${TAR_NAME}"
    tar -xzf "${TMP_DIR}/${TAR_NAME}" -C "${TMP_DIR}"
    SRC_DIR="${TMP_DIR}"
    SRC_BIN="${TMP_DIR}/vexrec"
fi

# Create directories
mkdir -p "${BIN_DIR}"
mkdir -p "${APP_DIR}"
mkdir -p "${ICON_BASE}/32x32/apps"
mkdir -p "${ICON_BASE}/128x128/apps"
mkdir -p "${ICON_BASE}/256x256/apps"

# Install binary
echo "Installing binary to ${BIN_DIR}/vexrec..."
install -m 755 "${SRC_BIN}" "${BIN_DIR}/vexrec"
ln -sf "${BIN_DIR}/vexrec" "${BIN_DIR}/luxrec"

# Install desktop entry
if [ -f "${SRC_DIR}/data/vexrec.desktop" ]; then
    echo "Installing desktop entry to ${APP_DIR}/vexrec.desktop..."
    install -m 644 "${SRC_DIR}/data/vexrec.desktop" "${APP_DIR}/vexrec.desktop"
elif [ -f "${SRC_DIR}/vexrec.desktop" ]; then
    echo "Installing desktop entry to ${APP_DIR}/vexrec.desktop..."
    install -m 644 "${SRC_DIR}/vexrec.desktop" "${APP_DIR}/vexrec.desktop"
fi

# Clean up legacy desktop entry if present
rm -f "${APP_DIR}/luxrec.desktop"

# Install icons
if [ -d "${SRC_DIR}/crates/vexrec-ui/icons" ]; then
    ICON_SRC="${SRC_DIR}/crates/vexrec-ui/icons"
elif [ -d "${SRC_DIR}/icons" ]; then
    ICON_SRC="${SRC_DIR}/icons"
else
    ICON_SRC=""
fi

if [ -n "${ICON_SRC}" ]; then
    echo "Installing application icons..."
    [ -f "${ICON_SRC}/32x32.png" ] && install -m 644 "${ICON_SRC}/32x32.png" "${ICON_BASE}/32x32/apps/vexrec.png"
    [ -f "${ICON_SRC}/128x128.png" ] && install -m 644 "${ICON_SRC}/128x128.png" "${ICON_BASE}/128x128/apps/vexrec.png"
    [ -f "${ICON_SRC}/128x128@2x.png" ] && install -m 644 "${ICON_SRC}/128x128@2x.png" "${ICON_BASE}/256x256/apps/vexrec.png"
fi

# Install shell completions
if command -v "${BIN_DIR}/vexrec" >/dev/null 2>&1; then
    "${BIN_DIR}/vexrec" completions --install || true
fi

# Update desktop and icon caches if available
command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "${APP_DIR}" 2>/dev/null || true
command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -q "${SHARE_PREFIX}/icons/hicolor" 2>/dev/null || true

echo ""
echo "Installation completed successfully!"
echo ""
echo "Run 'vexrec gui' or find Vexrec in your application launcher."
if [[ ":$PATH:" != *":${BIN_DIR}:"* ]]; then
    echo "Note: Make sure ${BIN_DIR} is in your PATH. Add this to your ~/.bashrc:"
    echo "  export PATH=\"${BIN_DIR}:\$PATH\""
fi
