---
name: revit-bridge-test
description: Run the verified wall test against the DTCAI Revit bridge to confirm the installation and bridge are healthy.
---

# DTCAI Revit Bridge Test (OpenCode)

Use this skill when you want to re-run the validated path/goal test that creates a wall from `(0,0,0)` to `(10,0,0)` and proves the bridge is functioning. This skill assumes Revit 2025/2026 is running with the DTCAI add-in loaded.

## Wall test script

- The script lives at `tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py` and:
  - Finds the first level & wall type in the active document
  - Creates a wall between `(0,0,0)` and `(10,0,0)` at the level elevation
  - Sets the `Mark` parameter to `revit-bridge-test`
  - Returns `result = { success: true, wallId: <id>, checks: { mark, height, start_point, end_point } }`
- To run it, execute:
  ```bash
  cd C:\Users\daric\Desktop\DTCAI.Addin.3.0.0
  node tools/revit-bridge/send.js --file tools/revit-bridge/tests/create_wall_from_0_0_0_to_10_0_0.py
  ```
- The same script powers the `/dtc-wall-test` OpenCode plugin command, so either interface yields identical JSON output—use whichever environment you prefer.

## When to use this skill

- After installing or updating the add-in via the `dtc-addin-installer` skill
- Whenever you want a known-good verification before running other automations
- To troubleshoot bridge connectivity before sending new custom goals

Let `revit-bridge` handle arbitrary automation goals; keep this skill reserved for the canonical wall test that proves the bridge is alive and responsive.
