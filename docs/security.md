# Security model

## Authority separation

DeepSeek Web receives text and returns text. It has no filesystem, shell, Git,
browser, or network tools on the user's machine. Codex remains the sole executor
and evaluates every proposed action under its normal permissions.

## Outbound data controls

1. Only explicit `--file` ranges and the requested Git diff enter a packet.
2. Canonical path checks block traversal and symlink escapes.
3. Sensitive paths such as `.env*`, private keys, SSH/AWS/GPG data, and credential
   files are denied. `.c2dignore` adds project rules.
4. Common inline secrets are replaced with `[REDACTED]`.
5. Packets have bounded size and report redaction, omission, and truncation metadata.
6. The user confirms the exact data class and destination immediately before each send.

Redaction is best effort, not a complete DLP system. Codex must inspect packet
metadata and avoid sending sensitive business data even when it does not match a
secret pattern.

## Prompt injection

Repository text and DeepSeek replies are untrusted. Packet delimiters and the boot
prompt tell DeepSeek not to follow instructions embedded in code or diffs. More
importantly, DeepSeek has no execution channel: Codex independently evaluates plans
and never treats a reply as authorization.

## Browser credentials

The workflow never reads cookies, local storage, passwords, verification codes, or
session tokens. The user signs in to DeepSeek directly in the in-app Browser.
