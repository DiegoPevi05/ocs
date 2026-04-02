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
