---
name: revit-bridge-opencode
description: Communicate with the running DTCAI Revit add-in (2024/2025/2026) via its local HTTP bridge to run arbitrary Python recipes against a live document.
---

# DTCAI Revit Bridge (OpenCode)

This skill is dedicated _solely_ to talking to the DTCAI add-in's local HTTP bridge once Revit 2024/2025/2026 is running. It does not build or install the add-in—use the `dtc-addin-installer` skill for that. Here's what this skill covers:

## Using the local bridge

1. Make sure Revit 2024, 2025, or 2026 is open so the add-in starts the HTTP bridge on `http://127.0.0.1:51337/execute`.
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
- **Response:** Extension of `{ success, stdout, result?, error?, traceback? }`. `success` only becomes `true` after the Revit `ExternalEvent` completes.

## Notes for OpenCode

- The bridge is version-agnostic and works with any Revit version (2024/2025/2026) running the DTCAI add-in
- Keep `timeoutMs` above 5–10s when running complex Python (Revit needs time to process the ExternalEvent)
- Use `context` to track the calling goal so logs/responses are traceable
- When you need to submit new recipes, use the same schema
