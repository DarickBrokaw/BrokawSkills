# Retrospective Learning Plugin - Design Document

## Overview

The Retrospective Learning Plugin is an OpenCode plugin that automatically captures lessons learned from failures and continuously improves documentation. It listens to OpenCode events, detects error patterns, and generates preventive rules.

**Plugin File:** `retrospective-plugin.ts` (358 lines)  
**Plugin Type:** OpenCode Plugin (TypeScript)  
**Events Handled:** `tool.execute.after`, `session.error`, `session.idle`, `file.edited`

---

## Architecture

### Plugin Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    RetrospectivePlugin                       │
│                                                             │
│  export const RetrospectivePlugin: Plugin = async (ctx) =>  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Context: { project, client, directory, worktree } │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Config: Load from retrospective-config.json        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Event Handlers:                                     │    │
│  │  ├── tool.execute.after  → Capture failures         │    │
│  │  ├── session.error       → Log critical errors      │    │
│  │  ├── session.idle        → Log completed sessions   │    │
│  │  └── file.edited         → Detect workarounds       │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Lesson Processing:                                  │    │
│  │  ├── analyzeEvent()      → Detect error patterns    │    │
│  │  ├── applyLesson()       → Update documentation     │    │
│  │  └── logLessons()        → Log to RUN_REPORT.md     │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                     OpenCode Event System                         │
│                                                                  │
│  User runs tool (bash, read, edit, etc.)                         │
│         ↓                                                        │
│  Tool executes                                                   │
│         ↓                                                        │
│  OpenCode fires event: tool.execute.after                       │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  RetrospectivePlugin receives (input, output)             │    │
│  │                                                           │    │
│  │  input: { tool, args }                                    │    │
│  │  output: { tool, args, duration_ms, exit_code, error }   │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  analyzeEvent() - Pattern Detection                       │    │
│  │                                                           │    │
│  │  if error includes 'charmap' → encoding issue             │    │
│  │  if error includes 'PermissionError' → permission issue   │    │
│  │  if error includes 'ENOENT' → not found issue             │    │
│  │  if duration_ms > 300000 → slow operation                 │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  applyLesson() - Documentation Updates                    │    │
│  │                                                           │    │
│  │  updateAgentsMd() → Add rule to AGENTS.md                │    │
│  │  updateTroubleshootingMd() → Add to TROUBLESHOOTING.md   │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│         ↓                                                        │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Session completes (session.idle event)                   │    │
│  │                                                           │    │
│  │  logLessonsToRunReport() → Log all lessons to RUN_REPORT │    │
│  │                                                           │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Components

### 1. Plugin Entry Point

```typescript
export const RetrospectivePlugin: Plugin = async (context) => {
  const { project, client, directory, worktree } = context;
  const config = loadConfig(directory);
  
  if (!config.enabled) {
    return {};
  }
  
  const lessons: Lesson[] = [];
  
  return {
    'tool.execute.after': async (input, output) => { ... },
    'session.error': async (input, output) => { ... },
    'session.idle': async (input, output) => { ... },
    'file.edited': async (input, output) => { ... }
  };
};
```

**Responsibilities:**
- Initialize plugin context
- Load configuration
- Return event handlers
- Manage lessons collection

### 2. Event Handlers

#### tool.execute.after

**Trigger:** After any tool execution completes

**Input:** `input` contains tool name and arguments  
**Output:** `output` contains results, duration, exit code, error

**Logic:**
```typescript
'tool.execute.after': async (input, output) => {
  const { tool, duration_ms, exit_code, error } = output;
  
  // Skip quick operations
  if (duration_ms < 300000) return;
  
  // Check for failures or slow operations
  if (exit_code !== 0 || duration_ms > 300000) {
    const event = createFailureEvent(tool, exit_code, error, duration_ms);
    const lesson = analyzeEvent(event);
    
    if (lesson) {
      lessons.push(lesson);
      await applyLesson(lesson);
    }
  }
}
```

#### session.error

**Trigger:** When session encounters a critical error

**Logic:**
```typescript
'session.error': async (input, output) => {
  const { error, session_id } = output;
  const event = {
    type: 'session_error',
    error: String(error),
    session_id,
    timestamp: new Date().toISOString()
  };
  
  const lesson = analyzeEvent(event);
  if (lesson) {
    lessons.push(lesson);
    await applyLesson(lesson);
  }
}
```

#### session.idle

**Trigger:** When session completes (idle)

**Logic:**
```typescript
'session.idle': async (input, output) => {
  if (lessons.length > 0) {
    await logLessonsToRunReport(lessons, output.session_id);
  }
}
```

#### file.edited

**Trigger:** When files are modified

**Logic:**
```typescript
'file.edited': async (input, output) => {
  if (output.edit_count > 3) {
    // Multiple edits may indicate manual workaround
    const event = { type: 'manual_workaround', timestamp: new Date().toISOString() };
    const lesson = analyzeEvent(event);
    if (lesson) {
      lessons.push(lesson);
      await applyLesson(lesson);
    }
  }
}
```

### 3. Pattern Detection (analyzeEvent)

The plugin detects these error patterns:

```typescript
function analyzeEvent(event: FailureEvent): Lesson | null {
  // Encoding errors
  if (event.error?.includes('charmap') || event.error?.includes('encoding')) {
    return {
      insight: 'Windows subprocess requires explicit UTF-8 encoding',
      rule: 'Always use encoding="utf-8" in subprocess calls on Windows',
      automation_potential: 'high'
    };
  }
  
  // Permission errors
  if (event.error?.includes('PermissionError') || event.error?.includes('Access is denied')) {
    return {
      insight: 'Direct executables may be blocked by security software',
      rule: 'Use python -m <tool> instead of <tool>.exe on Windows',
      automation_potential: 'medium'
    };
  }
  
  // Not found errors
  if (event.error?.includes('ENOENT') || event.error?.includes('not found')) {
    return {
      insight: 'Command or file not found',
      rule: 'Verify commands and paths exist before calling them',
      automation_potential: 'none'
    };
  }
  
  // Slow operations
  if (event.duration_ms && event.duration_ms > 300000) {
    return {
      insight: `Tool execution took ${Math.round(event.duration_ms / 60000)} minutes`,
      rule: 'Consider optimizing long-running operations or adding progress indicators',
      automation_potential: 'medium'
    };
  }
  
  return null; // No pattern detected
}
```

### 4. Documentation Updates

#### updateAgentsMd()

Adds new rules to `## Learned Lessons` section:

```typescript
async function updateAgentsMd(directory: string, lesson: Lesson) {
  const agentsPath = path.join(directory, 'AGENTS.md');
  const content = fs.readFileSync(agentsPath, 'utf-8');
  
  // Check for duplicates
  if (content.includes(lesson.rule)) return;
  
  // Add new rule
  const entry = `\n### Learned on ${timestamp}\n\n${lesson.rule}\n`;
  
  // Find or create section
  const newContent = content.includes('## Learned Lessons')
    ? content.replace('## Learned Lessons', `## Learned Lessons${entry}`)
    : content + entry;
  
  fs.writeFileSync(agentsPath, newContent);
}
```

#### updateTroubleshootingMd()

Adds known issues to troubleshooting table:

```typescript
async function updateTroubleshootingMd(directory: string, lesson: Lesson) {
  const tsPath = path.join(directory, 'TROUBLESHOOTING.md');
  const entry = `| ${lesson.event.error?.substring(0, 80)} | ${lesson.rule} | ${lesson.event.type} |\n`;
  
  // Create or append to table
  // ...
}
```

#### logLessonsToRunReport()

Logs learning sessions to `RUN_REPORT.md`:

```typescript
async function logLessonsToRunReport(lessons: Lesson[], session_id?: string) {
  const reportPath = path.join(directory, 'RUN_REPORT.md');
  
  const log = `\n## Learning Session: ${timestamp}\n\n` +
    `**Lessons Learned:** ${lessons.length}\n\n` +
    lessons.map((l, i) => `### Lesson ${i + 1}\n- **Insight:** ${l.insight}\n- **Rule:** ${l.rule}\n`).join('\n');
  
  // Append to RUN_REPORT.md
}
```

---

## Configuration

### File Location

Project: `.opencode/retrospective-config.json`  
Global: `%APPDATA%\opencode\retrospective-config.json`

### Schema

```typescript
interface LearningConfig {
  enabled: boolean;                                    // default: true
  min_time_threshold_seconds: number;                  // default: 300
  auto_update_docs: boolean;                           // default: true
  capture_these_events: string[];                      // default: all events
  ignored_tools: string[];                             // default: read, glob, grep, question
  severity_threshold: 'low' | 'medium' | 'high';      // default: medium
}
```

### Example

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

---

## OpenCode Integration

### Event Types Used

Per https://opencode.ai/docs/plugins/:

| Event | Type | Used For |
|-------|------|----------|
| `tool.execute.after` | Tool Event | Capture failed/slow tool executions |
| `session.error` | Session Event | Log critical errors |
| `session.idle` | Session Event | Log completed sessions |
| `file.edited` | File Event | Detect manual workarounds |

### Plugin Loading

OpenCode loads plugins from:

1. **Global (authoritative):**
   ```
   %APPDATA%\opencode\plugins\*\.opencode\plugins\*.ts
   ```

2. **Project (fallback):**
   ```
   <project>\.opencode\plugins\*.ts
   ```

3. **npm packages:**
   ```json
   // opencode.json
   { "plugins": ["package-name"] }
   ```

### Hook Signature

All handlers follow the documented signature:

```typescript
async (input: any, output: any) => {
  // Handle event
}
```

---

## Error Handling

### Plugin Errors

If the plugin encounters an error:
1. Error is logged to console
2. Plugin returns gracefully
3. No crash affects OpenCode session

### Configuration Errors

If configuration is invalid:
1. Default values are used
2. Warning is logged
3. Plugin continues with defaults

---

## Performance Considerations

### Memory

- Lessons are stored in memory during session
- Memory usage: ~1KB per lesson
- Typically < 100 lessons per session

### I/O

- Documentation writes: Once per failure
- File operations: Minimal (< 10 per session)
- No impact on OpenCode performance

---

## Extensibility

### Adding New Patterns

To add a new error pattern, extend `analyzeEvent()`:

```typescript
function analyzeEvent(event: FailureEvent): Lesson | null {
  // Existing patterns...
  
  // NEW PATTERN
  if (event.error?.includes('your_pattern')) {
    return {
      insight: 'Your insight here',
      rule: 'Your preventive rule here',
      automation_potential: 'low' // or 'medium' or 'high'
    };
  }
  
  return null;
}
```

### Adding New Documentation Targets

To add a new documentation file, extend `applyLesson()`:

```typescript
async function applyLesson(context: any, lesson: Lesson) {
  // Existing updates...
  
  // NEW TARGET
  await updateNewDocFile(context.directory, lesson);
}
```

### Adding New Event Handlers

To listen to additional events:

```typescript
export const RetrospectivePlugin: Plugin = async (context) => {
  return {
    // Existing handlers...
    
    // NEW HANDLER
    'your.new.event': async (input, output) => {
      // Handle new event
    }
  };
};
```

---

## Testing

### Unit Tests

Test pattern detection:

```typescript
// Test encoding pattern
const encodingEvent = { error: 'charmap codec can\'t encode' };
const encodingLesson = analyzeEvent(encodingEvent);
assert(encodingLesson.rule.includes('encoding'));

// Test permission pattern
const permissionEvent = { error: 'PermissionError: WinError 5' };
const permissionLesson = analyzeEvent(permissionEvent);
assert(permissionLesson.rule.includes('python -m'));
```

### Integration Tests

1. Load plugin in OpenCode
2. Trigger a failure
3. Verify AGENTS.md is updated
4. Verify RUN_REPORT.md is updated

### Manual Tests

```bash
# Test 1: Encoding error
python -c "import subprocess; subprocess.run(['echo', 'test'], encoding='invalid')"

# Test 2: Permission error
.venv/Scripts/ruff.exe --version

# Test 3: Not found error
nonexistent_command_12345
```

---

## Future Enhancements

1. **Pattern ML** - ML-based pattern detection
2. **Cross-project learning** - Share lessons between projects
3. **Predictive warnings** - Warn before known issues
4. **Auto-fix generation** - Generate fix scripts automatically
5. **Rule validation** - Verify rules work before adding

---

## References

- OpenCode Plugin Docs: https://opencode.ai/docs/plugins/
- Event Types: https://opencode.ai/docs/plugins/#events
- Plugin Examples: https://opencode.ai/docs/plugins/#examples

---

*Design Document - Retrospective Learning Plugin v1.0.0*
