import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { ArrowLeft, Plus, Trash2, Shield } from 'lucide-react';

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [creating, setCreating] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('USER');
  
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.users.list()
      .then(setUsers)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!newEmail.trim() || !newName.trim() || !newPassword.trim()) return;
    try {
      await api.users.create({ email: newEmail, fullName: newName, password: newPassword, role: newRole });
      setCreating(false);
      setNewEmail('');
      setNewName('');
      setNewPassword('');
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this user?')) return;
    try {
      await api.users.delete(id);
      setUsers(u => u.filter(x => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      {/* Header */}
      <div className="ocs-nav">
        <div className="ocs-nav__brand">
          <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
            <ArrowLeft size={18} />
          </button>
          <span className="brand-dot" style={{ marginLeft: 8 }} />
          User Management
        </div>
      </div>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>Users</h1>
          <button onClick={() => setCreating(true)} className="btn btn-primary">
            <Plus size={16} /> New User
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '12px 16px', borderRadius: 8, marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ color: 'var(--muted)', padding: 40, textAlign: 'center' }}>Loading users...</div>
        ) : (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Name</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Email</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase' }}>Role</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--muted)', textTransform: 'uppercase', width: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 500 }}>{u.fullName}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{u.email}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600, background: u.role === 'ADMIN' ? 'var(--accent-glow)' : 'var(--surface2)', color: u.role === 'ADMIN' ? 'var(--accent)' : 'var(--muted)' }}>
                        {u.role === 'ADMIN' && <Shield size={12} />}
                        {u.role}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} onMouseEnter={e => e.currentTarget.style.color = 'var(--danger)'} onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {creating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'var(--bg)', padding: 32, borderRadius: 12, width: 400, border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: 24, fontSize: '1.2rem', color: 'var(--text)' }}>New User</h3>
            
            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Full Name</label>
              <div className="input-form-container">
                <input className="input-form input-form-animated" value={newName} onChange={e => setNewName(e.target.value)} />
                <span className="input-form-underline"></span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Email</label>
              <div className="input-form-container">
                <input type="email" className="input-form input-form-animated" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                <span className="input-form-underline"></span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 16 }}>
              <label className="input-label">Password</label>
              <div className="input-form-container">
                <input type="password" className="input-form input-form-animated" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                <span className="input-form-underline"></span>
              </div>
            </div>

            <div className="input-group" style={{ marginBottom: 32 }}>
              <label className="input-label">Role</label>
              <select className="input-select" value={newRole} onChange={e => setNewRole(e.target.value)}>
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
