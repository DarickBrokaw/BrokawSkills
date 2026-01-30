import { Plugin, Project, Directory, Client, ToolExecutionContext } from 'opencode';
import * as fs from 'fs';
import * as path from 'path';

interface RalphLoopState {
  schemaVersion: number;
  active: boolean;
  startedAt: string;
  lastIterationAt: string;
  iteration: number;
  maxIterations: number;
  maxRuntimeMinutes: number;
  prompt: {
    mode: 'inline' | 'file';
    value: string;
    additionalInputs?: string[];
  };
  completionPromise: string;
  session: {
    strategy: 'fresh_per_iteration';
    lastSessionId?: string;
  };
  safety: {
    noChangeLimit: number;
    repeatErrorLimit: number;
    requireCleanGitStart: boolean;
  };
  stopReason: string | null;
  lastSummary: string;
  noProgressCount: number;
  consecutiveErrorCount: number;
  lastErrorFingerprint: string | null;
}

interface RalphHistoryEntry {
  iteration: number;
  startedAt: string;
  endedAt: string;
  result: 'continue' | 'done' | 'stopped' | 'error';
  stopReason: string | null;
  changedFiles: string[];
  errorFingerprint: string | null;
  notes: string;
  testResults?: string;
  lintResults?: string;
}

const STATE_FILE = '.opencode/ralph-loop.state.json';
const HISTORY_FILE = '.opencode/ralph-history.json';
const CONTEXT_FILE = '.opencode/ralph-context.md';
const IMPLEMENTATION_PLAN_FILE = 'IMPLEMENTATION_PLAN.md';

function getStateFilePath(project: Project): string {
  return path.join(project.directory.path, STATE_FILE);
}

function getHistoryFilePath(project: Project): string {
  return path.join(project.directory.path, HISTORY_FILE);
}

function getContextFilePath(project: Project): string {
  return path.join(project.directory.path, CONTEXT_FILE);
}

function getImplementationPlanPath(project: Project): string {
  return path.join(project.directory.path, IMPLEMENTATION_PLAN_FILE);
}

function readImplementationPlan(project: Project): string {
  try {
    const planPath = getImplementationPlanPath(project);
    if (fs.existsSync(planPath)) {
      return fs.readFileSync(planPath, 'utf-8');
    }
  } catch (error) {
    console.error('Error reading IMPLEMENTATION_PLAN.md:', error);
  }
  return '';
}

function writeImplementationPlan(project: Project, content: string): void {
  try {
    const planPath = getImplementationPlanPath(project);
    fs.writeFileSync(planPath, content);
  } catch (error) {
    console.error('Error writing IMPLEMENTATION_PLAN.md:', error);
  }
}

function readState(project: Project): RalphLoopState | null {
  try {
    const statePath = getStateFilePath(project);
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading state file:', error);
  }
  return null;
}

function writeState(project: Project, state: RalphLoopState): void {
  try {
    const statePath = getStateFilePath(project);
    const tempPath = statePath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(state, null, 2));
    fs.renameSync(tempPath, statePath);
  } catch (error) {
    console.error('Error writing state file:', error);
    throw error;
  }
}

function readHistory(project: Project): RalphHistoryEntry[] {
  try {
    const historyPath = getHistoryFilePath(project);
    if (fs.existsSync(historyPath)) {
      const content = fs.readFileSync(historyPath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading history file:', error);
  }
  return [];
}

function writeHistory(project: Project, history: RalphHistoryEntry[]): void {
  try {
    const historyPath = getHistoryFilePath(project);
    const tempPath = historyPath + '.tmp';
    fs.writeFileSync(tempPath, JSON.stringify(history, null, 2));
    fs.renameSync(tempPath, historyPath);
  } catch (error) {
    console.error('Error writing history file:', error);
    throw error;
  }
}

function readContext(project: Project): string {
  try {
    const contextPath = getContextFilePath(project);
    if (fs.existsSync(contextPath)) {
      return fs.readFileSync(contextPath, 'utf-8');
    }
  } catch (error) {
    console.error('Error reading context file:', error);
  }
  return '';
}

function writeContext(project: Project, context: string): void {
  try {
    const contextPath = getContextFilePath(project);
    fs.writeFileSync(contextPath, context);
  } catch (error) {
    console.error('Error writing context file:', error);
    throw error;
  }
}

function updateCarryoverContext(
  iterationResult: Awaited<ReturnType<typeof runIteration>>,
  previousContext: string,
  iteration: number
): string {
  const lines: string[] = [];
  
  lines.push('CURRENT_STATE:');
  if (iterationResult.completionTokenFound) {
    lines.push('- Completion token found, loop will stop');
  } else if (iterationResult.success) {
    lines.push('- Iteration completed successfully');
    if (iterationResult.changedFiles.length > 0) {
      lines.push(`- Changed files: ${iterationResult.changedFiles.join(', ')}`);
    } else {
      lines.push('- No files changed this iteration');
    }
  } else {
    lines.push('- Iteration failed with error');
  }
  lines.push('');
  
  lines.push('LAST_CHANGE:');
  if (iterationResult.changedFiles.length > 0) {
    lines.push(`- Files changed: ${iterationResult.changedFiles.join(', ')}`);
  } else if (!iterationResult.success) {
    lines.push(`- Error: ${iterationResult.notes.substring(0, 100)}`);
  } else {
    lines.push('- No changes made');
  }
  lines.push('');
  
  lines.push('LAST_RESULT:');
  if (iterationResult.success) {
    lines.push('- Iteration completed without errors');
  } else {
    lines.push(`- FAILED: ${iterationResult.notes.substring(0, 100)}`);
  }
  lines.push('');
  
  lines.push('NEXT_STEP:');
  if (iterationResult.completionTokenFound) {
    lines.push('- Loop complete, no further action needed');
  } else {
    lines.push('- Continue with next iteration');
  }
  lines.push('');
  
  lines.push('BLOCKERS:');
  if (!iterationResult.success && iterationResult.errorFingerprint) {
    lines.push(`- Error fingerprint: ${iterationResult.errorFingerprint}`);
  } else {
    lines.push('- None');
  }
  
  return lines.join('\n');
}

function extractChangedFilesFromResponse(response: string): string[] {
  const changedFiles: string[] = [];
  
  const patterns = [
    /(?:modified|changed|updated|created|edits? to|changes? to)\s+([a-zA-Z0-9_/.-]+\.[a-zA-Z0-9]+)/gi,
    /(?:file|files|path|paths):\s*([a-zA-Z0-9_/.-]+\.[a-zA-Z0-9]+)/gi,
    /([a-zA-Z0-9_/.-]+\/[a-zA-Z0-9_.-]+\.[a-zA-Z0-9]+)/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(response)) !== null) {
      const filePath = match[1];
      if (!changedFiles.includes(filePath) && !filePath.includes('..')) {
        changedFiles.push(filePath);
      }
    }
  }
  
  return changedFiles;
}

function extractTestResultsFromResponse(response: string): string | undefined {
  // Look for test results patterns
  // Pattern 1: RAN_COMMANDS section from system prompt
  const ranCommandsMatch = /RAN_COMMANDS:[\s\S]*?(?=\n\w+:|$)/.exec(response);
  if (ranCommandsMatch) {
    return ranCommandsMatch[0].trim();
  }
  
  // Pattern 2: Explicit test summary
  const testSummaryMatch = /(?:Tests|Test Results|Validation):\s*(Pass|Fail|Passed|Failed|[\d]+ passed)/i.exec(response);
  if (testSummaryMatch) {
    return testSummaryMatch[0];
  }
  
  return undefined;
}

function extractLintResultsFromResponse(response: string): string | undefined {
  // Pattern 1: RAN_COMMANDS (handled by test results usually, but check for lint keywords)
  if (response.includes('lint') || response.includes('eslint') || response.includes('tsc')) {
    const lines = response.split('\n');
    const lintLine = lines.find(l => /lint|eslint|tsc/.test(l) && /(pass|fail)/i.test(l));
    if (lintLine) return lintLine.trim();
  }
  return undefined;
}

function parseArgs(args: string[]): Record<string, string> {
  const result: Record<string, string> = {};
  let i = 0;
  while (i < args.length) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      if (i + 1 < args.length && !args[i + 1].startsWith('--')) {
        result[key] = args[i + 1];
        i += 2;
      } else {
        result[key] = 'true';
        i += 1;
      }
    } else if (args[i].startsWith('-')) {
      const key = args[i].substring(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        result[key] = args[i + 1];
        i += 2;
      } else {
        result[key] = 'true';
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return result;
}

function parseCommand(input: string): { command: string; args: string[] } {
  const parts = input.trim().split(/\s+/);
  return {
    command: parts[0].toLowerCase(),
    args: parts.slice(1)
  };
}

function createInitialState(args: Record<string, string>, project: Project): RalphLoopState {
  const promptMode = args['prompt-file'] ? 'file' : 'inline';
  const promptValue = args['prompt-file'] || args['prompt'] || 'PROMPT.md';
  const completionPromise = args['completion'] || 'DONE';
  const maxIterations = parseInt(args['max-iterations'] || '25', 10);
  const maxRuntimeMinutes = parseInt(args['max-runtime-minutes'] || '240', 10);
  const noChangeLimit = parseInt(args['no-change-limit'] || '3', 10);
  const repeatErrorLimit = parseInt(args['repeat-error-limit'] || '3', 10);
  const requireCleanGitStart = args['require-clean-git-start'] !== 'false';
  
  const additionalInputs: string[] = [];
  if (args['additional-inputs']) {
    additionalInputs.push(...args['additional-inputs'].split(',').map(s => s.trim()));
  } else {
    // Default optional files to look for
    if (fs.existsSync(path.join(project.directory.path, 'progress.md'))) additionalInputs.push('progress.md');
    if (fs.existsSync(path.join(project.directory.path, 'prd.json'))) additionalInputs.push('prd.json');
  }

  return {
    schemaVersion: 1,
    active: true,
    startedAt: new Date().toISOString(),
    lastIterationAt: new Date().toISOString(),
    iteration: 0,
    maxIterations,
    maxRuntimeMinutes,
    prompt: {
      mode: promptMode,
      value: promptValue,
      additionalInputs
    },
    completionPromise,
    session: {
      strategy: 'fresh_per_iteration'
    },
    safety: {
      noChangeLimit,
      repeatErrorLimit,
      requireCleanGitStart
    },
    stopReason: null,
    lastSummary: 'Loop initialized',
    noProgressCount: 0,
    consecutiveErrorCount: 0,
    lastErrorFingerprint: null
  };
}

async function runIteration(
  project: Project,
  client: Client,
  state: RalphLoopState
): Promise<{ success: boolean; changedFiles: string[]; completionTokenFound: boolean; errorFingerprint: string | null; notes: string }> {
  try {
    const iteration = state.iteration + 1;
    console.log(`Iteration ${iteration}/${state.maxIterations} started`);

    let promptText = '';
    if (state.prompt.mode === 'file') {
      const promptPath = path.join(project.directory.path, state.prompt.value);
      if (fs.existsSync(promptPath)) {
        promptText = fs.readFileSync(promptPath, 'utf-8');
      } else {
        throw new Error(`Prompt file not found: ${promptPath}`);
      }
    } else {
      promptText = state.prompt.value;
    }

    const context = readContext(project);
    if (context) {
      promptText = `Previous context:\n${context}\n\n${promptText}`;
    }

    // Read IMPLEMENTATION_PLAN.md per Ralph Playbook
    const implementationPlan = readImplementationPlan(project);
    if (implementationPlan) {
      promptText = `@IMPLEMENTATION_PLAN.md:\n${implementationPlan}\n\n${promptText}`;
    }

    if (state.prompt.additionalInputs && state.prompt.additionalInputs.length > 0) {
      for (const inputPath of state.prompt.additionalInputs) {
        try {
          const fullPath = path.join(project.directory.path, inputPath);
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            promptText = `\n\n--- Content of ${inputPath} ---\n${content}\n--- End of ${inputPath} ---\n\n${promptText}`;
          }
        } catch (err) {
          console.error(`Failed to read additional input: ${inputPath}`, err);
        }
      }
    }

    const session = await client.session.create();
    state.session.lastSessionId = session.id;

    await client.session.prompt(session, promptText);

    let completionTokenFound = false;
    let assistantResponse = '';

    try {
      const messages = await client.session.messages(session);
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'assistant') {
        assistantResponse = lastMessage.content || '';
        if (assistantResponse.includes(state.completionPromise)) {
          completionTokenFound = true;
        }
      }
    } catch (error) {
      console.log('Could not retrieve session messages');
    }

    try {
      await client.session.delete(session);
    } catch (error) {
      console.log('Session cleanup failed');
    }

    const changedFiles = extractChangedFilesFromResponse(assistantResponse);
    const testResults = extractTestResultsFromResponse(assistantResponse);
    const lintResults = extractLintResultsFromResponse(assistantResponse);
    
    let errorFingerprint: string | null = null;
    let notes = assistantResponse.substring(0, 200);

    if (completionTokenFound) {
      notes = 'Completion token found: ' + state.completionPromise;
    }

    console.log(`Iteration ${iteration} completed: ${notes}`);

    return {
      success: true,
      changedFiles,
      completionTokenFound,
      errorFingerprint,
      notes,
      testResults,
      lintResults
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const crypto = require('crypto');
    errorFingerprint = crypto.createHash('md5').update(errorMessage).digest('hex');
    console.error(`Iteration failed: ${errorMessage}`);
    return {
      success: false,
      changedFiles: [],
      completionTokenFound: false,
      errorFingerprint,
      notes: errorMessage
    };
  }
}

function checkStopConditions(state: RalphLoopState, iterationResult: ReturnType<typeof runIteration>): string | null {
  if (iterationResult.completionTokenFound) {
    return 'completion_promise';
  }

  if (state.iteration >= state.maxIterations) {
    return 'max_iterations';
  }

  const startedAt = new Date(state.startedAt);
  const now = new Date();
  const runtimeMinutes = (now.getTime() - startedAt.getTime()) / 60000;
  if (runtimeMinutes >= state.maxRuntimeMinutes) {
    return 'max_runtime';
  }

  if (iterationResult.errorFingerprint) {
    if (iterationResult.errorFingerprint === state.lastErrorFingerprint) {
      state.consecutiveErrorCount += 1;
    } else {
      state.consecutiveErrorCount = 1;
      state.lastErrorFingerprint = iterationResult.errorFingerprint;
    }
    
    if (state.consecutiveErrorCount >= state.safety.repeatErrorLimit) {
      return 'repeated_error';
    }

    // Check for permission blocked keywords in error
    if (/(?:permission|access)\s*(?:denied|blocked|refused)/i.test(iterationResult.notes) ||
        /BLOCKED/.test(iterationResult.notes)) {
        // If we see permission issues even once or twice, it might be a hard stop, 
        // but let's piggyback on the repeat limit or be stricter.
        // For now, treat as repeated error if it happens twice consecutively
        if (state.consecutiveErrorCount >= 2) {
            return 'permission_blocked';
        }
    }
  } else if (iterationResult.success) {
    state.consecutiveErrorCount = 0;
    state.lastErrorFingerprint = null;
  }

  if (iterationResult.changedFiles.length === 0 && iterationResult.success) {
    state.noProgressCount += 1;
    if (state.noProgressCount >= state.safety.noChangeLimit) {
      return 'no_progress';
    }
  } else if (iterationResult.changedFiles.length > 0) {
    state.noProgressCount = 0;
  }

  return null;
}

function checkKillSwitch(project: Project): boolean {
  try {
    const statePath = getStateFilePath(project);
    if (fs.existsSync(statePath)) {
      const content = fs.readFileSync(statePath, 'utf-8');
      const state = JSON.parse(content);
      return state.active === false;
    }
  } catch (error) {
    console.error('Error checking kill switch:', error);
  }
  return false;
}

function checkGitStatus(project: Project): { clean: boolean; changes: string[] } {
  try {
    const projectDir = project.directory.path;
    const gitPath = path.join(projectDir, '.git');
    
    if (!fs.existsSync(gitPath)) {
      return { clean: true, changes: [] };
    }
    
    const { execSync } = require('child_process');
    
    const changes = execSync('git status --porcelain', { 
      encoding: 'utf-8',
      cwd: projectDir 
    });
    
    const changedFiles = changes
      .trim()
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => line.substring(3).trim());
    
    return { 
      clean: changedFiles.length === 0, 
      changes: changedFiles 
    };
  } catch (error) {
    return { clean: true, changes: [] };
  }
}

async function runOrchestrator(project: Project, client: Client): Promise<void> {
  const state = readState(project);
  if (!state) {
    console.error('No state found. Use /ralph-loop to start a loop.');
    return;
  }

  if (state.safety.requireCleanGitStart) {
    const { clean, changes } = checkGitStatus(project);
    if (!clean) {
      state.active = false;
      state.stopReason = 'dirty_git';
      writeState(project, state);
      console.log('Loop stopped: git repository has uncommitted changes');
      console.log('Changes:', changes.join(', '));
      return;
    }
  }

  if (!state.active) {
    console.log('Loop is not active. Use /ralph-resume to resume.');
    return;
  }

  console.log('Starting Ralph loop orchestrator...');

  while (state.active) {
    if (checkKillSwitch(project)) {
      state.active = false;
      state.stopReason = 'kill_switch';
      writeState(project, state);
      console.log('Loop stopped: kill switch activated');
      break;
    }

    const stopReason = checkStopConditions(state, { completionTokenFound: false } as ReturnType<typeof runIteration>);
    if (stopReason) {
      state.stopReason = stopReason;
      state.active = false;
      writeState(project, state);
      console.log(`Loop stopped: ${stopReason}`);
      break;
    }

    state.iteration += 1;
    state.lastIterationAt = new Date().toISOString();
    writeState(project, state);

    const iterationResult = await runIteration(project, client, state);

    const history = readHistory(project);
    history.push({
      iteration: state.iteration,
      startedAt: state.lastIterationAt,
      endedAt: new Date().toISOString(),
      result: iterationResult.completionTokenFound ? 'done' : (iterationResult.success ? 'continue' : 'error'),
      stopReason: null,
      changedFiles: iterationResult.changedFiles,
      errorFingerprint: iterationResult.errorFingerprint,
      notes: iterationResult.notes
    });
    writeHistory(project, history);

    const previousContext = readContext(project);
    const newContext = updateCarryoverContext(
      iterationResult,
      previousContext,
      state.iteration
    );
    writeContext(project, newContext);

    const newStopReason = checkStopConditions(state, iterationResult);
    if (newStopReason) {
      state.stopReason = newStopReason;
      state.active = false;
      writeState(project, state);
      console.log(`Loop stopped: ${newStopReason}`);
      break;
    }

    if (!iterationResult.success) {
      state.stopReason = 'iteration_error';
      state.active = false;
      writeState(project, state);
      console.log('Loop stopped due to iteration error');
      break;
    }

    // Git push per Ralph Playbook
    try {
      const { execSync } = require('child_process');
      execSync('git add -A && git commit -m "Ralph iteration ' + state.iteration + '" && git push', {
        cwd: project.directory.path
      });
      console.log('Changes committed and pushed');
    } catch (error) {
      console.log('Git push skipped (no changes or push issue)');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

export async function ralphLoopPlugin(context: ToolExecutionContext): Promise<void> {
  const { project, client, command } = context;

  if (!command) {
    return;
  }

  const { command: cmd, args } = parseCommand(command);
  const parsedArgs = parseArgs(args);

  switch (cmd) {
    case '/ralph-loop':
    case 'ralph-loop':
      const existingState = readState(project);
      if (existingState && existingState.active) {
        console.log('Loop is already active. Use /ralph-status to check status.');
        return;
      }
      const initialState = createInitialState(parsedArgs, project);
      writeState(project, initialState);
      console.log('Ralph loop started. Initializing orchestrator...');
      await runOrchestrator(project, client);
      break;

    case '/ralph-stop':
    case 'ralph-stop':
      const stopState = readState(project);
      if (stopState) {
        stopState.active = false;
        stopState.stopReason = 'user_stop';
        writeState(project, stopState);
        console.log('Loop stop requested.');
      } else {
        console.log('No active loop found.');
      }
      break;

    case '/ralph-status':
    case 'ralph-status':
      const statusState = readState(project);
      if (statusState) {
        console.log(`Status: ${statusState.active ? 'Active' : 'Stopped'}`);
        console.log(`Iteration: ${statusState.iteration}/${statusState.maxIterations}`);
        console.log(`Started: ${statusState.startedAt}`);
        console.log(`Last iteration: ${statusState.lastIterationAt}`);
        console.log(`Stop reason: ${statusState.stopReason || 'None'}`);
        console.log(`Last summary: ${statusState.lastSummary}`);
      } else {
        console.log('No loop state found.');
      }
      break;

    case '/ralph-resume':
    case 'ralph-resume':
      const resumeState = readState(project);
      if (resumeState && !resumeState.active) {
        resumeState.active = true;
        writeState(project, resumeState);
        console.log('Resuming Ralph loop...');
        await runOrchestrator(project, client);
      } else if (resumeState && resumeState.active) {
        console.log('Loop is already active.');
      } else {
        console.log('No loop state found. Use /ralph-loop to start.');
      }
      break;

    case '/ralph-pause':
    case 'ralph-pause':
      const pauseState = readState(project);
      if (pauseState) {
        pauseState.active = false;
        pauseState.stopReason = 'user_paused';
        writeState(project, pauseState);
        console.log('Ralph loop paused.');
      } else {
        console.log('No active loop found.');
      }
      break;

    case '/ralph-log':
    case 'ralph-log':
      const history = readHistory(project);
      if (history.length === 0) {
        console.log('No history found.');
      } else {
        const count = parsedArgs['last'] ? parseInt(parsedArgs['last'], 10) : 5;
        const recent = history.slice(-count);
        recent.forEach(entry => {
          console.log(`Iteration ${entry.iteration} (${entry.result}): ${entry.notes}`);
          if (entry.changedFiles.length > 0) {
            console.log(`  Changed: ${entry.changedFiles.join(', ')}`);
          }
        });
      }
      break;

    case '/ralph-config':
    case 'ralph-config':
      const configState = readState(project);
      if (configState) {
        console.log(JSON.stringify(configState, null, 2));
      } else {
        console.log('No configuration found.');
      }
      break;

    case '/ralph-context':
    case 'ralph-context':
      const contextContent = readContext(project);
      if (contextContent) {
        console.log(contextContent);
      } else {
        console.log('No context found.');
      }
      break;
  }
}
