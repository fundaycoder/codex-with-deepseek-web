# Architecture

```text
┌──────────────────────────┐
│      DeepSeek Web        │
│   Plan / Review only     │
└────────────▲─────────────┘
             │ confirmed, bounded iteration packets
             │ rendered [C2D] replies
┌────────────┴─────────────┐
│ Codex + in-app Browser   │
│ browser control / parse  │
└──────▲───────────┬───────┘
       │           │ edit / shell / git / tests
       │           ▼
┌──────┴──────┐  ┌──────────────────────────┐
│ c2d CLI     │  │     Local workspace      │
│ packet/state│  │ Codex is sole executor   │
└─────────────┘  └──────────────────────────┘
```

## Components

- `context/`: builds planning/review packets, redacts common inline secrets,
  applies character limits, and labels source/diff content as untrusted.
- `workspace/`: canonical path containment, sensitive-path rules, safe file
  ranges, project detection, search, and Git diff collection.
- `session/`: stores one validated `chat.deepseek.com` conversation URL per workspace.
- `execution/`: local JSONL records for Codex iterations.
- `cli/`: exposes `status`, `session`, `packet`, and `record` commands.
- `skill/`: owns the browser-driven PLAN → LOCAL EXECUTION → FINAL REVIEW flow.

The PLAN transition is latency-sensitive. Skill activation goes directly through
`status` and a goal-first planning packet to confirmation and browser submission.
Broad repository discovery begins only after the PLAN reply.

There is no model client, public listener, tunnel, MCP server, or OAuth flow.
The browser is the only transport to DeepSeek Web.
