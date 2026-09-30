#!/usr/bin/env bash
set -euo pipefail

VERSION="0.1.0"
ARCH="amd64"
PKG_DIR="target/debian/luxrec_${VERSION}_${ARCH}"

echo "Building Debian/Ubuntu package for Luxrec v${VERSION}..."

rm -rf "${PKG_DIR}"
mkdir -p "${PKG_DIR}/DEBIAN"
mkdir -p "${PKG_DIR}/usr/bin"
mkdir -p "${PKG_DIR}/usr/share/applications"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/32x32/apps"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/128x128/apps"
mkdir -p "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps"
mkdir -p "${PKG_DIR}/usr/share/doc/luxrec"

cat <<EOF > "${PKG_DIR}/DEBIAN/control"
Package: luxrec
Version: ${VERSION}
Section: utils
Priority: optional
Architecture: ${ARCH}
Maintainer: Larvance <64753457+larvance@users.noreply.github.com>
Depends: libgstreamer1.0-0, libgstreamer-plugins-base1.0-0, gstreamer1.0-pipewire, gstreamer1.0-plugins-good, pipewire, xdg-desktop-portal
Homepage: https://github.com/larvance/luxrec
Description: Modern, minimalistic screenshot and screen recorder for Linux
 Luxrec is a lightweight, high-performance screen recording and screenshot application
 written in Rust with PipeWire audio, V4L2 camera overlay, and a modern, minimalistic
 floating GUI built with Tauri, React, and TypeScript.
EOF

# Copy binaries and assets
cp target/release/luxrec-cli "${PKG_DIR}/usr/bin/luxrec"
chmod 755 "${PKG_DIR}/usr/bin/luxrec"

cp data/luxrec.desktop "${PKG_DIR}/usr/share/applications/luxrec.desktop"
chmod 644 "${PKG_DIR}/usr/share/applications/luxrec.desktop"

cp crates/luxrec-ui/icons/32x32.png "${PKG_DIR}/usr/share/icons/hicolor/32x32/apps/luxrec.png"
cp crates/luxrec-ui/icons/128x128.png "${PKG_DIR}/usr/share/icons/hicolor/128x128/apps/luxrec.png"
cp crates/luxrec-ui/icons/128x128@2x.png "${PKG_DIR}/usr/share/icons/hicolor/256x256/apps/luxrec.png"

cp LICENSE "${PKG_DIR}/usr/share/doc/luxrec/copyright"
cp README.md "${PKG_DIR}/usr/share/doc/luxrec/README"

# Build debian package
dpkg-deb --build --root-owner-group "${PKG_DIR}" "target/luxrec_${VERSION}_${ARCH}.deb"

echo "Debian package successfully built: target/luxrec_${VERSION}_${ARCH}.deb"
