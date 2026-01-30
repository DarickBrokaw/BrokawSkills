import type { Plugin, ToolExecutionContext } from '@opencode-ai/plugin';
<<<<<<< HEAD
import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const DEFAULT_REPO = path.join(process.env.USERPROFILE || '', 'Desktop', 'DTCAI.Addin.3.0.0');
const REPO_ROOT = path.resolve(process.env.DTC_REPO_PATH || DEFAULT_REPO);
const BRIDGE_SCRIPT = 'tools/revit-bridge/send.js';
const PLUGIN_ROOT = path.join(process.env.USERPROFILE || '', '.config', 'opencode', 'plugins', 'dtc-revit-bridge');
const SCRIPTS_DIR = path.join(PLUGIN_ROOT, 'scripts');

interface BridgePayload {
  code: string;
  context?: Record<string, unknown>;
  timeoutMs?: number;
}

function ensureScriptsDir(): void {
  if (!fs.existsSync(SCRIPTS_DIR)) {
    fs.mkdirSync(SCRIPTS_DIR, { recursive: true });
  }
}

function persistScript(code: string): string {
  ensureScriptsDir();
  const name = `goal-${Date.now()}.py`;
  const filePath = path.join(SCRIPTS_DIR, name);
  fs.writeFileSync(filePath, code, 'utf-8');
  return filePath;
}

function loadToken(): string {
  const envToken = process.env.DTC_AI_TOKEN;
  if (envToken && envToken.trim()) {
    return envToken.trim();
  }

  const appData = process.env.APPDATA;
  if (!appData) {
    throw new Error('APPDATA is not set; cannot find DTCAI token file.');
  }

  const tokenPath = path.join(appData, 'DTCAI', 'token.txt');
  if (!fs.existsSync(tokenPath)) {
    throw new Error(`Token file missing at ${tokenPath}. Start Revit once to generate it.`);
  }

  return fs.readFileSync(tokenPath, 'utf-8').trim();
}

function runBridge(payload: BridgePayload, savedFile?: string): string {
  const args = ['--code', payload.code];
  if (payload.context) {
    args.push('--context', JSON.stringify(payload.context));
  }
  if (payload.timeoutMs) {
    args.push('--timeout', payload.timeoutMs.toString());
  }

  const env = { ...process.env, DTC_AI_TOKEN: loadToken() };
  env.DTC_BRIDGE_SOURCE = savedFile || '';

  const result = spawnSync('node', [path.join(REPO_ROOT, BRIDGE_SCRIPT), ...args], {
    cwd: REPO_ROOT,
    env,
    encoding: 'utf-8'
  });

  if (result.error) {
    throw result.error;
  }

  return (result.stdout || '') + (result.stderr || '');
}

function parseBridgeRequest(command: string): BridgePayload {
  try {
    return JSON.parse(command);
  } catch (err) {
    throw new Error('Command must be a JSON object with a `code` field.');
  }
}
=======
import { spawnSync } from 'child_process';
import * as os from 'os';
import * as path from 'path';

const DEFAULT_REPO = path.join(os.homedir(), 'Desktop', 'DTCAI.Addin.3.0.0');
const REPO_ROOT = path.resolve(process.env.DTC_REPO_PATH || DEFAULT_REPO);

const WALL_SCRIPT = 'tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py';
const SEND_SCRIPT = 'tools/revit-bridge/send.js';
const INSTALL_SCRIPT = 'tools/revit-bridge/install_dtcaibundle.ps1';

function parseCommand(raw: string): { name: string; args: string[] } {
  const tokens = raw.trim().split(/\s+/);
  const name = tokens[0].toLowerCase();
  const args = tokens.slice(1);
  return { name, args };
}

function runProcess(command: string, args: string[], options: { cwd?: string } = {}): string {
  const cwd = options.cwd || REPO_ROOT;
  const result = spawnSync(command, args, { cwd, env: process.env, encoding: 'utf-8' });
  let output = '';
  if (result.stdout) output += result.stdout;
  if (result.stderr) output += result.stderr;
  if (result.error) output += `\nERROR: ${result.error.message}`;
  if (result.status && result.status !== 0) {
    output += `\nProcess exited with code ${result.status}`;
  }
  return output.trim();
}

function runNodeScript(script: string, scriptArgs: string[] = []): string {
  const absolute = path.join(REPO_ROOT, script);
  return runProcess('node', [absolute, ...scriptArgs]);
}

function runDotnet(project: string): string {
  const projectPath = path.join(REPO_ROOT, project, `${project}.csproj`);
  return runProcess('dotnet', ['build', projectPath, '-c', 'Debug']);
}

function runPowerShell(script: string): string {
  const absolute = path.join(REPO_ROOT, script);
  return runProcess('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', absolute]);
}

const DTC_COMMANDS: Record<string, (ctx: ToolExecutionContext, args: string[]) => string> = {
  '/dtc-build': () => [runDotnet('Revit.2025'), runDotnet('Revit.2026')].join('\n'),
  'dtc-build': () => DTC_COMMANDS['/dtc-build'](undefined as any, []),
  '/dtc-install-bundle': () => runPowerShell(INSTALL_SCRIPT),
  'dtc-install-bundle': () => DTC_COMMANDS['/dtc-install-bundle'](undefined as any, []),
  '/dtc-wall-test': () => runNodeScript(WALL_SCRIPT),
  'dtc-wall-test': () => DTC_COMMANDS['/dtc-wall-test'](undefined as any, []),
  '/dtc-send': (_ctx, args) => {
    const fileIndex = args.findIndex(arg => arg === '--file');
    if (fileIndex === -1 || fileIndex === args.length - 1) {
      return 'Usage: /dtc-send --file path\nUse --file to pass a relative script path inside the repo.';
    }
    const scriptPath = args[fileIndex + 1];
    return runNodeScript(SEND_SCRIPT, ['--file', scriptPath]);
  },
  'dtc-send': (_ctx, args) => DTC_COMMANDS['/dtc-send'](undefined as any, args)
};
>>>>>>> 4159551 (Sync skills and plugins: 2026-01-26 13:44:45 (HEAD))

export const DtcRevitBridgePlugin: Plugin = async (context) => {
  const { command } = context;
  if (!command) {
    return {};
  }

<<<<<<< HEAD
  const payload = parseBridgeRequest(command);
  if (!payload.code || typeof payload.code !== 'string') {
    throw new Error('Payload must include a `code` string.');
  }

  const savedFile = persistScript(payload.code);
  console.log(`[DTC-REVIT-BRIDGE] Persisted goal script to ${savedFile}`);

  console.log('[DTC-REVIT-BRIDGE] Forwarding generated Python to the bridge.');
  const output = runBridge(payload, savedFile);
  console.log(output.trim());
=======
  const { name, args } = parseCommand(command);
  const handler = DTC_COMMANDS[name];
  if (!handler) {
    return {};
  }

  console.log(`[DTC-REVIT-PLUGIN] Handling ${name} with args ${args.join(' ')}`);
  const result = handler(context, args);
  console.log(result || '[DTC-REVIT-PLUGIN] Command completed');
>>>>>>> 4159551 (Sync skills and plugins: 2026-01-26 13:44:45 (HEAD))

  return {};
};

export default DtcRevitBridgePlugin;
