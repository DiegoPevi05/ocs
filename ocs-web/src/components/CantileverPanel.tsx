import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { CantileverData } from '../types';

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

// ─── Small layout helpers ─────────────────────────────────────────────────────

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

// ─── Configurations per catenary system ───────────────────────────────────────

const DOUBLE_WIRE_CONFIGS = [
  { value: 'TDP>2.2', label: 'TDP > 2.2' },
  { value: 'TDP<2.2', label: 'TDP < 2.2' },
  { value: 'CAI',     label: 'CAI' },
  { value: 'SBA',     label: 'SBA' },
];
const SINGLE_WIRE_CONFIGS = [
  { value: 'SBA', label: 'SBA' },
  { value: 'CAI', label: 'CAI' },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  cantilever: CantileverData;
  catenarySystem?: 'DOUBLE_WIRE' | 'SINGLE_WIRE';
  onSave: (updated: CantileverData) => void;
  onCalculate?: (updated: CantileverData) => void;
  onClose: () => void;
}

export function CantileverPanel({ cantilever, catenarySystem, onSave, onCalculate, onClose }: Props) {
  const [form, setForm] = useState<CantileverData>({ ...cantilever });
  const configs = catenarySystem === 'SINGLE_WIRE' ? SINGLE_WIRE_CONFIGS : DOUBLE_WIRE_CONFIGS;

  const set = <K extends keyof CantileverData>(key: K, val: CantileverData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  // pv distance derived from the drawn geometry (read-only display)
  const pvDistance = Math.hypot(form.x2 - form.x1, form.z2 - form.z1).toFixed(0);

  return (
    <>
      {/* ── Panel ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'clamp(280px, 25vw, 420px)',
        background: '#111827',
        borderLeft: '1px solid #1e2d45',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'cantileverPanelIn 0.22s ease-out',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: '1px solid #1e2d45',
          background: '#1c2539',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cantilever</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>
              {form.label || <span style={{ color: '#475569', fontStyle: 'italic' }}>unnamed</span>}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {/* ── Scrollable body ── */}
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

          {/* Configuration */}
          <Field label="Configuration">
            <select
              value={form.configuration ?? configs[0].value}
              onChange={e => {
                const cfg = e.target.value;
                setForm(f => ({
                  ...f,
                  configuration: cfg,
                  registerArmAlpha: cfg === 'CAI' ? -2 : 2,
                }));
              }}
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              {configs.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </Field>

          {/* Wire configuration — per-cantilever override */}
          <Field label="Wire System" hint="Overrides project default for this cantilever">
            <select
              value={form.contactWireConfiguration ?? (catenarySystem === 'SINGLE_WIRE' ? 'SINGLE' : 'DOUBLE')}
              onChange={e => set('contactWireConfiguration', e.target.value as 'SINGLE' | 'DOUBLE')}
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              <option value="DOUBLE">Double Wire</option>
              <option value="SINGLE">Single Wire</option>
            </select>
          </Field>

          <Divider label="Main Parameters" />

          {/* Heights */}
          <Row>
            <Field label="Contact Wire Height (mm)">
              <input type="number" value={form.contactWireHeight ?? 5400}
                onChange={e => set('contactWireHeight', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="System Height (mm)">
              <input type="number" value={form.systemHeight ?? 1000}
                onChange={e => set('systemHeight', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* CW offset + zigzag */}
          <Row>
            <Field label="CW Vertical Offset (mm)" hint="Offset below messenger wire">
              <input type="number" value={form.contactWireVerticalOffset ?? 120}
                onChange={e => set('contactWireVerticalOffset', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Zigzag (mm)" hint="+ / − along track">
              <input type="number" value={form.zigzag ?? 250}
                onChange={e => set('zigzag', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* PV (read-only display) + support offset */}
          <Row>
            <Field label="PV — pole ↔ track (mm)" hint="Derived from drawn position">
              <input
                type="text"
                readOnly
                value={pvDistance}
                style={{ ...INPUT, color: '#64748b', cursor: 'not-allowed' }}
              />
            </Field>
            <Field label="Support Offset (mm)">
              <input type="number" value={form.supportOffset ?? 1440}
                onChange={e => set('supportOffset', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* Bottom fixed + fixing distance */}
          <Row>
            <Field label="Bottom Fixed Height (mm)">
              <input type="number" value={form.bottomFixedHeight ?? 5440}
                onChange={e => set('bottomFixedHeight', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Fixing Distance (mm)">
              <input type="number" value={form.fixingDistance ?? 1500}
                onChange={e => set('fixingDistance', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* U + track gauge */}
          <Row>
            <Field label="U — superelevation (mm)" hint="Track cant / tilt">
              <input type="number" value={form.u ?? 0}
                onChange={e => set('u', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Track Gauge (mm)">
              <input type="number" value={form.trackGauge ?? 1435}
                onChange={e => set('trackGauge', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* Curve direction */}
          <Field label="Curve Direction">
            <select
              value={form.curveRadiusDirection ?? 'inside'}
              onChange={e => set('curveRadiusDirection', e.target.value)}
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              <option value="inside">Inside</option>
              <option value="outside">Outside</option>
            </select>
          </Field>

          <Divider label="Arm Geometry" />

          <Row>
            <Field label="Steady Arm α (°)" hint="Tilt angle of steady arm">
              <input type="number" step="0.1" value={form.steadyArmAlpha ?? -2}
                onChange={e => set('steadyArmAlpha', +e.target.value)} style={INPUT} />
            </Field>
            {(form.configuration === 'TDP>2.2' || form.configuration === 'CAI' || !form.configuration) && (
              <Field label="Steady Arm Length (mm)" hint="Horizontal arm reach (TDP>2.2 / CAI)">
                <input type="number" value={form.steadyArmLength ?? 1200}
                  onChange={e => set('steadyArmLength', +e.target.value)} style={INPUT} />
              </Field>
            )}
          </Row>

          {(form.configuration === 'TDP>2.2' || form.configuration === 'CAI' || !form.configuration) && (
            <Row>
              <Field label="Register Arm α (°)" hint="Tilt angle of register arm">
                <input type="number" step="0.1"
                  value={form.registerArmAlpha ?? (form.configuration === 'CAI' ? -2 : 2)}
                  onChange={e => set('registerArmAlpha', +e.target.value)} style={INPUT} />
              </Field>
            </Row>
          )}

        </div>

        {/* ── Footer ── */}
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

          {onCalculate && (
            <button
              onClick={() => onCalculate(form)}
              style={{
                padding: '7px 18px', background: '#eab308',
                border: 'none', color: '#111',
                borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
              }}
            >Calculate</button>
          )}

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

      {/* ── Slide-in keyframe ── */}
      <style>{`
        @keyframes cantileverPanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
