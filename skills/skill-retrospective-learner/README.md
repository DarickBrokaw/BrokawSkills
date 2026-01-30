# Skill: Retrospective Learner

Automated learning and retrospective system that captures lessons learned, updates documentation, and improves future execution efficiency.

## ⚠️ Important: Two Components

This skill package includes **TWO** components:

1. **skill-retrospective-learner** (Skill) - For **manual** learning sessions
2. **retrospective-plugin** (Plugin) - For **automatic** learning on failures

### Automatic Learning (Recommended)
The **plugin** (`retrospective-plugin.ts`) automatically:
- Captures failed tool executions
- Detects slow operations (>5 minutes)
- Logs session errors
- Updates AGENTS.md automatically
- Logs to RUN_REPORT.md

### Manual Learning (For Complex Issues)
The **skill** (`skill-retrospective-learner.ts`) is for:
- Documenting complex multi-step issues
- Adding context that automation can't capture
- Creating new rules for future prevention
- When you want to answer detailed questions

## Installation

### For Automatic Learning (Plugin)
The plugin is automatically loaded if placed in:
- Project: `.opencode/plugins/retrospective-plugin.ts`
- Global: `~/.config/opencode/plugins/retrospective-plugin.ts`

### For Manual Learning (Skill)
The skill is part of the standard OpenCode skill set. To use it:

1. Ensure the skill file exists: `~/.config/opencode/skills/skill-retrospective-learner/SKILL.md`
2. Invoke manually when needed

## Usage

### Automatic (Plugin)
Just use OpenCode normally! The plugin automatically:
- Watches for failures
- Captures lessons
- Updates documentation

### Manual (Skill)

```markdown
"Run the learning skill"
"I want to document what I learned"
"I spent 2 hours on encoding issues - let's document this"
"Trigger retrospective on the recent plugin failure"
```

## Configuration

### Plugin Configuration (`.opencode/retrospective-config.json`)

```json
{
  "enabled": true,
  "min_time_threshold_seconds": 300,
  "auto_update_docs": true,
  "capture_these_events": [
    "tool.execute.after",
    "session.error",
    "session.idle"
  ],
  "ignored_tools": ["read", "glob", "grep", "question"]
}
```

Options:
- `enabled`: Turn plugin on/off
- `min_time_threshold_seconds`: Alert on operations > this duration
- `auto_update_docs`: Automatically update AGENTS.md and TROUBLESHOOTING.md
- `capture_these_events`: Which events to listen to
- `ignored_tools`: Tools that don't trigger learning (quick ops)

## What Gets Updated

### AGENTS.md

New rules and guidelines are added to AGENTS.md under sections like:

- **Learned Lessons (Auto-Generated)**: Procedural rules discovered through experience
- **Known Issues & Solutions (Auto-Generated)**: Troubleshooting table for common problems
- **Platform-Specific Guidelines**: Windows, Linux, macOS workarounds

### RUN_REPORT.md

Learning sessions are logged in RUN_REPORT.md for project history:

```markdown
## Learning Session: 2026-01-21

**Goal:** Fix Windows character encoding issues

### Blockers Encountered
- [HIGH] 'charmap codec can't encode characters' (encoding)
  - Time spent: 120 minutes

### Workarounds Applied
- Use Node.js child_process instead of Python subprocess
  - Automation potential: high

### Lessons Learned
- Always use explicit UTF-8 encoding in subprocess calls
  - Applicability: platform_specific
```

## Examples

### Example 1: Documenting a Plugin Issue

```markdown
"I spent an hour trying to run the Ralph-loop plugin but it was using a local stub"

Learning Session:
- Goal: Run Ralph-loop plugin automatically
- Blocker: Local .opencode/plugins/ralph-loop.ts was a placeholder
- Solution: Found real plugin at global location and copied it
- Rule added: "Check global plugins when local is missing"
- Documentation: Updated AGENTS.md with plugin resolution strategy
```

### Example 2: Documenting a Windows-Specific Issue

```markdown
"Windows subprocess calls kept failing with encoding errors"

Learning Session:
- Goal: Run ruff check via subprocess
- Blocker: Windows cmd/bash uses CP1252 encoding, not UTF-8
- Solution: Use Node.js child_process with explicit UTF-8
- Rule added: "Always use encoding='utf-8' in Python subprocess"
- Automation: Created subprocess wrapper that enforces UTF-8
```

### Example 3: Documenting a Time Sink

```markdown
"Spent 2 hours debugging why PowerShell scripts wouldn't run"

Learning Session:
- Goal: Execute automation scripts
- Blocker: ThreatLocker + PowerShell Execution Policy blocking scripts
- Solution: Used Node.js runner instead
- Rule added: "Use Node.js for Windows automation, avoid .ps1 files"
```

## Integration with Other Skills

The Retrospective Learner works well with:

- **skill-name-creator**: When new patterns emerge, create new skills
- **skill-code-review**: When lessons relate to code quality
- **skill-documentation**: When documentation improvements are needed
- **skill-automation**: When high-automation-potential workarounds are found

## Best Practices

1. **Run after significant issues**: When you spend 5+ minutes on a problem, run the learning skill
2. **Be specific**: The more detail you provide, the better the documentation
3. **Suggest rules**: Propose specific rules to prevent recurrence
4. **Consider automation**: If you solved something manually, consider if it could be automated
5. **Review AGENTS.md**: Periodically review the learned lessons to see patterns

## File Structure

```
skill-retrospective-learner/
├── .opencode/
│   └── plugins/
│       └── skill-retrospective-learner.ts  # Main skill implementation
├── DESIGN.md                               # This design document
├── opencode.json                           # Skill permissions
├── README.md                               # This file
└── skill.json                              # Skill metadata
```

## Contributing

To improve this skill:

1. Review the DESIGN.md document for architecture decisions
2. Add new learning question templates for specific domains
3. Improve documentation generation logic
4. Add new hook triggers for different event types
5. Enhance automation suggestions

## License

Part of the OpenCode skill ecosystem. See OpenCode license for details.

---

*Part of the OpenCode skill-retrospective-learner package*
