# Troubleshooting

## `c2d` is not found

From the checkout run `corepack pnpm install`, `corepack pnpm build`, and
`corepack pnpm link --global`. Alternatively invoke `node bin/c2d.js`.

For a GitHub installation, re-run `npm install -g https://github.com/fundaycoder/codex-with-deepseek-web/archive/refs/heads/main.tar.gz`,
then open a new terminal and verify with `c2d --version`. Ensure the npm global
binary directory is present in `PATH`.

## DeepSeek opens the sign-in page

The user must complete sign-in in the in-app Browser. Codex must not type a
password or verification code, inspect browser storage, or solve a CAPTCHA.

## Saved conversation no longer opens

Run `c2d session clear -w <workspace>`, create a replacement conversation after
user confirmation, send the boot prompt and a short state handoff, then save its URL.

## Packet says `truncated: true`

Use smaller `path#start-end` ranges, reduce the number of `--file` options, or split
the review into focused packets. Tell DeepSeek and the user what was not covered.

## A file appears in `omittedFiles`

The path may be sensitive, outside the workspace, binary, missing, or too large.
Do not bypass the guard. Select a safe excerpt or summarize the relevant behavior
without including the protected content.

## DeepSeek reply is not structured

Ask once for a single `[C2D]` reply with the required state and fields. Because
that is another browser submission, obtain action-time confirmation first.
