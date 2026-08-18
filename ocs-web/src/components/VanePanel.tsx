import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { VaneData } from '../types';

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

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
    vane: VaneData;
    onSave: (updated: VaneData) => void;
    onCalculate?: (updated: VaneData) => void;
    onClose: () => void;
}

export function VanePanel({ vane, onSave, onCalculate, onClose }: Props) {
    const [form, setForm] = useState<VaneData>({ ...vane });
    const [minimized, setMinimized] = useState(false);

    const set = <K extends keyof VaneData>(key: K, val: VaneData[K]) =>
        setForm(f => ({ ...f, [key]: val }));

    return (
        <>
            {/* ── Panel ── */}
            <div style={{
                position: 'fixed', top: 0, right: 0, bottom: minimized ? 'auto' : 0,
                width: 'clamp(280px, 25vw, 420px)',
                background: 'var(--surface)',
                borderLeft: '1px solid var(--border)',
                borderBottom: minimized ? '1px solid var(--border)' : 'none',
                zIndex: 201,
                display: 'flex', flexDirection: 'column',
                animation: 'cantileverPanelIn 0.22s ease-out',
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
                            <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Vane</div>
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

                    <Divider label="Dropper Configuration" />

                    <Row>
                        <Field label="Qty Droppers" hint="0 = auto-calculated from vane length">
                            <input type="number" min={0} value={form.qtyDroppers ?? 0}
                                onChange={e => set('qtyDroppers', +e.target.value)} style={INPUT} />
                        </Field>
                        <Field label="Initial Separation (mm)" hint="Distance from each end to first/last dropper">
                            <input type="number" min={0} value={form.initialSeparation ?? 5000}
                                onChange={e => set('initialSeparation', +e.target.value)} style={INPUT} />
                        </Field>
                    </Row>

                    <Divider label="Wire Properties" />

                    <Row>
                        <Field label="CW Weight (kg/m)">
                            <input type="number" step={0.0001} value={form.cwWeight ?? 0.0019}
                                onChange={e => set('cwWeight', +e.target.value)} style={INPUT} />
                        </Field>
                        <Field label="CW Tension (N)">
                            <input type="number" value={form.cwTension ?? 1600}
                                onChange={e => set('cwTension', +e.target.value)} style={INPUT} />
                        </Field>
                    </Row>

                    <Row>
                        <Field label="SW Weight (kg/m)">
                            <input type="number" step={0.0001} value={form.swWeight ?? 0.0024}
                                onChange={e => set('swWeight', +e.target.value)} style={INPUT} />
                        </Field>
                        <Field label="SW Tension (N)">
                            <input type="number" value={form.swTension ?? 2000}
                                onChange={e => set('swTension', +e.target.value)} style={INPUT} />
                        </Field>
                    </Row>

                    <Field label="Dropper Weight (kg/m)" hint="Weight per unit length of each dropper">
                        <input type="number" step={0.0001} value={form.dropperWeight ?? 0.0006}
                            onChange={e => set('dropperWeight', +e.target.value)} style={INPUT} />
                    </Field>

                    {form.poleIdx !== undefined && (
                        <>
                            <Divider label="Pole Attachment" />
                            <Row>
                                <Field label="Pole CW Height (mm)">
                                    <input type="number" value={form.poleContactWireHeight ?? 5400}
                                        onChange={e => set('poleContactWireHeight', +e.target.value)} style={INPUT} />
                                </Field>
                                <Field label="Pole System Height (mm)">
                                    <input type="number" value={form.poleSystemHeight ?? 1000}
                                        onChange={e => set('poleSystemHeight', +e.target.value)} style={INPUT} />
                                </Field>
                            </Row>
                        </>
                    )}

                    <Divider label="Lifting Configuration" />

                    <Field label="Lifting Start Distance (mm)" hint="Distance from start where lifting begins. 0 = from start, length/2 = middle.">
                        <input type="number" min={0} value={form.liftingStartDistance ?? ''}
                            placeholder="Defaults to middle of vane"
                            onChange={e => set('liftingStartDistance', e.target.value === '' ? undefined : +e.target.value)} style={INPUT} />
                    </Field>

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
                            padding: '7px 18px', background: '#9333ea',
                            border: 'none', color: '#fff',
                            borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        }}
                    >Save</button>
                </div>
                )}
            </div>

            {/* Reuse the same keyframe from CantileverPanel */}
            <style>{`
        @keyframes cantileverPanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
        </>
    );
}
