# Retrospective Learning Plugin

**Version:** 1.0.0  
**Author:** OpenCode Community  
**Location:** `%APPDATA%\opencode\plugins\retrospective-plugin\.opencode\plugins\retrospective-plugin.ts`  
**Events:** `tool.execute.after`, `session.error`, `session.idle`, `file.edited`

---

## What This Plugin Does

The Retrospective Learning Plugin automatically captures lessons learned from failures and continuously improves your OpenCode workflow by:

1. **Monitoring tool executions** for failures and slow operations
2. **Detecting error patterns** (encoding, permissions, file not found, etc.)
3. **Generating rules** to prevent future occurrences
4. **Auto-updating documentation** in AGENTS.md, TROUBLESHOOTING.md, and RUN_REPORT.md

## How It Works

```
Failure occurs → Event fires → Plugin captures → Rule generated → Docs updated
```

### Event Handlers

| Event | Trigger | Action |
|-------|---------|--------|
| `tool.execute.after` | Any tool completes | Capture failures and slow operations |
| `session.error` | Session encounters error | Log critical errors |
| `session.idle` | Session completes | Log all lessons learned |
| `file.edited` | Files are modified | Detect manual workarounds |

### Detected Patterns

The plugin recognizes these error patterns automatically:

| Pattern | Example Error | Generated Rule |
|---------|---------------|----------------|
| **Encoding** | `charmap codec can't encode` | Use `encoding='utf-8'` in subprocess |
| **Permission** | `PermissionError: WinError 5` | Use `python -m tool` instead of .exe |
| **Not Found** | `ENOENT` file not found | Verify paths before use |
| **Slow Op** | >5 minutes execution | Add progress indicators |
| **Manual Workaround** | Multiple file edits | Document the workaround |

## Installation

### Global Installation (Primary)
```
C:\Users\<user>\.config\opencode\plugins\retrospective-plugin\.opencode\plugins\retrospective-plugin.ts
```

OpenCode automatically loads all plugins from `%APPDATA%\opencode\plugins\*\.opencode\plugins\*.ts`.

### Local Installation (Testing)
For testing, copy to:
```
<project>\.opencode\plugins\retrospective-plugin.ts
```

## Configuration

Create `.opencode/retrospective-config.json` in your project:

```json
{
  "enabled": true,
  "min_time_threshold_seconds": 300,
  "auto_update_docs": true,
  "capture_these_events": [
    "tool.execute.after",
    "session.error",
    "session.idle",
    "file.edited"
  ],
  "ignored_tools": ["read", "glob", "grep", "question"]
}
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `true` | Turn plugin on/off |
| `min_time_threshold_seconds` | number | `300` | Alert on ops > this duration |
| `auto_update_docs` | boolean | `true` | Auto-update documentation |
| `capture_these_events` | array | All events | Which events to listen to |
| `ignored_tools` | array | Quick tools | Tools that don't trigger learning |

## Documentation Updates

### AGENTS.md
New rules are added to the `## Learned Lessons` section:

```markdown
## Learned Lessons

### Learned on 2026-01-21 (Auto-Generated)

1. **Always use encoding="utf-8" in subprocess calls on Windows**
   - Insight: Windows subprocess requires explicit UTF-8 encoding
   - Source: bash failure
   - Automation potential: high
```

### TROUBLESHOOTING.md
Known issues are added to the troubleshooting table:

```markdown
| Issue | Solution | Category |
|-------|----------|----------|
| charmap codec can't encode... | Use encoding="utf-8" | tool_failure |
```

### RUN_REPORT.md
Learning sessions are logged:

```markdown
## Learning Session: 2026-01-21T10:30:00Z

**Type:** Auto-captured from bash failure

### Lesson Learned
- **Insight:** Windows subprocess requires explicit UTF-8 encoding
- **Rule:** Always use encoding="utf-8" in subprocess calls on Windows
- **Automation Potential:** high

### Documentation Updates
- ✅ AGENTS.md: New rule added
- ✅ TROUBLESHOOTING.md: Known issue logged
```

## Usage

### Automatic Learning (Default)
Just use OpenCode normally! The plugin automatically:
- Watches for failures
- Captures lessons
- Updates documentation

### Manual Learning (Skill)
For complex issues, use the skill:
```
"Run the learning skill for complex multi-step issue"
```

Location: `~/.config/opencode/skills/retrospective-learner/SKILL.md`

## Testing

To test the plugin:

1. **Start OpenCode** with the plugin loaded
2. **Trigger a failure** (e.g., run an invalid command)
3. **Check AGENTS.md** for new rules
4. **Check RUN_REPORT.md** for learning session logs
5. **Check TROUBLESHOOTING.md** for known issues

### Test Commands

```bash
# Trigger an encoding error
python -c "import subprocess; subprocess.run(['echo', 'test'], encoding='invalid')"

# Trigger a permission error
.venv/Scripts/ruff.exe --version  # May be blocked

# Trigger a "not found" error
nonexistent_command_12345
```

## Architecture

See [DESIGN.md](DESIGN.md) for detailed architecture documentation.

## File Structure

```
retrospective-plugin/
├── .opencode/
│   └── plugins/
│       └── retrospective-plugin.ts    # Main plugin (358 lines)
├── DESIGN.md                          # Architecture documentation
├── README.md                          # This file
└── opencode.json                      # Plugin configuration
```

## Related Documentation

- **DESIGN.md** - Detailed architecture and design decisions
- **LEARNING_SYSTEM.md** - Complete learning system documentation (project-specific)
- **AGENTS.md** - Project-level documentation
- **OpenCode Docs:** https://opencode.ai/docs/plugins/

## Troubleshooting

### Plugin Not Loading
1. Verify plugin file exists at correct path
2. Check OpenCode logs for loading errors
3. Restart OpenCode after making changes
4. Verify no syntax errors in TypeScript

### No Rules Generated
1. Check `.opencode/retrospective-config.json` exists
2. Verify `enabled: true` in config
3. Ensure failures have exit_code !== 0
4. Check slow operations > 5 minutes

### Documentation Not Updated
1. Verify write permissions on AGENTS.md
2. Check file paths are correct
3. Look for errors in OpenCode logs
4. Verify `auto_update_docs: true` in config

## Version History

- **1.0.0** (2026-01-21) - Initial release
  - Automatic failure capture
  - Pattern detection for encoding, permissions, not found
  - Auto-updates AGENTS.md, TROUBLESHOOTING.md, RUN_REPORT.md
  - Session event handlers
  - File edit detection for workarounds

## License

Part of the OpenCode skill ecosystem. See OpenCode license for details.

---

*Part of the OpenCode retrospective learning system*
