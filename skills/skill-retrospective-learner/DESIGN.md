# Learning Loop System - Design Document

## Overview

Create an automated retrospective system that captures lessons learned, updates documentation, and improves future execution efficiency.

## ⚠️ Architecture Correction

**IMPORTANT:** OpenCode does NOT have a "hook" system in the traditional sense. Instead, it uses:

1. **Plugin Events** - Real-time event listening in plugins
2. **Skills** - Manual invocation via the `skill` tool

The learning system uses **BOTH**:
- **Plugin** (`retrospective-plugin.ts`) - Auto-captures failures via events
- **Skill** (`skill-retrospective-learner.ts`) - Manual learning sessions for complex issues

---

## How OpenCode Events Work

### Available Events (from OpenCode Docs)
Plugins can subscribe to these events:

| Category | Events |
|----------|--------|
| **Tool** | `tool.execute.before`, `tool.execute.after` |
| **Session** | `session.error`, `session.idle`, `session.created`, `session.compacted` |
| **File** | `file.edited`, `file.watcher.updated` |
| **Command** | `command.executed` |
| **Message** | `message.removed`, `message.updated` |

### Plugin Structure
```typescript
export const MyPlugin: Plugin = async (context) => {
  return {
    'tool.execute.after': async (input, output) => {
      // Handle event
    },
    'session.error': async (input, output) => {
      // Handle error
    }
  };
};
```

---

## Learning System Architecture

### Component 1: retrospective-plugin.ts (Automatic)

**Location:** `.opencode/plugins/retrospective-plugin.ts`

**Responsibilities:**
- Listen to `tool.execute.after` for failures
- Listen to `session.error` for critical errors
- Listen to `session.idle` for session completion
- Auto-update AGENTS.md with new rules
- Auto-update TROUBLESHOOTING.md with known issues
- Log lessons to RUN_REPORT.md

**Events Handled:**
```typescript
'tool.execute.after': Capture failed/slow tool executions
'session.error': Capture critical session errors  
'session.idle': Log all lessons from completed session
'file.edited': Detect manual workarounds (multiple edits)
```

### Component 2: skill-retrospective-learner (Manual)

**Location:** `~/.config/opencode/skills/skill-retrospective-learner/SKILL.md`

**Responsibilities:**
- Manual invocation for complex issues
- Ask detailed learning questions
- Generate new rules and guidelines
- Suggest automation improvements
- Update documentation manually

**Invocation:**
```markdown
"Run the learning skill"
"I want to document what I learned"
```

---

## Learning Data Flow

### Automatic Flow (Plugin)
```
Tool execution fails
    ↓
tool.execute.after event fires
    ↓
retrospective-plugin captures failure
    ↓
Analyzes error, generates rule
    ↓
Auto-updates AGENTS.md
Auto-updates TROUBLESHOOTING.md
    ↓
Session completes (session.idle)
    ↓
Logs all lessons to RUN_REPORT.md
```

### Manual Flow (Skill)
```
User invokes skill manually
    ↓
Skill asks learning questions
    ↓
User provides detailed answers
    ↓
Skill generates documentation updates
    ↓
User reviews and approves (optional)
    ↓
Updates AGENTS.md, TROUBLESHOOTING.md
```

---

## Plugin Implementation Details

### Event Handler: tool.execute.after

```typescript
'tool.execute.after': async (input, output) => {
  const { tool, args, duration_ms, exit_code } = output;
  
  // Skip quick operations
  if (duration_ms < 300000) return; // < 5 minutes
  
  // Check for failures
  if (exit_code !== 0) {
    const lesson = analyzeFailure(tool, exit_code, args);
    await applyLesson(lesson);
  }
}
```

### Error Pattern Detection

The plugin detects common patterns:

| Pattern | Insight | Rule Generated |
|---------|---------|----------------|
| `charmap codec can't encode` | Windows encoding issue | Use `encoding='utf-8'` in subprocess |
| `PermissionError: WinError 5` | Executable blocked | Use `python -m tool` instead |
| `ENOENT` not found | File/command missing | Verify before use |
| Operation > 5 min | Slow operation | Optimize or add progress |
| Multiple file edits | Manual workaround | Document workaround |

---

## Documentation Updates

### AGENTS.md Updates

The plugin adds to `## Learned Lessons` section:

```markdown
### Learned on 2026-01-21

1. **Always use encoding='utf-8' in Windows subprocess calls**
   - Location: Windows Execution Guidelines
   - Rationale: Default Windows encoding (CP1252) fails with Unicode
```

### TROUBLESHOOTING.md Updates

The plugin adds to troubleshooting table:

```markdown
| Issue | Solution | Category |
|-------|----------|----------|
| 'charmap codec can't encode' | Use encoding='utf-8' in subprocess | encoding |
```

### RUN_REPORT.md Updates

The plugin logs sessions:

```markdown
## Learning Session: 2026-01-21T10:30:00Z

**Lessons Learned:** 2

### Lesson 1
- **Insight:** Windows subprocess requires explicit UTF-8 encoding
- **Rule:** Always use encoding="utf-8" in subprocess calls on Windows
- **Automation Potential:** high
```

---

## Configuration

### Plugin Config (`.opencode/retrospective-config.json`)

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
  "ignored_tools": ["read", "glob", "grep", "question"],
  "severity_threshold": "medium"
}
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `enabled` | true | Turn plugin on/off |
| `min_time_threshold_seconds` | 300 | Alert on ops > this duration |
| `auto_update_docs` | true | Auto-update documentation |
| `capture_these_events` | All tool/session events | Which events to listen to |
| `ignored_tools` | read, glob, grep, question | Quick tools to ignore |

---

## Benefits of This System

### Immediate Benefits
1. **Zero friction** - Plugin runs automatically, no manual invocation
2. **Immediate capture** - Lessons logged right when issues occur
3. **Consistent updates** - AGENTS.md always reflects real experience
4. **No extra commands** - Just use OpenCode normally

### Long-term Benefits
1. **Self-improving** - Each failure makes future runs better
2. **Pattern detection** - Same issue tracked across sessions
3. **Documentation hygiene** - AGENTS.md stays current
4. **Knowledge retention** - Lessons survive session resets

---

## Installation

### 1. Install Plugin (Automatic Learning)
Copy to one of:
- Project: `.opencode/plugins/retrospective-plugin.ts`
- Global: `~/.config/opencode/plugins/retrospective-plugin.ts`

### 2. Install Skill (Manual Learning)
Copy to one of:
- Project: `.opencode/skills/skill-retrospective-learner/SKILL.md`
- Global: `~/.config/opencode/skills/skill-retrospective-learner/SKILL.md`

### 3. Configure (Optional)
Create `.opencode/retrospective-config.json` to customize behavior.

---

## Integration with Ralph-Loop

The learning system integrates with Ralph-loop:

1. **During PLAN/BUILD** - Plugin captures failures
2. **After each iteration** - Lessons logged to RUN_REPORT.md
3. **On completion** - AGENTS.md updated with all lessons
4. **Future runs** - Avoid documented issues

Example workflow:
```
Ralph iteration 1: subprocess fails with encoding error
  ↓ Plugin captures, adds rule to AGENTS.md
Ralph iteration 2: Uses rule, succeeds
  ↓ Session idle, all lessons logged
Ralph completes: AGENTS.md has new encoding guideline
```

---

## Comparison: Plugin vs Skill

| Aspect | Plugin (Automatic) | Skill (Manual) |
|--------|-------------------|----------------|
| Trigger | Event-based | User invocation |
| Questions | None (auto-detect) | Detailed Q&A |
| Speed | Instant | Takes time |
| Context | Limited (error msg) | Full (user provides) |
| Use for | Common patterns | Complex issues |
| Best for | Encoding, permissions | Architectural lessons |

**Recommendation:** Use plugin for 90% of cases, skill for complex multi-session issues.

---

## Future Enhancements

1. **Pattern recognition** - ML-based pattern detection across sessions
2. **Cross-project learning** - Share lessons between projects
3. **Predictive warnings** - Warn before known issues
4. **Auto-fix generation** - Generate fix scripts automatically
5. **Rule validation** - Verify rules work before adding

---

*This document is part of the skill-retrospective-learner skill package.*
*Architecture updated to match OpenCode's actual event system.*
