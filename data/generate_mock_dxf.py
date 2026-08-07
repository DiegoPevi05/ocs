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

    # ── HEADER section ──────────────────────────────────────────────────────
    start_section("HEADER")
    emit(9, "$INSUNITS")
    emit(70, 4)  # mm
    emit(9, "$ACADVER")
    emit(1, "AC1015")  # AutoCAD 2000 format
    end_section()

    # ── TABLES section (layer definitions) ──────────────────────────────────
    # Declaring layers explicitly makes importers more reliable.
    start_section("TABLES")

    emit(0, "TABLE")
    emit(2, "LAYER")
    emit(70, 3)  # number of layer entries that follow

    # Layer: TRACK_STRAIGHT
    emit(0, "LAYER")
    emit(2, "TRACK_STRAIGHT")
    emit(70, 0)   # unfrozen
    emit(62, 7)   # colour: white
    emit(6, "CONTINUOUS")

    # Layer: TRACK_CURVE
    emit(0, "LAYER")
    emit(2, "TRACK_CURVE")
    emit(70, 0)
    emit(62, 5)   # colour: blue
    emit(6, "CONTINUOUS")

    # Layer: FOUNDATION
    emit(0, "LAYER")
    emit(2, "FOUNDATION")
    emit(70, 0)
    emit(62, 1)   # colour: red
    emit(6, "CONTINUOUS")

    emit(0, "ENDTAB")
    end_section()

    # ── ENTITIES section ────────────────────────────────────────────────────
    start_section("ENTITIES")

    # ── helpers ──────────────────────────────────────────────────────────────

    def emit_lwpolyline(vertices, layer, closed=False):
        """Write an LWPOLYLINE (2D lightweight polyline) with optional bulge.
        Each vertex dict: {x, y, bulge?}
        """
        emit(0, "LWPOLYLINE")
        emit(8, layer)
        emit(90, len(vertices))          # number of vertices
        emit(70, 1 if closed else 0)     # closed flag
        for v in vertices:
            emit(10, round(v['x'], 3))
            emit(20, round(v['y'], 3))
            if v.get('bulge', 0) != 0:
                emit(42, round(v['bulge'], 8))

    def emit_point(x, y, z, layer):
        emit(0, "POINT")
        emit(8, layer)
        emit(10, round(x, 3))
        emit(20, round(y, 3))
        emit(30, round(z, 3))

    def bulge_for_sweep_deg(deg):
        """DXF bulge = tan(sweep/4). Positive = CCW arc."""
        return math.tan(math.radians(deg / 4))

    # ── Geometry parameters ─────────────────────────────────────────────────
    TRACK_LENGTH    = 200_000   # length of the straight track (200 m)
    TRACK_SPACING   = 20_000    # gap between the two tracks (20 m)
    FOFFSET         =  3_000    # perpendicular distance of foundations from track

    CURVE_R         = 80_000    # curve radius
    CURVE_SWEEP_DEG = -90       # sweep angle of the curve (degrees, negative = CW/downwards)
    CURVE_STRAIGHT  = 60_000    # straight lead-in before the curve begins

    FSPACING_RECT   = 40_000    # foundation spacing on straight sections (40 m)
    FSPACING_CURVE  = 25_000    # foundation spacing on curves (25 m)

    # ────────────────────────────────────────────────────────────────────────
    # TRACK 1 — purely horizontal straight line
    # Runs along Y = 0, from X = 0 to X = TRACK_LENGTH
    # ────────────────────────────────────────────────────────────────────────
    TRACK1_Y = 0

    emit_lwpolyline([
        {'x': 0,            'y': TRACK1_Y},
        {'x': TRACK_LENGTH, 'y': TRACK1_Y},
    ], 'TRACK_STRAIGHT')

    # Foundations for Track 1:
    # Track 2 is BELOW (negative Y), so place foundations on the +Y side
    # to keep them away from the adjacent track.
    for s in range(0, TRACK_LENGTH + 1, FSPACING_RECT):
        emit_point(s, TRACK1_Y + FOFFSET, 0, 'FOUNDATION')

    # ────────────────────────────────────────────────────────────────────────
    # TRACK 2 — straight lead-in → 90° CW curve
    # Offset below Track 1 by TRACK_SPACING so they don't overlap.
    # Starts at Y = -(TRACK_SPACING), runs right along X,
    # then curves downward (CW 90°) to stay away from Track 1.
    # ────────────────────────────────────────────────────────────────────────
    TRACK2_Y = -(TRACK_SPACING)

    # The curve starts at X = CURVE_STRAIGHT.
    # Arc centre is at (CURVE_STRAIGHT, TRACK2_Y - CURVE_R).
    # The arc sweeps 90° CW from top-of-circle to the right side.
    curve_start_x = CURVE_STRAIGHT
    curve_end_x   = curve_start_x + CURVE_R
    curve_end_y   = TRACK2_Y - CURVE_R

    emit_lwpolyline([
        {'x': 0,              'y': TRACK2_Y},
        {'x': curve_start_x,  'y': TRACK2_Y, 'bulge': bulge_for_sweep_deg(CURVE_SWEEP_DEG)},
        {'x': curve_end_x,    'y': curve_end_y},
    ], 'TRACK_CURVE')

    # Foundations for Track 2, straight section:
    # Place on -Y side (away from Track 1 which is above).
    for s in range(0, CURVE_STRAIGHT + 1, FSPACING_RECT):
        emit_point(s, TRACK2_Y - FOFFSET, 0, 'FOUNDATION')

    # Foundations for Track 2, curved section:
    # The arc centre is at (curve_start_x, TRACK2_Y - CURVE_R).
    # The track follows the arc at radius CURVE_R from the centre.
    # "Away from Track 1" means placing foundations radially OUTWARD 
    # since Track 1 is above (Y=0) and the curve center is far below.
    # Actually, the track is at the top of the circle, so OUTWARD means 
    # pointing UP (+Y), towards Track 1. So we want INWARD (-Y) normals 
    # or outward reversed to stay away from Track 1.
    # Wait, the center is at -100,000, track is at -20,000. 
    # Outward points UP (+Y), towards Track 1.
    # To place foundations AWAY from Track 1, we want them to go DOWN (-Y), 
    # which is INWARD towards the center of the arc.
    arc_len = math.pi / 2 * CURVE_R  # quarter-circle arc length
    cx = curve_start_x
    cy = TRACK2_Y - CURVE_R

    s_curve = 0
    while s_curve <= arc_len + 1:
        # Angle on arc: starts at +π/2 (top of circle) and sweeps CW to 0
        angle = math.pi / 2 - (s_curve / CURVE_R)
        # Point on the track
        px = cx + CURVE_R * math.cos(angle)
        py = cy + CURVE_R * math.sin(angle)
        # Inward normal (towards curve centre → away from Track 1)
        nx = -math.cos(angle)
        ny = -math.sin(angle)

        fx = px + nx * FOFFSET
        fy = py + ny * FOFFSET

        # Safety check: only emit if foundation stays at least FOFFSET below Track 1
        if fy < TRACK1_Y - FOFFSET:
            emit_point(fx, fy, 0, 'FOUNDATION')

        s_curve += FSPACING_CURVE

    # ── Close up ────────────────────────────────────────────────────────────
    end_section()
    emit(0, "EOF")

    with open(filename, "w") as f:
        f.write("\n".join(lines) + "\n")


if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mock_tracks.dxf")
    generate_dxf(out)
    print(f"Generated {out} successfully!")
