import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { FoundationData, ProjectSettings } from '../types';
import { DEFAULT_PROJECT_SETTINGS } from '../types';

// ─── Shared style tokens ──────────────────────────────────────────────────────

const INPUT: CSSProperties = {
  width: '100%', padding: '6px 8px', background: '#0f172a',
  border: '1px solid #1e2d45', color: '#f8fafc',
  borderRadius: 4, outline: 'none', fontSize: 13,
  transition: 'border-color 0.15s',
  fontFamily: 'monospace'
};

const LABEL: CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 600, color: '#94a3b8',
  marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em'
};

const ROW: CSSProperties = { display: 'flex', gap: 12, marginBottom: 12 };

function Field({ label, children, hint }: { label: ReactNode, children: ReactNode, hint?: string }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={LABEL}>{label} {hint && <span style={{ color: '#64748b', fontSize: 10, textTransform: 'none', fontWeight: 400 }}>({hint})</span>}</label>
      {children}
    </div>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '20px 0 12px 0' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
      <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  foundation: FoundationData;
  settings?: ProjectSettings;
  onSave: (updated: FoundationData) => void;
  onClose: () => void;
}

export function FoundationPanel({ foundation, settings, onSave, onClose }: Props) {
  const s = settings ?? DEFAULT_PROJECT_SETTINGS;
  const [form, setForm] = useState<FoundationData>({ ...foundation });
  const [minimized, setMinimized] = useState(false);

  const set = <K extends keyof FoundationData>(key: K, val: FoundationData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <>
      {/* ── Overlay ── */}
      {!minimized && (
        <div
            onClick={onClose}
            style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.6)',
            zIndex: 200,
            }}
        />
      )}

      {/* ── Panel ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: minimized ? 'auto' : 0,
        width: 'clamp(280px, 25vw, 420px)',
        background: '#111827',
        borderLeft: '1px solid #1e2d45',
        borderBottom: minimized ? '1px solid #1e2d45' : 'none',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'foundationPanelIn 0.22s ease-out',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        transition: 'bottom 0.2s ease-in-out',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: minimized ? 'none' : '1px solid #1e2d45',
          background: '#1c2539',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setMinimized(!minimized)}
              style={{
                background: 'none', border: 'none', color: '#64748b',
                cursor: 'pointer', display: 'flex', alignItems: 'center',
                transition: 'transform 0.2s',
                transform: minimized ? 'rotate(-90deg)' : 'rotate(0deg)',
              }}
              title={minimized ? "Expand" : "Minimize"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Foundation</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>
                {form.label || <span style={{ color: '#475569', fontStyle: 'italic' }}>unnamed</span>}
                </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {/* ── Scrollable body ── */}
        {!minimized && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Label */}
          <Field label="Label">
            <input
              value={form.label ?? ''}
              onChange={e => set('label', e.target.value)}
              style={INPUT}
              autoFocus
            />
          </Field>

          <div style={ROW}>
            {/* Elevation */}
            <Field label="Y Elevation (mm)">
              <input type="number" value={form.y ?? 0}
                onChange={e => set('y', +e.target.value)} style={INPUT} />
            </Field>

            {/* Depth */}
            <Field label="Depth (mm)">
              <input type="number" value={form.depth ?? s.foundation.depth}
                onChange={e => set('depth', +e.target.value)} style={INPUT} />
            </Field>
          </div>

          <div style={ROW}>
            {/* Width */}
            <Field label="Width (mm)">
              <input type="number" value={form.width ?? s.foundation.width}
                onChange={e => set('width', +e.target.value)} style={INPUT} />
            </Field>

            {/* Length */}
            <Field label="Length (mm)">
              <input type="number" value={form.length ?? s.foundation.length}
                onChange={e => set('length', +e.target.value)} style={INPUT} />
            </Field>
          </div>

        </div>
        )}

        {/* ── Footer ── */}
        {!minimized && (
            <div style={{
            padding: '12px 18px',
            borderTop: '1px solid #1e2d45',
            display: 'flex', gap: 8, justifyContent: 'flex-end',
            background: '#1c2539',
            flexShrink: 0,
            }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px', background: 'none',
              border: '1px solid #1e2d45', color: '#94a3b8',
              borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(form)}
            style={{
              padding: '7px 18px', background: '#3b82f6',
              border: 'none', color: '#fff',
              borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Save</button>
        </div>
        )}
      </div>

      {/* ── Slide-in keyframe ── */}
      <style>{`
        @keyframes foundationPanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}