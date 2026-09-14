import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { PoleData, ProjectSettings } from '../types';
import { DEFAULT_PROJECT_SETTINGS } from '../types';

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
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
      <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  );
}

// ─── Section property calculator ──────────────────────────────────────────────

function calcSectionProps(profileType: string, width: number, length: number, thickness: number) {
  const w = width, h = length, ts = thickness;
  const tf = 13, tw = 8; // fixed flange / web thickness for T profiles
  let A = 0, Ix = 0, Iy = 0;

  if (profileType === 'SQUARE_HOLE') {
    const iW = w - 2 * ts, iH = h - 2 * ts;
    if (iW > 0 && iH > 0) {
      A = w * h - iW * iH;
      Ix = (w * Math.pow(h, 3) - iW * Math.pow(iH, 3)) / 12;
      Iy = (h * Math.pow(w, 3) - iH * Math.pow(iW, 3)) / 12;
    }
  } else if (profileType === 'CIRCLE_HOLE') {
    const rO = w / 2, rI = w / 2 - ts;
    if (rI > 0) {
      A = Math.PI * (rO * rO - rI * rI);
      Ix = (Math.PI / 4) * (Math.pow(rO, 4) - Math.pow(rI, 4));
      Iy = Ix;
    }
  } else if (profileType === 'T_PROFILE') {
    const As = w * tf, Aw = tw * (h - tf);
    A = As + Aw;
    if (A > 0) {
      const yC = (tw * (h - tf) * ((h - tf) / 2) + w * tf * (h - tf / 2)) / A;
      Ix = (w * Math.pow(tf, 3) / 12) + As * Math.pow(h - tf / 2 - yC, 2)
        + (tw * Math.pow(h - tf, 3) / 12) + Aw * Math.pow((h - tf) / 2 - yC, 2);
      Iy = (tf * Math.pow(w, 3) / 12) + ((h - tf) * Math.pow(tw, 3) / 12);
    }
  } else if (profileType === 'DOUBLE_T') {
    const iH = h - 2 * tf;
    A = 2 * (w * tf) + iH * tw;
    Ix = (w * Math.pow(h, 3) - (w - tw) * Math.pow(iH, 3)) / 12;
    Iy = (2 * tf * Math.pow(w, 3) + iH * Math.pow(tw, 3)) / 12;
  }

  return { A: Math.round(A), Ix: Math.round(Ix), Iy: Math.round(Iy) };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  pole: PoleData;
  settings?: ProjectSettings;
  /** This pole's cantilevers in their current effective order (position-sorted, or
   * pole.cantileverOrder when set) — used to display/reorder them. */
  cantileverSlots?: { id: string; label: string }[];
  onSave: (updated: PoleData) => void;
  onClose: () => void;
}

export function PolePanel({ pole, settings, cantileverSlots = [], onSave, onClose }: Props) {
  const s = settings ?? DEFAULT_PROJECT_SETTINGS;
  const [form, setForm] = useState<PoleData>({ ...pole });
  const [minimized, setMinimized] = useState(false);
  const [reordering, setReordering] = useState(false);

  const set = <K extends keyof PoleData>(key: K, val: PoleData[K]) =>
    setForm(f => ({ ...f, [key]: val }));

  // Effective display order: explicit form.cantileverOrder when set, else the
  // position-sorted default order passed in via cantileverSlots.
  const orderedSlots = (() => {
    const order = form.cantileverOrder;
    if (!order || order.length === 0) return cantileverSlots;
    const byId = new Map(cantileverSlots.map(cs => [cs.id, cs]));
    const out: typeof cantileverSlots = [];
    order.forEach(id => { const cs = byId.get(id); if (cs) { out.push(cs); byId.delete(id); } });
    byId.forEach(cs => out.push(cs)); // any not-yet-listed slot appended at the end
    return out;
  })();

  const moveSlot = (from: number, to: number) => {
    if (to < 0 || to >= orderedSlots.length) return;
    const ids = orderedSlots.map(s => s.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved);
    set('cantileverOrder', ids);
  };

  /** Re-compute section properties from current form dimensions. */
  const recompute = (pt: string, w: number, h: number, ts: number) => {
    const { A, Ix, Iy } = calcSectionProps(pt, w, h, ts);
    setForm(f => ({
      ...f,
      crossAreaZ: A,
      crossAreaX: h,
      crossAreaY: w,
      inertiaX: Ix,
      inertiaY: Iy,
      inertiaZ: Math.round(Ix + Iy),
    }));
  };

  const isAutoCalc = !!form.profileType && form.profileType !== 'CUSTOM';
  const isHollow = form.profileType === 'SQUARE_HOLE' || form.profileType === 'CIRCLE_HOLE';

  return (
    <>
      {/* No full-screen overlay here (unlike a modal) — the pole panel is a slide-in side
          panel, so the canvas behind it stays interactive: the user can still click/select
          another pole or cantilever in the viewport while this is open. */}

      {/* ── Panel ── */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: minimized ? 'auto' : 0,
        width: 'clamp(280px, 25vw, 420px)',
        background: 'var(--surface)',
        borderLeft: '1px solid var(--border)',
        borderBottom: minimized ? '1px solid var(--border)' : 'none',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'polePanelIn 0.22s ease-out',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
        transition: 'bottom 0.2s ease-in-out',
      }}>

        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          borderBottom: minimized ? 'none' : '1px solid var(--border)',
          background: 'var(--surface2)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setMinimized(!minimized)}
              style={{
                background: 'none', border: 'none', color: 'var(--muted)',
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
                <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pole</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 2 }}>
                {form.label || <span style={{ color: '#475569', fontStyle: 'italic' }}>unnamed</span>}
                </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
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

          <Row>
            {/* Elevation */}
            <Field label="Y Elevation (mm)" hint={form.foundationIdx !== undefined ? "Linked to foundation — editing this also updates the foundation's elevation." : "Vertical offset from base track level."}>
              <input type="number" value={form.y ?? 0}
                onChange={e => set('y', +e.target.value)} style={INPUT} />
            </Field>

            {/* Height */}
            <Field label="Height (mm)">
              <input type="number" value={form.h ?? s.pole.height}
                onChange={e => set('h', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Divider label="Catenary Configuration" />

          <Row>
            <Field label="Cantilevers" hint="Draw arms near this pole with the Cantilever tool">
              <div style={{ ...INPUT, display: 'flex', alignItems: 'center', color: 'var(--text)' }}>
                {orderedSlots.length} {orderedSlots.length === 1 ? 'cantilever' : 'cantilevers'}
              </div>
            </Field>
            <Field label="Cat. Separation (mm)" hint="Equidistant spacing between this pole's cantilevers">
              <input type="number" value={form.catSeparation ?? 720}
                onChange={e => set('catSeparation', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {orderedSlots.length > 1 && (
            <div>
              <button
                onClick={() => setReordering(r => !r)}
                style={{
                  width: '100%', padding: '6px 10px', background: 'var(--bg)',
                  border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)',
                  fontSize: 12, cursor: 'pointer', textAlign: 'left',
                }}
              >
                {reordering ? '▾' : '▸'} Reorder Cantilevers ({orderedSlots.length})
              </button>
              {reordering && (
                <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {orderedSlots.map((slot, i) => (
                    <div key={slot.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '5px 8px', background: 'var(--bg)',
                      border: '1px solid var(--border)', borderRadius: 4,
                    }}>
                      <span style={{ fontSize: 10, color: 'var(--muted)', width: 16, textAlign: 'center' }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.label}</span>
                      <button
                        disabled={i === 0}
                        onClick={() => moveSlot(i, i - 1)}
                        title="Move left"
                        style={{ background: 'none', border: 'none', color: i === 0 ? '#334155' : 'var(--muted)', cursor: i === 0 ? 'default' : 'pointer', fontSize: 13, padding: '0 4px' }}
                      >◀</button>
                      <button
                        disabled={i === orderedSlots.length - 1}
                        onClick={() => moveSlot(i, i + 1)}
                        title="Move right"
                        style={{ background: 'none', border: 'none', color: i === orderedSlots.length - 1 ? '#334155' : 'var(--muted)', cursor: i === orderedSlots.length - 1 ? 'default' : 'pointer', fontSize: 13, padding: '0 4px' }}
                      >▶</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <Divider label="Structural & Profile Properties" />

          <Field label="Profile Type">
            <select
              value={form.profileType ?? 'CUSTOM'}
              onChange={e => {
                const pt = e.target.value;
                if (pt === 'CUSTOM') {
                  set('profileType', pt);
                } else {
                  // Pick default dimensions from project settings
                  let w = 160, h = 160, ts = 5;
                  if (pt === 'SQUARE_HOLE') {
                    w = s.pole.squareHollowWidth;
                    h = s.pole.squareHollowLength;
                    ts = s.pole.squareHollowThickness;
                  } else if (pt === 'CIRCLE_HOLE') {
                    w = s.pole.circleHollowDiameter;
                    ts = s.pole.circleHollowThickness;
                    h = ts; // not used for circle, but set length = thickness for display
                  }
                  const { A, Ix, Iy } = calcSectionProps(pt, w, h, ts);
                  setForm(f => ({
                    ...f,
                    profileType: pt,
                    density: 7850,
                    width: w,
                    length: pt === 'CIRCLE_HOLE' ? ts : h,
                    sectionThickness: ts,
                    crossAreaZ: A,
                    crossAreaX: h,
                    crossAreaY: w,
                    inertiaX: Ix,
                    inertiaY: Iy,
                    inertiaZ: Math.round(Ix + Iy),
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

          {/* Cross-section dimensions — always editable; auto-calc triggers for non-CUSTOM */}
          <Row>
            <Field
              label={form.profileType === 'CIRCLE_HOLE' ? 'Diameter (mm)' : 'Width (mm)'}
              hint={isAutoCalc ? 'Edits auto-recalculate properties' : undefined}
            >
              <input
                type="number"
                value={form.width ?? ''}
                onChange={e => {
                  const w = +e.target.value;
                  set('width', w);
                  if (isAutoCalc) {
                    const h = form.profileType === 'CIRCLE_HOLE'
                      ? (form.sectionThickness ?? 5)
                      : (form.length ?? 160);
                    recompute(form.profileType!, w, h, form.sectionThickness ?? 5);
                  }
                }}
                style={INPUT}
              />
            </Field>
            {form.profileType !== 'CIRCLE_HOLE' && (
              <Field label="Length (mm)" hint={isAutoCalc ? 'Edits auto-recalculate properties' : undefined}>
                <input
                  type="number"
                  value={form.length ?? ''}
                  onChange={e => {
                    const h = +e.target.value;
                    set('length', h);
                    if (isAutoCalc) {
                      recompute(form.profileType!, form.width ?? 160, h, form.sectionThickness ?? 5);
                    }
                  }}
                  style={INPUT}
                />
              </Field>
            )}
          </Row>

          {/* Wall thickness — only for hollow sections */}
          {isHollow && (
            <Row>
              <Field label="Wall Thickness (mm)" hint="Edits auto-recalculate properties">
                <input
                  type="number"
                  value={form.sectionThickness ?? 5}
                  onChange={e => {
                    const ts = +e.target.value;
                    set('sectionThickness', ts);
                    const w = form.width ?? 160;
                    const h = form.profileType === 'CIRCLE_HOLE' ? ts : (form.length ?? 160);
                    recompute(form.profileType!, w, h, ts);
                  }}
                  style={INPUT}
                />
              </Field>
            </Row>
          )}

          <Row>
            <Field label="Density (kg/m³)">
              <input type="number" value={form.density ?? ''} onChange={e => set('density', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Cross Area Z (mm²)" hint={isAutoCalc ? 'Auto' : undefined}>
              <input type="number" value={form.crossAreaZ ?? ''} onChange={e => set('crossAreaZ', +e.target.value)}
                style={{ ...INPUT, borderColor: isAutoCalc ? '#1e3a5f' : 'var(--border)' }} />
            </Field>
          </Row>

          <Row>
            <Field label="Inertia X (mm⁴)" hint={isAutoCalc ? 'Auto' : undefined}>
              <input type="number" value={form.inertiaX ?? ''} onChange={e => set('inertiaX', +e.target.value)}
                style={{ ...INPUT, borderColor: isAutoCalc ? '#1e3a5f' : 'var(--border)' }} />
            </Field>
            <Field label="Inertia Y (mm⁴)" hint={isAutoCalc ? 'Auto' : undefined}>
              <input type="number" value={form.inertiaY ?? ''} onChange={e => set('inertiaY', +e.target.value)}
                style={{ ...INPUT, borderColor: isAutoCalc ? '#1e3a5f' : 'var(--border)' }} />
            </Field>
            <Field label="Inertia Z (mm⁴)" hint={isAutoCalc ? 'Auto' : undefined}>
              <input type="number" value={form.inertiaZ ?? ''} onChange={e => set('inertiaZ', +e.target.value)}
                style={{ ...INPUT, borderColor: isAutoCalc ? '#1e3a5f' : 'var(--border)' }} />
            </Field>
          </Row>

          {isAutoCalc && (
            <div style={{ fontSize: 10, color: '#334155', borderTop: '1px solid var(--border)', paddingTop: 6 }}>
              Blue-bordered fields are auto-calculated from dimensions. You can still override them directly.
            </div>
          )}

        </div>
        )}

        {/* ── Footer ── */}
        {!minimized && (
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
            onClick={() => onSave({ ...form, cantileversQuantity: orderedSlots.length || form.cantileversQuantity })}
            style={{
              padding: '7px 18px', background: 'var(--accent)',
              border: 'none', color: '#fff',
              borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            }}
          >Save</button>
        </div>
        )}
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
