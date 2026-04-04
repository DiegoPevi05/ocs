// ─── API data types (matches ocs-api / ocs-calculator response) ───────────────

export type RGBAColor = [number, number, number, number];

export interface ApiLine {
  color: RGBAColor;
  end: [number, number, number];   // [x, y, z]
  name: string;
  start: [number, number, number]; // [x, y, z]
}

export interface ApiResult {
  cut_length: number;
  diameter: number;
  length: number;
  name: string;
  thickness: number;
}

export interface ApiCantilever {
  index: number;
  lines: ApiLine[];
  results: ApiResult[];
}

export interface ApiPole {
  cantilevers: ApiCantilever[];
  lines: ApiLine[];
}

export interface ApiResponse {
  calculation_time_ms: number;
  poles: ApiPole[];
  status: string;
}

// ─── Viewer state types ────────────────────────────────────────────────────────

export type ViewMode = '2D' | '3D';
export type DrawMode = 'none' | 'track' | 'pole' | 'cantilever' | 'vane';

// ─── Scene drawing types ───────────────────────────────────────────────────────

export interface TrackPoint { x: number; z: number; y?: number; r?: number; }
export interface TrackData { id?: string; label: string; points: TrackPoint[]; }
export interface PoleData {
  id?: string; label?: string; x: number; z: number; y?: number; h?: number;
  cantileversQuantity?: number;  // how many catenary wires on this pole, default 1
  catSeparation?: number;        // vertical separation between catenary wires mm, default 720
}
export interface CantileverData {
  id?: string; label?: string;
  x1: number; z1: number;   // pole position
  x2: number; z2: number;   // track foot (zigzag-adjusted)
  x2raw?: number;  // perpendicular foot on track (no zigzag), needed for correct pv
  z2raw?: number;
  tx?: number;     // track tangent X at foot (unit vector)
  tz?: number;     // track tangent Z at foot (unit vector)
  // Calculation params — main_params
  contactWireHeight?: number;          // mm, default 5400
  systemHeight?: number;               // mm, default 1000
  contactWireVerticalOffset?: number;  // mm, default 120
  zigzag?: number;                     // mm, default 250
  supportOffset?: number;              // mm, default 1440
  fixingDistance?: number;             // mm, default 1500
  bottomFixedHeight?: number;          // mm, default 800
  u?: number;                          // track superelevation mm, default 0
  curveRadiusDirection?: string;       // 'inside' | 'outside', default 'inside'
  trackGauge?: number;                 // mm, default 1435
  configuration?: string;              // "TDP>2.2" | "TDP<2.2" | "CAI" | "SBA"
  steadyArmAlpha?: number;             // degrees, default -2.0
  registerArmAlpha?: number;           // degrees, default 2.0
  steadyArmLength?: number;            // mm, default 1200
}
export interface VaneData {
  id?: string; label?: string;
  x1: number; z1: number;
  x2: number; z2: number;
  // Calculation params
  cwWeight?: number;           // kg/m, default 0.0019
  cwTension?: number;          // N, default 1600
  swWeight?: number;           // kg/m, default 0.0024
  swTension?: number;          // N, default 2000
  initialSeparation?: number;  // mm, default 5000
  qtyDroppers?: number;        // default 0
  dropperWeight?: number;      // default 0.0006
  stepSize?: number;           // default 0
}
export interface SceneData {
  tracks: TrackData[];
  poles: PoleData[];
  cantilevers: CantileverData[];
  vanes: VaneData[];
}

// ─── REST API resource types ───────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export interface Location {
  id: string;
  projectId: string;
  name: string;
  sceneData?: SceneData | null;
  createdAt: string;
  updatedAt?: string;
}
