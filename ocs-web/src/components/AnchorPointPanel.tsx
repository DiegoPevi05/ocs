import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { AnchorPointData } from '../types';

// ─── Shared style tokens ──────────────────────────────────────────────────────

const INPUT: CSSProperties = {
  width: '100%', padding: '6px 10px',
  background: 'var(--bg)', border: '1px solid var(--border)',
  borderRadius: 4, color: 'var(--text)', fontSize: 12,
  outline: 'none',
};

const LABEL: CSSProperties = {
  display: 'block', fontSize: 10,
  color: 'var(--muted)', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 4,
};

const HINT: CSSProperties = {
  fontSize: 10, color: '#475569', marginTop: 3,
};

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <label style={LABEL}>{label}</label>
      {children}
      {hint && <div style={HINT}>{hint}</div>}
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>;
}

function Divider({ label }: { label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 0' }}>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  anchorPoint: AnchorPointData;
  onSave: (updated: AnchorPointData) => void;
  onClose: () => void;
}

export function AnchorPointPanel({ anchorPoint, onSave, onClose }: Props) {
  const [form, setForm] = useState<AnchorPointData>({ ...anchorPoint });

  const set = <K extends keyof AnchorPointData>(key: K, val: AnchorPointData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'clamp(280px, 25vw, 420px)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'anchorPointPanelIn 0.22s ease-out',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface2)',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anchor Point</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
              {form.label || <span style={{ color: '#475569', fontStyle: 'italic' }}>unnamed</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          <Field label="Label">
            <input
              value={form.label ?? ''}
              onChange={e => set('label', e.target.value)}
              style={INPUT}
              autoFocus
            />
          </Field>

          <Divider label="Position" />

          <Row>
            <Field label="X (m)" hint="World X coordinate">
              <input type="number" step="0.001" value={form.x}
                onChange={e => set('x', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Z (m)" hint="World Z coordinate">
              <input type="number" step="0.001" value={form.z}
                onChange={e => set('z', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {form.D !== undefined && (
            <Field label="D — distance to nearest pole (mm)" hint="Computed from pole positions">
              <input
                type="text" readOnly value={form.D.toFixed(0)}
                style={{ ...INPUT, color: 'var(--muted)', cursor: 'not-allowed' }}
              />
            </Field>
          )}

          <Divider label="Plate Dimensions" />

          <Row>
            <Field label="Width (mm)">
              <input type="number" value={form.width ?? 400}
                onChange={e => set('width', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Length (mm)">
              <input type="number" value={form.length ?? 400}
                onChange={e => set('length', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Field label="Height / Thickness (mm)">
            <input type="number" value={form.height ?? 20}
              onChange={e => set('height', +e.target.value)} style={INPUT} />
          </Field>

          <Divider label="Material" />

          <Field label="Density (kg/m³)">
            <input type="number" value={form.density ?? 7850}
              onChange={e => set('density', +e.target.value)} style={INPUT} />
          </Field>

        </div>

        {/* Footer */}
        <div style={{
          padding: '12px 18px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
          background: 'var(--surface2)',
          flexShrink: 0,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '7px 18px', background: 'none',
              border: '1px solid var(--border)', color: '#94a3b8',
              borderRadius: 4, cursor: 'pointer', fontSize: 13,
            }}
          >Cancel</button>
          <button
            onClick={() => onSave(form)}
            style={{
              padding: '7px 18px', background: 'var(--accent)',
              border: 'none', color: '#fff',
              borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Save</button>
        </div>
      </div>

      <style>{`
        @keyframes anchorPointPanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
