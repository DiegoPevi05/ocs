import { useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { ProjectSettings } from '../types';
import { DEFAULT_PROJECT_SETTINGS } from '../types';

// ─── Style tokens ─────────────────────────────────────────────────────────────

const INPUT: CSSProperties = {
  width: '100%', padding: '6px 10px',
  background: '#0a0e1a', border: '1px solid #1e2d45',
  borderRadius: 4, color: '#e2e8f0', fontSize: 12,
  outline: 'none', boxSizing: 'border-box',
};

const LABEL: CSSProperties = {
  display: 'block', fontSize: 10,
  color: '#64748b', textTransform: 'uppercase',
  letterSpacing: '0.06em', marginBottom: 4,
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

function Row({ children }: { children: ReactNode }) {
  return <div style={{ display: 'flex', gap: 10 }}>{children}</div>;
}

function Section({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '8px 0 4px' }}>
      <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
      <span style={{ fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{title}</span>
      <div style={{ flex: 1, height: 1, background: '#1e2d45' }} />
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  settings: ProjectSettings;
  onSave: (updated: ProjectSettings) => void;
  onClose: () => void;
}

export function ProjectSettingsPanel({ settings, onSave, onClose }: Props) {
  const [form, setForm] = useState<ProjectSettings>({ ...DEFAULT_PROJECT_SETTINGS, ...settings });

  const setP = <K extends keyof ProjectSettings['pole']>(key: K, val: ProjectSettings['pole'][K]) =>
    setForm(f => ({ ...f, pole: { ...f.pole, [key]: val } }));
  const setC = <K extends keyof ProjectSettings['cantilever']>(key: K, val: ProjectSettings['cantilever'][K]) =>
    setForm(f => ({ ...f, cantilever: { ...f.cantilever, [key]: val } }));
  const setV = <K extends keyof ProjectSettings['vane']>(key: K, val: ProjectSettings['vane'][K]) =>
    setForm(f => ({ ...f, vane: { ...f.vane, [key]: val } }));
  const setAP = <K extends keyof ProjectSettings['anchorPoint']>(key: K, val: ProjectSettings['anchorPoint'][K]) =>
    setForm(f => ({ ...f, anchorPoint: { ...f.anchorPoint, [key]: val } }));

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: 'clamp(320px, 28vw, 480px)',
        background: '#111827',
        borderLeft: '1px solid #1e2d45',
        zIndex: 201,
        display: 'flex', flexDirection: 'column',
        animation: 'settingsPanelIn 0.22s ease-out',
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
            <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Project</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>Default Settings</div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '0 4px' }}
          >×</button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>

          {/* ── Catenary System ── */}
          <Section title="Catenary System" />
          <Field label="Wire System">
            <select
              value={form.catenarySystem}
              onChange={e => setForm(f => ({ ...f, catenarySystem: e.target.value as ProjectSettings['catenarySystem'] }))}
              style={{ ...INPUT, cursor: 'pointer' }}
            >
              <option value="DOUBLE_WIRE">Double Wire System (Bifilaire)</option>
              <option value="SINGLE_WIRE">Single Wire System (Monofilaire)</option>
            </select>
          </Field>

          {/* ── Poles ── */}
          <Section title="Pole Defaults" />

          <Row>
            <Field label="Height (mm)">
              <input type="number" value={form.pole.height}
                onChange={e => setP('height', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Square Hollow — Width (mm)">
              <input type="number" value={form.pole.squareHollowWidth}
                onChange={e => setP('squareHollowWidth', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Square Hollow — Length (mm)">
              <input type="number" value={form.pole.squareHollowLength}
                onChange={e => setP('squareHollowLength', +e.target.value)} style={INPUT} />
            </Field>
          </Row>
          <Row>
            <Field label="Square Hollow — Wall Thickness (mm)">
              <input type="number" value={form.pole.squareHollowThickness}
                onChange={e => setP('squareHollowThickness', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Circle Hollow — Diameter (mm)">
              <input type="number" value={form.pole.circleHollowDiameter}
                onChange={e => setP('circleHollowDiameter', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Circle Hollow — Wall Thickness (mm)">
              <input type="number" value={form.pole.circleHollowThickness}
                onChange={e => setP('circleHollowThickness', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* ── Cantilevers ── */}
          <Section title="Cantilever Defaults" />

          <Row>
            <Field label="Contact Wire Height (mm)">
              <input type="number" value={form.cantilever.contactWireHeight}
                onChange={e => setC('contactWireHeight', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="System Height (mm)">
              <input type="number" value={form.cantilever.systemHeight}
                onChange={e => setC('systemHeight', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="CW Vertical Offset (mm)">
              <input type="number" value={form.cantilever.contactWireVerticalOffset}
                onChange={e => setC('contactWireVerticalOffset', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Zigzag (mm)">
              <input type="number" value={form.cantilever.zigzag}
                onChange={e => setC('zigzag', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Support Offset (mm)">
              <input type="number" value={form.cantilever.supportOffset}
                onChange={e => setC('supportOffset', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Bottom Fixed Height (mm)">
              <input type="number" value={form.cantilever.bottomFixedHeight}
                onChange={e => setC('bottomFixedHeight', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Fixing Distance (mm)">
              <input type="number" value={form.cantilever.fixingDistance}
                onChange={e => setC('fixingDistance', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="U — Superelevation (mm)">
              <input type="number" value={form.cantilever.u}
                onChange={e => setC('u', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Track Gauge (mm)">
              <input type="number" value={form.cantilever.trackGauge}
                onChange={e => setC('trackGauge', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* ── Vanes ── */}
          <Section title="Vane Defaults" />

          <Row>
            <Field label="CW Weight (kg/m)">
              <input type="number" step={0.0001} value={form.vane.cwWeight}
                onChange={e => setV('cwWeight', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="SW Weight (kg/m)">
              <input type="number" step={0.0001} value={form.vane.swWeight}
                onChange={e => setV('swWeight', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="CW Tension (N)">
              <input type="number" value={form.vane.cwTension}
                onChange={e => setV('cwTension', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="SW Tension (N)">
              <input type="number" value={form.vane.swTension}
                onChange={e => setV('swTension', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Dropper Weight (kg/m)">
              <input type="number" step={0.0001} value={form.vane.dropperWeight}
                onChange={e => setV('dropperWeight', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Initial Separation (mm)">
              <input type="number" value={form.vane.initialSeparation}
                onChange={e => setV('initialSeparation', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Qty Droppers (0 = auto)">
              <input type="number" min={0} value={form.vane.qtyDroppers}
                onChange={e => setV('qtyDroppers', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Lifting Start Dist. (mm)">
              <input type="number" min={0} value={form.vane.liftingStartDistance ?? ''}
                placeholder="Length / 2"
                onChange={e => setV('liftingStartDistance', e.target.value === '' ? undefined : +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Section title="Report" />
          <Row>
            <Field label="Max Dropper Columns" hint="Maximum droppers to show in a single row for the PDF report.">
              <input type="number" min={1} value={form.vane.reportMaxDroppers ?? 11}
                onChange={e => setV('reportMaxDroppers', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          {/* ── Anchor Point ── */}
          <Section title="Anchor Point Defaults" />

          <Row>
            <Field label="Width (mm)">
              <input type="number" value={form.anchorPoint.width}
                onChange={e => setAP('width', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Length (mm)">
              <input type="number" value={form.anchorPoint.length}
                onChange={e => setAP('length', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Height / Thickness (mm)">
              <input type="number" value={form.anchorPoint.height}
                onChange={e => setAP('height', +e.target.value)} style={INPUT} />
            </Field>
            <Field label="Density (kg/m³)">
              <input type="number" value={form.anchorPoint.density}
                onChange={e => setAP('density', +e.target.value)} style={INPUT} />
            </Field>
          </Row>

          <Row>
            <Field label="Fixing Point Height (mm)">
              <input type="number" value={form.anchorPoint.fixingPointHeight}
                onChange={e => setAP('fixingPointHeight', +e.target.value)} style={INPUT} />
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
          >Save Settings</button>
        </div>
      </div>

      <style>{`
        @keyframes settingsPanelIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  );
}
