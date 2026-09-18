import { useState, useEffect } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Bot, Key, Check, Eye, EyeOff, ShieldCheck, AlertTriangle, Loader2, Send, FlaskConical } from 'lucide-react';
import type { AiProvider } from '../types';
import { api } from '../lib/api';

// ─── Style tokens ─────────────────────────────────────────────────────────────

const INPUT: CSSProperties = {
  width: '100%', padding: '8px 12px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 8, color: 'var(--text)', fontSize: 13,
  outline: 'none', boxSizing: 'border-box', fontFamily: 'var(--font)',
  transition: 'border-color 0.2s',
};

const LABEL: CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600,
  color: 'var(--color-primary)', textTransform: 'uppercase',
  letterSpacing: '0.04em', marginBottom: 6,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={LABEL} title={hint}>{label}</label>
      {children}
    </div>
  );
}

function Divider({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0 8px' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ─── Provider data ────────────────────────────────────────────────────────────

const PROVIDERS: {
  id: AiProvider; name: string; color: string;
  defaultModel: string; models: string[]; docsUrl: string;
  description: string;
}[] = [
  {
    id: 'deepseek', name: 'DeepSeek', color: '#4f6ef7',
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
    docsUrl: 'https://platform.deepseek.com/api-keys',
    description: 'Fast & cost-effective reasoning model',
  },
  {
    id: 'openai', name: 'OpenAI', color: '#10a37f',
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    docsUrl: 'https://platform.openai.com/api-keys',
    description: 'Industry-leading GPT models',
  },
  {
    id: 'gemini', name: 'Google Gemini', color: '#4285f4',
    defaultModel: 'gemini-2.0-flash',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    docsUrl: 'https://aistudio.google.com/app/apikey',
    description: 'Google multimodal AI models',
  },
  {
    id: 'claude', name: 'Anthropic Claude', color: '#d97756',
    defaultModel: 'claude-sonnet-4-5',
    models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-haiku-3-5'],
    docsUrl: 'https://console.anthropic.com/settings/keys',
    description: 'Safe, helpful, honest AI',
  },
];

// ─── API helpers ──────────────────────────────────────────────────────────────

interface PlatformAiSettings {
  provider: AiProvider;
  apiKey: string;
  model: string;
  enabled: boolean;
  hasApiKey?: boolean;
}

interface PlatformSettingsData {
  ai: PlatformAiSettings;
  designCriteria: string;
}

async function loadPlatformSettings(): Promise<PlatformSettingsData> {
  return api.platform.getSettings();
}

async function savePlatformSettings(data: PlatformSettingsData): Promise<void> {
  return api.platform.saveSettings(data);
}

interface TestAiResult { success: boolean; message: string }

async function testAiConnection(ai: PlatformAiSettings, message: string): Promise<TestAiResult> {
  return api.platform.testAi({ provider: ai.provider, apiKey: ai.apiKey, model: ai.model, message });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  onClose: () => void;
}

export function PlatformSettingsModal({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [showKey, setShowKey] = useState(false);

  const [ai, setAi] = useState<PlatformAiSettings>({
    provider: 'deepseek', apiKey: '', model: 'deepseek-chat', enabled: false,
  });
  const [hasApiKey, setHasApiKey] = useState(false);
  const [designCriteria, setDesignCriteria] = useState('');
  const [tab, setTab] = useState<'ai' | 'criteria'>('ai');

  const [testMessage, setTestMessage] = useState('Say hello in one short sentence.');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestAiResult | null>(null);

  const selectedProvider = PROVIDERS.find(p => p.id === ai.provider) ?? PROVIDERS[0];

  useEffect(() => {
    loadPlatformSettings()
      .then(data => {
        const loaded = data.ai ?? {};
        setHasApiKey(!!(loaded as any).hasApiKey);
        setAi(prev => ({ ...prev, ...loaded }));
        setDesignCriteria(data.designCriteria ?? '');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleTestAi = async () => {
    if (!testMessage.trim() || testing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testAiConnection(ai, testMessage.trim());
      setTestResult(result);
    } catch (e: any) {
      setTestResult({ success: false, message: e.message ?? 'Test request failed.' });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await savePlatformSettings({ ai, designCriteria });
      setSaveStatus('saved');
      setHasApiKey(!!ai.apiKey || hasApiKey);
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (e: any) {
      setError(e.message);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 500, backdropFilter: 'blur(3px)' }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 501,
        width: tab === 'criteria' ? 'min(760px, 95vw)' : 'min(520px, 95vw)',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
        animation: 'platformModalIn 0.2s cubic-bezier(0.16,1,0.3,1)',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--color-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Platform Settings</div>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Server-wide AI configuration</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 24, lineHeight: 1 }}>&times;</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20, background: 'var(--bg)' }}>

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 32, color: 'var(--muted)' }}>
              <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Loading...
            </div>
          )}

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px', background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8, fontSize: 13, color: 'var(--danger)',
            }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          {!loading && <>
            {/* ── Tabs ── */}
            <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
              <button
                onClick={() => setTab('ai')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)',
                  background: tab === 'ai' ? 'var(--color-primary)' : 'transparent',
                  color: tab === 'ai' ? '#fff' : 'var(--muted)',
                }}
              >AI Provider</button>
              <button
                onClick={() => setTab('criteria')}
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 7, border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 700, fontFamily: 'var(--font)',
                  background: tab === 'criteria' ? 'var(--color-primary)' : 'transparent',
                  color: tab === 'criteria' ? '#fff' : 'var(--muted)',
                }}
              >Criterios de Diseño</button>
            </div>

            {tab === 'criteria' && (
              <>
                <div style={{
                  padding: '12px 14px', background: 'var(--color-secondary)',
                  border: '1px solid var(--border)', borderRadius: 10,
                  fontSize: 12, color: 'var(--text)', lineHeight: 1.5,
                }}>
                  Este documento se envía a la IA como instrucciones de diseño cada vez que
                  chatea o genera postes, ménsulas y vanos. Edítalo en lenguaje natural
                  (español o inglés): alturas típicas, separación entre postes, criterios de
                  zigzag, tensiones de cable, etc. Los cambios aplican de inmediato, sin
                  necesidad de tocar archivos ni código.
                </div>
                <textarea
                  value={designCriteria}
                  onChange={e => setDesignCriteria(e.target.value)}
                  spellCheck={false}
                  rows={20}
                  style={{
                    ...INPUT, fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5,
                    lineHeight: 1.6, resize: 'vertical', minHeight: 320,
                  }}
                />
              </>
            )}

            {tab === 'ai' && <>
            {/* ── AI Provider section ── */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px',
              background: ai.enabled ? 'var(--color-secondary)' : 'var(--surface)',
              border: `1px solid ${ai.enabled ? 'var(--color-primary)' : 'var(--border)'}`,
              borderRadius: 12,
              transition: 'all 0.2s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Bot size={22} color={ai.enabled ? 'var(--color-primary)' : 'var(--muted)'} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ai.enabled ? 'var(--color-primary)' : 'var(--muted)' }}>AI Assistant Engine</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>Enable the intelligent chat bubble in all project editors</div>
                </div>
              </div>
              <div
                onClick={() => setAi(a => ({ ...a, enabled: !a.enabled }))}
                style={{
                  width: 44, height: 24, borderRadius: 12,
                  background: ai.enabled ? 'var(--color-primary)' : 'var(--border)',
                  cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                }}
              >
                <div style={{
                  position: 'absolute', top: 3,
                  left: ai.enabled ? 23 : 3,
                  width: 18, height: 18, borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
              </div>
            </div>

            <Divider title="Select Provider" />

            {/* Provider cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {PROVIDERS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setAi(a => ({ ...a, provider: p.id, model: p.defaultModel }))}
                  style={{
                    padding: '14px 16px', borderRadius: 12,
                    border: ai.provider === p.id ? `2px solid ${p.color}` : '2px solid var(--border)',
                    background: ai.provider === p.id ? `${p.color}11` : 'var(--surface)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s',
                    fontFamily: 'var(--font)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: ai.provider === p.id ? 'var(--text)' : 'var(--muted)' }}>{p.name}</span>
                    {ai.provider === p.id && <Check size={16} color={p.color} />}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{p.description}</div>
                </button>
              ))}
            </div>

            <Divider title="Configuration" />

            <Field label="Model">
              <select
                value={ai.model}
                onChange={e => setAi(a => ({ ...a, model: e.target.value }))}
                style={{ ...INPUT, cursor: 'pointer' }}
              >
                {selectedProvider.models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </Field>

            <Field label={`${selectedProvider.name} Secret Key`}>
              <div style={{ position: 'relative' }}>
                <input
                  type={showKey ? 'text' : 'password'}
                  value={ai.apiKey}
                  onChange={e => setAi(a => ({ ...a, apiKey: e.target.value }))}
                  placeholder={hasApiKey ? '••••••••••••  (key already set — enter new to replace)' : 'sk-...'}
                  style={{ ...INPUT, paddingRight: 40 }}
                  autoComplete="off"
                />
                <button
                  onClick={() => setShowKey(v => !v)}
                  tabIndex={-1}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', display: 'flex', padding: 0 }}
                >
                  {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </Field>

            {hasApiKey && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--success)' }}>
                <Check size={14} /> API key is securely configured on this server
              </div>
            )}

            <Divider title="Test Connection" />

            <div style={{
              padding: '14px 16px', background: 'var(--surface)',
              border: '1px solid var(--border)', borderRadius: 10,
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>
                Send a one-off test message straight to {selectedProvider.name} using {hasApiKey && !ai.apiKey ? 'the key already saved on the server' : 'the key entered above'} — useful to confirm the key and model actually work before saving.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleTestAi(); }}
                  placeholder="Test message…"
                  style={{ ...INPUT, flex: 1 }}
                  disabled={testing}
                />
                <button
                  className="btn btn-secondary"
                  onClick={handleTestAi}
                  disabled={testing || !testMessage.trim() || (!ai.apiKey && !hasApiKey)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}
                >
                  {testing
                    ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Testing…</>
                    : <><FlaskConical size={14} /> Test</>}
                </button>
              </div>

              {testResult && (
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 12px', borderRadius: 8, fontSize: 12.5, lineHeight: 1.5,
                  background: testResult.success ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${testResult.success ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  color: testResult.success ? 'var(--success)' : 'var(--danger)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {testResult.success ? <Send size={14} style={{ flexShrink: 0, marginTop: 1 }} /> : <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>

            <a
              href={selectedProvider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}
            >
              <Key size={12} /> Get a {selectedProvider.name} API key &rarr;
            </a>

            {/* Info box */}
            <div style={{
              padding: '14px 16px',
              background: 'var(--color-secondary)', border: '1px solid var(--border)', borderRadius: 10,
              fontSize: 12, color: 'var(--text)', lineHeight: 1.6,
            }}>
              <strong style={{ color: 'var(--color-primary)' }}>Security Note:</strong>{' '}
              Your API key is securely stored on the backend server and is <strong>never transmitted to the browser</strong>.
              All AI interactions are processed server-side. This configuration applies platform-wide.
            </div>
            </>}
          </>}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px', borderTop: '1px solid var(--border)',
          background: 'var(--surface)', display: 'flex', gap: 12, justifyContent: 'flex-end', flexShrink: 0,
        }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || loading}
            style={{
              background: saveStatus === 'saved' ? 'var(--success)' : saveStatus === 'error' ? 'var(--danger)' : '',
              borderColor: saveStatus === 'saved' ? 'var(--success)' : saveStatus === 'error' ? 'var(--danger)' : '',
            }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
              : saveStatus === 'saved'
              ? <><Check size={16} /> Saved!</>
              : 'Save Settings'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes platformModalIn {
          from { opacity: 0; transform: translate(-50%, calc(-50% + 16px)) scale(0.97); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
