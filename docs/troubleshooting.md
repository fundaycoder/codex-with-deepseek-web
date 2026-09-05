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
user confirmation, and send the next required planning or review packet there.
Do not send a separate handoff message.

## Packet says `truncated: true`

Use smaller `path#start-end` ranges or reduce the number of `--file` options until
one useful packet fits. Do not split one iteration into multiple messages. Tell
DeepSeek and the user what was not covered.

## A file appears in `omittedFiles`

The path may be sensitive, outside the workspace, binary, missing, or too large.
Do not bypass the guard. Select a safe excerpt or summarize the relevant behavior
without including the protected content.

## DeepSeek reply is not structured

Interpret the visible reply conservatively and continue locally when its intent is
clear. Do not spend an extra DeepSeek message on format repair. If the reply is not
usable, surface the blocker to the user.
