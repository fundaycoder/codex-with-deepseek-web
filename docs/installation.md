# Installation and first use

[简体中文](installation.zh-CN.md) | **English**

## What gets installed

The project has two parts:

1. The `c2d` CLI builds bounded and redacted planning/review packets.
2. The Codex Skill coordinates DeepSeek Web and Codex while enforcing the
   confirmation and safety workflow.

DeepSeek is used through its normal website. No DeepSeek API key is required.

## Requirements

- Node.js 20 or newer, including `npm`
- Git
- Codex desktop with the in-app Browser
- A DeepSeek Web account

Check the command-line requirements:

```text
node --version
npm --version
git --version
```

## Recommended: ask Codex to install it

Paste this into a Codex task:

```text
Install https://github.com/fundaycoder/codex-with-deepseek-web.
First install the GitHub archive globally with npm, then use $skill-installer
to install its skill directory, and finally verify with c2d --version.
```

The Skill becomes available on the next Codex turn.

## Manual installation

Install the CLI directly from GitHub:

```text
npm install -g https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz
```

The repository includes the compiled CLI, so this does not install the
TypeScript or test toolchain.

Then ask Codex to install the Skill:

```text
Use $skill-installer to install
https://github.com/fundaycoder/codex-with-deepseek-web/tree/main/skill
```

Manual Skill fallback: copy `skill/SKILL.md` into either of these user-level
locations and restart Codex if it is not detected immediately:

```text
~/.agents/skills/codex-with-deepseek-web/SKILL.md
~/.codex/skills/codex-with-deepseek-web/SKILL.md
```

## Verify the installation

Open a new terminal and run:

```text
c2d --version
c2d status -w /path/to/your/project --json
```

The first command should print `0.5.0`. The second should return JSON describing
the selected workspace and its saved DeepSeek conversation, if one exists.

## First use

Open your project in Codex and say:

```text
Use codex-with-deepseek-web. Let DeepSeek Web plan first and review the final
diff. Codex should edit the project and run the tests. Goal: add CSV export.
```

The workflow is:

1. Codex immediately builds a planning packet from your goal, detected project
   metadata, and a bounded two-level tree. It does not first inspect the whole
   repository, run tests, or edit files.
2. Source excerpts are omitted by default. A focused excerpt is included only
   when you named it or it is indispensable. `c2d packet` blocks sensitive paths,
   redacts common inline secrets, and caps the packet size.
3. **Planning checkpoint:** Codex immediately shows the exact outbound context
   and asks for the first confirmation. Once confirmed, sending is its next action.
4. You sign in to DeepSeek Web yourself if needed. Codex sends the confirmed
   packet to one conversation for that workspace.
5. DeepSeek returns a structured plan. Only then does Codex perform full local
   discovery and complete one meaningful edit, diagnosis, and test batch.
6. Codex records that iteration, builds a bounded diff/test packet, obtains the
   host-required one-line confirmation, and sends it to the same DeepSeek chat.
7. A PLAN reply starts the next local batch automatically. DONE is the final
   review. The loop stops after 12 review iterations unless you ask to continue.

No new task instruction is needed between iterations. A Skill cannot waive a
mandatory action-time confirmation imposed by the Codex browser host.

DeepSeek never receives local shell, Git, or file-write access.

## Update

Re-run the CLI installation command:

```text
npm install -g https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz
```

To refresh the Skill, remove the installed `codex-with-deepseek-web` Skill
directory and install `skill/` again with `$skill-installer`.

## Uninstall

```text
npm uninstall -g codex-with-deepseek-web
```

Then remove the installed `codex-with-deepseek-web` Skill directory from
`~/.agents/skills` or `~/.codex/skills`.

## Troubleshooting

- If `c2d` is not found, open a new terminal and confirm npm's global binary
  directory is in `PATH`.
- If the Skill is not detected, start a new Codex turn or restart Codex.
- If DeepSeek shows a sign-in, CAPTCHA, or verification step, complete it
  yourself in the selected browser and then tell Codex you are ready.
- If a packet is truncated, select smaller file ranges instead of increasing the
  limit blindly.

See [troubleshooting](troubleshooting.md) and the [security model](security.md)
for more detail.
