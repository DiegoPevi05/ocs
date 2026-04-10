import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { AnchorData } from '../types';

// ─── Shared style tokens ──────────────────────────────────────────────────────

const INPUT: CSSProperties = {
  width: '100%', padding: '6px 10px',
  background: '#0a0e1a', border: '1px solid #1e2d45',
  borderRadius: 4, color: '#e2e8f0', fontSize: 12,
  outline: 'none',
};

const LABEL: CSSProperties = {
  display: 'block', fontSize: 10,
  color: '#64748b', textTransform: 'uppercase',
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
      <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
      <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  anchor: AnchorData;
  poleLabel?: string;
  anchorPointLabel?: string;
  onSave: (updated: AnchorData) => void;
  onClose: () => void;
}

export function AnchorPanel({ anchor, poleLabel, anchorPointLabel, onSave, onClose }: Props) {
  const [form, setForm] = useState<AnchorData>({ ...anchor });

  const set = <K extends keyof AnchorData>(key: K, val: AnchorData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <>
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'clamp(280px, 25vw, 420px)',
        background: '#111827',
        borderLeft: '1px solid #1e2d45',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'anchorPanelIn 0.22s ease-out',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid #1e2d45',
          background: '#1c2539',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Anchor</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>
              {form.label || <span style={{ color: '#475569', fontStyle: 'italic' }}>unnamed</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
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

          <Divider label="Connections" />

          <Row>
            <Field label="Pole" hint="Snapped during drawing">
              <input type="text" readOnly
                value={poleLabel ?? `Pole ${form.poleIdx + 1}`}
                style={{ ...INPUT, color: '#64748b', cursor: 'not-allowed' }} />
            </Field>
            <Field label="Anchor Point" hint="Snapped during drawing">
              <input type="text" readOnly
                value={anchorPointLabel ?? `AP ${form.anchorPointIdx + 1}`}
                style={{ ...INPUT, color: '#64748b', cursor: 'not-allowed' }} />
            </Field>
          </Row>

          <Divider label="Parameters" />

          <Field label="Fixing Point Height (mm)" hint="Height on pole face from base">
            <input type="number" value={form.fixingPointHeight ?? 500}
              onChange={e => set('fixingPointHeight', +e.target.value)} style={INPUT} />
          </Field>

          <Row>
            <Field label="Density (kg/m³)">
              <input type="number" value={form.density ?? 7850}
                onChange={e => set('density', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Cross Section (mm²)">
              <input type="number" value={form.crossSection ?? 100}
                onChange={e => set('crossSection', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

        </div>

        {/* Footer */}
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
              borderRadius: 4, cursor: 'pointer', fontSize: 13,
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
      </div>

      <style>{`
        @keyframes anchorPanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
