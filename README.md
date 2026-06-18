# Strava Quick Kudos - Simplified Chinese Localization

🌐 **Language**: [English](README.md) | [简体中文](README_zh-CN.md)

## Project Description

This branch contains Simplified Chinese localization for the [Strava Quick Kudos](https://github.com/jongoodey) extension.

- **Original project**: https://github.com/jongoodey (by jongoodey)
- **Original Chrome Web Store**: https://chromewebstore.google.com/detail/Strava%20QDOS%20Giver/belkkbpmghfdedngfkomlifeknfnacdi

---

## 🖼️ Interface Preview

### 🚴 On Strava Dashboard

| Main Interface | Advanced Options |
|----------------|------------------|
| ![Chinese Interface - Main](png/on%20Strava%20Dashboard%2001.png) | ![Chinese Interface - Advanced Options](png/on%20Strava%20Dashboard%2002.png) |

### 🔧 Diagnostics & Alerts

| Run Diagnostics (Activity Stats) | Error Prompt (Non-Dashboard) |
|---------------------------------|------------------------------|
| ![Run Diagnostics](png/Run%20Diagnostics.png) | ![Not on Strava Dashboard](png/Not%20on%20Strava%20Dashboard.png) |

- **Run Diagnostics**: Counts activity cards, kudos buttons, owners on current page for troubleshooting
- **Error Prompt**: Shows when user is not on Strava Dashboard page, guiding to correct page

---

## Disclaimer

**Important Notice:** This is an unofficial local modification of the original Strava QDOS Giver extension. The localization work was done on the local files of the original extension for personal use and community benefit.

- This localization is provided "as is" without warranty of any kind.
- The original extension author (@jongoodey) has been contacted via email requesting official Chinese localization support.
- One email was rejected (jon@indexify.co), but the email sent to the GitHub registered address (goodeyjon@hotmail.com) was delivered successfully.
- Until official support is implemented, users may use this localized version by manually loading the unpacked extension in developer mode.

**USE AT YOUR OWN RISK:** This modified version is not officially supported by the original author. Users should be aware that:
- This is a third-party modification
- The original extension may receive updates that could break compatibility
- Users are responsible for ensuring compliance with Chrome Web Store policies when using unpacked extensions

---

## Localization Contents

The following files have been localized to Simplified Chinese:

### 1. manifest.json
- Extension name: `Strava 一键点赞`
- Description: `在 Strava 上一键点赞，支持位置、时间和活动类型筛选。位置选择器、快速点赞全部、多轮捕获。`

### 2. popup.html
All interface text translated to Simplified Chinese:

| Original | Chinese |
|----------|---------|
| Strava Quick Kudos | Strava 一键点赞 |
| Quick Kudo All | 快速点赞全部 |
| Kudos All Activities | 点赞所有活动 |
| Time Range: | 时间范围: |
| Last 24 hours | 最近24小时 |
| Last 48 hours | 最近48小时 |
| Last 7 days | 最近7天 |
| All Visible | 全部可见 |
| One-click done, no scrolling needed, fast kudos. | 一键完成，无需滚动，快速点赞。 |
| Ready to kudos. | 准备好点赞。 |
| Filters | 筛选器 |
| Location Filter | 位置筛选 |
| Allow / Block | 允许 / 阻止 |
| Detected Locations | 检测到的位置 |
| Scan Feed | 扫描动态 |
| Search locations... | 搜索位置... |
| Click "Scan Feed" to get locations from the current feed. | 点击"扫描动态"从当前动态列表获取位置。 |
| Select All | 全选 |
| Clear | 清除 |
| Selected X | 已选择 X 个 |
| Custom keywords (optional), e.g.: Beijing | 自定义关键词（可选），如：北京 |
| Selected items and custom keywords are combined. Supports substring matching, case-insensitive. | 选择项和自定义关键词将合并。支持子字符串匹配，不区分大小写。 |
| Activity Type Filter | 活动类型筛选 |
| e.g.: Run, Ride, Trail Run | 例如：跑步, 骑行, 越野跑 |
| Comma-separated. Matches activity icon labels. | 逗号分隔。匹配活动图标标签。 |
| Or Custom Settings | 或自定义设置 |
| Advanced Options | 高级选项 |
| Kudos Speed | 点赞速度 |
| seconds | 秒 |
| Start from bottom | 从底部开始 |
| Start Custom Kudos | 开始自定义点赞 |
| Stop Kudos | 停止点赞 |
| Auto Speed (fast then slow) | 自动速度（先快后慢） |
| Limit kudos count | 限制点赞数 |
| times | 次 |
| Reset Counter | 重置计数器 |
| Run Diagnostics | 运行诊断 |
| Not on Strava Dashboard | 未在 Strava 仪表盘 |
| This extension only works on Strava Dashboard. | 此扩展仅在 Strava 仪表盘页面生效。 |
| Go to Strava Dashboard | 前往 Strava 仪表盘 |
| Please go to Strava Dashboard to use this extension. | 请前往 Strava 仪表盘使用此扩展。 |

### 3. popup.js
Dynamic status messages translated:

| Original | Chinese |
|---------|---------|
| Speed: Auto | 速度: 自动 |
| Speed: Xs | 速度: X秒 |
| Kudos Given: X/X | 已点赞: X/X |
| Settings saved | 设置已保存 |
| Scanning feed for locations... | 正在扫描动态获取位置... |
| Scanning... | 扫描中... |
| Found X locations in X feed entries. | 在 X 条动态中发现 X 个位置。 |
| Scan complete but no data returned. | 扫描完成但未返回数据。 |
| Scan error: X | 扫描错误: X |
| Kudos stopped | 点赞已停止 |
| Error: X | 错误: X |
| Running... | 运行中... |
| Counter reset to 0 | 计数器已重置为 0 |
| Cards X - Kudos X - Owner X - Time X - Already Given X | 卡片 X - 点赞按钮 X - 作者 X - 时间 X - 已点赞 X |

### 4. kudos-engine.js
Engine runtime messages translated:

| Original | Chinese |
|---------|---------|
| Loading activities... (Found X) | 加载活动中... (已找到 X 个) |
| Loaded X activities (time range reached). | 已加载 X 个活动 (已达时间范围)。 |
| Loaded all X activities. | 已加载全部 X 个活动。 |
| Loaded X activities (loading stalled). | 已加载 X 个活动 (加载停滞)。 |
| Starting... | 开始... |
| Pass X: X eligible activities | 第 X 轮: X 个符合条件的活动 |
| Limit reached: X/X | 已达上限: X/X |
| Kudos given: X (X remaining) | 已点赞: X (剩余 X 个) |
| Last 24 hours | 最近24小时 |
| Last 48 hours | 最近48小时 |
| Last 7 days | 最近7天 |
| All Visible | 全部可见 |
| Last X hours | 最近 X小时 |
| Done! X kudos given (X). | 完成! 已点赞 X 个 (X)。 |
| Scanning feed for locations... | 正在扫描动态获取位置... |
| Found X unique locations in X cards. | 在 X 条动态中发现 X 个独特位置。 |

---

## ✅ Fixes & Updates

### v1.1 Fixes (June 2026)

1. **Chinese Time Format Support** - Added parsing support for Chinese interface time display:
   - Supports `刚刚`, `今天`, `昨天`
   - Supports `X分钟前`, `X小时前`, `X天前` formats

2. **Kudos Count Fix** - Fixed issue where kudos count showed 0 despite successful clicks:
   - Enhanced `alreadyKudoed()` function with multiple detection methods
   - Improved `clickWithRetry()` function with multiple verification attempts
   - Added fallback mechanism to ensure kudos are counted correctly

3. **Updated Preview Images** - Updated demo screenshots showing Chinese interface

---

## How to Apply

### Method 1: Manual File Replacement

1. Download the original extension source code
2. Replace the corresponding files with those from this repository
3. Load the extension in Chrome (Developer mode → Load unpacked)

### Method 2: Install Pre-packaged Version

Once the author merges this branch, a packaged `.zip` file will be released for direct installation.

---

## Commit Summary

Localization changes include:
- manifest.json: Extension name and description
- popup.html: All interface text
- popup.js: Dynamic status messages
- kudos-engine.js: Engine runtime messages

---

## Acknowledgements

- **Original project**: [jongoodey](https://github.com/jongoodey)
- **Localization contributor**: [techysy](https://github.com/techysy)
