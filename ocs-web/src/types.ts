// ─── API data types (matches ocs-api / ocs-calculator response) ───────────────

export type RGBAColor = [number, number, number, number];

export interface ApiLine {
  color: RGBAColor;
  end: [number, number, number];   // [x, y, z]
  name: string;
  start: [number, number, number]; // [x, y, z]
  radius?: number;                 // >0 = outer radius mm → render as 3D cylinder; 0/absent = wire line
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
export type DrawMode = 'none' | 'track' | 'pole' | 'cantilever' | 'vane' | 'anchorPoint' | 'anchor';

// ─── Scene drawing types ───────────────────────────────────────────────────────

export interface TrackPoint { x: number; z: number; y?: number; r?: number; }
export interface TrackData { id?: string; label: string; points: TrackPoint[]; }
export interface PoleData {
  id?: string; label?: string; x: number; z: number; y?: number; h?: number;
  cantileversQuantity?: number;  // how many catenary wires on this pole, default 1
  catSeparation?: number;        // vertical separation between catenary wires mm, default 720

  // Physical & Profile Properties
  density?: number;
  inertiaX?: number;
  inertiaY?: number;
  inertiaZ?: number;
  crossAreaX?: number;
  crossAreaY?: number;
  crossAreaZ?: number;
  profileType?: 'SQUARE_HOLE' | 'CIRCLE_HOLE' | 'T_PROFILE' | 'DOUBLE_T' | 'CUSTOM' | string;
  width?: number;            // cross-section outer width mm
  length?: number;           // cross-section outer depth/height mm
  sectionThickness?: number; // wall thickness for hollow sections (SQUARE_HOLE / CIRCLE_HOLE), default 5
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
  contactWireConfiguration?: 'SINGLE' | 'DOUBLE'; // per-cantilever override; inherits project setting
  steadyArmAlpha?: number;             // degrees, default -2.0
  registerArmAlpha?: number;           // degrees, default 2.0
  steadyArmLength?: number;            // mm, default 1200
}
export interface VaneData {
  id?: string; label?: string;
  // Parent cantilever indices (required — a vane always links exactly 2 cantilevers)
  cantileverIdx1: number;
  cantileverIdx2: number;
  // Derived 2D positions (cached from cantilevers[idx].x2/z2 for rendering)
  x1: number; z1: number;
  x2: number; z2: number;
  // User-configurable
  qtyDroppers?: number;         // default 0 (auto-calculated by vane length)
  initialSeparation?: number;   // mm from each cantilever end to first/last dropper, default 5000
  // Physical — inherited from cantilevers by default, can be overridden
  cwWeight?: number;      // kg/m, default 0.0019
  cwTension?: number;     // N, default 1600
  swWeight?: number;      // kg/m, default 0.0024
  swTension?: number;     // N, default 2000
  dropperWeight?: number; // default 0.0006
  liftingStartDistance?: number; // mm from start where lifting starts, default length/2
}

// Vane calculation response from ocs-calculator
export interface ApiVaneResponse {
  status: string;
  calculation_time_ms?: number;
  _vaneIdx?: number;
  vane?: {
    lines: ApiLine[];
    liftingStartDistance?: number;
    results: {
      index: number;
      dropper_length: number;
      distance_eye_to_eye: number;
      distance_cw: number;
      distance_pole_dropper: number;
      distance_dropper_dropper: number;
      distance_cw_h: number;
      dropper_inclination: number;
    }[];
  };
}
// ─── Nested calculation response from GET /api/locations/{id}/calculated ─────

export interface CalcVaneEntry {
  vaneIndex: number;
  label?: string;
  lines: ApiLine[];
  results: NonNullable<ApiVaneResponse['vane']>['results'];
}

export interface CalcCantileverEntry {
  cantileverIndex: number;
  wireIndex: number;
  label?: string;
  configuration?: string;
  lines: ApiLine[];
  results: ApiResult[];
  vanes: CalcVaneEntry[];
}

export interface CalcPoleEntry {
  poleIndex: number;
  label?: string;
  x: number;
  z: number;
  cantilevers: CalcCantileverEntry[];
}

export interface CalcLocationResponse {
  status: string;
  location: Location;
  poles: CalcPoleEntry[];
}

export interface AnchorPointData {
  id?: string; label?: string;
  x: number; z: number;          // center position in XZ plane
  width?: number;                 // mm, default from project settings
  length?: number;                // mm, default from project settings
  height?: number;                // mm, default from project settings
  density?: number;               // kg/m³, default from project settings
  D?: number;                     // mm, distance to nearest pole center (computed during placement)
}

export interface AnchorData {
  id?: string; label?: string;
  poleIdx: number;               // index into poles array
  anchorPointIdx: number;        // index into anchorPoints array
  // Connection points (computed from pole face + anchor point top center)
  px: number; pz: number;        // pole face connection point XZ
  ax: number; az: number;        // anchor point top center XZ
  fixingPointHeight?: number;    // mm from pole base, default from project settings
  density?: number;              // kg/m³
  crossSection?: number;         // mm²
}

export interface SceneData {
  tracks: TrackData[];
  poles: PoleData[];
  cantilevers: CantileverData[];
  vanes: VaneData[];
  anchorPoints: AnchorPointData[];
  anchors: AnchorData[];
}

// ─── REST API resource types ───────────────────────────────────────────────────

// ─── Project settings (inherited defaults for new poles, cantilevers, vanes) ───

export interface ProjectSettings {
  catenarySystem: 'DOUBLE_WIRE' | 'SINGLE_WIRE';
  pole: {
    height: number;
    squareHollowWidth: number;
    squareHollowLength: number;
    squareHollowThickness: number;
    circleHollowDiameter: number;
    circleHollowThickness: number;
  };
  cantilever: {
    contactWireHeight: number;
    systemHeight: number;
    contactWireVerticalOffset: number;
    zigzag: number;
    supportOffset: number;
    bottomFixedHeight: number;
    fixingDistance: number;
    u: number;
    trackGauge: number;
  };
  vane: {
    cwWeight: number;
    swWeight: number;
    cwTension: number;
    swTension: number;
    dropperWeight: number;
    initialSeparation: number;
    qtyDroppers: number;
    liftingStartDistance?: number;
  };
  anchorPoint: {
    width: number;               // mm, default plate width
    length: number;              // mm, default plate length
    height: number;              // mm, default plate height/thickness
    density: number;             // kg/m³
    fixingPointHeight: number;   // mm from pole base (used for Anchor)
  };
}

export const DEFAULT_PROJECT_SETTINGS: ProjectSettings = {
  catenarySystem: 'DOUBLE_WIRE',
  pole: {
    height: 3000,
    squareHollowWidth: 160,
    squareHollowLength: 160,
    squareHollowThickness: 5,
    circleHollowDiameter: 160,
    circleHollowThickness: 5,
  },
  cantilever: {
    contactWireHeight: 5400,
    systemHeight: 1000,
    contactWireVerticalOffset: 120,
    zigzag: 250,
    supportOffset: 1440,
    bottomFixedHeight: 5440,
    fixingDistance: 1500,
    u: 0,
    trackGauge: 1435,
  },
  vane: {
    cwWeight: 0.0019,
    swWeight: 0.0024,
    cwTension: 1600,
    swTension: 2000,
    dropperWeight: 0.0006,
    initialSeparation: 5000,
    qtyDroppers: 0,
    liftingStartDistance: undefined,
  },
  anchorPoint: {
    width: 400,
    length: 400,
    height: 20,
    density: 7850,
    fixingPointHeight: 500,
  },
};

export interface Project {
  id: string;
  name: string;
  description?: string;
  settings?: string | null;  // JSON-serialized ProjectSettings
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
