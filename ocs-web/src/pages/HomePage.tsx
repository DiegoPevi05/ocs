import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FolderOpen } from 'lucide-react';
import { api } from '../lib/api';
import type { Project } from '../types';

export default function HomePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
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
    <div style={{ minHeight: '100vh', background: '#0a0e1a', color: '#e2e8f0', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <div style={{ background: '#111827', borderBottom: '1px solid #1e2d45', padding: '0 32px', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600 }}>
          <span style={{ width: 9, height: 9, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6', display: 'inline-block' }} />
          OCS — Railway Electrification Designer
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Projects</h1>
          <button
            onClick={() => setCreating(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer', fontWeight: 500, fontSize: '0.9rem' }}
          >
            <Plus size={16} /> New Project
          </button>
        </div>

        {error && (
          <div style={{ background: '#450a0a', border: '1px solid #ef4444', borderRadius: 6, padding: '10px 16px', marginBottom: 20, color: '#fca5a5', fontSize: '0.875rem' }}>
            {error} — is the ocs-api running on port 8080?
          </div>
        )}

        {loading ? (
          <div style={{ color: '#64748b', padding: 40, textAlign: 'center' }}>Loading…</div>
        ) : projects.length === 0 ? (
          <div style={{ color: '#64748b', padding: 60, textAlign: 'center', border: '1px dashed #1e2d45', borderRadius: 10 }}>
            No projects yet. Create one to get started.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {projects.map(p => (
              <div
                key={p.id}
                onClick={() => navigate(`/projects/${p.id}`)}
                style={{ background: '#111827', border: '1px solid #1e2d45', borderRadius: 10, padding: '20px 22px', cursor: 'pointer', transition: 'border-color 0.15s', display: 'flex', flexDirection: 'column', gap: 8 }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3b82f6')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#1e2d45')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FolderOpen size={18} color="#3b82f6" />
                    <span style={{ fontWeight: 600 }}>{p.name}</span>
                  </div>
                  <button
                    onClick={e => handleDelete(p.id, e)}
                    style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4, borderRadius: 4, lineHeight: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {p.description && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{p.description}</div>}
                <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 4 }}>
                  {new Date(p.createdAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create project modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#1e293b', padding: 28, borderRadius: 10, color: '#f8fafc', width: 360, border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, marginBottom: 18 }}>New Project</h3>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{ width: '100%', padding: '7px 10px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 6, boxSizing: 'border-box', marginBottom: 14 }}
            />
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: 4 }}>Description</label>
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              style={{ width: '100%', padding: '7px 10px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 6, boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 22, justifyContent: 'flex-end' }}>
              <button style={{ padding: '7px 18px', background: '#475569', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }} onClick={() => setCreating(false)}>Cancel</button>
              <button style={{ padding: '7px 18px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 6, cursor: 'pointer' }} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
