# Raycast macOS 汉化｜简体中文界面与插件汉化包

为 macOS 上的 **Raycast 2.5.3.0（Apple Silicon / arm64）** 提供简体中文界面的非官方汉化包。支持主界面、设置、部分提示，以及 100 个商店插件及 Mole 的商店文案和部分内部界面，附带安装与恢复原版工具。

## 选择你的平台

| 平台 | 项目与安装说明 | 汉化包下载 |
| --- | --- | --- |
| macOS · 2.5.3.0 Apple Silicon | [Raycast macOS 汉化](https://github.com/zwjtano/raycast-macos-zh-CN) | [macOS 下载](https://github.com/zwjtano/raycast-macos-zh-CN/releases/latest) |
| Windows · 2.4.0.0 x64 | [Raycast Windows 汉化](https://github.com/zwjtano/raycast-windows-zh-CN) | [Windows 下载](https://github.com/zwjtano/raycast-windows-zh-CN/releases/latest) |

Raycast macOS Simplified Chinese Localization。两个平台独立维护，请按系统和 Raycast 版本下载对应安装包。

**[下载最新版汉化包](https://github.com/zwjtano/raycast-macos-zh-CN/releases/latest)** · [安装教程](#安装教程) · [恢复原版](#恢复与更新) · [插件列表](#插件汉化列表) · [常见问题](#常见问题)

| 项目 | 支持情况 |
| --- | --- |
| Raycast 版本 | 2.5.3.0，安装时校验文件指纹 |
| 平台 | macOS，Apple Silicon（arm64） |
| 中文语言 | 简体中文（zh-CN） |
| 插件覆盖 | 100 个商店插件及 Mole，部分界面与商店文案 |
| 原生菜单栏 | 保留英文 |
| 恢复 | 安装前自动备份，提供恢复原版工具 |

本项目提供中文补丁，不包含 Raycast 应用安装程序，也不是官方中文版。

## 最新版本：v2.5.3.0-r8

- 适配 Raycast **2.5.3.0 arm64**，迁移主界面、设置、商店和插件显示翻译。
- 保留商店快照前十页 100 个插件及 Mole 的已复核汉化。
- 补齐新版“索引网络与可移动驱动器”设置及说明，保留模型服务商设置翻译。
- 补齐 `Ask About Webpage`、`Ask + 模型名称`、内置 AI 写作命令、Deep Research、AI Command / AI Extension / Agent 类型文案。
- 补齐 Quick AI、System Settings、Empty Trash、最近使用的文件，以及部分语音输入、屏幕感知和登录提示。
- 安装与恢复在应用副本上验证通过，还原后完整官方签名检查通过；本机启动和中文主界面已实测，已有 AI 与系统设置翻译迁移通过静态校验。未逐一实测所有需要登录的第三方服务。

**版本必须对应：** [2.5.3.0 下载](https://github.com/zwjtano/raycast-macos-zh-CN/releases/tag/v2.5.3.0-r8) · [2.5.2.0 历史版](https://github.com/zwjtano/raycast-macos-zh-CN/releases/tag/v2.5.2.0-r7) · [2.5.1.0 历史版](https://github.com/zwjtano/raycast-macos-zh-CN/releases/tag/v2.5.1.0-r6.1) · [2.4.1.0 历史版](https://github.com/zwjtano/raycast-macos-zh-CN/releases/tag/v2.4.1.0-r4)。旧版汉化包不可覆盖新版 Raycast。

## 汉化效果截图

以下是旧版 Raycast 2.4.1.0 arm64 安装 r4 的实际界面截图，仅供参考；不是本次 2.5.3.0 的截图。

### 主界面

![Raycast 汉化主界面：中文搜索框和命令列表，Command 类型标签保留英文](docs/screenshots/main.jpg)

### 通用设置

![Raycast 简体中文设置：外观、界面大小及窗口模式](docs/screenshots/settings.jpg)

### Mole 插件商店命令

![Mole 商店详情汉化：系统状态、清理系统、优化系统和卸载应用的中文说明](docs/screenshots/mole-store.jpg)

插件截图展示商店文案，不代表插件内部全部功能已完成汉化验收。

## 安装教程

[下载汉化包 ZIP](https://github.com/zwjtano/raycast-macos-zh-CN/releases/download/v2.5.3.0-r8/Raycast-2.5.3.0-arm64-r8.zip) · [SHA-256 校验文件](https://github.com/zwjtano/raycast-macos-zh-CN/releases/download/v2.5.3.0-r8/Raycast-2.5.3.0-arm64-r8.zip.sha256)

在 Release 页的 Assets 中选择上述 ZIP，完整解压。GitHub 自动生成的 Source code 不是安装包；不要单独下载 `.command` 文件。

1. 安装对应官方原版，放到“应用程序”，先成功打开一次，再从菜单完全退出 Raycast。
2. 双击“安装汉化.command”。应用路径直接回车，默认 `/Applications/Raycast.app`。
3. 确认提示处直接回车开始安装；输入 `n` 取消。完成后打开 Raycast。

无须安装 Python、Node 或开发工具。不自动提权。程序版本和文件指纹必须同时匹配，其他版本会拒绝安装。

## 恢复与更新

完全退出 Raycast，双击同一补丁包里的“恢复原版.command”，两次回车即可按默认路径恢复。恢复后会检查完整官方签名。

安装前自动备份原始资源，位置为 `~/Library/Application Support/Raycast-Chinese-Patch/2.5.3.0/`。请保留备份及补丁包，且不要移动打过补丁的应用。

升级 Raycast 前建议先恢复原版。如果已经通过官方更新变成干净的 2.5.3.0，可以直接安装本包；不要在新版应用上运行旧版本汉化包的恢复工具。同一 Raycast 版本内升级汉化补丁，先用当前补丁对应的恢复工具还原，再安装新版补丁。本包不能跨版本使用；应用更新或被其他工具修改后，恢复工具会拒绝覆盖。

## 覆盖范围

- 主界面、设置、部分操作提示、权限说明与表情名称。
- 100 个商店插件及 Mole 的商店介绍、命令说明、偏好设置及部分内部界面；未安装插件的商店文案也可汉化。
- 应用与插件名称保持原文，主搜索结果右侧类型标签保留 `Command`。
- 菜单栏保留英文，不含原生菜单实验补丁。

189 项资源替换。纳入范围的插件没有逐一完成全部功能验收，未知文案、部分动态内容、README 和部分登录后页面可能保持英文，不宣称完整汉化。不启用未经复核的机翻草稿。

## 插件汉化列表

按 **2026-09-21** 的 macOS 商店默认排序快照，纳入前十页共 **100 个插件**，另保留 **Mole**，合计 **101 个**。商店排序会变化，这不是实时名单。

覆盖商店简介、命令名称与说明、设置项以及已复核的内部固定文案。**纳入范围不代表所有页面、动态内容或登录后流程均已完整汉化或实际验收。** 产品和模型名称、`@标识` 保留原文。

| 页码 | 插件（商店链接） |
| --- | --- |
| 1 | [Color Picker](https://www.raycast.com/thomas/color-picker) |
| 1 | [Kill Process](https://www.raycast.com/rolandleth/kill-process) |
| 1 | [Google Chrome](https://www.raycast.com/Codely/google-chrome) |
| 1 | [Spotify Player](https://www.raycast.com/mattisssa/spotify-player) |
| 1 | [Google Translate](https://www.raycast.com/gebeto/translate) |
| 1 | [Visual Studio Code](https://www.raycast.com/thomas/visual-studio-code) |
| 1 | [Linear](https://www.raycast.com/linear/linear) |
| 1 | [Slack](https://www.raycast.com/mommertf/slack) |
| 1 | [1Password](https://www.raycast.com/khasbilegt/1password) |
| 1 | [Brew](https://www.raycast.com/nhojb/brew) |
| 2 | [Notion](https://www.raycast.com/notion/notion) |
| 2 | [Arc](https://www.raycast.com/the-browser-company/arc) |
| 2 | [GitHub](https://www.raycast.com/raycast/github) |
| 2 | [Coffee](https://www.raycast.com/mooxl/coffee) |
| 2 | [Speedtest](https://www.raycast.com/tonka3000/speedtest) |
| 2 | [Obsidian](https://www.raycast.com/marcjulian/obsidian) |
| 2 | [ChatGPT](https://www.raycast.com/abielzulio/chatgpt) |
| 2 | [Apple Notes](https://www.raycast.com/raycast/apple-notes) |
| 2 | [Apple Reminders](https://www.raycast.com/raycast/apple-reminders) |
| 2 | [Video Downloader](https://www.raycast.com/vimtor/video-downloader) |
| 3 | [Warp](https://www.raycast.com/warpdotdev/warp) |
| 3 | [System Monitor](https://www.raycast.com/hossammourad/raycast-system-monitor) |
| 3 | [GIF Search](https://www.raycast.com/josephschmitt/gif-search) |
| 3 | [Google Search](https://www.raycast.com/mblode/google-search) |
| 3 | [Timers](https://www.raycast.com/ThatNerd/timers) |
| 3 | [Lorem Ipsum](https://www.raycast.com/AntonNiklasson/lorem-ipsum) |
| 3 | [Zoom](https://www.raycast.com/raycast/zoom) |
| 3 | [Clean Keyboard](https://www.raycast.com/ike-gg/clean-keyboard) |
| 3 | [Format JSON](https://www.raycast.com/destiner/json-format) |
| 3 | [CleanShot X](https://www.raycast.com/Aayush9029/cleanshotx) |
| 4 | [Remove Paywall](https://www.raycast.com/tegola/remove-paywall) |
| 4 | [Music](https://www.raycast.com/fedevitaledev/music) |
| 4 | [Pomodoro](https://www.raycast.com/asubbotin/pomodoro) |
| 4 | [Todoist](https://www.raycast.com/doist/todoist) |
| 4 | [Set Audio Device](https://www.raycast.com/benvp/audio-device) |
| 4 | [Downloads Manager](https://www.raycast.com/thomas/downloads-manager) |
| 4 | [Google Calendar](https://www.raycast.com/thomas/google-calendar) |
| 4 | [Port Manager](https://www.raycast.com/lucaschultz/port-manager) |
| 4 | [YouTube](https://www.raycast.com/tonka3000/youtube) |
| 4 | [Google Gemini](https://www.raycast.com/EvanZhouDev/raycast-gemini) |
| 5 | [Browser Bookmarks](https://www.raycast.com/raycast/browser-bookmarks) |
| 5 | [Shell](https://www.raycast.com/asubbotin/shell) |
| 5 | [Tailwind CSS](https://www.raycast.com/vimtor/tailwindcss) |
| 5 | [Image Modification](https://www.raycast.com/HelloImSteven/sips) |
| 5 | [ScreenOCR](https://www.raycast.com/huzef44/screenocr) |
| 5 | [Bitwarden Vault](https://www.raycast.com/jomifepe/bitwarden) |
| 5 | [Jira](https://www.raycast.com/raycast/jira) |
| 5 | [Toothpick](https://www.raycast.com/VladCuciureanu/toothpick) |
| 5 | [Change Case](https://www.raycast.com/erics118/change-case) |
| 5 | [Emoji Search](https://www.raycast.com/FezVrasta/emoji) |
| 6 | [Perplexity](https://www.raycast.com/third774/perplexity) |
| 6 | [Docker](https://www.raycast.com/priithaamer/docker) |
| 6 | [Messages](https://www.raycast.com/thomaslombart/messages) |
| 6 | [Safari](https://www.raycast.com/loris/safari) |
| 6 | [Google Workspace](https://www.raycast.com/raycast/google-workspace) |
| 6 | [Quit Applications](https://www.raycast.com/mackopes/quit-applications) |
| 6 | [ray.so](https://www.raycast.com/garrett/ray-so) |
| 6 | [Installed Extensions](https://www.raycast.com/pernielsentikaer/installed-extensions) |
| 6 | [Folder Search](https://www.raycast.com/GastroGeek/folder-search) |
| 6 | [Cursor](https://www.raycast.com/degouville/cursor-recent-projects) |
| 7 | [App Cleaner](https://www.raycast.com/dziad/appcleaner) |
| 7 | [Word Count](https://www.raycast.com/itsmingjie/word-count) |
| 7 | [MyIP](https://www.raycast.com/Kang/myip) |
| 7 | [Google Maps Search](https://www.raycast.com/ratoru/google-maps-search) |
| 7 | [Password Generator](https://www.raycast.com/joshuaiz/password-generator) |
| 7 | [QR Code Generator](https://www.raycast.com/Melvynx/qrcode-generator) |
| 7 | [Base64](https://www.raycast.com/DanielSinclair/base64) |
| 7 | [Svgl](https://www.raycast.com/1weiho/svgl) |
| 7 | [Ruler](https://www.raycast.com/anwarulislam/ruler) |
| 7 | [Apple Mail](https://www.raycast.com/yug2005/mail) |
| 8 | [iTerm](https://www.raycast.com/ron-myers/iterm) |
| 8 | [Claude](https://www.raycast.com/florisdobber/claude) |
| 8 | [Raycast Explorer](https://www.raycast.com/raycast/raycast-explorer) |
| 8 | [Google Meet](https://www.raycast.com/vitoorgomes/google-meet) |
| 8 | [Apple Intelligence](https://www.raycast.com/EvanZhouDev/raycast-apple-intelligence) |
| 8 | [UUID Generator](https://www.raycast.com/jmaeso/uuid-generator) |
| 8 | [Quick Event](https://www.raycast.com/mblode/quick-event) |
| 8 | [Easy Dictionary](https://www.raycast.com/isfeng/easydict) |
| 8 | [Wikipedia](https://www.raycast.com/vimtor/wikipedia) |
| 8 | [WhatsApp](https://www.raycast.com/vimtor/whatsapp) |
| 9 | [Deepcast](https://www.raycast.com/mooxl/deepcast) |
| 9 | [Model Context Protocol Registry](https://www.raycast.com/raycast/model-context-protocol-registry) |
| 9 | [TinyPNG](https://www.raycast.com/kawamataryo/tinypng) |
| 9 | [2FA Code Finder](https://www.raycast.com/yuercl/imessage-2fa) |
| 9 | [Ollama AI](https://www.raycast.com/massimiliano_pasquini/raycast-ollama) |
| 9 | [Raindrop.io](https://www.raycast.com/lardissone/raindrop-io) |
| 9 | [Amphetamine](https://www.raycast.com/gstvds/amphetamine) |
| 9 | [Random Data Generator](https://www.raycast.com/loris/random) |
| 9 | [Gmail](https://www.raycast.com/tonka3000/gmail) |
| 9 | [Figma File Search](https://www.raycast.com/michaelschultz/figma-files-raycast-extension) |
| 10 | [Weather](https://www.raycast.com/tonka3000/weather) |
| 10 | [Cheatsheets](https://www.raycast.com/destiner/cheatsheets) |
| 10 | [Unix Timestamp](https://www.raycast.com/destiner/unix-timestamp) |
| 10 | [Visual Studio Code - Project Manager](https://www.raycast.com/MarkusLanger/vscode-project-manager) |
| 10 | [Dropover](https://www.raycast.com/jag-k/dropover) |
| 10 | [Screenshot](https://www.raycast.com/Aayush9029/screenshot) |
| 10 | [Media Converter](https://www.raycast.com/leandro.maia/media-converter) |
| 10 | [JetBrains Toolbox Recent Projects](https://www.raycast.com/gdsmith/jetbrains) |
| 10 | [Things](https://www.raycast.com/loris/things) |
| 10 | [Home Assistant](https://www.raycast.com/tonka3000/homeassistant) |
| 补充 | [Mole](https://www.raycast.com/jlrochin/mole) |

静态验证检查了范围内 1,104 个插件源码文件，命中 4,410 处固定界面文字；100 个隔离插件加载测试验证了显示文字转换与参数、回调和原文件保留。它们不等同于 101 个插件的全部实际业务流程验收。

## 启动限制

修改资源会使应用的完整官方签名校验失效，部分机器可能被 macOS 拦截。本机已验证能启动，但不保证其他机器能启动。

补丁不修改原生可执行文件、不重新签名、不移除隔离标记、不关闭系统安全保护，也不修改用户数据库和账户数据。如提示“已损坏”，优先使用恢复工具；若恢复失败，重新安装对应官方原版。不要重置数据库。

## 文件说明

- `安装汉化.command`、`恢复原版.command`：双击操作入口。
- `patch.sh`、`payload/`、`manifest.tsv`、`native-sha256.txt`：安装、校验及还原必需，须整体保留。
- `Unicode-LICENSE.txt`、`Unicode来源.json`、`Acorn-LICENSE.txt`：第三方许可及数据来源。

不包含 Raycast 安装程序、测试应用、个人配置、数据库或备份。

## 常见问题

### Raycast 怎么设置中文？

本项目通过替换指定版本的界面资源实现简体中文显示。请按照上方安装教程操作；它不是通用的语言设置开关。

### 这是 Raycast 官方中文版吗？

不是。这是社区制作的非官方中文补丁，需要自行安装对应官方原版。

### 支持 Intel Mac 或其他 Raycast 版本吗？

本包仅支持 Raycast 2.5.3.0 arm64。Intel 版本和其他版本尚未适配，不要强行安装。

### 插件都完整汉化了吗？

没有。覆盖范围是 100 个商店插件及 Mole 的商店文案及部分内部界面，包括 Mole、Dropover、App Cleaner、Amphetamine、TinyPNG 和 Music 等。未知文字和未覆盖页面保留原文。

### 汉化后提示“已损坏”怎么办？

修改资源可能触发 macOS 的签名检查。优先使用本包的恢复工具还原；恢复失败时重新安装对应官方原版。不要重置用户数据库，也不要关闭全局安全保护。

### Raycast 更新后还能用吗？

本补丁不能跨版本使用。升级前先恢复原版；升级后的汉化需要适配对应版本。

### 如何反馈漏译或安装问题？

通过 [GitHub Issues](https://github.com/zwjtano/raycast-macos-zh-CN/issues) 提供 Raycast 版本、macOS 版本、芯片类型及问题截图。提交前遮住账户信息、密钥和个人内容。

## English overview

An unofficial **Simplified Chinese localization patch for Raycast on macOS**, targeting **Raycast 2.5.3.0 on Apple Silicon (arm64)**. Includes translated UI resources, selected text for 100 macOS Store extensions plus Mole, an installer, and a restore tool. Native menus remain English; translation coverage is partial. No Raycast application binary or personal data is included. Resource changes invalidate the complete app signature and may be blocked by macOS. Use only with the matching original version.

## 第三方内容

本项目与 Raycast 官方无隶属关系。Raycast 及其应用资源的权利归原权利人所有；本仓库不对第三方资源重新授予许可。Unicode 数据与 Acorn 的许可随包提供。
