# Skill Usage Examples

This document contains examples of how to use the `skill-retrospective-learner` skill in various scenarios.

## Example 1: Documenting a Plugin Issue

### User Input
```
"I spent an hour trying to run the Ralph-loop plugin but it kept failing"
```

### Skill Response
```
I'd love to help you capture what you learned! Let me ask some questions to extract the lessons.

1. What was the goal you were trying to accomplish?
> Run the Ralph-loop plugin automatically

2. What blocked or slowed you down?
> The local .opencode/plugins/ralph-loop.ts was a placeholder stub that returned empty object

3. How did you discover the issue?
> I opened the file and saw it was only 7 lines with a comment saying "intentionally empty"

4. What was the workaround or solution?
> I found the real plugin at the global location: 
> C:\Users\darick\.config\opencode\plugins\ralph-loop\.opencode\plugins\ralph-loop.ts
> Then copied it to the local project

5. Where should this be documented?
> AGENTS.md under "Plugin Resolution Strategy"

6. What rule should we add to prevent this?
> "Always check global plugins when local is missing or stub"

7. Can this be automated?
> Yes - create a pre-flight check that compares local vs global plugin sizes

Great! I've documented your learning session and updated AGENTS.md with a new rule.
```

### Documentation Created

Added to `AGENTS.md`:
```markdown
### Learned on 2026-01-21

1. **Always check global plugins when local is missing or stub**
   - Location: Plugin Resolution Strategy
   - Rationale: Local placeholders waste time; global plugins are authoritative
```

Added to `TROUBLESHOOTING.md`:
```markdown
### Plugin is placeholder/stub

**Category:** plugin  
**Solution:** Copy from global plugin location

**Global Plugin Location:**
%APPDATA%\opencode\plugins\<plugin-name>\.opencode\plugins\<plugin-name>.ts
```

---

## Example 2: Documenting an Encoding Issue

### User Input
```
"Windows subprocess calls kept failing with 'charmap codec can't encode' errors for 2 hours"
```

### Skill Response
```
I'd love to help you capture what you learned! Let me ask some questions...

1. What was the goal?
> Run ruff check via subprocess to validate code

2. What blocked you?
> 'charmap codec can't encode characters in position 0-39'
> Tried Python subprocess, PowerShell, batch files - all failed

3. What was the workaround?
> Use Node.js child_process which handles UTF-8 better on Windows

4. Where to document?
> AGENTS.md under "Character Encoding"

5. What rule to add?
> "Always use explicit UTF-8 encoding in subprocess calls"

6. Can this be automated?
> Yes - create a subprocess wrapper that enforces UTF-8

Documentation updated! I've also created a suggestion for automation.
```

### Documentation Created

Added to `AGENTS.md`:
```markdown
### Character Encoding (Critical)
- **ALWAYS use explicit UTF-8 encoding** for file I/O and subprocess calls
- **For Python subprocess**, always specify encoding:
  ```python
  subprocess.run(cmd, encoding='utf-8', text=True)
  ```
- **If encoding issues persist**, use Node.js child_process instead of Python subprocess
```

Added to `TROUBLESHOOTING.md`:
```markdown
### 'charmap codec can't encode/decode'

**Solution:** Use explicit UTF-8 encoding

```python
subprocess.run(cmd, encoding='utf-8', text=True)
```
```

---

## Example 3: Documenting a Permission Issue

### User Input
```
"Ruff executable kept failing with PermissionError: [WinError 5] Access is denied"
```

### Skill Response
```
Let me capture this permission issue...

1. Goal: Run ruff linter
2. Blocker: PermissionError when running .venv\Scripts\ruff.exe
3. Solution: Use `python -m ruff` instead
4. Rule: "Use Python module invocation over direct executables"
5. Automation: Can create alias or wrapper script

Documentation updated!
```

### Documentation Created

Added to `AGENTS.md`:
```markdown
### Execution Workarounds
- **Use Python module invocation** over direct executables:
  - ✅ `python -m ruff` instead of `ruff.exe`
  - ✅ `python -m pytest` instead of pytest executable
```

Added to `TROUBLESHOOTING.md`:
```markdown
### PermissionError: [WinError 5] Access is denied

**Solution:** Use Python module invocation

```bash
python -m ruff check .
python -m pytest
```
```

---

## Example 4: Time-Based Learning

### User Input
```
"I spent 2 hours debugging why PowerShell scripts wouldn't run"
```

### Skill Response
```
That's a significant time investment! Let me document the learning...

1. Goal: Execute automation scripts
2. Blocker: ThreatLocker + PowerShell Execution Policy blocking scripts
3. Time spent: 120 minutes
4. Solution: Used Node.js runner instead
5. Rule: "Use Node.js for Windows automation, avoid .ps1 files"
6. Automation potential: High - created run_ralph_node.js

Documentation updated! This is now in the troubleshooting guide.
```

### Documentation Created

Added to `AGENTS.md` (PowerShell Barriers section):
```markdown
### PowerShell Barriers
- **PowerShell scripts will likely be blocked** by:
  - Execution Policy (Restricted by default)
  - ThreatLocker / security software
- **Safe alternatives**: Use Node.js runner for automation
```

Added to `TROUBLESHOOTING.md`:
```markdown
### PowerShell scripts blocked

**Solution:** Use Node.js runner

```bash
node run_ralph_node.js build 5
```
```

---

## Example 5: Automated Trigger

### Triggered by: pytest failure

### Skill Response
```
I noticed pytest failed. Would you like to run a learning session to document what happened?

Failure: tests/test_counter.py::test_cli_help_exists FAILED
Error: "CLI not implemented yet"

This looks like a plugin or implementation issue. Run "Run the learning skill" to document.
```

### Documentation Created (if user says yes)

Added to `RUN_REPORT.md`:
```markdown
## Learning Session: 2026-01-21

**Goal:** Fix failing pytest tests

### Blockers Encountered
- [HIGH] CLI not implemented (plugin)
  - Time spent: 5 minutes

### Workarounds Applied
- Implemented counter_fixture CLI with get, inc, run commands
  - Automation potential: none (one-time fix)

### Lessons Learned
- Tests fail fast when implementation is missing
- Should check implementation completeness before running tests
```

---

## Configuration Examples

### Minimal Configuration (auto-update enabled)

```json
{
  "skill-retrospective-learner": {
    "learning_threshold_minutes": 5,
    "auto_update_docs": true
  }
}
```

### Full Configuration (manual review required)

```json
{
  "skill-retrospective-learner": {
    "learning_threshold_minutes": 10,
    "auto_update_docs": false,
    "ask_followup_questions": true,
    "create_automation_scripts": true,
    "update_agents_md": true,
    "update_run_report": true,
    "create_troubleshooting_entries": true,
    "trigger_on_these_categories": [
      "encoding",
      "permissions",
      "plugin",
      "platform"
    ]
  }
}
```

---

## Integration with Hooks

### Example hook configuration in opencode.json

```json
{
  "hooks": {
    "onTaskFailure": {
      "action": "run_skill_retrospective_learner"
    },
    "onTimeThreshold": {
      "params": {
        "threshold_minutes": 15,
        "action": "run_skill_retrospective_learner"
      }
    }
  }
}
```

---

## Tips for Effective Learning Sessions

1. **Run early**: Don't wait until you've forgotten details
2. **Be specific**: Include error messages, file paths, commands
3. **Suggest rules**: Propose concrete rules to prevent recurrence
4. **Consider automation**: If you solved it manually, can it be automated?
5. **Review periodically**: Check AGENTS.md periodically to see patterns

---

*These examples are part of the skill-retrospective-learner skill package.*
