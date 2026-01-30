/**
 * Skill: Retrospective Learner
 * 
 * Automated learning and retrospective system that captures lessons learned,
 * updates documentation, and improves future execution efficiency.
 * 
 * Usage:
 * - Manual: "Run the learning skill" or "I spent time on X, let's document it"
 * - Auto: Triggered by hooks on failures, workarounds, or significant time spent
 * 
 * The skill asks probing questions to extract insights, then updates
 * AGENTS.md, RUN_REPORT.md, and other documentation with new rules.
 */

import { Plugin, Project, ToolExecutionContext, BashResult } from 'opencode';
import * as fs from 'fs';
import * as path from 'path';

interface LearningSession {
  timestamp: string;
  goal: string;
  blockers: BlockerInfo[];
  workarounds: WorkaroundInfo[];
  lessons: LessonInfo[];
  rules: RuleInfo[];
  documentationUpdates: DocUpdateInfo[];
}

interface BlockerInfo {
  description: string;
  category: 'encoding' | 'permissions' | 'plugin' | 'platform' | 'documentation' | 'automation' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  discoveryMethod: 'error_message' | 'trial_and_error' | 'documentation_search' | 'user_knowledge';
  timeSpentMinutes: number;
}

interface WorkaroundInfo {
  solution: string;
  isPermanent: boolean;
  automationPotential: 'none' | 'low' | 'medium' | 'high';
  source: 'self_discovered' | 'documentation' | 'community' | 'ai_assistance';
}

interface LessonInfo {
  insight: string;
  applicability: 'project_specific' | 'platform_specific' | 'universal';
  priority: 'low' | 'medium' | 'high';
}

interface RuleInfo {
  rule: string;
  location: 'AGENTS.md' | 'README.md' | 'TROUBLESHOOTING.md' | 'opencode.json';
  section: string;
  rationale: string;
}

interface DocUpdateInfo {
  file: string;
  section: string;
  content: string;
  updateType: 'add' | 'replace' | 'append';
}

interface SkillConfig {
  learning_threshold_minutes: number;
  auto_update_docs: boolean;
  ask_followup_questions: boolean;
}

const DEFAULT_CONFIG: SkillConfig = {
  learning_threshold_minutes: 5,
  auto_update_docs: true,
  ask_followup_questions: true
};

export async function skillRetrospectiveLearner(context: ToolExecutionContext): Promise<void> {
  const { project, command } = context;
  
  // Parse configuration
  const config = parseConfig(context);
  
  // Check if this is a learning session trigger
  const triggerType = detectTrigger(command, context);
  
  if (!triggerType) {
    await sendResponse(project, "I didn't understand the learning trigger. Try: 'Run the learning skill' or 'I want to document what I learned'");
    return;
  }

  // Start learning session
  await sendResponse(project, "I'd love to help you capture what you learned! Let me ask some questions to extract the lessons.");
  
  // Collect learning information through questions
  const session = await conductLearningSession(project, triggerType, config);
  
  if (!session) {
    await sendResponse(project, "Learning session cancelled.");
    return;
  }
  
  // Generate documentation updates
  const docUpdates = generateDocumentationUpdates(session);
  
  // Apply updates if configured
  if (config.auto_update_docs) {
    await applyDocumentationUpdates(project, docUpdates);
    await sendResponse(project, `I've updated ${docUpdates.length} documentation section(s) with your lessons learned.`);
  } else {
    // Show proposed updates for review
    await showProposedUpdates(project, docUpdates);
  }
  
  // Create summary
  await createSessionSummary(project, session, docUpdates);
  
  // Suggest automation improvements
  if (session.workarounds.some(w => w.automationPotential === 'high')) {
    await suggestAutomation(project, session);
  }
  
  await sendResponse(project, "Learning session complete! Your insights are now documented for future reference.");
}

function detectTrigger(command: string | undefined, context: ToolExecutionContext): string | null {
  if (!command) return 'manual';
  
  const cmd = command.toLowerCase();
  
  // Manual triggers
  if (cmd.includes('learning') || cmd.includes('retrospective') || cmd.includes('document what')) {
    return 'manual';
  }
  
  // Failure triggers
  if (cmd.includes('failed') || cmd.includes('blocked') || cmd.includes('issue') || cmd.includes('error')) {
    return 'failure';
  }
  
  // Workaround triggers
  if (cmd.includes('workaround') || cmd.includes('fix') || cmd.includes('solved')) {
    return 'workaround';
  }
  
  // Time-based triggers
  if (cmd.includes('spent') || cmd.includes('took too long') || cmd.includes('hours')) {
    return 'time';
  }
  
  return 'manual';
}

async function conductLearningSession(
  project: Project, 
  triggerType: string, 
  config: SkillConfig
): Promise<LearningSession | null> {
  // This would normally involve asking questions to the user
  // For this implementation, we create a template session that can be filled in
  
  const session: LearningSession = {
    timestamp: new Date().toISOString(),
    goal: '', // Would be filled via questions
    blockers: [],
    workarounds: [],
    lessons: [],
    rules: [],
    documentationUpdates: []
  };
  
  // Question templates based on trigger type
  const questions = generateQuestions(triggerType);
  
  // In a full implementation, this would use the ask tool
  // For now, we return a template session structure
  return session;
}

function generateQuestions(triggerType: string): string[] {
  const baseQuestions = [
    "What was the goal you were trying to accomplish?",
    "What blocked or slowed you down?",
    "How did you discover the issue?",
    "What was the workaround or solution?",
    "Where should this be documented?",
    "What rule should we add to prevent this?",
    "Can this be automated?"
  ];
  
  const triggerQuestions: Record<string, string[]> = {
    'failure': [
      "What error message did you see?",
      "What was the first sign that something was wrong?",
      "How many attempts did it take to find a solution?"
    ],
    'workaround': [
      "What was the manual fix you applied?",
      "How long did it take to implement the workaround?",
      "Is this a permanent solution or temporary?"
    ],
    'time': [
      "What task took longer than expected?",
      "What was the unexpected complexity?",
      "What would have made this faster?"
    ],
    'manual': [
      "What would you like to document from this session?",
      "Is this related to a specific issue or a general lesson?"
    ]
  };
  
  return [...baseQuestions, ...(triggerQuestions[triggerType] || [])];
}

function parseConfig(context: ToolExecutionContext): SkillConfig {
  // In a full implementation, parse from context.configuration
  return DEFAULT_CONFIG;
}

async function sendResponse(project: Project, message: string): Promise<void> {
  console.log(`[RETROSPECTIVE-LEARNER] ${message}`);
}

function generateDocumentationUpdates(session: LearningSession): DocUpdateInfo[] {
  const updates: DocUpdateInfo[] = [];
  
  // Generate AGENTS.md updates for procedural rules
  if (session.rules.some(r => r.location === 'AGENTS.md')) {
    const agentRules = session.rules.filter(r => r.location === 'AGENTS.md');
    updates.push({
      file: 'AGENTS.md',
      section: '## Learned Lessons (Auto-Generated)',
      content: generateAgentRulesSection(agentRules),
      updateType: 'append'
    });
  }
  
  // Generate RUN_REPORT.md update
  updates.push({
    file: 'RUN_REPORT.md',
    section: '## Learning Session Results',
    content: generateLearningSessionSection(session),
    updateType: 'append'
  });
  
  // Generate troubleshooting updates
  const troubleshootingRules = session.blockers
    .filter(b => b.severity === 'high' || b.severity === 'critical')
    .map(b => ({
      issue: b.description,
      solution: session.workarounds.find(w => w.solution)?.solution || 'See above',
      category: b.category
    }));
  
  if (troubleshootingRules.length > 0) {
    updates.push({
      file: 'AGENTS.md',
      section: '## Known Issues & Solutions (Auto-Generated)',
      content: generateTroubleshootingSection(troubleshootingRules),
      updateType: 'append'
    });
  }
  
  return updates;
}

function generateAgentRulesSection(rules: RuleInfo[]): string {
  const timestamp = new Date().toISOString().split('T')[0];
  let content = `\n### Learned on ${timestamp}\n\n`;
  
  rules.forEach((rule, i) => {
    content += `${i + 1}. **${rule.rule}**\n`;
    content += `   - Location: ${rule.section}\n`;
    content += `   - Rationale: ${rule.rationale}\n\n`;
  });
  
  return content;
}

function generateLearningSessionSection(session: LearningSession): string {
  const timestamp = new Date().toISOString();
  
  let content = `\n---\n\n## Learning Session: ${timestamp}\n\n`;
  
  content += `**Goal:** ${session.goal || 'Not documented'}\n\n`;
  
  if (session.blockers.length > 0) {
    content += `### Blockers Encountered\n`;
    session.blockers.forEach(b => {
      content += `- [${b.severity.toUpperCase()}] ${b.description} (${b.category})\n`;
      content += `  - Time spent: ${b.timeSpentMinutes} minutes\n`;
    });
    content += '\n';
  }
  
  if (session.workarounds.length > 0) {
    content += `### Workarounds Applied\n`;
    session.workarounds.forEach(w => {
      content += `- ${w.solution}\n`;
      content += `  - Automation potential: ${w.automationPotential}\n`;
    });
    content += '\n';
  }
  
  if (session.lessons.length > 0) {
    content += `### Lessons Learned\n`;
    session.lessons.forEach(l => {
      content += `- ${l.insight}\n`;
      content += `  - Applicability: ${l.applicability}\n`;
    });
    content += '\n';
  }
  
  return content;
}

function generateTroubleshootingSection(issues: { issue: string; solution: string; category: string }[]): string {
  let content = `\n| Issue | Solution | Category |\n|-------|----------|----------|\n`;
  
  issues.forEach(i => {
    content += `| ${i.issue} | ${i.solution} | ${i.category} |\n`;
  });
  
  content += '\n';
  
  return content;
}

async function applyDocumentationUpdates(project: Project, updates: DocUpdateInfo[]): Promise<void> {
  const projectPath = project.directory.path;
  
  for (const update of updates) {
    const filePath = path.join(projectPath, update.file);
    
    try {
      if (!fs.existsSync(filePath)) {
        // Create new file if it doesn't exist
        fs.writeFileSync(filePath, `# ${update.file}\n\n${update.content}\n`);
        continue;
      }
      
      const existingContent = fs.readFileSync(filePath, 'utf-8');
      
      if (update.updateType === 'append') {
        fs.writeFileSync(filePath, existingContent + update.content);
      } else if (update.updateType === 'add') {
        fs.writeFileSync(filePath, update.content + '\n\n' + existingContent);
      } else if (update.updateType === 'replace') {
        // More complex replacement logic would go here
        fs.writeFileSync(filePath, existingContent + update.content);
      }
      
      console.log(`[RETROSPECTIVE-LEARNER] Updated ${update.file}`);
      
    } catch (error) {
      console.error(`[RETROSPECTIVE-LEARNER] Failed to update ${update.file}:`, error);
    }
  }
}

async function showProposedUpdates(project: Project, updates: DocUpdateInfo[]): Promise<void> {
  await sendResponse(project, "Here are the documentation updates I propose:\n");
  
  for (const update of updates) {
    await sendResponse(project, `\n### ${update.file} - ${update.section}`);
    await sendResponse(project, update.content);
  }
  
  await sendResponse(project, "\nWould you like me to apply these updates? (yes/no)");
}

async function createSessionSummary(
  project: Project, 
  session: LearningSession, 
  docUpdates: DocUpdateInfo[]
): Promise<void> {
  const summary = `
Learning Session Summary
========================
Timestamp: ${session.timestamp}
Blockers documented: ${session.blockers.length}
Workarounds captured: ${session.workarounds.length}
Lessons extracted: ${session.lessons.length}
Rules generated: ${session.rules.length}
Documentation updates: ${docUpdates.length}

The following have been updated:
${docUpdates.map(u => `- ${u.file} (${u.updateType})`).join('\n')}
  `.trim();
  
  console.log(`[RETROSPECTIVE-LEARNER] ${summary}`);
}

async function suggestAutomation(project: Project, session: LearningSession): Promise<void> {
  const automatableWorkarounds = session.workarounds
    .filter(w => w.automationPotential === 'high')
    .map(w => w.solution);
  
  if (automatableWorkarounds.length > 0) {
    await sendResponse(project, "\nI noticed some high-automation-potential workarounds:");
    automatableWorkarounds.forEach((w, i) => {
      console.log(`${i + 1}. ${w}`);
    });
    await sendResponse(project, "\nWould you like me to create automation scripts for these?");
  }
}

export default skillRetrospectiveLearner;
