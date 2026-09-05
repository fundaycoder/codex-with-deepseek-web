# Codex with DeepSeek Web

> DeepSeek 网页版负责规划和复审，Codex 负责本地执行。不使用 DeepSeek API。

[English](README.md) | **简体中文** · [完整安装手册](docs/installation.zh-CN.md)

## 它解决什么问题

收到新任务后，Codex 会立即根据用户目标、自动识别的项目元数据和限长目录树
准备 DeepSeek 规划请求，不先进行大范围源码检查、测试或本地修改。只有用户已经
点名文件，或极小片段对理解任务不可缺少时，才会在首次规划中附带源码。

`c2d packet` 会对发送的代码片段或 Git Diff 进行筛选、脱敏和限长。DeepSeek
给出计划或审查意见，Codex 再在本地修改代码、执行命令和运行测试。

首次规划后，Codex 会分批修改、诊断和测试，再让 DeepSeek 检查当前限长 Diff。
DeepSeek 返回 PLAN 时继续下一批本地工作，返回 DONE 时完成最终复审。无需用户重新
下达任务，最多连续复审 12 轮。Codex 宿主仍可能要求每次网页发送前进行简短的即时
确认；Skill 无法覆盖这项平台规则。

它不是 DeepSeek API 客户端，也不会给 DeepSeek 提供本地工具权限。

```text
本地工作区
   │  Codex 选择必要上下文
   ▼
c2d packet（敏感路径拒绝、行内脱敏、长度限制）
   │  用户在发送前确认具体内容范围
   ▼
DeepSeek 网页版（仅规划 / 复审）
   │  结构化 PLAN / DONE / BLOCKED
   ▼
Codex（编辑 / Shell / Git / 测试）
```

## 特点

- 零模型 API：不需要 DeepSeek API Key。
- 即时规划：收到任务后先准备 DeepSeek 调用，完整本地分析放在规划回复之后。
- 持续协作：规划后按“执行一批 → DeepSeek 复审”循环，直到最终通过。
- 职责隔离：DeepSeek 无法读写本地文件或执行命令。
- 最小披露：只发送本轮必要的文件范围、Diff 和测试摘要。
- 两层保护：敏感文件路径直接拒绝，常见行内密钥自动替换为 `[REDACTED]`。
- 独立复审：执行后使用真实 Git Diff 生成复审包。
- 会话续用：每个工作区保存一个 DeepSeek 网页会话地址。

## 安装

要求 Node.js 20+、Git，以及带内置浏览器能力的 Codex 桌面端。

环境准备、手动安装、验证、更新和卸载详见
[中文安装手册](docs/installation.zh-CN.md)。

### 从 GitHub 安装（推荐）

把下面这句话发给 Codex：

```text
请安装 https://github.com/fundaycoder/codex-with-deepseek-web：
先用 npm install -g 安装这个 GitHub 仓库的 main.tar.gz，再使用 $skill-installer 安装仓库中的 skill 目录，最后运行 c2d --version 验证。
```

也可以手动执行：

```powershell
npm install -g "https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz"
```

然后让 Codex 执行：

```text
使用 $skill-installer 安装
https://github.com/fundaycoder/codex-with-deepseek-web/tree/main/skill
```

安装 Skill 后，它会在下一轮对话中生效。

### 从本地源码安装

```powershell
corepack pnpm install
corepack pnpm build
corepack pnpm link --global

$skillDir = Join-Path $env:USERPROFILE ".codex\skills\codex-with-deepseek-web"
New-Item -ItemType Directory -Force -Path $skillDir | Out-Null
Copy-Item "skill\SKILL.md" (Join-Path $skillDir "SKILL.md") -Force
```

如果使用官方推荐的用户级目录，也可将 Skill 复制到
`~/.agents/skills/codex-with-deepseek-web/SKILL.md`。Codex 通常会自动发现变更；
若当前对话没有识别到它，请重启 Codex。

安装完成后对 Codex 说：

```text
使用 Codex with DeepSeek Web 帮我实现……
```

第一次使用时，Codex 会打开 DeepSeek 网页。如果尚未登录，会请你自己完成登录。

你也可以明确给它分工和目标：

```text
使用 codex-with-deepseek-web。让 DeepSeek 网页版先规划并在修改后复审；
Codex 负责读取项目、改代码和跑测试。目标：给这个项目增加导出 CSV 功能。
```

规划返回后，Codex 会自动连续执行本地修改、诊断、测试和 DeepSeek 复审，直到
DeepSeek 返回 DONE、出现真正阻塞，或达到 12 轮上限。浏览器发送前若宿主要求即时
确认，提示应压缩为一句话；首次指令不能取消平台强制确认。

## 更新与卸载

更新 CLI：

```powershell
npm install -g "https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz"
```

卸载 CLI：

```powershell
npm uninstall -g codex-with-deepseek-web
```

Skill 可删除 `~/.codex/skills/codex-with-deepseek-web`（或对应的
`~/.agents/skills/codex-with-deepseek-web`）来卸载。

## CLI

```text
c2d status -w <项目目录> --json
c2d session get -w <项目目录> --json
c2d packet plan -w <项目目录> --task c2d_ab12 --goal "目标" \
  --file "src/app.ts#1-160" --json
c2d packet review -w <项目目录> --task c2d_ab12 --iteration 1 \
  --goal "目标" --tests "27 passed" --json
```

`--file` 可以重复。`path#start-end` 用于只发送必要的行范围。默认消息上限为
60,000 字符，硬上限为 180,000 字符。

## 安全说明

发送到 DeepSeek 网页的内容会离开本机。每次发送之前，Codex 必须向你说明将发送的
文件范围或 Diff、测试摘要，以及是否发生脱敏或截断，并在当时取得确认。

默认禁止 `.env*`、私钥、SSH/AWS/GPG 配置、凭据文件等。可在项目根目录添加
`.c2dignore` 扩展拒绝规则。自动脱敏属于额外防线，不应替代人工检查。

更多说明见 [架构](docs/architecture.md)、[协议](docs/protocol.md)、
[安全模型](docs/security.md) 和 [故障排查](docs/troubleshooting.md)。

## 开发

```text
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

MIT License。
