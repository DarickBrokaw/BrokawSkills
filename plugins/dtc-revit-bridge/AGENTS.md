# DTCAI Revit Bridge Plugin for OpenCode

## Purpose
<<<<<<< HEAD
- Relay generated Python goals from OpenCode into the DTCAI add-in’s local bridge.
- Store each generated script under `scripts/goal-<timestamp>.py` so you can inspect or reuse it later.
- Return the bridge JSON response back into the OpenCode session.

## Command
- `/dtc-bridge goal <description>` — the assistant should reply with a JSON payload containing `code` (Python string) plus optional `context` metadata.

## Files
- Plugin code: `%APPDATA%\opencode\plugins\dtc-revit-bridge\.opencode\plugins\dtc-revit-bridge.ts`
- Stored scripts: `%APPDATA%\opencode\plugins\dtc-revit-bridge\scripts\goal-<timestamp>.py`

## Behavior
1. OpenCode provides the generated Python via the JSON command.
2. Plugin saves that code to the `scripts` folder for traceability.
3. Plugin posts the same code to `http://127.0.0.1:51337/execute` with the token header.
4. Plugin prints the bridge response (success/property/error/traceback) so you can confirm execution.

## Installation
1. Place the plugin folder under `%APPDATA%\opencode\plugins\dtc-revit-bridge`.
2. Restart OpenCode so the plugin loads.
3. Run `/dtc-bridge goal ...` with the generated JSON payload.

OpenCode auto-loads plugins from `%APPDATA%\opencode\plugins\*\.opencode\plugins\*.ts` and `<project>\.opencode\plugins\*.ts`.
=======
- Drive the local DTCAI Revit HTTP bridge from OpenCode commands.
- Provide deterministic builds, bundle installs, and the verified wall test.
- Wrap the wall test script and `send.js` helper so you can replay it with a simple OpenCode command.

## Installation location
```
%APPDATA%\opencode\plugins\dtc-revit-bridge\.opencode\plugins\dtc-revit-bridge.ts
```
OpenCode auto-loads plugins from:
- `%APPDATA%\opencode\plugins\*\.opencode\plugins\*.ts`
- `<project>\.opencode\plugins\*.ts`

## Commands
- `/dtc-build` — `dotnet build Revit.2025` and `Revit.2026`
- `/dtc-install-bundle` — Runs `tools/revit-bridge/install_dtcaibundle.ps1`
- `/dtc-wall-test` — Runs `tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py`
- `/dtc-send --file <path>` — Sends any Python script via `tools/revit-bridge/send.js` (use relative paths inside the repo).

## Notes for developers
- Commands execute inside `C:\Users\daric\Desktop\DTCAI.Addin.3.0.0` unless `DTC_REPO_PATH` is set.
- Outputs are logged to the OpenCode console so you can see the JSON response.
- The plugin leverages the same scripts you already run manually; no new dependencies are required.
>>>>>>> 4159551 (Sync skills and plugins: 2026-01-26 13:44:45 (HEAD))
