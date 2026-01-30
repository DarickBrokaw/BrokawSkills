# DTCAI Revit Bridge Plugin for OpenCode

<<<<<<< HEAD
**Version:** 1.0.1  
**Location:** `%APPDATA%\opencode\plugins\dtc-revit-bridge\.opencode\plugins\dtc-revit-bridge.ts`

This is an always-on plugin that lets OpenCode send generated Python goals directly to the running DTCAI Revit add-in bridge. It does not build, install, or run tests—it simply forwards Python code to `http://127.0.0.1:51337/execute` with the required token and stores each generated script for later review.

## Plugin workflow

1. **User prompt:** The user describes a goal (e.g. “place a wall from (0,0,0) to (10,0,0) and label it”).
2. **OpenCode generates Python:** The plugin schema tells the assistant to return the Python code that uses `app`, `doc`, and the Revit API. Include `context` metadata if needed; the plugin simply relays the code string.
3. **Plugin executes:** The plugin saves the generated Python under `./scripts/goal-<timestamp>.py`, then POSTs the same JSON to the bridge. The bridge response (success/error/stdout/result/traceback) is printed back to OpenCode and logged.

## Supported command

```
/dtc-bridge goal <description>
```

The plugin expects the assistant to supply a JSON object containing the generated Python code in the `code` field. It sends this code to the bridge and prints the JSON response you receive from Revit. The plugin also accepts `context:<json>` optional metadata you want to pass through to Python.

### Example

```
User: /dtc-bridge goal Create a wall from 0,0,0 to 10,0,0
```

The assistant should reply with:
```
{
  "code": "from Autodesk.Revit.DB import ...",
  "context": { "goal": "create east wall" }
}
```

The plugin supplies the token header, the `timeoutMs`, stores the script at `scripts/goal-<timestamp>.py`, and relays the bridge’s response back to OpenCode. It also captures any `stdout`/`error` so you can confirm success.

## Bridge schema

The plugin sends the following JSON to the local bridge:

```json
{
  "code": "<python code string>",
  "timeoutMs": 15000,
  "context": {"goal": "literal user goal or metadata"}
}
```

It passes the token from `%APPDATA%\DTCAI\token.txt` as `x-dtc-token`. The response is printed verbatim (success/error/stdout/result/traceback).

## Generated scripts folder

Every time a goal command runs, the generated Python is stored at:
```
%APPDATA%\opencode\plugins\dtc-revit-bridge\scripts\goal-<timestamp>.py
```
You can open these files later to review what code was sent to Revit.

## Installation

Copy the `dtc-revit-bridge` folder into `%APPDATA%\opencode\plugins`. OpenCode auto-loads plugins from `%APPDATA%\opencode\plugins\*\.opencode\plugins\*.ts`.
=======
**Version:** 1.0.0  
**Location:** `%APPDATA%\opencode\plugins\dtc-revit-bridge\.opencode\plugins\dtc-revit-bridge.ts`

This plugin lets OpenCode issue DTCAI-specific commands that build the add-in, install it into `%APPDATA%\Autodesk\ApplicationPlugins\DTCAI.bundle`, and execute the validated wall test through the local HTTP bridge. Use these commands when you need deterministic automation against Revit 2025/2026.

## Available commands

| Command | What it does |
|---|---|
| `/dtc-build` | Runs `dotnet build` for both Revit.2025 and Revit.2026 (Debug). Use before installing the bundle to capture new assemblies and the embedded Python runtime. |
| `/dtc-install-bundle` | Executes `tools/revit-bridge/install_dtcaibundle.ps1` to recreate `%APPDATA%\Autodesk\ApplicationPlugins\DTCAI.bundle` with the latest build outputs and manifests. |
| `/dtc-wall-test` | Posts `tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py` to the bridge via `node tools/revit-bridge/send.js`. Returns the same JSON proof-of-success we used earlier. |
| `/dtc-send --file <path>` | Sends any Python script (relative to the repo root) through the bridge helper (`tools/revit-bridge/send.js`). Use for custom automation once you confirm the code matches the bridge schema. |

### Notes

- Each command runs inside the repo at `C:\Users\daric\Desktop\DTCAI.Addin.3.0.0` by default. Override the source path by setting `DTC_REPO_PATH` before invoking the plugin (useful if you move the repo).
- The plugin assumes `node`, `dotnet`, and `powershell` are available on PATH.
- The wall test logs JSON results to the console so you can verify the `success` flag and `checks` for the coordinates.

## Installation

1. Copy the plugin folder to `%APPDATA%\opencode\plugins\dtc-revit-bridge` (already done).  
2. Make sure `tools/revit-bridge/send.js` and the referenced scripts exist inside the repo root.  
3. Restart OpenCode if it was running so it loads the new plugin.

OpenCode automatically loads plugins from `%APPDATA%\opencode\plugins\*\.opencode\plugins\*.ts`, so no extra config is required once this folder is in place.
>>>>>>> 4159551 (Sync skills and plugins: 2026-01-26 13:44:45 (HEAD))
