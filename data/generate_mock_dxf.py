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

    BRANCH_STRAIGHT = 100_000  # straight section before the curve
    CURVE_R  = 80_000   # curve radius
    FOFFSET  =  3_000   # cross-track distance to foundation from track centre

    # Spacing values
    FSPACING_RECT   = 40_000   # foundation spacing on straight sections (40 m)
    FSPACING_CURVE  = 25_000   # foundation spacing on curves (25 m)

    # ── TRACK (straight → 90° CCW curve) ──────────────────────────────────────
    TRACK_Y = 0
    CURVE_END_X = BRANCH_STRAIGHT + CURVE_R
    CURVE_END_Y = TRACK_Y + CURVE_R

    emit_polyline_3d([
        {'x': 0,               'y': TRACK_Y,    'z': 0},
        {'x': BRANCH_STRAIGHT, 'y': TRACK_Y,    'z': 0, 'bulge': bulge_for_sweep_deg(90)},
        {'x': CURVE_END_X,     'y': CURVE_END_Y,'z': 0},
    ], 'TRACK_CURVE')

    # Foundations along the STRAIGHT section — on the -Y side (3000 mm perpendicular)
    for s in range(0, BRANCH_STRAIGHT + 1, FSPACING_RECT):
        emit_point(s, TRACK_Y - FOFFSET, 0, 'FOUNDATION')

    # Foundations along the CURVE — outward from curve centre
    # The curve centre is at (BRANCH_STRAIGHT, TRACK_Y + CURVE_R)
    # The outward normal points away from the centre (radially outward)
    arc_len = math.pi / 2 * CURVE_R
    cx, cy = BRANCH_STRAIGHT, TRACK_Y + CURVE_R
    s_curve = 0
    while s_curve <= arc_len:
        # Angle on arc: starts at -π/2 (bottom of circle) and sweeps CCW
        angle_on_arc = -math.pi / 2 + (s_curve / CURVE_R)
        px = cx + CURVE_R * math.cos(angle_on_arc)
        py = cy + CURVE_R * math.sin(angle_on_arc)
        # Outward normal (away from curve centre)
        nx = math.cos(angle_on_arc)
        ny = math.sin(angle_on_arc)
        emit_point(px + nx * FOFFSET, py + ny * FOFFSET, 0, 'FOUNDATION')
        s_curve += FSPACING_CURVE

    end_section()
    emit(0, "EOF")

    with open(filename, "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_tracks.dxf")
    generate_dxf(out)
    print(f"Generated {out} successfully!")
