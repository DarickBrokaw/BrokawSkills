import sys
from pathlib import Path

# --- locate helper ---
try:
    base_dir = Path(__file__).parent
except NameError:
    base_dir = Path.cwd()

scripts_dir = base_dir.parent / "scripts"
sys.path.insert(0, str(scripts_dir))

try:
    from send_to_revit_bridge import send_to_revit_bridge
except ImportError as e:
    print(f"Error importing helper: {e}")
    print(f"Scripts directory: {scripts_dir}")
    sys.exit(1)

# --- code that runs INSIDE Revit (via your DTCAI bridge) ---
python_body = r"""
import clr

# These AddReference calls are safe even if already loaded in-process.
clr.AddReference("RevitAPI")
clr.AddReference("RevitAPIUI")

from Autodesk.Revit.DB import (
    XYZ, Line, Wall, Transaction,
    FilteredElementCollector, Level,
    ElementTypeGroup, ElementId, WallType
)

def _get_doc():
    # Prefer injected doc if your bridge provides it
    doc = globals().get("doc", None)
    if doc:
        return doc

    # pyRevit-style fallback
    revit_obj = globals().get("__revit__", None)
    if revit_obj:
        return revit_obj.ActiveUIDocument.Document

    # Common injection fallback (if bridge provides uidoc)
    uidoc = globals().get("uidoc", None)
    if uidoc:
        return uidoc.Document

    raise Exception("No active Revit document found. Bridge must provide 'doc' or '__revit__' or 'uidoc'.")

def _get_level(doc):
    # Try active view level first (plan views)
    try:
        lvl = doc.ActiveView.GenLevel
        if lvl: return lvl
    except:
        pass

    # Otherwise: pick the lowest-elevation level in the model
    levels = list(FilteredElementCollector(doc).OfClass(Level).ToElements())
    if not levels:
        raise Exception("No Level elements found in the document.")
    levels.sort(key=lambda l: l.Elevation)
    return levels[0]

def _get_wall_type(doc):
    wt_id = doc.GetDefaultElementTypeId(ElementTypeGroup.WallType)
    if wt_id and wt_id != ElementId.InvalidElementId:
        wt = doc.GetElement(wt_id)
        if wt: return wt

    # Fallback: first available WallType
    wts = list(FilteredElementCollector(doc).OfClass(WallType).ToElements())
    if not wts:
        raise Exception("No WallType elements found in the document.")
    return wts[0]

doc = _get_doc()
level = _get_level(doc)
wall_type = _get_wall_type(doc)

t = Transaction(doc, "Create Wall (0,0,0) to (10,0,0)")
t.Start()

try:
    # Revit internal units are feet. This creates a 10-ft wall run in +X.
    z = level.Elevation  # place the curve on the chosen level
    start_point = XYZ(0.0, 0.0, z)
    end_point   = XYZ(10.0, 0.0, z)

    line = Line.CreateBound(start_point, end_point)

    height_ft = 10.0     # optional, 10 ft tall wall (change if desired)
    offset_ft = 0.0
    flip = False
    structural = False

    wall = Wall.Create(doc, line, wall_type.Id, level.Id, height_ft, offset_ft, flip, structural)

    result = {
        "success": True,
        "wall_id": str(wall.Id.IntegerValue),
        "wall_type": wall_type.Name,
        "level": level.Name,
        "curve_length_ft": float(line.Length),
        "height_ft": height_ft,
        "start_point": {"x": start_point.X, "y": start_point.Y, "z": start_point.Z},
        "end_point": {"x": end_point.X, "y": end_point.Y, "z": end_point.Z},
    }

    print("Wall created successfully.")
    print("Wall Id:", wall.Id.IntegerValue)

    t.Commit()

except Exception as e:
    try:
        t.RollBack()
    except:
        pass

    result = {
        "success": False,
        "error": str(e),
        "error_type": type(e).__name__,
    }

# Many bridges look for one of these:
OUT = result
__result__ = result
"""

print("Sending wall creation request to Revit...")

try:
    response = send_to_revit_bridge(
        python_body,
        timeout_ms=15000,
        context={"task": "create_wall_test"}
    )

    print("\n=== REVIT RESPONSE ===")
    print(f"Success: {response.get('success', 'Unknown')}")

    if response.get("stdout"):
        print("\n--- Revit stdout ---")
        print(response["stdout"])

    if response.get("result"):
        print("\n--- Result ---")
        print(response["result"])

    if not response.get("success", False):
        if response.get("error"):
            print("\n--- Error ---")
            print(response["error"])
        if response.get("traceback"):
            print("\n--- Traceback ---")
            print(response["traceback"])

except Exception as e:
    print(f"FAILED: Could not communicate with Revit bridge: {e}")
    print("Make sure:")
    print("1) Revit is running")
    print("2) DTCAI add-in is loaded")
    print("3) The bridge is listening on the expected port")
    print("4) Token file exists at %APPDATA%\\DTCAI\\token.txt")
