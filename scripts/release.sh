#!/usr/bin/env bash
set -euo pipefail

# vexrec unified release script
# Builds and uploads strictly:
# 1. vexrec_<version>_amd64.AppImage
# 2. vexrec-<version>-linux-x86_64.tar.gz
# 3. vexrec_<version>_amd64.deb

REPO="aerovexhq/vexrec"
SOURCE="${BASH_SOURCE[0]}"
while [ -h "$SOURCE" ]; do
  DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
  SOURCE="$(readlink "$SOURCE")"
  [[ $SOURCE != /* ]] && SOURCE="$DIR/$SOURCE"
done
SCRIPT_DIR="$(cd -P "$(dirname "$SOURCE")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${ROOT_DIR}"

# Determine target release tag / version
TAG="${1:-}"
if [ -z "${TAG}" ]; then
  # Try to get latest release tag from GitHub
  TAG=$(gh release view -R "${REPO}" --json tagName -q .tagName 2>/dev/null || true)
  if [ -z "${TAG}" ]; then
    # Fallback to Cargo.toml
    TAG=$(grep -m1 '^version' Cargo.toml | awk -F '"' '{print $2}')
  fi
fi

VERSION="${TAG#v}"
echo "==> Preparing release for vexrec version ${VERSION} (tag: ${TAG})..."

# Ensure tools are present
command -v appimagetool >/dev/null 2>&1 || {
  echo "Error: appimagetool not found in PATH. Ensure ~/.local/bin is in PATH." >&2
  exit 1
}
command -v dpkg-deb >/dev/null 2>&1 || {
  echo "Error: dpkg-deb not found in PATH." >&2
  exit 1
}
command -v gh >/dev/null 2>&1 || {
  echo "Error: gh CLI not found in PATH." >&2
  exit 1
}

DIST_DIR="${ROOT_DIR}/dist-release"
rm -rf "${DIST_DIR}"
mkdir -p "${DIST_DIR}"

echo "==> Compiling vexrec release binary..."
cargo build --release -p vexrec-cli
strip target/release/vexrec || true

echo "==> Building Debian package..."
bash packaging/deb/create_deb.sh "${VERSION}"
cp "target/vexrec_${VERSION}_amd64.deb" "${DIST_DIR}/vexrec_${VERSION}_amd64.deb"

echo "==> Assembling AppImage..."
APPDIR="${ROOT_DIR}/target/vexrec_appdir"
rm -rf "${APPDIR}"
mkdir -p "${APPDIR}/usr/bin" \
         "${APPDIR}/usr/share/applications" \
         "${APPDIR}/usr/share/icons/hicolor/256x256/apps" \
         "${APPDIR}/usr/share/icons/hicolor/128x128/apps" \
         "${APPDIR}/usr/share/icons/hicolor/32x32/apps"

cp target/release/vexrec "${APPDIR}/usr/bin/vexrec"
chmod +x "${APPDIR}/usr/bin/vexrec"
cp data/vexrec.desktop "${APPDIR}/vexrec.desktop"
cp data/vexrec.desktop "${APPDIR}/usr/share/applications/vexrec.desktop"
cp crates/vexrec-ui/icons/128x128@2x.png "${APPDIR}/vexrec.png"
cp crates/vexrec-ui/icons/128x128@2x.png "${APPDIR}/usr/share/icons/hicolor/256x256/apps/vexrec.png"
cp crates/vexrec-ui/icons/128x128.png "${APPDIR}/usr/share/icons/hicolor/128x128/apps/vexrec.png"
cp crates/vexrec-ui/icons/32x32.png "${APPDIR}/usr/share/icons/hicolor/32x32/apps/vexrec.png"

cat <<'EOF' > "${APPDIR}/AppRun"
#!/bin/sh
HERE="$(dirname "$(readlink -f "${0}")")"
exec "${HERE}/usr/bin/vexrec" "$@"
EOF
chmod +x "${APPDIR}/AppRun"

ARCH=x86_64 appimagetool "${APPDIR}" "${DIST_DIR}/vexrec_${VERSION}_amd64.AppImage"

echo "==> Creating portable tarball..."
TAR_DIR="${ROOT_DIR}/target/tarball_staging"
rm -rf "${TAR_DIR}"
mkdir -p "${TAR_DIR}/data" "${TAR_DIR}/icons"

cp target/release/vexrec "${TAR_DIR}/vexrec"
chmod +x "${TAR_DIR}/vexrec"
cp install.sh "${TAR_DIR}/install.sh"
chmod +x "${TAR_DIR}/install.sh"
cp data/vexrec.desktop "${TAR_DIR}/data/vexrec.desktop"
cp README.md LICENSE "${TAR_DIR}/" 2>/dev/null || true
cp -r crates/vexrec-ui/icons/* "${TAR_DIR}/icons/" 2>/dev/null || true

tar -czf "${DIST_DIR}/vexrec-${VERSION}-linux-x86_64.tar.gz" -C "${TAR_DIR}" .

echo "==> Staged release assets in dist-release/:"
ls -lh "${DIST_DIR}"

# Check upload flag (default: true)
UPLOAD="${UPLOAD:-true}"
if [ "${UPLOAD}" = "true" ]; then
  echo "==> Uploading assets to GitHub release ${TAG} in ${REPO}..."
  if gh release view "${TAG}" -R "${REPO}" >/dev/null 2>&1; then
    gh release upload "${TAG}" "${DIST_DIR}"/* --clobber -R "${REPO}"
  else
    echo "Creating new release ${TAG}..."
    gh release create "${TAG}" "${DIST_DIR}"/* \
      --title "vexrec ${VERSION}: Modern and Minimalistic Linux Screen Recorder and Screenshot Suite" \
      --notes "Modern, minimalistic screen recording and screenshot application for Linux." \
      -R "${REPO}"
  fi
  echo "==> Release assets successfully uploaded to ${REPO} @ ${TAG}!"
else
  echo "==> UPLOAD=false specified; skipping upload."
fi
