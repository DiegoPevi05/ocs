import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { PoleData } from '../types';

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  pole: PoleData;
  onSave: (updated: PoleData) => void;
  onClose: () => void;
}

export function PolePanel({ pole, onSave, onClose }: Props) {
  const [form, setForm] = useState<PoleData>({ ...pole });

  const set = <K extends keyof PoleData>(key: K, val: PoleData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  return (
    <>
      {/* ── Overlay ── */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 200,
        }}
      />

      {/* ── Panel ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'clamp(280px, 25vw, 420px)',
        background: '#111827',
        borderLeft: '1px solid #1e2d45',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'polePanelIn 0.22s ease-out',
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
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pole</div>
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

          {/* Height */}
          <Field label="Height (mm)">
            <input type="number" value={form.h ?? 3000}
              onChange={e => set('h', +e.target.value)} style={INPUT} />
          </Field>

          <Divider label="Catenary Configuration" />

          <Row>
            <Field label="Cantilevers Quantity" hint="Number of catenary wires on this pole">
              <input type="number" min={1} max={4} value={form.cantileversQuantity ?? 1}
                onChange={e => set('cantileversQuantity', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Cat. Separation (mm)" hint="Vertical spacing between catenary wires">
              <input type="number" value={form.catSeparation ?? 720}
                onChange={e => set('catSeparation', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Divider label="Structural & Profile Properties" />

          <Field label="Profile Type">
            <select
              value={form.profileType ?? 'CUSTOM'}
              onChange={e => {
                const pt = e.target.value;
                if (pt === 'CUSTOM') {
                  set('profileType', pt);
                } else {
                  const w = 160; const h = 160; const tf = 13; const tw = 8;
                  const density = 7850;
                  let A=0, Ix=0, Iy=0;
                  if (pt === 'SQUARE_HOLE') {
                    const ts = 5;
                    const iW = w - 2*ts; const iH = h - 2*ts;
                    A = w*h - iW*iH;
                    Ix = (w*Math.pow(h,3) - iW*Math.pow(iH,3))/12;
                    Iy = (h*Math.pow(w,3) - iH*Math.pow(iW,3))/12;
                  } else if (pt === 'CIRCLE_HOLE') {
                    const rO = w/2; const rI = w/2 - 5;
                    A = Math.PI*(rO*rO - rI*rI);
                    Ix = (Math.PI/4)*(Math.pow(rO,4) - Math.pow(rI,4)); Iy = Ix;
                  } else if (pt === 'T_PROFILE') {
                    const As = w*tf; const Aw = tw*(h-tf);
                    A = As + Aw;
                    const yC = (tw*(h-tf)*((h-tf)/2) + w*tf*(h-tf/2))/A;
                    Ix = (w*Math.pow(tf,3)/12) + As*Math.pow(h-tf/2-yC,2) + (tw*Math.pow(h-tf,3)/12) + Aw*Math.pow((h-tf)/2-yC,2);
                    Iy = (tf*Math.pow(w,3)/12) + ((h-tf)*Math.pow(tw,3)/12);
                  } else if (pt === 'DOUBLE_T') {
                    const iH = h - 2*tf;
                    A = 2*(w*tf) + iH*tw;
                    Ix = (w*Math.pow(h,3) - (w-tw)*Math.pow(iH,3))/12;
                    Iy = (2*tf*Math.pow(w,3) + iH*Math.pow(tw,3))/12;
                  }
                  setForm(f => ({
                    ...f, profileType: pt, density,
                    width: w, length: h,
                    crossAreaZ: Math.round(A), crossAreaX: h, crossAreaY: w,
                    inertiaX: Math.round(Ix), inertiaY: Math.round(Iy), inertiaZ: Math.round(Ix + Iy),
                  }));
                }
              }}
              style={INPUT}
            >
              <option value="CUSTOM">Custom / Override</option>
              <option value="SQUARE_HOLE">Square (Hollow)</option>
              <option value="CIRCLE_HOLE">Circle (Hollow)</option>
              <option value="T_PROFILE">T-Profile</option>
              <option value="DOUBLE_T">Double-T (I-Beam)</option>
            </select>
          </Field>

          {/* Cross-section dimensions */}
          <Row>
            <Field label="Width (mm)" hint={form.profileType !== 'CUSTOM' ? 'Set by profile' : undefined}>
              <input
                type="number" value={form.width ?? ''}
                onChange={e => set('width', +e.target.value)}
                disabled={form.profileType !== 'CUSTOM' && !!form.profileType}
                style={{ ...INPUT, opacity: (form.profileType !== 'CUSTOM' && !!form.profileType) ? 0.45 : 1 }}
              />
            </Field>
            <Field label="Length (mm)" hint={form.profileType !== 'CUSTOM' ? 'Set by profile' : undefined}>
              <input
                type="number" value={form.length ?? ''}
                onChange={e => set('length', +e.target.value)}
                disabled={form.profileType !== 'CUSTOM' && !!form.profileType}
                style={{ ...INPUT, opacity: (form.profileType !== 'CUSTOM' && !!form.profileType) ? 0.45 : 1 }}
              />
            </Field>
          </Row>

          <Row>
            <Field label="Density (kg/m³)"><input type="number" value={form.density ?? ''} onChange={e => set('density', +e.target.value)} style={INPUT} /></Field>
            <Field label="Cross Area Z (mm²)"><input type="number" value={form.crossAreaZ ?? ''} onChange={e => set('crossAreaZ', +e.target.value)} style={INPUT} /></Field>
          </Row>

          <Row>
            <Field label="Inertia X (mm⁴)"><input type="number" value={form.inertiaX ?? ''} onChange={e => set('inertiaX', +e.target.value)} style={INPUT} /></Field>
            <Field label="Inertia Y (mm⁴)"><input type="number" value={form.inertiaY ?? ''} onChange={e => set('inertiaY', +e.target.value)} style={INPUT} /></Field>
            <Field label="Inertia Z (mm⁴)"><input type="number" value={form.inertiaZ ?? ''} onChange={e => set('inertiaZ', +e.target.value)} style={INPUT} /></Field>
          </Row>

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
        @keyframes polePanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
