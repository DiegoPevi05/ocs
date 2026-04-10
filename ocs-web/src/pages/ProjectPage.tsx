import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Edit3, ArrowLeft, MapPin, Settings } from 'lucide-react';
import { api, parseProjectSettings } from '../lib/api';
import type { Location, Project, ProjectSettings } from '../types';
import { DEFAULT_PROJECT_SETTINGS } from '../types';
import { ProjectSettingsPanel } from '../components/ProjectSettingsPanel';

export default function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(DEFAULT_PROJECT_SETTINGS);

  const load = async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const [proj, locs] = await Promise.all([
        api.projects.get(projectId),
        api.locations.list(projectId),
      ]);
      setProject(proj);
      setLocations(locs);
      const parsed = parseProjectSettings(proj);
      if (parsed) setProjectSettings(parsed);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [projectId]);

  const handleCreate = async () => {
    if (!newName.trim() || !projectId) return;
    try {
      await api.locations.create(projectId, newName.trim());
      setCreating(false);
      setNewName('');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this location?')) return;
    try {
      await api.locations.delete(id);
      setLocations(l => l.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ background: '#111827', borderBottom: '1px solid #1e2d45', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate('/')}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            <ArrowLeft size={16} /> Projects
          </button>
          <span style={{ color: '#334155' }}>／</span>
          <span style={{ fontWeight: 600 }}>{project?.name ?? '…'}</span>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          title="Project Settings"
          style={{ background: 'transparent', border: '1px solid #1e2d45', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, fontSize: '0.8rem' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#e2e8f0'; e.currentTarget.style.borderColor = '#334155'; }}
          onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = '#1e2d45'; }}
        >
          <Settings size={15} /> Settings
        </button>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Locations</h1>
          <button
            onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
          >
            <Plus size={16} /> New Location
          </button>
        </div>

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 6, padding: '10px 16px', marginBottom: 20, color: '#fca5a5', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading…</div>
        ) : locations.length === 0 ? (
          <div style={{ color: '#64748b', padding: 60, textAlign: 'center', border: '1px dashed #1e2d45', borderRadius: 10 }}>
            No locations yet. Create one to start designing.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {locations.map(loc => (
              <div
                key={loc.id}
                style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 10, padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MapPin size={17} color="#22c55e" />
                    <span style={{ fontWeight: 600 }}>{loc.name}</span>
                  </div>
                  <button
                    onClick={e => handleDelete(loc.id, e)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 4, lineHeight: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#475569' }}>
                  {new Date(loc.createdAt).toLocaleDateString()}
                </div>
                <button
                  onClick={() => navigate(`/editor/${loc.id}`)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '7px 0', background: 'transparent', border: '1px solid #334155', color: '#94a3b8', borderRadius: 6, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#94a3b8'; }}
                >
                  <Edit3 size={14} /> Open Editor
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', padding: 28, borderRadius: 10, color: '#f8fafc', width: 340, border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>New Location</h3>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ width: '100%', padding: '7px 10px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 6, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button style={{ padding: '7px 18px', background: '#475569', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }} onClick={() => setCreating(false)}>Cancel</button>
              <button style={{ padding: '7px 18px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {showSettings && projectId && (
        <ProjectSettingsPanel
          settings={projectSettings}
          onSave={async (updated) => {
            try {
              const saved = await api.projects.updateSettings(projectId, updated);
              const parsed = parseProjectSettings(saved);
              if (parsed) setProjectSettings(parsed);
              setShowSettings(false);
            } catch (e: any) {
              setError(e.message);
            }
          }}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}
