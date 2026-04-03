import type { Location, Project, SceneData } from '../types';

const BASE = 'http://localhost:8080/api';

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
  },
};

/** Parse sceneData from location (it's stored as a JSON string inside the jsonb column) */
export function parseSceneData(loc: Location): SceneData | null {
  if (!loc.sceneData) return null;
  if (typeof loc.sceneData === 'object') return loc.sceneData as SceneData;
  try { return JSON.parse(loc.sceneData as unknown as string); } catch { return null; }
}
