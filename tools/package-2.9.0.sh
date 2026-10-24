#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd -P)"
BUILD="${ROOT}/build/2.9.0.0"
OUTPUT_ROOT="${1:-/Users/vicliu/artifacts/codex-generated}"
STAMP="$(/bin/date +%Y%m%d-%H%M%S)"
NAME="Raycast-2.9.0.0-arm64-zh-CN"
PACKAGE="${OUTPUT_ROOT}/${NAME}-${STAMP}"
ZIP="${PACKAGE}.zip"

[ -f "${BUILD}/manifest.tsv" ] || {
  echo "缺少构建产物：${BUILD}，请先运行 node tools/build-2.9.0.mjs" >&2
  exit 1
}

/bin/mkdir -p "${PACKAGE}"
/usr/bin/ditto "${BUILD}/payload" "${PACKAGE}/payload"
/bin/cp "${BUILD}/manifest.tsv" "${BUILD}/native-sha256.txt" "${PACKAGE}/"
/bin/cp \
  "${ROOT}/patch.sh" \
  "${ROOT}/安装汉化.command" \
  "${ROOT}/恢复原版.command" \
  "${ROOT}/使用说明.txt" \
  "${PACKAGE}/"

/usr/bin/jq -n \
  --arg version "2.9.0.0" \
  --arg architecture "arm64" \
  --arg buildHash "80a089bc4a415ff3c5c554fe7f67a0ae17ef127d" \
  --arg nativeSha256 "$(cat "${BUILD}/native-sha256.txt")" \
  --arg scope "core UI and settings; migrated from verified 2.8.2 translation with manual 2.9.0 additions" \
  '{version:$version, architecture:$architecture, buildHash:$buildHash, nativeSha256:$nativeSha256, scope:$scope}' \
  > "${PACKAGE}/包信息.json"

/usr/bin/ditto -c -k --sequesterRsrc --keepParent "${PACKAGE}" "${ZIP}"
/usr/bin/shasum -a 256 "${ZIP}" | /usr/bin/awk '{print $1 "  " $2}' > "${ZIP}.sha256"

echo "${PACKAGE}"
echo "${ZIP}"
cat "${ZIP}.sha256"
