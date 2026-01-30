# Hook Configuration Template

This document provides template configurations for integrating `skill-retrospective-learner` with various trigger events.

## Basic Hook Setup

Add to your project's `opencode.json`:

```json
{
  "hooks": {
    "<trigger_name>": {
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "<category>",
        "severity": "<low|medium|high|critical>"
      }
    }
  }
}
```

---

## Common Trigger Templates

### 1. Subprocess Failure Trigger

```json
{
  "onSubprocessFailure": {
    "trigger": "subprocess_exit_code_nonzero",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "subprocess_error",
      "severity": "high",
      "capture_output": true,
      "suggest_encoding_fix": true
    }
  }
}
```

**Use when:** Any subprocess returns non-zero exit code

**Captures:** Error message, command that failed, exit code

---

### 2. Plugin Failure Trigger

```json
{
  "onPluginFailure": {
    "trigger": "plugin_returned_empty",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "plugin_error",
      "severity": "high",
      "check_global_first": true,
      "suggest_copy_from_global": true
    }
  }
}
```

**Use when:** A plugin returns `{}`, null, or empty response

**Captures:** Plugin name, return value, expected behavior

---

### 3. Test Failure Trigger

```json
{
  "onTestFailure": {
    "trigger": "pytest_failed",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "validation_error",
      "severity": "high",
      "include_test_output": true,
      "suggest_fix": true
    }
  }
}
```

**Use when:** `python -m pytest` returns non-zero

**Captures:** Test output, failed test names, error messages

---

### 4. Time Threshold Trigger

```json
{
  "onTimeThreshold": {
    "trigger": "task_exceeded_time_threshold",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "time_sink",
      "severity": "medium",
      "threshold_minutes": 15,
      "suggest_efficiency_improvement": true
    }
  }
}
```

**Use when:** A task takes longer than expected

**Captures:** Time spent, task description, bottlenecks

---

### 5. Encoding Error Trigger

```json
{
  "onEncodingError": {
    "trigger": "unicode_encoding_error",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "encoding_error",
      "severity": "high",
      "suggest_utf8_fix": true,
      "suggest_node_alternative": true
    }
  }
}
```

**Use when:** 'charmap codec can't encode/decode' errors

**Captures:** Encoding type, file involved, attempted solutions

---

### 6. Permission Error Trigger

```json
{
  "onPermissionError": {
    "trigger": "permission_denied_error",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "permission_error",
      "severity": "high",
      "suggest_module_invocation": true,
      "suggest_node_alternative": true
    }
  }
}
```

**Use when:** PermissionError or Access is denied

**Captures:** File/executable involved, user context, security software

---

### 7. Manual Workaround Trigger

```json
{
  "onManualWorkaround": {
    "trigger": "user_applied_fix",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "manual_intervention",
      "severity": "medium",
      "auto_document": true,
      "suggest_automation": true
    }
  }
}
```

**Use when:** User manually fixes something that should be automated

**Captures:** Manual steps applied, original problem, automation potential

---

### 8. Windows Platform Trigger

```json
{
  "onWindowsPlatform": {
    "trigger": "platform_windows_detected",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "platform_specific",
      "severity": "low",
      "apply_windows_guidelines": true,
      "document_workaround": true
    }
  }
}
```

**Use when:** Windows-specific platform detected

**Captures:** Platform details, Windows-specific issues, workarounds

---

## Complete Example Configuration

```json
{
  "$schema": "https://opencode.ai/schema.json",
  "name": "my-project",
  "version": "1.0.0",
  
  "skills": ["skill-retrospective-learner"],
  
  "hooks": {
    "onSubprocessFailure": {
      "trigger": "subprocess_exit_code_nonzero",
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "subprocess_error",
        "severity": "high"
      }
    },
    
    "onPluginFailure": {
      "trigger": "plugin_returned_empty",
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "plugin_error",
        "severity": "high",
        "check_global_first": true
      }
    },
    
    "onTestFailure": {
      "trigger": "pytest_failed",
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "validation_error",
        "severity": "high",
        "include_test_output": true
      }
    },
    
    "onTimeThreshold": {
      "trigger": "task_exceeded_time_threshold",
      "params": {
        "threshold_minutes": 10,
        "action": "run_skill_retrospective_learner",
        "failure_type": "time_sink",
        "severity": "medium"
      }
    },
    
    "onEncodingError": {
      "trigger": "unicode_encoding_error",
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "encoding_error",
        "severity": "high",
        "suggest_utf8_fix": true
      }
    },
    
    "onPermissionError": {
      "trigger": "permission_denied_error",
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "permission_error",
        "severity": "high",
        "suggest_module_invocation": true
      }
    },
    
    "onWindowsPlatform": {
      "trigger": "platform_windows_detected",
      "action": "run_skill_retrospective_learner",
      "params": {
        "failure_type": "platform_specific",
        "severity": "low",
        "apply_windows_guidelines": true
      }
    }
  },
  
  "skill-configurations": {
    "skill-retrospective-learner": {
      "learning_threshold_minutes": 5,
      "auto_update_docs": true,
      "ask_followup_questions": true,
      "create_automation_scripts": false,
      "update_agents_md": true,
      "update_run_report": true,
      "create_troubleshooting_entries": true,
      "trigger_on_these_categories": [
        "encoding",
        "permissions",
        "plugin",
        "platform",
        "documentation",
        "automation"
      ]
    }
  }
}
```

---

## Skill Configuration Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `learning_threshold_minutes` | number | 5 | Minimum time to trigger learning |
| `auto_update_docs` | boolean | true | Auto-update documentation |
| `ask_followup_questions` | boolean | true | Ask deeper questions |

### Documentation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `update_agents_md` | boolean | true | Update AGENTS.md |
| `update_run_report` | boolean | true | Update RUN_REPORT.md |
| `create_troubleshooting_entries` | boolean | true | Add to TROUBLESHOOTING.md |

### Automation Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `create_automation_scripts` | boolean | false | Auto-create automation |
| `suggest_automation` | boolean | true | Suggest automation potential |

### Category Filtering

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `trigger_on_these_categories` | array | all categories | Categories to trigger on |

Valid categories:
- `encoding`
- `permissions`
- `plugin`
- `platform`
- `documentation`
- `automation`
- `validation`
- `other`

---

## Custom Triggers

You can create custom triggers for project-specific events:

```json
{
  "onCustomEvent": {
    "trigger": "your_custom_trigger_name",
    "action": "run_skill_retrospective_learner",
    "params": {
      "failure_type": "custom",
      "severity": "medium",
      "custom_param": "value"
    }
  }
}
```

Custom triggers can be invoked from code:

```typescript
// In a plugin or script
context.hooks.trigger('onCustomEvent', {
  custom_param: 'value'
});
```

---

## Disabling Hooks

To disable specific hooks:

```json
{
  "hooks": {
    "onTimeThreshold": {
      "disabled": true
    }
  }
}
```

Or disable the skill entirely:

```json
{
  "skills": []
}
```

---

*These templates are part of the skill-retrospective-learner skill package.*
