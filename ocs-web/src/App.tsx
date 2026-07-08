import { useEffect, useRef, useState } from 'react';
import {
  MousePointer2,
  Minus,
  CircleDot,
  GitMerge,
  Link2,
  Box,
  Square,
  RotateCcw,
} from 'lucide-react';
import { ViewerEngine } from './viewer/ViewerEngine';
import { mockData } from './mockData';
import type { DrawMode, ViewMode } from './types';

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

// ─── Legend item ─────────────────────────────────────────────────────────────

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="legend-item">
      <span className="legend-dot" style={{ background: color }} />
      <span className="legend-label">{label}</span>
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [drawMode, setDrawMode] = useState<DrawMode>('none');

  // Dynamic geometry states
  const [completedTracks, setCompletedTracks] = useState<{ x: number, z: number, y?: number, r?: number, label?: string }[][]>([]);
  const [trackPoints, setTrackPoints] = useState<{ x: number, z: number, y?: number, r?: number }[]>([]);
  const [poles, setPoles] = useState<{ x: number, z: number, y?: number, h?: number, label?: string }[]>([]);
  const [trackMode, setTrackMode] = useState<'rect' | 'poly'>('rect');
  const [autoSnap, setAutoSnap] = useState<boolean>(true);

  // Selection states
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [selectedPoles, setSelectedPoles] = useState<number[]>([]);
  const [selFilter, setSelFilter] = useState({ tracks: true, poles: true });

  // Modals
  const [poleModal, setPoleModal] = useState<{ x: number, z: number, y: number } | null>(null);
  const [trackModal, setTrackModal] = useState<{ x: number, z: number, y?: number, r?: number }[] | null>(null);
  const [cantileverModal, setCantileverModal] = useState<{ x1: number, z1: number, x2: number, z2: number } | null>(null);

  // Cantilever state
  const [cantileverPoints, setCantileverPoints] = useState<{ x: number, z: number, y?: number }[]>([]);
  const [cantilevers, setCantilevers] = useState<{ x1: number, z1: number, x2: number, z2: number, label?: string }[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ViewerEngine | null>(null);

  // Mount the Three.js engine once
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new ViewerEngine(containerRef.current);
    engine.loadData(mockData);
    engineRef.current = engine;
    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Context pointers for callbacks
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

  const cantileverPointsRef = useRef(cantileverPoints);
  useEffect(() => { cantileverPointsRef.current = cantileverPoints; }, [cantileverPoints]);

  // Sync dynamic geometry
  useEffect(() => {
    engineRef.current?.setDynamicGeometry({ trackPoints, poles, completedTracks, selectedTracks, selectedPoles, cantileverPoints, cantilevers });
  }, [trackPoints, poles, completedTracks, selectedTracks, selectedPoles, cantileverPoints, cantilevers]);

  // Listen to clicks from ViewerEngine
  useEffect(() => {
    const handleViewerClick = (e: Event) => {
      const { x, z, y, r, mode } = (e as CustomEvent).detail;
      if (mode === 'track') {
        const newPoints = [...trackPointsRef.current, { x, z, y, r }];
        if (newPoints.length >= 2) {
          let matchedLabel = '';
          const threshold = 50;
          const isMatch = (a: any, b: any) => Math.abs(a.x - b.x) < threshold && Math.abs(a.z - b.z) < threshold;

          for (let i = 0; i < completedTracksRef.current.length; i++) {
            const tr = completedTracksRef.current[i];
            if (tr.length === 0) continue;
            const startP = tr[0];
            const endP = tr[tr.length - 1];

            if (isMatch(newPoints[0], startP) || isMatch(newPoints[0], endP) ||
              isMatch(newPoints[1], startP) || isMatch(newPoints[1], endP)) {
              matchedLabel = tr[0].label || '';
              break;
            }
          }

          if (matchedLabel) {
            // Auto-adopt tracking label and seamlessly attach!
            const finalTrack = newPoints.map(t => ({ ...t, label: matchedLabel }));
            setCompletedTracks(prev => [...prev, finalTrack]);
            setTrackPoints([]);
          } else {
            // Open Naming Modal immediately
            setTrackModal(newPoints);
            setTrackPoints([]);
          }
        } else {
          setTrackPoints(newPoints);
        }
      } else if (mode === 'pole') {
        setPoleModal({ x, z, y });
      } else if (mode === 'cantilever') {
        // Single click: pole position is given, auto-compute perpendicular foot to nearest track
        let footX = x, footZ = z;
        let minDist = Infinity;
        const checkSeg = (ax: number, az: number, bx: number, bz: number) => {
          const dx = bx - ax, dz = bz - az;
          const len2 = dx * dx + dz * dz;
          if (len2 === 0) return;
          const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / len2));
          const px = ax + t * dx, pz = az + t * dz;
          const d = Math.hypot(x - px, z - pz);
          if (d < minDist) { minDist = d; footX = px; footZ = pz; }
        };
        completedTracksRef.current.forEach(tr => {
          for (let i = 1; i < tr.length; i++) checkSeg(tr[i - 1].x, tr[i - 1].z, tr[i].x, tr[i].z);
        });
        // Immediately open modal — no 2nd click needed
        setCantileverModal({ x1: x, z1: z, x2: footX, z2: footZ });
      }
    };

    const handleViewerSelect = (e: Event) => {
      const { minX, maxX, minZ, maxZ, isWindowSelect } = (e as CustomEvent).detail;
      const selT = new Set<number>();
      const selP = new Set<number>();
      const inB = (x: number, z: number) => x >= minX && x <= maxX && z >= minZ && z <= maxZ;

      const matchedLabels = new Set<string>();

      if (selFilterRef.current.tracks) {
        completedTracksRef.current.forEach((tr, i) => {
          if (isWindowSelect) {
            // Window: all points must be inside
            if (tr.every(p => inB(p.x, p.z))) {
              selT.add(i);
              if (tr[0]?.label) matchedLabels.add(tr[0].label);
            }
          } else {
            // Crossing: any point inside
            if (tr.some(p => inB(p.x, p.z))) {
              selT.add(i);
              if (tr[0]?.label) matchedLabels.add(tr[0].label);
            }
          }
        });
        completedTracksRef.current.forEach((tr, i) => {
          if (tr[0]?.label && matchedLabels.has(tr[0].label)) selT.add(i);
        });
      }
      if (selFilterRef.current.poles) {
        polesRef.current.forEach((p, i) => {
          if (inB(p.x, p.z)) {
            selP.add(i);
            if (p.label) matchedLabels.add(p.label);
          }
        });
        polesRef.current.forEach((p, i) => {
          if (p.label && matchedLabels.has(p.label)) selP.add(i);
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
  }, []);

  // Sync trackMode
  useEffect(() => {
    if (engineRef.current) engineRef.current.trackMode = trackMode;
  }, [trackMode]);

  // Sync snap option
  useEffect(() => {
    if (engineRef.current) engineRef.current.enableSnap = autoSnap;
  }, [autoSnap]);

  // Handle global keyboard shortcuts (Escape to cancel drawing)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selT = selectedTracksRef.current;
        const selP = selectedPolesRef.current;
        if (selT.length > 0 || selP.length > 0) {
          setCompletedTracks(prev => prev.filter((_, i) => !selT.includes(i)));
          setPoles(prev => prev.filter((_, i) => !selP.includes(i)));
          setSelectedTracks([]);
          setSelectedPoles([]);
        }
      } else if (e.key === 'Escape') {
        if (trackPoints.length > 0) {
          // Just cancel the uncompleted tracking segment cleanly
          setTrackPoints([]);
        } else if (cantileverPoints.length > 0) {
          setCantileverPoints([]);
        } else if (drawMode !== 'none') {
          setDrawMode('none');
          engineRef.current?.setDrawMode('none');
        }

        // Always attempt to clear standard selections on ESC
        setSelectedTracks([]);
        setSelectedPoles([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawMode, trackPoints]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const toggleView = () => {
    const next: ViewMode = viewMode === '2D' ? '3D' : '2D';
    setViewMode(next);
    engineRef.current?.setViewMode(next);
    // When switching to 2D, reset draw mode
    if (next === '2D') {
      // keep previous draw mode
    } else {
      setDrawMode('none');
      engineRef.current?.setDrawMode('none');
    }
  };

  const selectDraw = (mode: DrawMode) => {
    if (viewMode === '3D') return; // drawing only in 2D
    const next: DrawMode = drawMode === mode ? 'none' : mode;
    setDrawMode(next);
    engineRef.current?.setDrawMode(next);
  };

  const resetCamera = () => {
    engineRef.current?.resetCamera();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="ocs-app">

      {/* ── Navbar ────────────────────────────────────────────────────── */}
      <nav className="ocs-nav">
        <div className="ocs-nav__brand">
          <span className="brand-dot" />
          OCS — Railway Electrification Designer
        </div>

        <div className="ocs-nav__actions">
          <button
            className={`view-toggle ${viewMode === '3D' ? 'view-toggle--3d' : ''}`}
            onClick={toggleView}
            title="Toggle 2D / 3D view"
          >
            {viewMode === '2D'
              ? <><Box size={15} /> <span>3D</span></>
              : <><Square size={15} /> <span>2D</span></>
            }
          </button>
        </div>
      </nav>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div className="ocs-body">

        {/* Left toolbar */}
        <aside className="ocs-toolbar">
          {/* Navigate / Select */}
          <div className="tool-group">
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <ToolButton
                icon={<MousePointer2 size={17} />}
                label="Select"
                active={drawMode === 'none'}
                onClick={() => selectDraw('none')}
              />
              {drawMode === 'none' && viewMode === '2D' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, animation: 'fadeInDown 0.2s ease-out', fontSize: 11 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.tracks} onChange={e => setSelFilter(f => ({ ...f, tracks: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Tracks</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.poles} onChange={e => setSelFilter(f => ({ ...f, poles: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Poles</label>
                </div>
              )}
            </div>
          </div>

          <div className="tool-sep" />

          {/* Drawing tools */}
          <div className="tool-group">
            <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
              <ToolButton
                icon={<Minus size={17} />}
                label={drawMode === 'track' ? (trackMode === 'rect' ? 'Rect Track' : 'Poly Track') : 'Track'}
                active={drawMode === 'track'}
                disabled={viewMode === '3D'}
                onClick={() => selectDraw('track')}
                title="Draw track line"
              />
              {drawMode === 'track' && viewMode === '2D' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '4px', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4, animation: 'fadeInDown 0.2s ease-out' }}>
                  <button
                    className={`tool-btn ${trackMode === 'rect' ? 'tool-btn--active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setTrackMode('rect'); }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: 'none', background: trackMode === 'rect' ? '#3b82f6' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                  >Rect</button>
                  <button
                    className={`tool-btn ${trackMode === 'poly' ? 'tool-btn--active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setTrackMode('poly'); }}
                    style={{ width: '100%', padding: '6px 10px', fontSize: '11px', borderRadius: '4px', border: 'none', background: trackMode === 'poly' ? '#3b82f6' : 'transparent', color: '#fff', cursor: 'pointer', textAlign: 'left' }}
                  >Polyline</button>
                </div>
              )}
            </div>
            <ToolButton
              icon={<CircleDot size={17} />}
              label="Pole"
              active={drawMode === 'pole'}
              disabled={viewMode === '3D'}
              onClick={() => selectDraw('pole')}
              title="Place pole"
            />
            <ToolButton
              icon={<GitMerge size={17} />}
              label="Cantilever"
              active={drawMode === 'cantilever'}
              disabled={viewMode === '3D'}
              onClick={() => selectDraw('cantilever')}
              title="Add cantilever"
            />
            <ToolButton
              icon={<Link2 size={17} />}
              label="Vane"
              active={drawMode === 'vane'}
              disabled={viewMode === '3D'}
              onClick={() => selectDraw('vane')}
              title="Add vane (connect two cantilever ends)"
            />
          </div>

          <div className="tool-sep" />

          {/* Utilities */}
          <div className="tool-group">
            <ToolButton
              icon={<RotateCcw size={17} />}
              label="Reset"
              onClick={resetCamera}
              title="Reset camera to fit all geometry"
            />
          </div>

          {/* Legend */}
          <div className="toolbar-legend">
            <div className="toolbar-legend__title">Legend</div>
            <LegendItem color="#3b82f6" label="Railway Track" />
            <LegendItem color="#ef4444" label="Catenary Pole" />
            <LegendItem color="#22c55e" label="Cantilever" />
            <LegendItem color="#eab308" label="Vane" />
          </div>
        </aside>

        {/* Canvas */}
        <main className="ocs-canvas-wrap">
          <div ref={containerRef} className="ocs-canvas" />

          {/* Mode badge overlay */}
          <div className="canvas-badge">
            {viewMode === '2D'
              ? <>
                <span className="canvas-badge__mode">2D</span>
                <span className="canvas-badge__hint">
                  Scroll: zoom · Right-drag: pan
                  {drawMode !== 'none' && ` · Drawing: ${drawMode}`}
                </span>
              </>
              : <>
                <span className="canvas-badge__mode canvas-badge__mode--3d">3D</span>
                <span className="canvas-badge__hint">
                  Left-drag: orbit · Right-drag: pan · Scroll: zoom
                </span>
              </>
            }
          </div>

          {/* Reference Widget overlay */}
          <div style={{ position: 'absolute', bottom: 20, right: 20, background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(51,65,85,0.5)', color: '#94a3b8', padding: '10px 14px', borderRadius: 6, zIndex: 50, fontFamily: 'monospace', fontSize: 13, userSelect: 'none' }}>
            <div style={{ paddingBottom: 6, borderBottom: '1px solid rgba(51,65,85,0.5)', marginBottom: 6, fontWeight: 600 }}>Axis View</div>
            <div style={{ display: 'grid', gridTemplateColumns: '15px 1fr', gap: '8px', alignItems: 'center' }}><strong style={{ color: '#ef4444' }}>X</strong>  Rigth(Pan)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '15px 1fr', gap: '8px', alignItems: 'center' }}><strong style={{ color: '#3b82f6' }}>Z</strong>  {viewMode === '2D' ? 'Up(Ver)' : 'Front/Back'}</div>
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                <input type="checkbox" checked={autoSnap} onChange={e => setAutoSnap(e.target.checked)} style={{ cursor: 'pointer', accentColor: '#3b82f6' }} />
                <span style={{ fontSize: 12 }}>Auto-Snap Grid</span>
              </label>
            </div>
          </div>
        </main>

        {/* Modals */}
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
                  setPoles(prev => [...prev, { ...poleModal, label: lbl, h: hgt }]);
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
                  const finalTrack = trackModal.map(t => ({ ...t, label: lbl }));
                  setCompletedTracks(prev => [...prev, finalTrack]);
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
                  setCantilevers(prev => [...prev, { ...cantileverModal!, label: lbl }]);
                  setCantileverModal(null);
                }}>Guardar</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
