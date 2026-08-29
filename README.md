# Codex with DeepSeek Web

> DeepSeek Web plans and reviews. Codex executes locally. No DeepSeek API key.

**English** | [简体中文](README.zh-CN.md) · [Installation guide](docs/installation.md)

Codex selects the smallest useful source excerpts or Git diff, then `c2d packet`
applies sensitive-path denial, best-effort inline secret redaction, and a size cap.
After the user confirms the exact transfer, Codex submits the packet to DeepSeek
Web through the in-app Browser. DeepSeek returns a structured plan or review;
Codex keeps exclusive ownership of editing, shell, Git, and tests.

The standard workflow has two confirmation checkpoints only: one before the
planning packet and one before the final review packet. Codex works continuously
between them and sends no progress or clarification messages to DeepSeek.

This project does not call a model API, upload a repository, expose local tools to
DeepSeek, run a public tunnel, or use OAuth/MCP bridging.

## Install

Requirements: Node.js 20+, Git, and Codex desktop with the in-app Browser.

For prerequisites, manual installation, verification, updates, and removal, see
the complete [English installation guide](docs/installation.md).

### Install from GitHub (recommended)

Give Codex this prompt:

```text
Install https://github.com/fundaycoder/codex-with-deepseek-web.
First install the GitHub archive globally with npm, then use $skill-installer
to install its skill directory, and finally verify with c2d --version.
```

Manual equivalent:

```text
npm install -g https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz
```

Then ask Codex:

```text
Use $skill-installer to install
https://github.com/fundaycoder/codex-with-deepseek-web/tree/main/skill
```

The installed skill is available on the next turn.

### Install from a checkout

```text
corepack pnpm install
corepack pnpm build
corepack pnpm link --global
```

Copy `skill/SKILL.md` to
`~/.codex/skills/codex-with-deepseek-web/SKILL.md`, then ask Codex:

```text
Use Codex with DeepSeek Web to implement ...
```

On first use, Codex opens `https://chat.deepseek.com/` and asks you to sign in if
needed. A normal successful task asks twice: once before sending focused planning
context and once before sending the final bounded diff and test summary.

Codex also discovers user skills from
`~/.agents/skills/codex-with-deepseek-web/SKILL.md`. Restart Codex if an installed
skill is not detected in the current session.

## Update and uninstall

Re-run the global `npm install` command above to update the CLI. Remove it with:

```text
npm uninstall -g codex-with-deepseek-web
```

Remove the matching `codex-with-deepseek-web` skill directory to uninstall the
workflow.

## CLI

```text
c2d status -w <workspace> --json
c2d session get -w <workspace> --json
c2d packet plan -w <workspace> --task c2d_ab12 --goal "..." \
  --file "src/app.ts#1-160" --json
c2d packet review -w <workspace> --task c2d_ab12 --iteration 1 \
  --goal "..." --tests "27 passed" --json
```

Repeat `--file` for multiple excerpts. Add project-specific deny rules in
`.c2dignore`. See [architecture](docs/architecture.md),
[protocol](docs/protocol.md), [security](docs/security.md), and
[troubleshooting](docs/troubleshooting.md).

## Development

```text
corepack pnpm install
corepack pnpm build
corepack pnpm test
```

MIT License.
