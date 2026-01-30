---
name: dtc-addin-installer
description: Deploy the shipped DTCAI Revit add-in bundle (2025 + 2026) into %APPDATA%\Autodesk\ApplicationPlugins\DTCAI.bundle without requiring the source repository.
---

# DTCAI Add-in Installer (OpenCode)

This skill carries all the prebuilt DTCAI add-in assets (2025 + 2026) as assets, plus a standalone installer script. Use it when you need to deploy the add-in into a new machine without access to the original repository or build toolchain.

## What’s included

- **Assets**: `Contents\2025`, `Contents\2026`, `PackageContents.xml`, `DTC.addin`, and the `Resources\Images` folder are packaged under `skills/dtc-addin-installer/assets` so they travel with the skill.
- **Installer**: Run `install_bundle.ps1` to copy those assets into `%APPDATA%\Autodesk\ApplicationPlugins\DTCAI.bundle`. The script uses `%APPDATA%`/`%USERNAME%` so it works on any Windows account.

## How to deploy

1. Copy or extract the skill folder into your OpenCode skills directory (`~/.config/opencode/skills/dtc-addin-installer`).
2. Run the installer script:
   ```powershell
   powershell -ExecutionPolicy Bypass -File ~/.config/opencode/skills/dtc-addin-installer/install_bundle.ps1
   ```
   The script prints progress as it copies each folder and ensures the bundle root gets cleaned before new files arrive.
3. Restart Revit 2025/2026. On next launch, the add-in will load the packaged `DTCAI.Addin.dll`, Python runtime, and manifests from `%APPDATA%\Autodesk\ApplicationPlugins\DTCAI.bundle`.

## Notes

- No builds or repo checkouts are required: everything the add-in needs is part of the skill assets.
- If you ever need to update the assets, rebuild locally, rerun `install_dtcaibundle.ps1` from the repo, and copy the resulting bundle tree into `skills/dtc-addin-installer/assets` before shipping the skill.
- The skill keeps the folder structure identical to the Revit bundle, so you can inspect or replace individual files if needed.
