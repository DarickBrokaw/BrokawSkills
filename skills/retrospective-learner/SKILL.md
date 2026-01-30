---
name: retrospective-learner
description: Automatically captures lessons learned from failures and updates documentation
license: MIT
compatibility: opencode
metadata:
  audience: developers
  workflow: learning
---

# Retrospective Learner

Automatically captures lessons learned from failures and updates documentation.

## What I Do

I watch for failures and inefficiencies during your OpenCode sessions and automatically:
- Capture lessons from failed tool executions
- Detect slow operations (>5 minutes)
- Update AGENTS.md with new rules
- Update TROUBLESHOOTING.md with known issues
- Log learning sessions to RUN_REPORT.md

## When to Use Me

Use me when you want to:
- Automatically learn from every failure
- Build up a knowledge base without manual effort
- Track patterns across sessions
- Improve AGENTS.md automatically

## How I Work

1. I listen to OpenCode events (tool.execute.after, session.error)
2. When failures occur, I analyze the error pattern
3. I generate a rule to prevent recurrence
4. I automatically update documentation

## Configuration

Create `.opencode/retrospective-config.json`:

```json
{
  "enabled": true,
  "min_time_threshold_seconds": 300,
  "auto_update_docs": true
}
```

## What I Capture

| Event Type | Example | Rule Generated |
|------------|---------|----------------|
| Encoding error | 'charmap codec can't encode' | Use encoding='utf-8' in subprocess |
| Permission error | 'Access is denied' | Use python -m tool instead of .exe |
| Not found | 'ENOENT' file not found | Verify paths before use |
| Slow operation | >5 minutes | Add progress indicators |

## Example

When a subprocess fails with encoding error:
```
Rule added to AGENTS.md:
- Always use encoding="utf-8" in subprocess calls on Windows
```

## Manual Override

For complex issues, invoke the skill directly:
```
"Run the learning skill for complex multi-step issue"
```

The skill asks detailed questions for issues that automation can't capture.
