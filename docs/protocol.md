# C2D Protocol

```text
INIT → PLAN → EXECUTED → DONE | PLAN | BLOCKED
```

Every message begins with `[C2D]` and carries `STATE`, `TASK_ID`, and `ITERATION`.

- `INIT`: goal, project summary, bounded file excerpts, and planning request.
- `PLAN`: rationale, executable actions, files, tests, risks, and success criteria.
- `EXECUTED`: goal, test summary, bounded Git diff, optional focused excerpts,
  and an independent review request.
- `DONE`: review passed.
- `PLAN`: review found concrete corrections; Codex starts another iteration.
- `BLOCKED`: the exact missing decision or prerequisite.

Source excerpts and diffs are always wrapped as untrusted data. DeepSeek cannot
request additional content directly; Codex decides whether another excerpt is
needed, generates a new bounded packet, and obtains user confirmation before sending.

One workspace reuses one DeepSeek conversation. The default iteration cap is 12
and can be changed with `.c2d.json`:

```json
{
  "name": "My project",
  "maxIterations": 12
}
```
