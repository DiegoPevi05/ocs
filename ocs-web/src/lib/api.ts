import { DEFAULT_PROJECT_SETTINGS } from '../types';
import type { Location, Project, ProjectSettings, SceneData } from '../types';

const BASE = `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'}/api`;

async function req<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  });
  if (!res.ok) throw new Error(`${opts?.method ?? 'GET'} ${path} → ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export const api = {
  projects: {
    list: () => req<Project[]>('/projects'),
    get: (id: string) => req<Project>(`/projects/${id}`),
    create: (name: string, description?: string) =>
      req<Project>('/projects', { method: 'POST', body: JSON.stringify({ name, description }) }),
    update: (id: string, name: string, description?: string) =>
      req<Project>(`/projects/${id}`, { method: 'PUT', body: JSON.stringify({ name, description }) }),
    delete: (id: string) => req<void>(`/projects/${id}`, { method: 'DELETE' }),
    updateSettings: (id: string, settings: ProjectSettings) =>
      req<Project>(`/projects/${id}/settings`, { method: 'PUT', body: JSON.stringify({ settings: JSON.stringify(settings) }) }),
  },

  // ─── Locations ──────────────────────────────────────────────────────────────

  locations: {
    list: (projectId: string) => req<Location[]>(`/projects/${projectId}/locations`),
    get: (id: string) => req<Location>(`/locations/${id}`),
    create: (projectId: string, name: string, sceneData?: SceneData) =>
      req<Location>(`/projects/${projectId}/locations`, {
        method: 'POST',
        body: JSON.stringify({ name, sceneData: sceneData ? JSON.stringify(sceneData) : null }),
      }),
    update: (id: string, name: string, sceneData?: SceneData) =>
      req<Location>(`/locations/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name, sceneData: sceneData ? JSON.stringify(sceneData) : null }),
      }),
    delete: (id: string) => req<void>(`/locations/${id}`, { method: 'DELETE' }),

    downloadReport: async (id: string, filename: string): Promise<void> => {
      const res = await fetch(`${BASE}/locations/${id}/report`);
      if (!res.ok) throw new Error(`GET /locations/${id}/report → ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    },
  },
};

/** Parse sceneData from location (it's stored as a JSON string inside the jsonb column) */
export function parseSceneData(loc: Location): SceneData | null {
  if (!loc.sceneData) return null;
  if (typeof loc.sceneData === 'object') return loc.sceneData as SceneData;
  try { return JSON.parse(loc.sceneData as unknown as string); } catch { return null; }
}

/** Parse project settings (stored as a JSON string inside the jsonb column) */
export function parseProjectSettings(project: Project): ProjectSettings | null {
  if (!project.settings) return null;
  let parsed: any;
  if (typeof project.settings === 'object') {
    parsed = project.settings;
  } else {
    try { parsed = JSON.parse(project.settings as unknown as string); } catch { return null; }
  }
  
  return {
    ...DEFAULT_PROJECT_SETTINGS,
    ...parsed,
    pole: { ...DEFAULT_PROJECT_SETTINGS.pole, ...(parsed.pole || {}) },
    cantilever: { ...DEFAULT_PROJECT_SETTINGS.cantilever, ...(parsed.cantilever || {}) },
    vane: { ...DEFAULT_PROJECT_SETTINGS.vane, ...(parsed.vane || {}) },
    anchorPoint: { ...DEFAULT_PROJECT_SETTINGS.anchorPoint, ...(parsed.anchorPoint || {}) }
  };
}
