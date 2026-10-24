#!/bin/bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd -P)"
MODE="${1:---interactive-apply}"
APP="${2:-/Applications/Raycast.app}"
VERSION="2.9.0.0"
INTERACTIVE=0
if [ -d "${ROOT}/build/${VERSION}/payload" ]; then
  ASSET_ROOT="${ROOT}/build/${VERSION}"
else
  ASSET_ROOT="${ROOT}"
fi

case "${MODE}" in
  --interactive-apply|--interactive-restore)
    INTERACTIVE=1
    echo "Raycast ${VERSION} arm64 设置界面汉化包"
    if [ "${MODE}" = "--interactive-restore" ]; then
      echo '恢复原版：撤销汉化，保留用户设置和插件数据。'
    else
    echo '安装汉化：替换主界面、设置、对话框等前端资源中的可见文案。'
    fi
    echo '修改资源会使完整官方签名失效；本工具不会关闭系统安全保护，也不会重新签名。'
    echo '仅适用于指定版本。请先完全退出 Raycast。'
    printf '应用路径（回车使用 /Applications/Raycast.app）：'
    IFS= read -r input
    if [ -n "${input}" ]; then APP="${input}"; fi
    if [ ! -d "${APP}" ]; then
      echo '请输入实际路径，不要添加引号或反斜杠。'
      exit 1
    fi
    if [ "${MODE}" = "--interactive-restore" ]; then
      MODE="--restore"
    else
      MODE="--apply"
    fi
    ;;
  --apply|--restore|--check) ;;
  *)
    echo "用法：patch.sh --check|--apply|--restore ${APP}"
    exit 2
    ;;
esac

fail() {
  echo "失败：$*" >&2
  exit 1
}

hash() {
  /usr/bin/shasum -a 256 "$1" | /usr/bin/awk '{print $1}'
}

confirm_action() {
  while true; do
    printf '%s（回车继续，输入 n 取消）：' "$1"
    if ! IFS= read -r answer; then
      echo '未收到确认，已取消；未修改应用。'
      exit 1
    fi
    case "${answer}" in
      ''|y|Y|yes|YES|Yes|是|确认) return 0 ;;
      n|N|no|NO|No|否|取消)
        echo '已取消，未修改应用。'
        exit 0
        ;;
      *) echo '未识别输入，请直接回车继续，或输入 n 取消。' ;;
    esac
  done
}

[ -d "${APP}/Contents" ] || fail '找不到所选应用。'
APP="$(cd "${APP}" && pwd -P)"
[ "${APP}" != "/" ] || fail '应用路径无效。'

INSTALLED_VERSION="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "${APP}/Contents/Info.plist")"
[ "${INSTALLED_VERSION}" = "${VERSION}" ] || fail "版本不匹配：${INSTALLED_VERSION}。本包只支持 ${VERSION}。"

EXPECTED_BINARY="$(cat "${ASSET_ROOT}/native-sha256.txt")"
[ "$(hash "${APP}/Contents/MacOS/Raycast")" = "${EXPECTED_BINARY}" ] \
  || fail '原生程序指纹不匹配，请使用指定 arm64 原版。'

if /bin/ps -axo comm= 2>/dev/null | /usr/bin/grep -F "${APP}/Contents/" >/dev/null; then
  fail 'Raycast 仍在运行，请从应用菜单退出后重试。'
fi

KEY="$(printf '%s' "${APP}" | /usr/bin/shasum -a 256 | /usr/bin/awk '{print $1}')"
BACKUP="${HOME}/Library/Application Support/Raycast-Chinese-Patch/${VERSION}/${KEY}"

check_payload() {
  while IFS=$'\t' read -r old new rel; do
    [ -n "${rel}" ] || continue
    [ -f "${ASSET_ROOT}/payload/${rel}" ] || fail "补丁文件缺失：${rel}"
    [ "$(hash "${ASSET_ROOT}/payload/${rel}")" = "${new}" ] || fail "补丁文件校验失败：${rel}"
  done < "${ASSET_ROOT}/manifest.tsv"
}

check_original() {
  while IFS=$'\t' read -r old new rel; do
    [ -n "${rel}" ] || continue
    [ -f "${APP}/${rel}" ] && [ ! -L "${APP}/${rel}" ] \
      || fail "原版文件缺失或为链接：${rel}"
    [ "$(hash "${APP}/${rel}")" = "${old}" ] \
      || fail "原版资源不匹配：${rel}。可能已更新或安装其他汉化。"
  done < "${ASSET_ROOT}/manifest.tsv"
}

rollback() {
  while IFS=$'\t' read -r old new rel; do
    [ -n "${rel}" ] || continue
    /bin/cp -p "${BACKUP}/files/${rel}" "${APP}/${rel}"
  done < "${BACKUP}/manifest.tsv"
}

if [ "${MODE}" = "--restore" ]; then
  echo '正在检查恢复备份和当前资源，请稍候…'
  [ -f "${BACKUP}/complete" ] || fail '此应用路径没有完整备份，不能自动恢复。'
  /usr/bin/cmp -s "${BACKUP}/manifest.tsv" "${ASSET_ROOT}/manifest.tsv" \
    || fail '备份属于另一版补丁，请使用对应恢复工具。'

  while IFS=$'\t' read -r old new rel; do
    [ -n "${rel}" ] || continue
    [ -f "${BACKUP}/files/${rel}" ] && [ "$(hash "${BACKUP}/files/${rel}")" = "${old}" ] \
      || fail "备份损坏：${rel}"
    [ -f "${APP}/${rel}" ] && [ "$(hash "${APP}/${rel}")" = "${new}" ] \
      || fail "应用已更新或另有修改，停止恢复以免覆盖：${rel}"
    [ -w "${APP}/${rel}" ] || fail "没有写入权限：${rel}"
  done < "${ASSET_ROOT}/manifest.tsv"

  if [ "${INTERACTIVE}" = 1 ]; then
    confirm_action '恢复所选应用的原版资源？'
  fi

  echo '正在恢复原版资源…'
  rollback
  echo '正在验证原版资源及官方签名…'
  check_original
  /usr/bin/codesign --verify --deep --strict "${APP}" \
    || fail '资源已恢复，但完整签名检查失败，请从保留的原版安装包重新安装。'
  /bin/mv "${BACKUP}" "${BACKUP}.restored.$(/bin/date +%Y%m%d-%H%M%S).$$"
  echo '恢复成功，原版资源与完整签名检查通过。备份已归档。'
  exit 0
fi

check_payload

if [ "${MODE}" = "--check" ]; then
  original_count=0
  patched_count=0
  while IFS=$'\t' read -r old new rel; do
    [ -n "${rel}" ] || continue
    [ -f "${APP}/${rel}" ] && [ ! -L "${APP}/${rel}" ] \
      || fail "目标资源缺失或为链接：${rel}"
    actual="$(hash "${APP}/${rel}")"
    if [ "${actual}" = "${old}" ]; then
      original_count=$((original_count + 1))
    elif [ "${actual}" = "${new}" ]; then
      patched_count=$((patched_count + 1))
    else
      fail "目标资源不匹配：${rel}。可能已更新、损坏或安装了其他汉化。"
    fi
  done < "${ASSET_ROOT}/manifest.tsv"
  count=$((original_count + patched_count))
  if [ "${patched_count}" = 0 ]; then
    echo "检查通过：版本、原生程序、${count} 个目标资源及补丁内容均匹配。当前为原版，尚未修改应用。"
  elif [ "${original_count}" = 0 ]; then
    echo "检查通过：版本、原生程序、${count} 个目标资源及补丁内容均匹配。当前已安装本补丁。"
  else
    fail "检测到混合状态：${original_count} 个原版资源、${patched_count} 个补丁资源。请恢复后重试。"
  fi
  exit 0
fi

check_original

[ ! -e "${BACKUP}" ] || fail "该路径已有备份，停止以免覆盖：${BACKUP}"
[ -w "${APP}/Contents/Resources" ] || fail '当前账户无权修改此应用。'
while IFS=$'\t' read -r old new rel; do
  [ -n "${rel}" ] || continue
  [ -w "${APP}/${rel}" ] || fail "没有写入权限：${rel}"
done < "${ASSET_ROOT}/manifest.tsv"

if [ "${INTERACTIVE}" = 1 ]; then
  confirm_action '应用到上述原版并创建备份？'
fi

umask 077
/bin/mkdir -p "${BACKUP}/files"
/bin/cp "${ASSET_ROOT}/manifest.tsv" "${BACKUP}/manifest.tsv"
printf '%s\n' "${APP}" > "${BACKUP}/app-path.txt"

while IFS=$'\t' read -r old new rel; do
  [ -n "${rel}" ] || continue
  /bin/mkdir -p "${BACKUP}/files/$(dirname "${rel}")"
  /bin/cp -p "${APP}/${rel}" "${BACKUP}/files/${rel}"
  [ "$(hash "${BACKUP}/files/${rel}")" = "${old}" ] \
    || fail "备份校验失败：${rel}；应用尚未修改。"
done < "${ASSET_ROOT}/manifest.tsv"

touch "${BACKUP}/complete"

on_error() {
  code=$?
  trap - EXIT INT TERM
  if [ "${code}" != 0 ]; then
    echo '安装未完成，正在回滚原版资源。' >&2
    rollback
    echo "备份保留在：${BACKUP}" >&2
  fi
  exit "${code}"
}
trap on_error EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

umask 022
while IFS=$'\t' read -r old new rel; do
  [ -n "${rel}" ] || continue
  /bin/mkdir -p "${APP}/$(dirname "${rel}")"
  /bin/cp "${ASSET_ROOT}/payload/${rel}" "${APP}/${rel}"
  [ "$(hash "${APP}/${rel}")" = "${new}" ] || fail "写入校验失败：${rel}"
done < "${ASSET_ROOT}/manifest.tsv"

trap - EXIT INT TERM
echo '汉化资源安装完成，全部目标文件校验通过。'
echo "备份：${BACKUP}"
echo '现在可打开 Raycast。若 macOS 拦截，请参考说明；不要关闭全局安全保护。'
