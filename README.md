# Raycast macOS 简体中文界面补丁（2.9.0.0）

这是 [zwjtano/raycast-macos-zh-CN](https://github.com/zwjtano/raycast-macos-zh-CN) 的兼容 fork，当前适配 **Raycast 2.9.0.0 Apple Silicon（arm64）**。

> 当前范围是主界面、设置、对话框和主要内置功能的固定文案，不是完整汉化。商店插件内部文案、远程内容、用户内容和原生菜单栏仍可能为英文。

- Fork：<https://github.com/iamvicliu/raycast-macos-zh-CN>
- 上游原理：替换 Raycast Electron 前端中的 JavaScript 资源字符串
- 兼容版本：`2.9.0.0`，构建版本 `80a089bc4a415ff3c5c554fe7f67a0ae17ef127d`
- 原生程序 SHA-256：`ee00fded1e4a42afb21bd36de06e306e3f485e8fbd875ef01254f28af6728923`
- 本包不含 Raycast 安装程序，也不是 Raycast 官方中文版

## 当前覆盖范围

翻译表覆盖 214 个前端资源，生成 5,727 处字符串替换，包括：

- 主搜索、欢迎页、设置导航和主要设置页
- 对话框、操作面板、空状态、错误提示和按钮
- AI、笔记、剪贴板、窗口管理、听写等内置功能界面

英文原文经 AST 提取，并与哈希核验过的 2.8.2 社区汉化按同文件、同字符串位置对齐后迁移；2.9.0 新增或变化的文案由本 fork 补充。构建器只替换通过 acorn 定位的字符串字面量和模板片段。

不包含：

- 商店插件和第三方扩展内部汉化
- 远程更新日志正文、服务端动态内容和用户内容
- 原生 macOS 菜单栏
- 所有动态拼接文案和未命中界面的完整翻译

## 原理

Raycast 的 macOS 桌面界面位于：

```text
Raycast.app/Contents/Resources/macos-app_RaycastDesktopApp.bundle/Contents/Resources/frontend/
```

本项目只替换该目录下翻译表指定 JavaScript 文件中的字符串字面量：

- 不修改 `Contents/MacOS/Raycast` 原生程序
- 不重新签名
- 不关闭 Gatekeeper、SIP 或系统安全保护
- 不修改用户数据库、账户或插件数据

`manifest.tsv` 同时记录原文件 SHA-256、补丁文件 SHA-256 和相对路径。安装脚本会同时校验版本、原生程序指纹、当前原文件和 payload；恢复时再校验备份、当前补丁文件和完整应用签名。

## 构建

构建依赖 acorn；仓库只忽略 `.tools/node_modules/`，不会把依赖内容纳入版本控制。首次使用先安装：

```bash
cd .tools
npm install
cd ..
```

```bash
node tools/build-2.9.0.mjs --app /Applications/Raycast.app
```

构建前请确认 `/Applications/Raycast.app` 是未打补丁的 `2.9.0.0 arm64` 原版。

产物写入 `build/2.9.0.0/`：

- `payload/`：替换后的前端资源
- `manifest.tsv`：原文件与补丁文件哈希
- `native-sha256.txt`：原生程序指纹
- `build-report.json`：替换统计

生成后可用 acorn 检查每个目标 JS 的模块语法：

```bash
node - <<'NODE'
import { readdir, readFile } from "node:fs/promises";
import { parse } from "./.tools/node_modules/acorn/dist/acorn.mjs";
const root = "build/2.9.0.0/payload/Contents/Resources/macos-app_RaycastDesktopApp.bundle/Contents/Resources/frontend";
for (const file of await readdir(root)) {
  if (!file.endsWith(".js")) continue;
  parse(await readFile(`${root}/${file}`, "utf8"), {
    ecmaVersion: "latest",
    sourceType: "module",
    allowHashBang: true,
  });
}
NODE
```

## 安装与恢复

发布包应包含：

```text
安装汉化.command
恢复原版.command
patch.sh
payload/
manifest.tsv
native-sha256.txt
使用说明.txt
```

安装前完全退出 Raycast，然后双击 `安装汉化.command`。脚本默认使用 `/Applications/Raycast.app`，也允许输入其他应用路径。

备份位置：

```text
~/Library/Application Support/Raycast-Chinese-Patch/2.9.0.0/<应用路径哈希>/
```

恢复时双击 `恢复原版.command`。恢复成功后会执行：

```bash
codesign --verify --deep --strict /Applications/Raycast.app
```

## 验证边界

本地验证应区分：

1. 生成器完成、payload 哈希匹配
2. 214 个补丁 JS 全部通过 acorn 模块语法检查
3. 临时副本上 `--check`、`--apply`、`--restore` 成功
4. 恢复后原文件哈希和完整签名通过
5. 实际启动并逐页查看中文界面

前四项不等于第五项。当前仓库不声称已经完成 2.9.0.0 的逐页 UI 验收。

## 打包

```bash
tools/package-2.9.0.sh
```

默认在 `/Users/vicliu/artifacts/codex-generated/` 生成带时间戳的 ZIP 和 SHA-256 文件。

## 限制与更新

- 仅支持 Raycast `2.9.0.0` arm64；Intel Mac 和其他版本会拒绝安装。
- 修改资源会使应用完整签名失效，部分机器可能被 macOS 拦截。
- 升级 Raycast 前先恢复原版。应用更新后不要用旧包恢复或覆盖新版资源。
- 如提示应用损坏，优先使用恢复工具；恢复失败时重新安装对应官方原版。不要重置数据库，也不要关闭全局安全保护。
- 上游项目维护完整插件汉化范围；本 fork 当前只验证 2.9.0.0 核心设置界面兼容性。

## 上游与许可

本项目沿用上游仓库的安装/恢复思路和目录结构。第三方许可文件仅在发布包实际包含相应数据时一并分发。Raycast 及其商标、应用资源归 Raycast Technologies Ltd. 所有。
