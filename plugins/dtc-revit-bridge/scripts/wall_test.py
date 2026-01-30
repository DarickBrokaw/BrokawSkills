from Autodesk.Revit.DB import (
    BuiltInParameter,
    FilteredElementCollector,
    Line,
    Level,
    Transaction,
    Wall,
    WallType,
    XYZ,
)

doc = doc

level = FilteredElementCollector(doc).OfClass(Level).FirstElement()
if level is None:
    raise Exception("No Level found in the document.")

wall_type = FilteredElementCollector(doc).OfClass(WallType).FirstElement()
if wall_type is None:
    raise Exception("No WallType found in the document.")

start = XYZ(0, 0, float(level.Elevation))
end = XYZ(10, 0, float(level.Elevation))
curve = Line.CreateBound(start, end)

transaction_name = "DTCAI: Wall test 0-10"
txn = Transaction(doc, transaction_name)
wall = None
mark_param = None

try:
    txn.Start()
    wall = Wall.Create(doc, curve, wall_type.Id, level.Id, 10.0, 0.0, False, False)
    mark_param = wall.get_Parameter(BuiltInParameter.ALL_MODEL_MARK)
    if mark_param is None or mark_param.IsReadOnly:
        mark_param = wall.LookupParameter("Mark")
    if mark_param is None or mark_param.IsReadOnly:
        raise Exception("Cannot set Mark parameter; it is missing or readonly.")

    mark_param.Set("revit-bridge-test")
    txn.Commit()
except Exception:
    if txn.HasStarted() and not txn.HasEnded():
        txn.RollBack()
    raise

location = wall.Location
curve = location.Curve if location else None
start_pt = curve.GetEndPoint(0) if curve else None
end_pt = curve.GetEndPoint(1) if curve else None

checks = {
    "mark": mark_param.AsString(),
    "height": wall.get_Parameter(BuiltInParameter.WALL_USER_HEIGHT_PARAM).AsDouble() if wall else None,
    "start_point": (start_pt.X, start_pt.Y, start_pt.Z) if start_pt else None,
    "end_point": (end_pt.X, end_pt.Y, end_pt.Z) if end_pt else None,
}

result = {
    "wallId": wall.Id.IntegerValue,
    "success": True,
    "checks": checks,
}
