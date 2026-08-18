import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FolderOpen, Settings2, Users } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../types';
import { PlatformSettingsModal } from '../components/PlatformSettingsModal';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.projects.list()
      .then(setProjects)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.projects.create(newName.trim(), newDesc.trim() || undefined);
      setCreating(false);
      setNewName('');
      setNewDesc('');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Delete this project and all its locations?')) return;
    try {
      await api.projects.delete(id);
      setProjects(p => p.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font)' }}>
      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 8px var(--accent-glow)', display: 'inline-block' }} />
          OCS — Railway Electrification Designer
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/users')}
            title="Manage Users"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--muted)',
              borderRadius: 6, cursor: 'pointer', fontSize: 12,
              fontFamily: 'var(--font)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            <Users size={14} /> Users
          </button>
          <button
            onClick={() => setShowPlatformSettings(true)}
            title="Platform Settings"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', background: 'transparent',
              border: '1px solid var(--border)', color: 'var(--muted)',
              borderRadius: 6, cursor: 'pointer', fontSize: 12,
              fontFamily: 'var(--font)',
              transition: 'color 0.15s, border-color 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--muted)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)'; }}
          >
            <Settings2 size={14} /> Platform Settings
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Projects</h1>
          <button
            onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'var(--accent)', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: 6, padding: '10px 16px', marginBottom: 20, color: 'var(--danger)', fontSize: '0.875rem' }}>
            {error} — is the ocs-api running on port 8080?
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div style={{ color: 'var(--muted)', padding: 60, textAlign: 'center', border: '1px dashed var(--border)', borderRadius: 10 }}>
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '20px 22px', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: 8 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderOpen size={18} color="var(--accent)" />
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <button
                    onClick={e => handleDelete(p.id, e)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4, borderRadius: 4, lineHeight: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {p.description && <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{p.description}</div>}
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', marginTop: 4 }}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', padding: 28, borderRadius: 10, color: 'var(--text)', width: 360, border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>New Project</h3>
            
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Name <span style={{ color: 'var(--danger)' }}>*</span></label>
              <div className="input-form-container">
                <input
                  autoFocus
                  className="input-form input-form-animated"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <span className="input-form-underline"></span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 22 }}>
              <label className="input-label">Description</label>
              <div className="input-form-container">
                <input
                  className="input-form input-form-animated"
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                />
                <span className="input-form-underline"></span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Platform Settings Modal */}
      {showPlatformSettings && (
        <PlatformSettingsModal onClose={() => setShowPlatformSettings(false)} />
      )}
    </div>
  );
}
