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
export interface PoleData { id?: string; label?: string; x: number; z: number; y?: number; h?: number; }
export interface CantileverData { id?: string; label?: string; x1: number; z1: number; x2: number; z2: number; }
export interface VaneData { id?: string; label?: string; x1: number; z1: number; x2: number; z2: number; }
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
