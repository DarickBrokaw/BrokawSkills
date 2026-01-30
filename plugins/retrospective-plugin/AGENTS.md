# Retrospective Plugin - Global Installation

This is the global installation of the Retrospective Learning Plugin for OpenCode.

## What This Plugin Does

Automatically captures lessons learned from failures and updates documentation:

- Listens to OpenCode events (`tool.execute.after`, `session.error`, etc.)
- Detects failure patterns (encoding, permissions, slow operations)
- Updates AGENTS.md with new rules automatically
- Updates TROUBLESHOOTING.md with known issues
- Logs learning sessions to RUN_REPORT.md

## Events Handled

- `tool.execute.after` - Capture failed/slow tool executions
- `session.error` - Capture critical session errors
- `session.idle` - Log completed sessions
- `file.edited` - Detect manual workarounds

## Detected Patterns

| Pattern | Example Error | Auto-Generated Rule |
|---------|---------------|---------------------|
| Encoding | `charmap codec can't encode` | Use `encoding='utf-8'` |
| Permission | `PermissionError: WinError 5` | Use `python -m tool` |
| Not Found | `ENOENT` file not found | Verify paths exist |
| Slow Op | >5 minutes operation | Add progress indicators |

## Configuration

Plugin configuration is loaded from:
- Project: `.opencode/retrospective-config.json`
- Global: `~/.config/opencode/retrospective-config.json`

### Configuration Options

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

## Installation

This plugin is installed globally at:
`%APPDATA%\opencode\plugins\retrospective-plugin\.opencode\plugins\retrospective-plugin.ts`

OpenCode automatically loads all plugins from:
- Global: `~/.config/opencode/plugins/*/.opencode/plugins/*.ts`
- Project: `.opencode/plugins/*.ts`

## Usage

Just use OpenCode normally! The plugin automatically:
- Watches for failures
- Captures lessons
- Updates documentation

For manual learning sessions, use the skill:
```
"Run the learning skill"
```

## File Structure

```
retrospective-plugin/
├── .opencode/
│   └── plugins/
│       └── retrospective-plugin.ts    # Main plugin
├── opencode.json                       # Plugin configuration
├── AGENTS.md                           # This file
└── README.md                           # Usage documentation
```

## Related Skills

- `skill-retrospective-learner` - Manual learning skill for complex issues
- Location: `~/.config/opencode/skills/retrospective-learner/SKILL.md`

## Troubleshooting

If the plugin is not loading:
1. Verify plugin file exists at correct path
2. Check OpenCode logs for plugin loading errors
3. Ensure no syntax errors in the TypeScript file
4. Restart OpenCode after making changes

## Version

- Plugin: 1.0.0
- Last Updated: 2026-01-21
