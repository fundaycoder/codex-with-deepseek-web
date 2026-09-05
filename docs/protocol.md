# C2D Protocol

```text
INIT → PLAN → LOCAL_EXECUTION → FINAL_REVIEW → DONE | PLAN | BLOCKED
```

Every message begins with `[C2D]` and carries `STATE`, `TASK_ID`, and `ITERATION`.

- `INIT`: goal, project summary, bounded file excerpts, and planning request.
- `PLAN`: rationale, executable actions, files, tests, risks, and success criteria.
- `EXECUTED`: goal, test summary, bounded Git diff, optional focused excerpts,
  and an independent review request.
- `DONE`: review passed.
- `PLAN`: final review found concrete corrections; Codex handles them locally.
- `BLOCKED`: the exact missing decision or prerequisite.

Source excerpts and diffs are always wrapped as untrusted data. The standard
protocol starts with one planning request, followed by one review request after
each meaningful local edit/test batch. Each browser submission follows the host's
action-time confirmation policy.

The planning request uses a fast path: it is prepared before broad repository
inspection, tests, or edits. Goal, detected project metadata, and a bounded tree
are sufficient by default; source excerpts are opt-in when already identified as
essential. Full local discovery starts after the PLAN reply.

Codex sends no commentary-only progress, duplicate context, or format-repair
messages. A PLAN review reply starts the next local iteration; DONE is the final
review. The loop stops at 12 review iterations unless the user explicitly asks to
continue. Mandatory action-time confirmation cannot be waived by earlier approval.

One workspace reuses one DeepSeek conversation.
