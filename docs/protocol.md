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
protocol has exactly two outbound messages: one planning request and one final
review request. Each is independently confirmed immediately before sending.

Between them, Codex may perform as many local edit/test iterations as needed but
sends no progress, clarification, or format-repair messages to DeepSeek. After the
final reply, Codex applies clear review findings locally and does not request a
second review. Another DeepSeek round requires an explicit user request and a new
action-time confirmation.

One workspace reuses one DeepSeek conversation.
