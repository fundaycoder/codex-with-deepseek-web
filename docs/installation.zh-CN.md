# 安装与首次使用

**简体中文** | [English](installation.md)

## 会安装什么

本项目包含两部分：

1. `c2d` 命令行用于生成限长、脱敏的规划包和复审包。
2. Codex Skill 负责协调 DeepSeek 网页版与 Codex，并执行确认和安全流程。

DeepSeek 通过正常网页使用，不需要 DeepSeek API Key。

## 环境要求

- Node.js 20 或更高版本，并包含 `npm`
- Git
- 带内置浏览器能力的 Codex 桌面端
- DeepSeek 网页账号

可先检查命令行环境：

```text
node --version
npm --version
git --version
```

## 推荐：让 Codex 自动安装

把下面这段话发给 Codex：

```text
请安装 https://github.com/fundaycoder/codex-with-deepseek-web：
先用 npm install -g 安装这个 GitHub 仓库的 main.tar.gz，再使用 $skill-installer 安装仓库中的 skill 目录，最后运行 c2d --version 验证。
```

Skill 会在下一轮 Codex 对话中生效。

## 手动安装

直接从 GitHub 安装 CLI：

```text
npm install -g https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz
```

仓库已经包含编译后的 CLI，因此不会额外安装 TypeScript 或测试工具链。

然后让 Codex 安装 Skill：

```text
使用 $skill-installer 安装
https://github.com/fundaycoder/codex-with-deepseek-web/tree/main/skill
```

手动备用方法：把 `skill/SKILL.md` 复制到下面任一用户级目录。如果没有立即
识别，请重启 Codex：

```text
~/.agents/skills/codex-with-deepseek-web/SKILL.md
~/.codex/skills/codex-with-deepseek-web/SKILL.md
```

## 验证安装

打开一个新终端并运行：

```text
c2d --version
c2d status -w /你的/项目路径 --json
```

第一条命令应输出 `0.2.0`。第二条会返回当前工作区信息，以及已经保存的
DeepSeek 会话信息（如果存在）。

## 第一次使用

在 Codex 中打开项目，然后说：

```text
使用 codex-with-deepseek-web。让 DeepSeek 网页版先规划并在修改完成后复审；
Codex 负责修改项目并运行测试。目标：增加 CSV 导出功能。
```

工作流程如下：

1. Codex 在本地检查项目，只选择完成当前判断所需的代码片段。
2. `c2d packet` 拒绝敏感路径、替换常见行内密钥并限制消息长度。
3. Codex 列出将发送的具体文件范围或 Diff，并向你确认。
4. 如需登录，你自行在 DeepSeek 网页完成。Codex 把已确认的数据发送到该
   工作区固定使用的一条会话。
5. DeepSeek 返回结构化计划；Codex 评估后在本地改代码并运行相关测试。
6. Codex 再次确认后，把限长的真实 Diff 与测试摘要发给 DeepSeek 独立复审。

DeepSeek 永远不会获得本地 Shell、Git 或文件写入权限。

## 更新

重新执行 CLI 安装命令：

```text
npm install -g https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz
```

更新 Skill 时，删除已经安装的 `codex-with-deepseek-web` Skill 目录，然后使用
`$skill-installer` 重新安装仓库中的 `skill/`。

## 卸载

```text
npm uninstall -g codex-with-deepseek-web
```

然后从 `~/.agents/skills` 或 `~/.codex/skills` 中删除
`codex-with-deepseek-web` 目录。

## 常见问题

- 找不到 `c2d`：打开新终端，并确认 npm 的全局命令目录已加入 `PATH`。
- 找不到 Skill：新开一轮 Codex 对话，或重启 Codex。
- DeepSeek 要求登录、验证码或 CAPTCHA：请你自己在所选浏览器中完成，再告诉
  Codex 可以继续。
- 数据包提示被截断：优先缩小文件行范围，不要盲目提高长度上限。

更多内容参见[故障排查](troubleshooting.md)和[安全模型](security.md)。
