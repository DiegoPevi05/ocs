import math
import os

def generate_dxf(filename):
    lines = []

    def emit(code, val):
        lines.append(f"{code}")
        lines.append(f"{val}")

    def start_section(name):
        emit(0, "SECTION")
        emit(2, name)

    def end_section():
        emit(0, "ENDSEC")

    start_section("HEADER")
    emit(9, "$INSUNITS")
    emit(70, 4)  # mm
    end_section()

    start_section("ENTITIES")

    # ── helpers ──────────────────────────────────────────────────────────────

    def emit_polyline_3d(vertices, layer):
        """Write a 3D POLYLINE with optional bulge per vertex (code 42)."""
        emit(0, "POLYLINE")
        emit(8, layer)
        emit(66, 1)
        emit(70, 8)
        emit(10, 0); emit(20, 0); emit(30, 0)
        for v in vertices:
            emit(0, "VERTEX")
            emit(8, layer)
            emit(70, 32)
            emit(10, round(v['x'], 3))
            emit(20, round(v['y'], 3))
            emit(30, round(v.get('z', 0), 3))
            if v.get('bulge', 0) != 0:
                emit(42, round(v['bulge'], 8))
        emit(0, "SEQEND")
        emit(8, layer)

    def emit_point(x, y, z, layer):
        emit(0, "POINT")
        emit(8, layer)
        emit(10, round(x, 3))
        emit(20, round(y, 3))
        emit(30, round(z, 3))

    def bulge_for_sweep_deg(deg):
        """DXF bulge = tan(sweep/4). Positive = CCW arc."""
        return math.tan(math.radians(deg / 4))

    # ── geometry ─────────────────────────────────────────────────────────────
    #
    # Layout (plan view, X = along track, Y = cross-track):
    #
    #   TRACK_A   Y =  6000   ── straight 200 m ──▶
    #   TRACK_B   Y =  0      ── straight 200 m ──▶
    #   TRACK_BRANCH  starts between them (Y = 3000),
    #               goes straight to X = 100 000, then curves
    #               away to the LEFT (negative Y direction).
    #
    # Foundation offset from track centre = 3 000 mm (3 m)
    # Foundation spacing = 50 000 mm (50 m)
    # Total straight length = 200 000 mm (200 m)

    TOTAL    = 200_000   # total straight length for tracks A and B
    BRANCH_STRAIGHT = 100_000  # branch goes straight to this X
    CURVE_R  = 80_000   # curve radius for the branch
    FSPACING = 50_000   # foundation spacing
    FOFFSET  =  3_000   # cross-track distance to foundation from track centre

    # ── TRACK A (straight, at Y = 6000) ──────────────────────────────────────
    A_Y = 6_000
    emit_polyline_3d([
        {'x': 0,      'y': A_Y, 'z': 0},
        {'x': TOTAL,  'y': A_Y, 'z': 0},
    ], 'TRACK_A')

    # foundations along TRACK A (every 50 m, one per step on the outer/far side)
    for s in range(0, TOTAL + 1, FSPACING):
        emit_point(s, A_Y + FOFFSET, 0, 'FOUNDATION')   # outer side (positive Y)

    # ── TRACK B (straight, at Y = 0) ─────────────────────────────────────────
    B_Y = 0
    emit_polyline_3d([
        {'x': 0,      'y': B_Y, 'z': 0},
        {'x': TOTAL,  'y': B_Y, 'z': 0},
    ], 'TRACK_B')

    # foundations along TRACK B (every 50 m, one per step on the outer/far side)
    for s in range(0, TOTAL + 1, FSPACING):
        emit_point(s, B_Y - FOFFSET, 0, 'FOUNDATION')   # outer side (negative Y)

    # ── TRACK BRANCH (Y = 3000, straight → 90° curve opening LEFT) ───────────
    # 90-degree sweep going CCW → curves toward negative Y.
    # Start of curve:  X = BRANCH_STRAIGHT, Y = 3000
    # End of curve:    X = BRANCH_STRAIGHT + R, Y = 3000 - R   (quarter circle)
    # The bulge for a 90° CCW arc is +tan(22.5°); for CW (going -Y) use negative.
    BR_Y   = 3_000
    BR_END_X = BRANCH_STRAIGHT + CURVE_R
    BR_END_Y = BR_Y - CURVE_R   # curves away: moves in -Y direction

    emit_polyline_3d([
        {'x': 0,               'y': BR_Y,    'z': 0},
        {'x': BRANCH_STRAIGHT, 'y': BR_Y,    'z': 0, 'bulge': -bulge_for_sweep_deg(90)},
        {'x': BR_END_X,        'y': BR_END_Y,'z': 0},
    ], 'TRACK_BRANCH')

    # foundations along the branch straight section (one per step, outer side)
    for s in range(0, BRANCH_STRAIGHT + 1, FSPACING):
        emit_point(s, BR_Y + FOFFSET, 0, 'FOUNDATION')  # outer side (positive Y, away from track B)

    # foundations along the branch curve (one per step, outward normal only)
    arc_len = math.pi / 2 * CURVE_R
    num_arc_pts = max(1, int(arc_len / FSPACING))
    cx, cy = BRANCH_STRAIGHT, BR_Y - CURVE_R
    for k in range(1, num_arc_pts + 1):
        t = k / num_arc_pts
        angle_on_arc = math.pi / 2 - (math.pi / 2 * t)
        px = cx + CURVE_R * math.cos(angle_on_arc)
        py = cy + CURVE_R * math.sin(angle_on_arc)
        nx = math.cos(angle_on_arc)
        ny = math.sin(angle_on_arc)
        # outward (away from centre of curve)
        emit_point(px + nx * FOFFSET, py + ny * FOFFSET, 0, 'FOUNDATION')

    end_section()
    emit(0, "EOF")

    with open(filename, "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_tracks.dxf")
    generate_dxf(out)
    print(f"Generated {out} successfully!")
