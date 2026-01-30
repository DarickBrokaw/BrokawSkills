---
name: revit-bridge-opencode
<<<<<<< HEAD
description: Communicate with the running DTCAI Revit add-in via its local HTTP bridge to run arbitrary Python recipes against a live document.
=======
description: Send Python automation through the DTCAI Add-in local HTTP bridge from OpenCode, run the validated wall test, and manage the bundle install artifacts so Revit 2025/2026 receives the latest code.
>>>>>>> 4159551 (Sync skills and plugins: 2026-01-26 13:44:45 (HEAD))
---

# DTCAI Revit Bridge (OpenCode)

<<<<<<< HEAD
This skill is dedicated _solely_ to talking to the DTCAI add-in’s local HTTP bridge once Revit 2025/2026 is running. It does not build or install the add-in—use the `dtc-addin-installer` skill for that. Here’s what this skill covers:

## Using the local bridge

1. Make sure Revit 2025 or 2026 is open so the add-in starts the HTTP bridge on `http://127.0.0.1:51337/execute`.
2. Retrieve the token that the add-in writes to `%APPDATA%\DTCAI\token.txt` (or set `DTC_AI_TOKEN` if you prefer). That token is required in the `x-dtc-token` header for every bridge request.
3. Use `scripts/send_to_revit_bridge.py` (packaged alongside this skill) or any HTTP client to POST JSON to the bridge:
   ```json
   {
     "code": "<your python>",
     "timeoutMs": 15000,
     "context": { "goal": "describe what you want" }
   }
   ```
   The bridge returns `{ success, stdout, result?, error?, traceback? }`. Always inspect `success`/`error` before trusting the result.
4. `code` runs with `app`, `doc`, and `__revit__` already injected, so your Python can treat them as provided objects.

## Helper script

`tools/revit-bridge/send.js` already handles token loading, JSON formatting, and timeout/error handling. Wrap it where needed, or call it directly from the plugin:

```bash
node tools/revit-bridge/send.js --code "print('hello from bridge')"
node tools/revit-bridge/send.js --file path\to\custom_script.py --timeout 20000
```

Use this skill whenever you need to send a new goal, automation script, or diagnostic into the running Revit add-in; leave the validated wall test to the companion `revit-bridge-test` skill.
=======
This skill teaches OpenCode how to interact with the `DTCAI.Addin` local bridge now installed in `%APPDATA%\Autodesk\ApplicationPlugins\DTCAI.bundle`. Use it when you need to run verified Python recipes, re-run the wall test, or update the bundle before launching Revit.

## Prerequisites

1. Run both `Revit.2025` and `Revit.2026` builds from the repo root (`dotnet build Revit.2025\Revit.2025.csproj -c Debug` etc.). Copying is easiest with `tools/revit-bridge/install_dtcaibundle.ps1` (see below).
2. Start Revit so the bridge spins up on `127.0.0.1:51337` and writes `%APPDATA%\DTCAI\token.txt`.
3. The bridge only accepts requests with `x-dtc-token`; the helper scripts below load it for you.

## Bridge API & schema

- **Endpoint:** `POST http://127.0.0.1:<port>/execute` (default `port=51337`; override with `DTC_AI_PORT`).
- **Headers:**
  ```text
  Content-Type: application/json
  x-dtc-token: <token from %APPDATA%\DTCAI\token.txt (or DTC_AI_TOKEN env)>
  ```
- **Payload schema:**
  ```json
  {
    "code": "<python code as string>",
    "timeoutMs": 10000,
    "context": { "job": "name or metadata" }
  }
  ```
- **Response:** Extension of `{ success, stdout, result?, error?, traceback? }`. `success` only becomes `true` after the Revit `ExternalEvent` completes. Inspect `stdout`/`stderr` in `response['stdout']` and Python errors in `response['traceback']` when troubleshooting.

Use this schema in OpenCode when you call `requests.post`, `httpx.post`, or any fetch wrapper. The `code` string can contain newline-delimited Python with `app`, `doc`, and `__revit__` already injected by the bridge.

## Helper script for OpenCode

Import `send_to_revit_bridge` from `scripts/send_to_revit_bridge.py` (this repo path is consistent with the skill). Example:

```python
from scripts.send_to_revit_bridge import send_to_revit_bridge

wall_code = """
from Autodesk.Revit.DB import XYZ, Line, Wall, Transaction
lvl = doc.ActiveView.GenLevel
start = XYZ(0, 0, lvl.Elevation)
end = XYZ(10, 0, lvl.Elevation)
curve = Line.CreateBound(start, end)
with Transaction(doc, 'DTCAI Wall') as tx:
    tx.Start()
    wall = Wall.Create(doc, curve, doc.GetDefaultElementTypeId(ElementTypeGroup.WallType), lvl.Id, 10.0, 0.0, False, False)
    tx.Commit()
"""

result = send_to_revit_bridge(wall_code, timeout_ms=12000)
print(result)
```

The helper reads the token, builds the JSON payload, and prints the parsed response. `context` can be passed as a dict to tag runs. Reuse the helper for every OpenCode task to keep the header setup consistent.

## Validated wall test & script

You already have a tested script at `tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py` (the wall from 0,0,0 to 10,0,0). Run it via the same helper or by piping into `send.js`.

Mirror the manual call we ran:

```bash
cd C:\Users\daric\Desktop\DTCAI.Addin.3.0.0
node tools/revit-bridge/send.js --file tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py
```

The script returns `{ "success": true, ... }` when the wall is created. Extend the script by adjusting the coordinates or parameters and re-run via OpenCode/Node when you need similar geometry.

## Installing / refreshing the bundle

To copy the freshly built outputs into Revit’s plugin folder, run the shared installer:

```powershell
powershell -ExecutionPolicy Bypass -File tools/revit-bridge/install_dtcaibundle.ps1
```

It copies 2025/2026 `bin\Debug` contents, ensures `PackageContents.xml`/`DTC.addin` live in the bundle root, and refreshes the icon assets. Re-run after every build before starting Revit.

## Notes for OpenCode

- Always inspect the JSON `result` and `checks` produced by the wall test script. You can weave that data back into OpenCode workflows to decide if a wall exists or to report on success.
- Keep `timeoutMs` above 5–10s when running complex Python (Revit needs time to process the ExternalEvent). Use `context` to track the calling goal so logs/responses are traceable.
- When you need to submit new recipes, use the same schema. If you ever build an OpenCode skill to wrap the bridge, keep the helper + test script path in the skill for easy updates.
>>>>>>> 4159551 (Sync skills and plugins: 2026-01-26 13:44:45 (HEAD))
