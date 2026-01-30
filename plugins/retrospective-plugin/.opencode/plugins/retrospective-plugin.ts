/**
 * Plugin: Retrospective Learner
 * 
 * Automatically captures lessons learned from failures and updates documentation.
 * 
 * Events Listened To:
 * - tool.execute.after: Capture failed tool executions
 * - session.error: Capture session errors
 * - session.idle: Capture when session completes
 * 
 * Usage:
 * - Automatically triggers when failures occur
 * - Updates AGENTS.md with new rules
 * - Updates TROUBLESHOOTING.md with known issues
 * - Logs learning sessions to RUN_REPORT.md
 */

import type { Plugin } from '@opencode-ai/plugin';
import * as fs from 'fs';
import * as path from 'path';

interface LearningConfig {
  enabled: boolean;
  min_time_threshold_seconds: number;
  auto_update_docs: boolean;
  capture_these_events: string[];
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
}

interface FailureEvent {
  type: string;
  tool?: string;
  error?: string;
  exit_code?: number;
  timestamp: string;
  duration_ms?: number;
  session_id?: string;
}

interface Lesson {
  timestamp: string;
  event: FailureEvent;
  insight: string;
  rule: string;
  automation_potential: 'none' | 'low' | 'medium' | 'high';
}

const DEFAULT_CONFIG: LearningConfig = {
  enabled: true,
  min_time_threshold_seconds: 300, // 5 minutes
  auto_update_docs: true,
  capture_these_events: [
    'tool.execute.after',
    'session.error',
    'session.idle'
  ],
  severity_threshold: 'medium'
};

export const RetrospectivePlugin: Plugin = async (context) => {
  const { project, client, directory, worktree } = context;
  
  const config = loadConfig(directory);
  
  if (!config.enabled) {
    return {};
  }
  
  const lessons: Lesson[] = [];
  
  console.log('[RETROSPECTIVE-PLUGIN] Initialized - watching for failures and time sinks');
  
  return {
    /**
     * Capture tool execution results
     * Trigger learning session if tool failed or took too long
     */
    'tool.execute.after': async (input, output) => {
      const { tool, args, duration_ms, exit_code } = output;
      
      // Skip quick operations
      if (duration_ms && duration_ms < config.min_time_threshold_seconds * 1000) {
        return;
      }
      
      // Check for failures
      const failed = exit_code !== 0 && exit_code !== undefined;
      const slow = duration_ms && duration_ms > config.min_time_threshold_seconds * 1000;
      
      if (failed || slow) {
        const event: FailureEvent = {
          type: 'tool_failure',
          tool,
          exit_code,
          duration_ms,
          timestamp: new Date().toISOString()
        };
        
        const lesson = await analyzeEvent(context, event, config);
        if (lesson) {
          lessons.push(lesson);
          
          if (config.auto_update_docs) {
            await applyLesson(context, lesson);
          }
        }
      }
    },
    
    /**
     * Capture session errors
     * These are critical failures that need documentation
     */
    'session.error': async (input, output) => {
      const { error, session_id } = output;
      
      const event: FailureEvent = {
        type: 'session_error',
        error: String(error),
        session_id,
        timestamp: new Date().toISOString()
      };
      
      const lesson = await analyzeEvent(context, event, config);
      if (lesson) {
        lessons.push(lesson);
        
        if (config.auto_update_docs) {
          await applyLesson(context, lesson);
        }
      }
    },
    
    /**
     * Capture session completion
     * Log lessons learned from the session
     */
    'session.idle': async (input, output) => {
      const { session_id, status } = output;
      
      if (lessons.length > 0) {
        await logLessonsToRunReport(context, lessons, session_id);
        console.log(`[RETROSPECTIVE-PLUGIN] Logged ${lessons.length} lessons to RUN_REPORT.md`);
      }
    },
    
    /**
     * Capture file edits that might indicate workarounds
     */
    'file.edited': async (input, output) => {
      const { filePath, edit_count } = output;
      
      // Detect potential manual workarounds (multiple edits to same file)
      if (edit_count && edit_count > 3) {
        const event: FailureEvent = {
          type: 'manual_workaround',
          timestamp: new Date().toISOString()
        };
        
        const lesson = await analyzeEvent(context, event, config);
        if (lesson) {
          lessons.push(lesson);
          
          if (config.auto_update_docs) {
            await applyLesson(context, lesson);
          }
        }
      }
    }
  };
};

function loadConfig(directory: string): LearningConfig {
  const configPath = path.join(directory, '.opencode', 'retrospective-config.json');
  
  if (fs.existsSync(configPath)) {
    try {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      return { ...DEFAULT_CONFIG, ...config };
    } catch {
      return DEFAULT_CONFIG;
    }
  }
  
  return DEFAULT_CONFIG;
}

async function analyzeEvent(
  context: any,
  event: FailureEvent,
  config: LearningConfig
): Promise<Lesson | null> {
  const { directory } = context;
  
  // Analyze the event and generate insights
  let insight = '';
  let rule = '';
  let automation_potential: 'none' | 'low' | 'medium' | 'high' = 'low';
  
  if (event.type === 'tool_failure') {
    const { tool, exit_code, duration_ms } = event;
    
    if (exit_code !== 0 && exit_code !== undefined) {
      // Tool failed
      if (tool === 'bash' || tool === 'subprocess') {
        if (event.error?.includes('charmap') || event.error?.includes('encoding')) {
          insight = 'Windows subprocess requires explicit UTF-8 encoding';
          rule = 'Always use encoding="utf-8" in subprocess calls on Windows';
          automation_potential = 'high';
        } else if (event.error?.includes('PermissionError') || event.error?.includes('Access is denied')) {
          insight = 'Direct executables may be blocked by security software';
          rule = 'Use python -m <tool> instead of <tool>.exe on Windows';
          automation_potential = 'medium';
        } else if (event.error?.includes('ENOENT') || event.error?.includes('not found')) {
          insight = 'Command or file not found - check path and availability';
          rule = 'Verify commands exist before calling them';
          automation_potential = 'none';
        }
      } else if (tool === 'read') {
        if (event.error?.includes('Access is denied')) {
          insight = 'File permissions prevent reading';
          rule = 'Check file permissions and ACLs before read operations';
          automation_potential = 'low';
        }
      }
    } else if (duration_ms && duration_ms > 300000) {
      // Tool was slow (>5 minutes)
      insight = `Tool execution took ${Math.round(duration_ms / 60000)} minutes - may indicate inefficiency`;
      rule = 'Consider optimizing long-running operations or adding progress indicators';
      automation_potential = 'medium';
    }
  } else if (event.type === 'session_error') {
    insight = `Session error: ${event.error?.substring(0, 100)}`;
    rule = 'Handle session errors gracefully with proper error recovery';
    automation_potential = 'medium';
  } else if (event.type === 'manual_workaround') {
    insight = 'Multiple file edits detected - may indicate manual workaround';
    rule = 'Document workarounds for future reference';
    automation_potential = 'medium';
  }
  
  if (!insight) {
    return null; // No lesson to learn
  }
  
  return {
    timestamp: event.timestamp,
    event,
    insight,
    rule,
    automation_potential
  };
}

async function applyLesson(context: any, lesson: Lesson): Promise<void> {
  const { directory } = context;
  
  // Update AGENTS.md with new rule
  await updateAgentsMd(directory, lesson);
  
  // Update TROUBLESHOOTING.md with known issue
  await updateTroubleshootingMd(directory, lesson);
}

async function updateAgentsMd(directory: string, lesson: Lesson): Promise<void> {
  const agentsPath = path.join(directory, 'AGENTS.md');
  
  if (!fs.existsSync(agentsPath)) {
    return;
  }
  
  const timestamp = lesson.timestamp.split('T')[0];
  const ruleEntry = `\n### Learned on ${timestamp}\n\n${lesson.rule}\n`;
  
  const content = fs.readFileSync(agentsPath, 'utf-8');
  
  // Check if this rule already exists
  if (content.includes(lesson.rule)) {
    return;
  }
  
  // Find or create "Learned Lessons" section
  const learnedSection = content.includes('## Learned Lessons')
    ? '## Learned Lessons'
    : '## Troubleshooting\n## Learned Lessons';
  
  const updatedContent = content.includes(learnedSection)
    ? content.replace(learnedSection, `${learnedSection}${ruleEntry}`)
    : content + ruleEntry;
  
  fs.writeFileSync(agentsPath, updatedContent);
  console.log(`[RETROSPECTIVE-PLUGIN] Updated AGENTS.md with rule: ${lesson.rule.substring(0, 50)}...`);
}

async function updateTroubleshootingMd(directory: string, lesson: Lesson): Promise<void> {
  const tsPath = path.join(directory, 'TROUBLESHOOTING.md');
  
  // Create troubleshooting entry
  const issue = lesson.event.error?.substring(0, 80) || lesson.event.type;
  const entry = `\n| ${issue} | ${lesson.rule} | ${lesson.event.type} |\n`;
  
  if (fs.existsSync(tsPath)) {
    const content = fs.readFileSync(tsPath, 'utf-8');
    
    // Check if this issue already exists
    if (content.includes(issue)) {
      return;
    }
    
    // Append to troubleshooting table
    const updatedContent = content.includes('| Issue |')
      ? content.replace('| Issue |', `| ${issue} |`)
      : content + entry;
    
    fs.writeFileSync(tsPath, updatedContent);
  } else {
    // Create new troubleshooting file
    const header = `# Troubleshooting Guide (Auto-Generated)\n\n| Issue | Solution | Category |\n|-------|----------|----------|\n`;
    fs.writeFileSync(tsPath, header + entry);
  }
  
  console.log(`[RETROSPECTIVE-PLUGIN] Updated TROUBLESHOOTING.md with issue`);
}

async function logLessonsToRunReport(
  context: any,
  lessons: Lesson[],
  session_id?: string
): Promise<void> {
  const { directory } = context;
  const reportPath = path.join(directory, 'RUN_REPORT.md');
  
  const timestamp = new Date().toISOString();
  let logEntry = `\n---\n\n## Learning Session: ${timestamp}\n`;
  
  if (session_id) {
    logEntry += `**Session:** ${session_id}\n`;
  }
  
  logEntry += `**Lessons Learned:** ${lessons.length}\n\n`;
  
  lessons.forEach((lesson, i) => {
    logEntry += `### Lesson ${i + 1}\n`;
    logEntry += `- **Insight:** ${lesson.insight}\n`;
    logEntry += `- **Rule:** ${lesson.rule}\n`;
    logEntry += `- **Automation Potential:** ${lesson.automation_potential}\n\n`;
  });
  
  if (fs.existsSync(reportPath)) {
    const content = fs.readFileSync(reportPath, 'utf-8');
    fs.writeFileSync(reportPath, content + logEntry);
  } else {
    fs.writeFileSync(reportPath, `# RUN_REPORT.md\n\n${logEntry}`);
  }
}

export default RetrospectivePlugin;
