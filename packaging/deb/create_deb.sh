#!/usr/bin/env bash
set -euo pipefail

VERSION="${1:-0.1.0}"
ARCH="amd64"
PKG_DIR="target/debian/vexrec_${VERSION}_${ARCH}"

echo "Building Debian/Ubuntu package for Vexrec v${VERSION}..."

rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/bin"
mkdir -p "${PKG_DIR}/usr/share/applications"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/32x32/apps"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/128x128/apps"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps"
mkdir -p "${PKG_DIR}/usr/share/doc/vexrec"
mkdir -p "${PKG_DIR}/usr/share/bash-completion/completions"

cat <<EOF > "${PKG_DIR}/DEBIAN/control"
Package: vexrec
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Maintainer: Aerovex HQ <dev@aerovex.net>
Depends: libgstreamer1.0-0, libgstreamer-plugins-base1.0-0, gstreamer1.0-pipewire, gstreamer1.0-plugins-good, pipewire, xdg-desktop-portal
Homepage: https://github.com/aerovexhq/vexrec
Description: Modern, minimalistic screenshot and screen recorder for Linux
 Vexrec is a lightweight, high-performance screen recording and screenshot application
 written in Rust with PipeWire audio, V4L2 camera overlay, and a modern, minimalistic
 floating GUI built with Tauri, React, and TypeScript.
EOF

# Copy binaries and assets
cp target/release/vexrec "${PKG_DIR}/usr/bin/vexrec"
chmod 755 "${PKG_DIR}/usr/bin/vexrec"
ln -sf vexrec "${PKG_DIR}/usr/bin/luxrec"

cp data/vexrec.desktop "${PKG_DIR}/usr/share/applications/vexrec.desktop"
chmod 644 "${PKG_DIR}/usr/share/applications/vexrec.desktop"

cp crates/vexrec-ui/icons/32x32.png "${PKG_DIR}/usr/share/icons/hicolor/32x32/apps/vexrec.png"
cp crates/vexrec-ui/icons/128x128.png "${PKG_DIR}/usr/share/icons/hicolor/128x128/apps/vexrec.png"
cp crates/vexrec-ui/icons/128x128@2x.png "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps/vexrec.png"

# Generate bash completion
if [ -x target/release/vexrec ]; then
    target/release/vexrec completions bash > "${PKG_DIR}/usr/share/bash-completion/completions/vexrec" || true
fi

cp LICENSE "${PKG_DIR}/usr/share/doc/vexrec/copyright"
cp README.md "${PKG_DIR}/usr/share/doc/vexrec/README"

# Build debian package
dpkg-deb --build --root-owner-group "${PKG_DIR}" "target/vexrec_${VERSION}_${ARCH}.deb"

echo "Debian package successfully built: target/vexrec_${VERSION}_${ARCH}.deb"
