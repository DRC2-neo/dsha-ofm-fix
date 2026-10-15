# Changelog

## 0.1.0

首个版本。

- 关掉 `dsh-our-free-model` 的毛玻璃：`.ofm_glass` / `.ofm_nav` / `.ofm_modal` / `.ofm_panel` / `.ofm_toast` 去掉 `backdrop-filter`，表面改用宿主主题不透明色 `var(--dsw-alias-bg-layer-2)`。
- 弹窗遮罩 `.ofm_scrim` 只去模糊，保留压暗。
- 背景光晕 `.ofm_aurora` 默认关闭，`<html data-ofm-aurora="keep">` 可保留。
- 纯 CSS 覆盖：不修改上游插件任何文件，卸载即还原。
- 自带 `tools/selftest.mjs`（`npm test`）与可复现打包 `tools/pack.mjs`（`npm run pack`）。
