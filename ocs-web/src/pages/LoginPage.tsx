import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.auth.login(email, password);
      localStorage.setItem('ocs_token', res.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <form onSubmit={handleLogin} style={{ width: 320, padding: 32, background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginBottom: 32 }}>
          <span className="brand-dot"></span>
          <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--text)' }}>OCS Login</span>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '10px 12px', borderRadius: 8, fontSize: '0.85rem', marginBottom: 20, border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <div className="input-group" style={{ marginBottom: 20 }}>
          <label className="input-label">Email</label>
          <div className="input-form-container">
            <input 
              type="email" 
              required
              className="input-form input-form-animated" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
            />
            <span className="input-form-underline"></span>
          </div>
        </div>

        <div className="input-group" style={{ marginBottom: 32 }}>
          <label className="input-label">Password</label>
          <div className="input-form-container">
            <input 
              type="password" 
              required
              className="input-form input-form-animated" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
            />
            <span className="input-form-underline"></span>
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </form>
    </div>
  );
}
