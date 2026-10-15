# dsha-ofm-fix

把 [`dsh-our-free-model`](https://www.npmjs.com/package/dsh-our-free-model) 的**毛玻璃界面改成实底**的 DSH / DSHA 插件。

纯 CSS 覆盖，**不修改上游任何文件**：不写对方目录、不动完整性快照，安装/卸载都不影响 `dsh-our-free-model` 的正常升级。

**没有构建步骤** —— 仓库里的文件就是运行时的文件，所以从 GitHub 直装即可用。

---

## 效果

| 表面 | 改前 | 改后 |
|---|---|---|
| 卡片 / KPI / 渠道卡 / 页面头部 `.ofm_glass` | `backdrop-filter: blur(16px)` + 68% 半透明 | 无模糊 + 主题不透明色 |
| 顶部导航 `.ofm_nav` | `blur(20px)` + 62% 半透明 | 无模糊 + 实底 |
| 弹窗与大面板 `.ofm_modal` / `.ofm_panel` | `blur(18px)` | 无模糊 + 实底 |
| 提示条 `.ofm_toast` | `blur(14px)` | 无模糊 + 实底 |
| 弹窗遮罩 `.ofm_scrim` | 模糊 + 压暗 | **只去模糊**，保留压暗 |
| 背景光晕 `.ofm_aurora` | 三团 `blur(70px)` 光斑 | 关闭（可选择性保留，见下） |

实底用的是宿主主题变量 `var(--dsw-alias-bg-layer-2)`，**浅色/深色主题都跟随**，没有写死颜色。

## 安装（四种入口，任选其一）

### 1. npm / git —— 从 GitHub 直装

```bash
# 默认分支
npm install github:<owner>/dsha-ofm-fix

# 指定 tag / commit（推荐，可复现）
npm install github:<owner>/dsha-ofm-fix#v0.1.0
```

git 安装会按 `files` 打包仓库（`index.js`、`client.js`、`cordis.patch.yml` 等运行时文件都在内），
并自动从 registry 装上 peer 依赖 `@deepseek-ai/cordis`（公共包，`^4.0.2`）。**不需要 `prepare`/构建**。

### 2. DSH 插件管理器

| 形式 | 填什么 |
|---|---|
| 仓库 | `https://github.com/<owner>/dsha-ofm-fix` |
| 指定 ref | `https://github.com/<owner>/dsha-ofm-fix/tree/v0.1.0` |
| Release 资产 | `https://github.com/<owner>/dsha-ofm-fix/releases` |
| 本地 zip | 导入 `dist/dsha-ofm-fix-0.1.0.zip` |

### 3. npm registry（若已发到 npm）

```
npm:dsha-ofm-fix
```

### 4. 本地 link（开发用）

```bash
cd ~/.dsh/profiles/web
pnpm add link:/path/to/dsha-ofm-fix
# 再把 "dsha-ofm-fix" 加进同一 package.json 的 dsh.profile.bundles
```

**生效方式：刷新页面（F5）**；无法刷新时重启 Web。

## 卸载 / 回滚

卸载插件即可 —— 它只往页面注入一个 `<style>` 节点，插件销毁时该节点被移除，界面立刻回到毛玻璃。

```bash
python3 ~/.dsh/plugin-manager.py delete dsha-ofm-fix   # DSHA 环境
```

## 发布新版本

```bash
npm test                                   # 自测
# 改 package.json 的 version 与 CHANGELOG.md
git commit -am "release: vX.Y.Z" && git tag vX.Y.Z && git push --tags
```

推 tag 会触发 `.github/workflows/release.yml`：跑测试 → `npm run pack` → 生成
`dist/*.zip` 与 `SHA256SUMS.txt` → 建 GitHub Release 并把它们作为资产附上。
本地想要同样的产物直接 `npm run pack`：**只打 git 追踪文件、条目时间戳钉在 HEAD 提交时间**，
所以同一个 commit 永远产出同样的字节与同样的 SHA-256（可复现）。

## 兼容性

- 目标插件：`dsh-our-free-model` **v2.1.0**（其类名以 `ofm_` 为前缀）
- 宿主：DSH / DSHA Web 壳（依赖其 `client-modules` 的 `window.__ModuleLoader__` 协议）
- 声明：`engines.dsh = ^0.2.0-rc.1`（插件管理器据此判定"兼容"）
- 选择器已与上游 CSS 逐一对齐：`.ofm_glass` / `.ofm_nav` / `.ofm_toast` / `.ofm_scrim` / `.ofm_hero` / `.ofm_panel` / `.ofm_ann` / `.ofm_modal` / `.ofm_aurora`
- 上游调整类名时，只需改 `client.js` 里对应的选择器

## 可选行为

在 `<html>` 上加 `data-ofm-aurora="keep"` 可**保留**背景光晕（只去模糊、不改光晕）：

```js
document.documentElement.dataset.ofmAurora = 'keep'
```

## 与 dsh-ofm-tune 的关系

同一个作者维护的 `dsh-ofm-tune` 把「关毛玻璃」**直接编进上游代码**，并额外包含界面提速改动。
本插件与它效果重叠，**不要同时安装**（重复注入；且 tune 会让上游更新被完整性校验挡住，本插件不会）。

## 仓库结构

```
index.js                     Host 半身（空实现：只为承载 dsh.client 的挂载行存在）
client.js                    浏览器半身：注入一段 CSS
cordis.patch.yml             把本插件作为一行插入 Loader 树
tools/selftest.mjs           npm test：假 ModuleLoader + 假 DOM 跑一遍浏览器半身
tools/pack.mjs               npm run pack：可复现 zip（输出到 dist/）
.github/workflows/   test（每次 push）+ release（推 tag 发版）
```

## English

`dsha-ofm-fix` replaces the frosted-glass surfaces of `dsh-our-free-model`
with solid panels: `backdrop-filter` is dropped, surfaces take the theme's
opaque layer colour, and the decorative background aurora is hidden. It is a
pure CSS overlay that never writes to the upstream plugin's files, so updating
or reinstalling `dsh-our-free-model` keeps working. There is no build step, so
`npm install github:<owner>/dsha-ofm-fix` yields a ready-to-load plugin.

## License

MIT
