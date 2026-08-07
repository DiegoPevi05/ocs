// ─── DXF ASCII Parser ──────────────────────────────────────────────────────────
// Parses AutoCAD DXF ASCII files entirely in the browser.
// Supports: LINE, LWPOLYLINE, POLYLINE+VERTEX, POINT entities.
// Coordinate transform: DXF(X,Y,Z) → Scene(X, Z, Y)
//   scene.x = dxf.X * scale   (easting)
//   scene.z = dxf.Y * scale   (northing — same sign, DXF plan-view Y = scene Z)
//   scene.y = dxf.Z * scale   (elevation)

export interface DxfPoint {
  x: number;
  z: number;
  y: number; // elevation
  r?: number; // signed arc radius (from DXF bulge); >0 = CCW, <0 = CW
}

export interface ParsedTrack {
  label: string;
  layer: string;
  points: DxfPoint[];
  entityType: string; // 'LINE' | 'LWPOLYLINE' | 'POLYLINE'
}

export interface ParsedFoundation {
  label: string;
  layer: string;
  x: number;
  z: number;
  y: number;
}

export interface ParsedUnresolved {
  entityType: string;
  layer: string;
  summary: string;
}

export type DxfClassification = 'track' | 'foundation' | 'skip';

export interface ParsedDxfScene {
  tracks:      ParsedTrack[];
  foundations: ParsedFoundation[];
  unresolved:  ParsedUnresolved[];
  units:       string;
  scale:       number; // mm per DXF unit
}

// ── $INSUNITS → mm per unit ──────────────────────────────────────────────────
const INSUNITS_SCALE: Record<number, number> = {
  0:  1,        // undefined — assume mm
  1:  25.4,     // inches
  2:  304.8,    // feet
  3:  1609344,  // miles
  4:  1,        // mm
  5:  10,       // cm
  6:  1000,     // m
  7:  1000000,  // km
  8:  0.0000254,// microinches
  9:  0.0254,   // mils (thou)
  10: 914.4,    // yards
  11: 1e10,     // angstroms (ignore)
  12: 1e7,      // nanometers
  13: 1e6,      // microns
  14: 100,      // decimeters
  15: 10000,    // decameters
  16: 100000,   // hectometers
  17: 1e9,      // gigameters
  18: 1.496e14, // AU
  19: 9.461e18, // light-years
  20: 3.086e19, // parsecs
};

const INSUNITS_LABEL: Record<number, string> = {
  0: 'unknown', 1: 'in', 2: 'ft', 4: 'mm', 5: 'cm',
  6: 'm', 7: 'km',
};

// ── Layer → auto-classification ───────────────────────────────────────────────
const TRACK_PREFIXES = ['track', 'via', 'rail', 'cwr', 'line', 'linea', 'trk'];
const FOUND_PREFIXES = ['found', 'base', 'pillar', 'pad', 'ciment', 'cimenta', 'zapata'];

export function classifyLayer(layer: string): DxfClassification | 'unknown' {
  const l = layer.toLowerCase();
  if (TRACK_PREFIXES.some(p => l.includes(p))) return 'track';
  if (FOUND_PREFIXES.some(p => l.includes(p))) return 'foundation';
  return 'unknown';
}

// ── Tokeniser ─────────────────────────────────────────────────────────────────
interface Token { code: number; value: string; }

function tokenize(text: string): Token[] {
  const lines = text.split(/\r?\n/);
  const tokens: Token[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const code = parseInt(lines[i].trim(), 10);
    if (isNaN(code)) continue;
    tokens.push({ code, value: lines[i + 1].trim() });
  }
  return tokens;
}

// ── Main parser ───────────────────────────────────────────────────────────────
export function parseDxf(text: string, overrideScale?: number): ParsedDxfScene {
  const tokens = tokenize(text);
  let scale = 1;          // mm per DXF unit
  let unitsLabel = 'unknown';
  let inHeader = false;
  let inEntities = false;
  let inObjects = false;

  const tracks:      ParsedTrack[]       = [];
  const foundations: ParsedFoundation[]  = [];
  const unresolved:  ParsedUnresolved[]  = [];

  let i = 0;

  // ── Helpers ─────────────────────────────────────────────────────────────
  const num = (t: Token) => parseFloat(t.value);
  const peek = () => tokens[i];
  const advance = () => tokens[i++];

  // Apply scale: DXF→scene coordinate transform
  const sx = (v: number) => v * scale;  // DXF X → scene X
  const sz = (v: number) => v * scale;  // DXF Y → scene Z (same sign for plan-view)
  const sy = (v: number) => v * scale;  // DXF Z → scene Y (elevation)

  // ── Pass 1: HEADER — read $INSUNITS ──────────────────────────────────────
  for (let j = 0; j < tokens.length; j++) {
    const t = tokens[j];
    if (t.code === 2 && t.value === 'HEADER') { inHeader = true; continue; }
    if (t.code === 0 && t.value === 'ENDSEC' && inHeader) { inHeader = false; break; }
    if (inHeader && t.code === 9 && t.value === '$INSUNITS') {
      const next = tokens[j + 1];
      if (next && next.code === 70) {
        const u = parseInt(next.value, 10);
        scale = INSUNITS_SCALE[u] ?? 1;
        unitsLabel = INSUNITS_LABEL[u] ?? 'unknown';
      }
    }
  }
  if (overrideScale !== undefined && overrideScale > 0) {
    scale = overrideScale;
    unitsLabel = 'custom';
  }

  // ── Pass 2: ENTITIES section ──────────────────────────────────────────────
  i = 0;
  while (i < tokens.length) {
    const t = advance();

    if (t.code === 2 && t.value === 'ENTITIES') { inEntities = true; continue; }
    if (t.code === 2 && t.value === 'OBJECTS')  { inObjects = true; inEntities = false; continue; }
    if (t.code === 0 && t.value === 'ENDSEC')   { inEntities = false; continue; }
    if (!inEntities || inObjects) continue;

    if (t.code !== 0) continue; // skip non-entity-start tokens

    const entityType = t.value;

    if (entityType === 'LINE') {
      parseLine();
    } else if (entityType === 'LWPOLYLINE') {
      parseLwPolyline();
    } else if (entityType === 'POLYLINE') {
      parsePolyline();
    } else if (entityType === 'POINT') {
      parsePoint();
    }
    // Everything else (ARC, CIRCLE, TEXT, DIMENSION…) → ignored
  }

  return { tracks, foundations, unresolved, units: unitsLabel, scale };

  // ── Entity parsers ────────────────────────────────────────────────────────

  function readCommonHeader(): { layer: string } {
    // Peek ahead collecting common header groups (5=handle, 8=layer, etc.)
    // Stop when we see the next entity-start (code 0) or an entity-specific code
    let layer = '0';
    // We've already consumed the entity type token; read ahead for header fields
    while (i < tokens.length) {
      const t = peek();
      if (t.code === 0) break; // next entity start
      if (t.code === 8) { layer = advance().value; continue; }
      // Stop at entity-specific data codes
      if ([10, 11, 20, 21, 30, 31, 38, 39, 40, 41, 70, 90].includes(t.code)) break;
      advance(); // consume irrelevant header token
    }
    return { layer };
  }

  function parseLine() {
    // Collect all groups until next entity
    let layer = '0';
    let x0 = 0, y0 = 0, z0 = 0, x1 = 0, y1 = 0, z1 = 0;
    while (i < tokens.length && peek().code !== 0) {
      const t = advance();
      if (t.code === 8)  layer = t.value;
      if (t.code === 10) x0 = num(t);
      if (t.code === 20) y0 = num(t);
      if (t.code === 30) z0 = num(t);
      if (t.code === 11) x1 = num(t);
      if (t.code === 21) y1 = num(t);
      if (t.code === 31) z1 = num(t);
    }
    const pts: DxfPoint[] = [
      { x: sx(x0), z: sz(y0), y: sy(z0) },
      { x: sx(x1), z: sz(y1), y: sy(z1) },
    ];
    const label = autoLabel('LINE', layer, tracks.length + 1);
    tracks.push({ label, layer, points: pts, entityType: 'LINE' });
  }

  /**
   * Convert DXF bulge to a signed arc radius (in DXF units).
   * bulge = tan(sweep_angle / 4); radius = chord × (1 + b²) / (4|b|)
   * Sign convention: bulge > 0 → CCW → positive radius.
   */
  function bulgeToSignedRadius(x1: number, y1: number, x2: number, y2: number, b: number): number | undefined {
    if (Math.abs(b) < 1e-8) return undefined;
    const chord = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    if (chord < 1e-8) return undefined;
    const R = chord * (1 + b * b) / (4 * Math.abs(b));
    return Math.sign(b) * R;
  }

  function parseLwPolyline() {
    let layer = '0';
    let elevation = 0;
    let closed = false;
    const vertices: {x: number, y: number, b: number}[] = [];

    while (i < tokens.length && peek().code !== 0) {
      const t = advance();
      if (t.code === 8)  layer     = t.value;
      if (t.code === 38) elevation = num(t);
      if (t.code === 70) closed    = !!(parseInt(t.value, 10) & 1);
      
      if (t.code === 10) {
        vertices.push({ x: num(t), y: 0, b: 0 });
      } else if (t.code === 20 && vertices.length > 0) {
        vertices[vertices.length - 1].y = num(t);
      } else if (t.code === 42 && vertices.length > 0) {
        vertices[vertices.length - 1].b = num(t);
      }
    }

    if (vertices.length < 2) return;
    if (closed) vertices.push({ ...vertices[0], b: 0 });

    const pts: DxfPoint[] = [];
    for (let k = 0; k < vertices.length; k++) {
      const v = vertices[k];
      const pt: DxfPoint = { x: sx(v.x), z: sz(v.y), y: sy(elevation) };

      // If the *previous* vertex had bulge, this point is the arc endpoint.
      // Compute signed radius and attach it to this point (matches TrackPoint.r convention).
      if (k > 0 && vertices[k - 1].b !== 0) {
        const prev = vertices[k - 1];
        const rDxf = bulgeToSignedRadius(prev.x, prev.y, v.x, v.y, prev.b);
        if (rDxf !== undefined) pt.r = rDxf * scale;
      }

      pts.push(pt);
    }

    const label = autoLabel('LWPOLYLINE', layer, tracks.length + 1);
    tracks.push({ label, layer, points: pts, entityType: 'LWPOLYLINE' });
  }

  function parsePolyline() {
    // 3D POLYLINE: geometry comes from following VERTEX entities until SEQEND
    let layer = '0';
    const vertices: {x: number, y: number, z: number, b: number}[] = [];

    // Read polyline header
    while (i < tokens.length && peek().code !== 0) {
      const t = advance();
      if (t.code === 8) layer = t.value;
    }

    // Read VERTEX entities
    while (i < tokens.length) {
      const t = peek();
      if (t.code === 0 && t.value === 'SEQEND') { advance(); break; }
      if (t.code === 0 && t.value === 'VERTEX') {
        advance(); // consume 'VERTEX'
        let vx = 0, vy = 0, vz = 0, vb = 0;
        while (i < tokens.length && peek().code !== 0) {
          const vt = advance();
          if (vt.code === 10) vx = num(vt);
          if (vt.code === 20) vy = num(vt);
          if (vt.code === 30) vz = num(vt);
          if (vt.code === 42) vb = num(vt);
        }
        vertices.push({ x: vx, y: vy, z: vz, b: vb });
      } else {
        advance(); // skip unexpected token
      }
    }

    if (vertices.length < 2) return;
    
    const pts: DxfPoint[] = [];
    for (let k = 0; k < vertices.length; k++) {
      const v = vertices[k];
      const pt: DxfPoint = { x: sx(v.x), z: sz(v.y), y: sy(v.z) };

      // If the *previous* vertex had bulge, compute arc radius for this endpoint.
      if (k > 0 && vertices[k - 1].b !== 0) {
        const prev = vertices[k - 1];
        const rDxf = bulgeToSignedRadius(prev.x, prev.y, v.x, v.y, prev.b);
        if (rDxf !== undefined) pt.r = rDxf * scale;
      }

      pts.push(pt);
    }

    const label = autoLabel('POLYLINE', layer, tracks.length + 1);
    tracks.push({ label, layer, points: pts, entityType: 'POLYLINE' });
  }

  function parsePoint() {
    let layer = '0';
    let px = 0, py = 0, pz = 0;
    while (i < tokens.length && peek().code !== 0) {
      const t = advance();
      if (t.code === 8)  layer = t.value;
      if (t.code === 10) px = num(t);
      if (t.code === 20) py = num(t);
      if (t.code === 30) pz = num(t);
    }
    const label = autoLabel('POINT', layer, foundations.length + 1);
    foundations.push({ label, layer, x: sx(px), z: sz(py), y: sy(pz) });
  }

  function autoLabel(type: string, layer: string, idx: number): string {
    // Use layer name as label prefix if it's descriptive, else fallback
    const layerClean = layer.replace(/[^a-zA-Z0-9_\-]/g, '_').toUpperCase();
    return layerClean !== '0' ? `${layerClean}_${idx}` : `${type}_${idx}`;
  }
}
