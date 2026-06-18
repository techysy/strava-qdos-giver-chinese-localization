# Strava Quick Kudos - 简体中文本地化

## 项目说明

本分支包含 [Strava Quick Kudos](https://github.com/jongoodey) 扩展的简体中文（Simplified Chinese）本地化修改。

- **原始项目**: https://github.com/jongoodey (作者: jongoodey)
- **原始 Chrome 应用商店**: https://chromewebstore.google.com/detail/Strava%20QDOS%20Giver/belkkbpmghfdedngfkomlifeknfnacdi

---

## 免责声明

**重要声明：** 这是对原始 Strava QDOS Giver 扩展的非官方本地修改。本地化工作是在原始扩展的本地文件上完成的，仅供个人使用和社区共享。

- 本本地化版本按"原样"提供，不提供任何形式的担保。
- 已通过邮件联系原始扩展作者 (@jongoodey)，请求官方中文本地化支持。
- 其中一封邮件被退回 (jon@indexify.co)，但发送到 GitHub 注册邮箱 (goodeyjon@hotmail.com) 的邮件已成功投递。
- 在官方支持实现之前，用户可以通过开发者模式手动加载未打包的扩展来使用此本地化版本。

**风险自负：** 此修改版本未得到原始作者的官方支持。用户应注意：
- 这是第三方修改
- 原始扩展可能会收到更新，可能会破坏兼容性
- 用户有责任确保在使用未打包扩展时遵守 Chrome 应用商店政策

---

## 本地化内容

本本地化版本对以下文件进行了中文翻译：

### 1. manifest.json
- 扩展名称：`Strava 一键点赞`
- 描述：`在 Strava 上一键点赞，支持位置、时间和活动类型筛选。位置选择器、快速点赞全部、多轮捕获。`

### 2. popup.html
所有界面文本已翻译为简体中文：

| 原文 | 中文 |
|------|------|
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
动态状态消息已翻译：

| 原文 | 中文 |
|------|------|
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
引擎运行时状态消息已翻译：

| 原文 | 中文 |
|------|------|
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

## 应用方法

### 方法一：手动替换文件

1. 下载原始扩展源码
2. 将本仓库对应文件替换原始文件
3. 加载扩展到 Chrome（开发者模式 → 加载已解压的扩展程序）

### 方法二：安装已打包版本

如作者合并本分支，将发布打包好的 `.zip` 文件供直接安装。

---

## 提交信息

本地化修改包括：
- manifest.json：扩展名称和描述
- popup.html：所有界面文本
- popup.js：动态状态消息
- kudos-engine.js：引擎运行时消息

---

## 致谢

- **原始项目**: [jongoodey](https://github.com/jongoodey)
- **本地化贡献者**: [techysy](https://github.com/techysy)
