import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MousePointer2,
  Minus,
  CircleDot,
  GitMerge,
  Link2,
  Box,
  Square,
  RotateCcw,
  ArrowLeft,
  Save,
} from 'lucide-react';
import { ViewerEngine } from '../viewer/ViewerEngine';
import { api, parseSceneData } from '../lib/api';
import type { DrawMode, ViewMode, SceneData, Location } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Closest XZ point on polyline (handles arcs via sampling). */
function closestPointOnTracks(
  tracks: { x: number; z: number; y?: number; r?: number; label?: string }[][],
  px: number,
  pz: number
): { x: number; z: number } {
  let footX = px, footZ = pz, minDist = Infinity;

  const checkStraight = (ax: number, az: number, bx: number, bz: number) => {
    const dx = bx - ax, dz = bz - az, len2 = dx * dx + dz * dz;
    if (len2 === 0) return;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / len2));
    const qx = ax + t * dx, qz = az + t * dz;
    const d = Math.hypot(px - qx, pz - qz);
    if (d < minDist) { minDist = d; footX = qx; footZ = qz; }
  };

  tracks.forEach(tr => {
    for (let i = 1; i < tr.length; i++) {
      const prev = tr[i - 1], curr = tr[i];
      if (curr.r && Math.abs(curr.r) > 1) {
        const chord = Math.hypot(curr.x - prev.x, curr.z - prev.z);
        const R = Math.abs(curr.r);
        if (R > chord / 2) {
          const mx = (prev.x + curr.x) / 2, mz = (prev.z + curr.z) / 2;
          const ux = (curr.x - prev.x) / chord, uz = (curr.z - prev.z) / chord;
          const h = Math.sqrt(R * R - (chord / 2) * (chord / 2));
          const sign = curr.r > 0 ? 1 : -1;
          const cx = mx - uz * h * sign, cz = mz + ux * h * sign;
          const sa = Math.atan2(prev.z - cz, prev.x - cx);
          const ea = Math.atan2(curr.z - cz, curr.x - cx);
          // determine sweep direction matching the arc sign convention
          let sweep = ea - sa;
          if (curr.r > 0 && sweep > 0) sweep -= 2 * Math.PI;
          if (curr.r < 0 && sweep < 0) sweep += 2 * Math.PI;
          for (let s = 0; s <= 64; s++) {
            const a = sa + sweep * s / 64;
            const qx = cx + R * Math.cos(a), qz = cz + R * Math.sin(a);
            const d = Math.hypot(px - qx, pz - qz);
            if (d < minDist) { minDist = d; footX = qx; footZ = qz; }
          }
          continue;
        }
      }
      checkStraight(prev.x, prev.z, curr.x, curr.z);
    }
  });

  return { x: footX, z: footZ };
}

// ─── ToolButton ───────────────────────────────────────────────────────────────

interface ToolButtonProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
  title?: string;
  onClick: () => void;
}

function ToolButton({ icon, label, active, disabled, title, onClick }: ToolButtonProps) {
  return (
    <button
      className={`tool-btn${active ? ' tool-btn--active' : ''}${disabled ? ' tool-btn--disabled' : ''}`}
      onClick={onClick}
      title={title ?? label}
      disabled={disabled}
    >
      <span className="tool-btn__icon">{icon}</span>
      <span className="tool-btn__label">{label}</span>
    </button>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span className="legend-label">{label}</span>
    </div>
  );
}

// ─── EditorPage ───────────────────────────────────────────────────────────────

export default function EditorPage() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();

  const [location, setLocation] = useState<Location | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [trackMode, setTrackMode] = useState<'rect' | 'poly'>('rect');
  const [autoSnap, setAutoSnap] = useState(true);

  // Drawing state
  const [completedTracks, setCompletedTracks] = useState<{ x: number; z: number; y?: number; r?: number; label?: string }[][]>([]);
  const [trackPoints, setTrackPoints] = useState<{ x: number; z: number; y?: number; r?: number }[]>([]);
  const [poles, setPoles] = useState<{ x: number; z: number; y?: number; h?: number; label?: string }[]>([]);
  const [cantilevers, setCantilevers] = useState<{ x1: number; z1: number; x2: number; z2: number; label?: string }[]>([]);
  const [vanes, setVanes] = useState<{ x1: number; z1: number; x2: number; z2: number; label?: string }[]>([]);
  const [vanePoints, setVanePoints] = useState<{ x: number; z: number }[]>([]);

  // Selection
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [selectedPoles, setSelectedPoles] = useState<number[]>([]);
  const [selFilter, setSelFilter] = useState({ tracks: true, poles: true });

  // Modals
  const [poleModal, setPoleModal] = useState<{ x: number; z: number; y: number } | null>(null);
  const [trackModal, setTrackModal] = useState<{ x: number; z: number; y?: number; r?: number }[] | null>(null);
  const [cantileverModal, setCantileverModal] = useState<{ x1: number; z1: number; x2: number; z2: number } | null>(null);
  const [vaneModal, setVaneModal] = useState<{ x1: number; z1: number; x2: number; z2: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ViewerEngine | null>(null);

  // Stable refs
  const completedTracksRef = useRef(completedTracks);
  useEffect(() => { completedTracksRef.current = completedTracks; }, [completedTracks]);
  const polesRef = useRef(poles);
  useEffect(() => { polesRef.current = poles; }, [poles]);
  const selFilterRef = useRef(selFilter);
  useEffect(() => { selFilterRef.current = selFilter; }, [selFilter]);
  const trackPointsRef = useRef(trackPoints);
  useEffect(() => { trackPointsRef.current = trackPoints; }, [trackPoints]);
  const selectedTracksRef = useRef(selectedTracks);
  useEffect(() => { selectedTracksRef.current = selectedTracks; }, [selectedTracks]);
  const selectedPolesRef = useRef(selectedPoles);
  useEffect(() => { selectedPolesRef.current = selectedPoles; }, [selectedPoles]);
  const cantileversRef = useRef(cantilevers);
  useEffect(() => { cantileversRef.current = cantilevers; }, [cantilevers]);
  const vanePointsRef = useRef(vanePoints);
  useEffect(() => { vanePointsRef.current = vanePoints; }, [vanePoints]);

  // Mount engine
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new ViewerEngine(containerRef.current);
    engineRef.current = engine;
    return () => { engine.dispose(); engineRef.current = null; };
  }, []);

  // Load location scene data
  useEffect(() => {
    if (!locationId) return;
    api.locations.get(locationId).then(loc => {
      setLocation(loc);
      const scene = parseSceneData(loc);
      if (scene) {
        // Restore state from scene
        setCompletedTracks(scene.tracks.map(t => t.points.map(p => ({ ...p, label: t.label }))));
        setPoles(scene.poles);
        setCantilevers(scene.cantilevers);
        setVanes(scene.vanes);
      }
    }).catch(() => {/* offline / no API — editor still works with empty scene */});
  }, [locationId]);

  // Sync dynamic geometry to engine
  useEffect(() => {
    engineRef.current?.setDynamicGeometry({
      trackPoints, poles, completedTracks, selectedTracks, selectedPoles,
      cantileverPoints: [], cantilevers, vanes, vanePoints,
    });
  }, [trackPoints, poles, completedTracks, selectedTracks, selectedPoles, cantilevers, vanes, vanePoints]);

  // Sync track mode
  useEffect(() => { if (engineRef.current) engineRef.current.trackMode = trackMode; }, [trackMode]);
  useEffect(() => { if (engineRef.current) engineRef.current.enableSnap = autoSnap; }, [autoSnap]);

  // Save to API
  const saveScene = useCallback(async (
    tracks = completedTracksRef.current,
    poleList = polesRef.current,
    cantList = cantileversRef.current,
  ) => {
    if (!locationId || !location) return;
    // Build SceneData from state
    const labelMap = new Map<string, { x: number; z: number; y?: number; r?: number; label?: string }[]>();
    tracks.forEach(tr => {
      const lbl = (tr[0] as any)?.label ?? '';
      if (!labelMap.has(lbl)) labelMap.set(lbl, []);
      labelMap.get(lbl)!.push(...tr);
    });
    const trackData = Array.from(labelMap.entries()).map(([label, pts]) => ({
      label,
      points: pts.map(({ label: _l, ...rest }) => rest),
    }));
    const scene: SceneData = {
      tracks: trackData,
      poles: poleList,
      cantilevers: cantList,
      vanes,
    };
    setSaving(true);
    setSaveError(null);
    try {
      await api.locations.update(locationId, location.name, scene);
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }, [locationId, location, vanes]);

  // viewer-click handler
  useEffect(() => {
    const handleViewerClick = (e: Event) => {
      const { x, z, y, r, mode } = (e as CustomEvent).detail;

      if (mode === 'track') {
        const newPoints = [...trackPointsRef.current, { x, z, y, r }];
        if (newPoints.length >= 2) {
          const threshold = 50;
          const isMatch = (a: { x: number; z: number }, b: { x: number; z: number }) =>
            Math.abs(a.x - b.x) < threshold && Math.abs(a.z - b.z) < threshold;
          let matchedLabel = '';
          for (const tr of completedTracksRef.current) {
            if (!tr.length) continue;
            const s = tr[0], en = tr[tr.length - 1];
            if (isMatch(newPoints[0], s) || isMatch(newPoints[0], en) ||
              isMatch(newPoints[1], s) || isMatch(newPoints[1], en)) {
              matchedLabel = tr[0].label || ''; break;
            }
          }
          if (matchedLabel) {
            const finalTrack = newPoints.map(t => ({ ...t, label: matchedLabel }));
            setCompletedTracks(prev => {
              const next = [...prev, finalTrack];
              saveScene(next);
              return next;
            });
            setTrackPoints([]);
          } else {
            setTrackModal(newPoints);
            setTrackPoints([]);
          }
        } else {
          setTrackPoints(newPoints);
        }

      } else if (mode === 'pole') {
        setPoleModal({ x, z, y });

      } else if (mode === 'cantilever') {
        const foot = closestPointOnTracks(completedTracksRef.current, x, z);
        setCantileverModal({ x1: x, z1: z, x2: foot.x, z2: foot.z });

      } else if (mode === 'vane') {
        const pts = vanePointsRef.current;
        if (pts.length === 0) {
          setVanePoints([{ x, z }]);
        } else {
          setVaneModal({ x1: pts[0].x, z1: pts[0].z, x2: x, z2: z });
          setVanePoints([]);
        }
      }
    };

    const handleViewerSelect = (e: Event) => {
      const { minX, maxX, minZ, maxZ } = (e as CustomEvent).detail;
      const selT = new Set<number>();
      const selP = new Set<number>();
      const inB = (x: number, z: number) => x >= minX && x <= maxX && z >= minZ && z <= maxZ;
      const matchedLabels = new Set<string>();

      if (selFilterRef.current.tracks) {
        completedTracksRef.current.forEach((tr, i) => {
          if (tr.some(p => inB(p.x, p.z))) { selT.add(i); if (tr[0]?.label) matchedLabels.add(tr[0].label); }
        });
        completedTracksRef.current.forEach((tr, i) => {
          if (tr[0]?.label && matchedLabels.has(tr[0].label)) selT.add(i);
        });
      }
      if (selFilterRef.current.poles) {
        polesRef.current.forEach((p, i) => {
          if (inB(p.x, p.z)) { selP.add(i); if (p.label) matchedLabels.add(p.label); }
        });
      }
      setSelectedTracks(Array.from(selT));
      setSelectedPoles(Array.from(selP));
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('viewer-click', handleViewerClick);
      container.addEventListener('viewer-select', handleViewerSelect);
      return () => {
        container.removeEventListener('viewer-click', handleViewerClick);
        container.removeEventListener('viewer-select', handleViewerSelect);
      };
    }
  }, [saveScene]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selT = selectedTracksRef.current;
        const selP = selectedPolesRef.current;
        if (selT.length || selP.length) {
          setCompletedTracks(prev => prev.filter((_, i) => !selT.includes(i)));
          setPoles(prev => prev.filter((_, i) => !selP.includes(i)));
          setSelectedTracks([]);
          setSelectedPoles([]);
        }
      } else if (e.key === 'Escape') {
        setTrackPoints([]);
        setVanePoints([]);
        if (drawMode !== 'none') { setDrawMode('none'); engineRef.current?.setDrawMode('none'); }
        setSelectedTracks([]);
        setSelectedPoles([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode]);

  // ─── Handlers ─────────────────────────────────────────────────────────────────

  const toggleView = () => {
    const next: ViewMode = viewMode === '2D' ? '3D' : '2D';
    setViewMode(next);
    engineRef.current?.setViewMode(next);
    if (next === '3D') { setDrawMode('none'); engineRef.current?.setDrawMode('none'); }
  };

  const selectDraw = (mode: DrawMode) => {
    if (viewMode === '3D') return;
    const next: DrawMode = drawMode === mode ? 'none' : mode;
    setDrawMode(next);
    engineRef.current?.setDrawMode(next);
  };

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="ocs-app">
      <nav className="ocs-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}
          >
            <ArrowLeft size={16} />
          </button>
          <div className="ocs-nav__brand">
            <span className="brand-dot" />
            {location?.name ?? 'Editor'} — OCS Designer
          </div>
        </div>

        <div className="ocs-nav__actions">
          {saveError && <span style={{ fontSize: '0.75rem', color: '#ef4444' }}>{saveError}</span>}
          {locationId && (
            <button
              onClick={() => saveScene()}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: saving ? '#1e293b' : '#3b82f6', border: '1px solid #3b82f6', color: '#fff', borderRadius: 6, cursor: saving ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
            >
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button
            className={`view-toggle ${viewMode === '3D' ? 'view-toggle--3d' : ''}`}
            onClick={toggleView}
          >
            {viewMode === '2D' ? <><Box size={15} /><span>3D</span></> : <><Square size={15} /><span>2D</span></>}
          </button>
        </div>
      </nav>

      <div className="ocs-body">
        <aside className="ocs-toolbar">
          <div className="tool-group">
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <ToolButton icon={<MousePointer2 size={17} />} label="Select" active={drawMode === 'none'} onClick={() => selectDraw('none')} />
              {drawMode === 'none' && viewMode === '2D' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, animation: 'fadeInDown 0.2s ease-out', fontSize: 11 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.tracks} onChange={e => setSelFilter(f => ({ ...f, tracks: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Tracks</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.poles} onChange={e => setSelFilter(f => ({ ...f, poles: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Poles</label>
                </div>
              )}
            </div>
          </div>

          <div className="tool-sep" />

          <div className="tool-group">
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <ToolButton
                icon={<Minus size={17} />}
                label={drawMode === 'track' ? (trackMode === 'rect' ? 'Rect Track' : 'Poly Track') : 'Track'}
                active={drawMode === 'track'}
                disabled={viewMode === '3D'}
                onClick={() => selectDraw('track')}
              />
              {drawMode === 'track' && viewMode === '2D' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '4px', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, animation: 'fadeInDown 0.2s ease-out' }}>
                  <button className={`tool-btn ${trackMode === 'rect' ? 'tool-btn--active' : ''}`} onClick={e => { e.stopPropagation(); setTrackMode('rect'); }} style={{ width: '100%', padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: 'none', background: trackMode === 'rect' ? '#3b82f6' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>Rect</button>
                  <button className={`tool-btn ${trackMode === 'poly' ? 'tool-btn--active' : ''}`} onClick={e => { e.stopPropagation(); setTrackMode('poly'); }} style={{ width: '100%', padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: 'none', background: trackMode === 'poly' ? '#3b82f6' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left' }}>Polyline</button>
                </div>
              )}
            </div>
            <ToolButton icon={<CircleDot size={17} />} label="Pole" active={drawMode === 'pole'} disabled={viewMode === '3D'} onClick={() => selectDraw('pole')} />
            <ToolButton icon={<GitMerge size={17} />} label="Cantilever" active={drawMode === 'cantilever'} disabled={viewMode === '3D'} onClick={() => selectDraw('cantilever')} />
            <ToolButton icon={<Link2 size={17} />} label="Vane" active={drawMode === 'vane'} disabled={viewMode === '3D'} onClick={() => selectDraw('vane')} title="Connect two cantilever track-side ends" />
          </div>

          <div className="tool-sep" />

          <div className="tool-group">
            <ToolButton icon={<RotateCcw size={17} />} label="Reset" onClick={() => engineRef.current?.resetCamera()} />
          </div>

          <div className="toolbar-legend">
            <div className="toolbar-legend__title">Legend</div>
            <LegendItem color="#3b82f6" label="Railway Track" />
            <LegendItem color="#ef4444" label="Catenary Pole" />
            <LegendItem color="#22c55e" label="Cantilever" />
            <LegendItem color="#eab308" label="Vane" />
          </div>
        </aside>

        <main className="ocs-canvas-wrap">
          <div ref={containerRef} className="ocs-canvas" />

          <div className="canvas-badge">
            {viewMode === '2D'
              ? <><span className="canvas-badge__mode">2D</span><span className="canvas-badge__hint">Scroll: zoom · Right-drag: pan{drawMode !== 'none' && ` · Drawing: ${drawMode}`}</span></>
              : <><span className="canvas-badge__mode canvas-badge__mode--3d">3D</span><span className="canvas-badge__hint">Left-drag: orbit · Right-drag: pan · Scroll: zoom</span></>}
          </div>

          <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(51,65,85,0.5)', color: '#94a3b8', padding: '10px 14px', borderRadius: 6, zIndex: 50, fontFamily: 'monospace', fontSize: 13, userSelect: 'none' }}>
            <div style={{ paddingBottom: 6, borderBottom: '1px solid rgba(51,65,85,0.5)', marginBottom: 6, fontWeight: 600 }}>Axis View</div>
            <div style={{ display: 'grid', gridTemplateColumns: '15px 1fr', gap: '8px', alignItems: 'center' }}><strong style={{ color: '#ef4444' }}>X</strong> Right (Pan)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '15px 1fr', gap: '8px', alignItems: 'center' }}><strong style={{ color: '#3b82f6' }}>Z</strong> {viewMode === '2D' ? 'Up (Ver)' : 'Front/Back'}</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSnap} onChange={e => setAutoSnap(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#3b82f6' }} />
                <span style={{ fontSize: 12 }}>Auto-Snap Grid</span>
              </label>
            </div>
          </div>
        </main>

        {/* ── Modals ── */}

        {poleModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', padding: 24, borderRadius: 8, color: '#f8fafc', width: 300, border: '1px solid #334155' }}>
              <h3 style={{ marginTop: 0 }}>Configure Pole</h3>
              <label style={{ display: 'block', marginTop: 12 }}>Name / Label <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="pole-label-input" style={{ width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 }} autoFocus />
              <label style={{ display: 'block', marginTop: 12 }}>Height (mm)</label>
              <input id="pole-height-input" type="number" defaultValue="3000" style={{ width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 }} />
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => setPoleModal(null)}>Cancel</button>
                <button style={{ padding: '6px 16px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => {
                  const lbl = (document.getElementById('pole-label-input') as HTMLInputElement).value.trim();
                  if (!lbl) { alert('Label is required'); return; }
                  const hgt = parseFloat((document.getElementById('pole-height-input') as HTMLInputElement).value) || 3000;
                  setPoles(prev => {
                    const next = [...prev, { ...poleModal!, label: lbl, h: hgt }];
                    saveScene(completedTracksRef.current, next);
                    return next;
                  });
                  setPoleModal(null);
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {trackModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', padding: 24, borderRadius: 8, color: '#f8fafc', width: 300, border: '1px solid #334155' }}>
              <h3 style={{ marginTop: 0 }}>Configure Track</h3>
              <label style={{ display: 'block', marginTop: 12 }}>Label <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="track-label-input" style={{ width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 }} autoFocus />
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => setTrackModal(null)}>Cancel</button>
                <button style={{ padding: '6px 16px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => {
                  const lbl = (document.getElementById('track-label-input') as HTMLInputElement).value.trim();
                  if (!lbl) { alert('Label is required'); return; }
                  const finalTrack = trackModal!.map(t => ({ ...t, label: lbl }));
                  setCompletedTracks(prev => {
                    const next = [...prev, finalTrack];
                    saveScene(next);
                    return next;
                  });
                  setTrackModal(null);
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {cantileverModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', padding: 24, borderRadius: 8, color: '#f8fafc', width: 300, border: '1px solid #334155' }}>
              <h3 style={{ marginTop: 0 }}>Configure Cantilever</h3>
              <label style={{ display: 'block', marginTop: 12 }}>Label <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="cantilever-label-input" style={{ width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 }} autoFocus />
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => setCantileverModal(null)}>Cancel</button>
                <button style={{ padding: '6px 16px', background: '#f59e0b', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => {
                  const lbl = (document.getElementById('cantilever-label-input') as HTMLInputElement).value.trim();
                  if (!lbl) { alert('Label is required'); return; }
                  setCantilevers(prev => {
                    const next = [...prev, { ...cantileverModal!, label: lbl }];
                    saveScene(completedTracksRef.current, polesRef.current, next);
                    return next;
                  });
                  setCantileverModal(null);
                }}>Save</button>
              </div>
            </div>
          </div>
        )}

        {vaneModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#1e293b', padding: 24, borderRadius: 8, color: '#f8fafc', width: 300, border: '1px solid #334155' }}>
              <h3 style={{ marginTop: 0 }}>Configure Vane</h3>
              <label style={{ display: 'block', marginTop: 12 }}>Label <span style={{ color: '#ef4444' }}>*</span></label>
              <input id="vane-label-input" style={{ width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 }} autoFocus />
              <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
                <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => setVaneModal(null)}>Cancel</button>
                <button style={{ padding: '6px 16px', background: '#eab308', border: 'none', color: '#111', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }} onClick={() => {
                  const lbl = (document.getElementById('vane-label-input') as HTMLInputElement).value.trim();
                  if (!lbl) { alert('Label is required'); return; }
                  setVanes(prev => [...prev, { ...vaneModal!, label: lbl }]);
                  setVaneModal(null);
                }}>Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
