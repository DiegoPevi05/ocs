import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MousePointer2, Minus, CircleDot, GitMerge, Link2,
  Box, Square, RotateCcw, ArrowLeft, Save,
} from 'lucide-react';
import { Client as StompClient } from '@stomp/stompjs';
import { ViewerEngine } from '../viewer/ViewerEngine';
import { api, parseSceneData } from '../lib/api';
import { CantileverPanel } from '../components/CantileverPanel';
import { PolePanel } from '../components/PolePanel';
import type { DrawMode, ViewMode, SceneData, Location, CantileverData, VaneData, ApiResponse, PoleData } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TrackFoot { x: number; z: number; tx: number; tz: number; }

/** Closest XZ point on polyline + track segment direction. */
function closestPointOnTracks(
  tracks: { x: number; z: number; y?: number; r?: number; label?: string }[][],
  px: number, pz: number
): TrackFoot {
  let footX = px, footZ = pz, minDist = Infinity, tx = 1, tz = 0;

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
          let sweep = ea - sa;
          if (curr.r > 0 && sweep < 0) sweep += 2 * Math.PI;   // CCW: keep positive
          if (curr.r < 0 && sweep > 0) sweep -= 2 * Math.PI;   // CW: keep negative
          for (let s = 0; s <= 64; s++) {
            const a = sa + sweep * s / 64;
            const qx = cx + R * Math.cos(a), qz = cz + R * Math.sin(a);
            const d = Math.hypot(px - qx, pz - qz);
            if (d < minDist) {
              minDist = d; footX = qx; footZ = qz;
              const tDirX = -Math.sin(a) * (curr.r < 0 ? -1 : 1);
              const tDirZ = Math.cos(a) * (curr.r < 0 ? -1 : 1);
              const tLen = Math.hypot(tDirX, tDirZ);
              tx = tLen > 0 ? tDirX / tLen : 1; tz = tLen > 0 ? tDirZ / tLen : 0;
            }
          }
          continue;
        }
      }
      const dx = curr.x - prev.x, dz = curr.z - prev.z;
      const len2 = dx * dx + dz * dz;
      if (len2 === 0) continue;
      const t = Math.max(0, Math.min(1, ((px - prev.x) * dx + (pz - prev.z) * dz) / len2));
      const qx = prev.x + t * dx, qz = prev.z + t * dz;
      const d = Math.hypot(px - qx, pz - qz);
      if (d < minDist) {
        minDist = d; footX = qx; footZ = qz;
        const len = Math.sqrt(len2);
        tx = len > 0 ? dx / len : 1; tz = len > 0 ? dz / len : 0;
      }
    }
  });

  return { x: footX, z: footZ, tx, tz };
}

// ─── Input field helper ────────────────────────────────────────────────────────
const INP = { width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 } as const;
const LBL = { display: 'block', marginTop: 12, fontSize: 12, color: '#94a3b8' } as const;
const ROW = { display: 'flex', gap: 10, marginTop: 8 } as const;

// ─── ToolButton ───────────────────────────────────────────────────────────────

function ToolButton({ icon, label, active, disabled, title, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; disabled?: boolean; title?: string; onClick: () => void;
}) {
  return (
    <button className={`tool-btn${active ? ' tool-btn--active' : ''}${disabled ? ' tool-btn--disabled' : ''}`} onClick={onClick} title={title ?? label} disabled={disabled}>
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

// ─── Modal shell ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#1e293b', padding: 24, borderRadius: 8, color: '#f8fafc', width: 360, border: '1px solid #334155', maxHeight: '90vh', overflowY: 'auto' }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {children}
      </div>
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
  const [poles, setPoles] = useState<PoleData[]>([]);
  const [cantilevers, setCantilevers] = useState<CantileverData[]>([]);
  const [vanes, setVanes] = useState<VaneData[]>([]);
  const [vaneFirstCantIdx, setVaneFirstCantIdx] = useState<number | null>(null);

  // Selection
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [selectedPoles, setSelectedPoles] = useState<number[]>([]);
  const [selectedCantilevers, setSelectedCantilevers] = useState<number[]>([]);
  const [selectedVanes, setSelectedVanes] = useState<number[]>([]);
  const [selFilter, setSelFilter] = useState({ tracks: true, poles: true, cantilevers: true, vanes: true });

  // Creation modals
  const [poleModal, setPoleModal] = useState<{ x: number; z: number; y: number } | null>(null);
  const [trackModal, setTrackModal] = useState<{ x: number; z: number; y?: number; r?: number }[] | null>(null);
  const [cantileverModal, setCantileverModal] = useState<{ x1: number; z1: number; x2raw: number; z2raw: number; tx: number; tz: number } | null>(null);
  const [vaneModal, setVaneModal] = useState<{ x1: number; z1: number; x2: number; z2: number } | null>(null);

  // Edit modals
  const [editPoleIdx, setEditPoleIdx] = useState<number | null>(null);
  const [editCantileverIdx, setEditCantileverIdx] = useState<number | null>(null);
  const [editVaneIdx, setEditVaneIdx] = useState<number | null>(null);

  // Cantilever form state — only zigzag is kept for the rubber-band preview while drawing
  const [cantFormZZ, setCantFormZZ] = useState(250);

  // Vane modal form state
  const [vaneFormLabel, setVaneFormLabel] = useState('');
  const [vaneFormDroppers, setVaneFormDroppers] = useState(0);
  const [vaneFormInitialSep, setVaneFormInitialSep] = useState(5000);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ViewerEngine | null>(null);
  const stompRef = useRef<StompClient | null>(null);
  const pendingVaneCantRef = useRef<{ cantileverIdx1: number; cantileverIdx2: number } | null>(null);
  const calcDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calcResultsRef = useRef<ApiResponse[]>([]);
  const calcExpectedRef = useRef<number>(0);

  // Stable refs
  const completedTracksRef = useRef(completedTracks);
  useEffect(() => { completedTracksRef.current = completedTracks; }, [completedTracks]);
  const polesRef = useRef(poles);
  useEffect(() => { polesRef.current = poles; }, [poles]);
  const cantileversRef = useRef(cantilevers);
  useEffect(() => { cantileversRef.current = cantilevers; }, [cantilevers]);
  const vanesRef = useRef(vanes);
  useEffect(() => { vanesRef.current = vanes; }, [vanes]);
  const selFilterRef = useRef(selFilter);
  useEffect(() => { selFilterRef.current = selFilter; }, [selFilter]);
  const trackPointsRef = useRef(trackPoints);
  useEffect(() => { trackPointsRef.current = trackPoints; }, [trackPoints]);
  const selectedTracksRef = useRef(selectedTracks);
  useEffect(() => { selectedTracksRef.current = selectedTracks; }, [selectedTracks]);
  const selectedPolesRef = useRef(selectedPoles);
  useEffect(() => { selectedPolesRef.current = selectedPoles; }, [selectedPoles]);
  const selectedCantiRef = useRef(selectedCantilevers);
  useEffect(() => { selectedCantiRef.current = selectedCantilevers; }, [selectedCantilevers]);
  const selectedVanesRef = useRef(selectedVanes);
  useEffect(() => { selectedVanesRef.current = selectedVanes; }, [selectedVanes]);
  const vaneFirstCantIdxRef = useRef(vaneFirstCantIdx);
  useEffect(() => { vaneFirstCantIdxRef.current = vaneFirstCantIdx; }, [vaneFirstCantIdx]);

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
    fetch(`/api/locations/${locationId}/calculated`)
      .then(res => res.json())
      .then(res => {
        if (res.status === 'success') {
          const loc = res.location;
          setLocation(loc);
          const scene = parseSceneData(loc);
          if (scene) {
            setCompletedTracks(scene.tracks.map((t: any) => t.points.map((p: any) => ({ ...p, label: t.label }))));
            setPoles(scene.poles);
            setCantilevers(scene.cantilevers);
            setVanes(scene.vanes);
          }
          if (res.calculations && res.calculations.status === 'success') {
            calcResultsRef.current = [res.calculations];
            engineRef.current?.clearApiData();
            engineRef.current?.addApiData(res.calculations);
          }
        } else {
          api.locations.get(locationId).then(loc => {
            setLocation(loc);
            const scene = parseSceneData(loc);
            if (scene) {
              setCompletedTracks(scene.tracks.map(t => t.points.map(p => ({ ...p, label: t.label }))));
              setPoles(scene.poles);
              setCantilevers(scene.cantilevers);
              setVanes(scene.vanes);
            }
          }).catch(() => {/* offline */ });
        }
      }).catch(() => {
        api.locations.get(locationId).then(loc => {
          setLocation(loc);
          const scene = parseSceneData(loc);
          if (scene) {
            setCompletedTracks(scene.tracks.map(t => t.points.map(p => ({ ...p, label: t.label }))));
            setPoles(scene.poles);
            setCantilevers(scene.cantilevers);
            setVanes(scene.vanes);
          }
        }).catch(() => {/* offline */ });
      });
  }, [locationId]);

  // WebSocket (STOMP) connection
  useEffect(() => {
    const client = new StompClient({
      webSocketFactory: () => new WebSocket(`${import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080'}/ws-raw`),
      reconnectDelay: 5000,
    });

    client.onConnect = () => {
      // Subscribe to cantilever calculation results
      client.subscribe('/topic/calculation', msg => {
        try {
          const data: ApiResponse = JSON.parse(msg.body);
          if (data.status === 'success') {
            calcResultsRef.current.push(data);
            // Re-render all accumulated pole results together
            engineRef.current?.clearApiData();
            calcResultsRef.current.forEach(r => engineRef.current?.addApiData(r));
          }
        } catch { /* ignore parse errors */ }
      });
      // Subscribe to vane calculation results
      client.subscribe('/topic/vane-result', msg => {
        try {
          const data = JSON.parse(msg.body);
          if (data.status === 'success' && data.vane && data._vaneIdx !== undefined) {
            engineRef.current?.loadVaneLines(data.vane.lines || [], data._vaneIdx.toString());
          }
        } catch { /* ignore */ }
      });
      // STOMP connected — recalculate with whatever is already loaded.
      // triggerCalculation checks connected state at call time, so we need
      // to call it here after the connection is established.
      triggerCalculation(cantileversRef.current);
    };

    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); stompRef.current = null; };
  }, []);

  // Sync dynamic geometry to engine
  useEffect(() => {
    engineRef.current?.setDynamicGeometry({
      trackPoints, poles, completedTracks, selectedTracks, selectedPoles,
      cantileverPoints: [], cantilevers, vanes, vaneFirstCantIdx,
      selectedCantilevers, selectedVanes,
    });
  }, [trackPoints, poles, completedTracks, selectedTracks, selectedPoles, cantilevers, vanes, vaneFirstCantIdx, selectedCantilevers, selectedVanes]);

  // Sync zigzag to engine for preview
  useEffect(() => {
    if (engineRef.current) engineRef.current.cantileverZigzag = cantFormZZ;
  }, [cantFormZZ]);
  useEffect(() => { if (engineRef.current) engineRef.current.cantileverZigzag = cantileverModal ? cantFormZZ : 250; }, [cantileverModal, cantFormZZ]);

  // Sync track/snap modes
  useEffect(() => { if (engineRef.current) engineRef.current.trackMode = trackMode; }, [trackMode]);
  useEffect(() => { if (engineRef.current) engineRef.current.enableSnap = autoSnap; }, [autoSnap]);
  useEffect(() => { if (engineRef.current) engineRef.current.selFilter = selFilter; }, [selFilter]);

  // Trigger calculation when cantilevers change (debounced)
  const triggerCalculation = useCallback((cantiList: CantileverData[]) => {
    if (!stompRef.current?.connected) return;
    if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
    calcDebounceRef.current = setTimeout(() => {
      // Reset accumulator for this new batch
      calcResultsRef.current = [];
      calcExpectedRef.current = cantiList.length;
      engineRef.current?.clearApiData();

      if (cantiList.length === 0) return;

      const payloads = cantiList.map(c => {
        const footX = c.x2raw ?? c.x2;
        const footZ = c.z2raw ?? c.z2;
        const matchPole = polesRef.current.find(p => Math.hypot(p.x - c.x1, p.z - c.z1) < 500);
        return {
          configuration: c.configuration ?? 'TDP>2.2',
          polePosition: [c.x1, 0, c.z1],
          pv: [footX, 0, -footZ],
          contactWireHeight: c.contactWireHeight ?? 5400,
          systemHeight: c.systemHeight ?? 1000,
          contactWireVerticalOffset: c.contactWireVerticalOffset ?? 120,
          zigzag: c.zigzag ?? 250,
          supportOffset: c.supportOffset ?? 1440,
          fixingDistance: c.fixingDistance ?? 1500,
          bottomFixedHeight: c.bottomFixedHeight ?? 5440,
          u: c.u ?? 0,
          curveRadiusDirection: c.curveRadiusDirection ?? 'inside',
          trackGauge: c.trackGauge ?? 1435,
          cantileversQuantity: matchPole?.cantileversQuantity ?? 1,
          catSeparation: matchPole?.catSeparation ?? 720,
          steadyArmAlpha: c.steadyArmAlpha ?? -2,
          registerArmAlpha: c.registerArmAlpha ?? 2,
          steadyArmLength: c.steadyArmLength ?? 1200,
        };
      });

      stompRef.current?.publish({ destination: '/app/calculate/batch', body: JSON.stringify(payloads) });
    }, 400);
  }, []);

  useEffect(() => { triggerCalculation(cantilevers); }, [cantilevers, triggerCalculation]);

  const triggerVaneCalculation = useCallback((vaneList: VaneData[], cantList: CantileverData[]) => {
    if (!stompRef.current?.connected) return;
    vaneList.forEach((v, vIdx) => {
      const c1 = cantList[v.cantileverIdx1];
      const c2 = cantList[v.cantileverIdx2];
      if (!c1 || !c2) return;
      const cwH1 = c1.contactWireHeight ?? 5400;
      const sysH1 = c1.systemHeight ?? 1000;
      const cwH2 = c2.contactWireHeight ?? 5400;
      const sysH2 = c2.systemHeight ?? 1000;
      const payload = {
        _vaneIdx: vIdx,
        cw_start: [c1.x2, cwH1, -c1.z2],
        sw_start: [c1.x2, cwH1 + sysH1, -c1.z2],
        cw_end: [c2.x2, cwH2, -c2.z2],
        sw_end: [c2.x2, cwH2 + sysH2, -c2.z2],
        qty_droppers: v.qtyDroppers ?? 0,
        initial_separation: v.initialSeparation ?? 5000,
        step_size: 500,  // fixed 500mm rendering grid for smooth wire curves
        cw_weight: v.cwWeight ?? 0.0019,
        cw_tension: v.cwTension ?? 1600,
        sw_weight: v.swWeight ?? 0.0024,
        sw_tension: v.swTension ?? 2000,
        dropper_weight: v.dropperWeight ?? 0.0006,
      };
      stompRef.current?.publish({ destination: '/app/calculate/vane', body: JSON.stringify(payload) });
    });
  }, []);

  // Cascade vane recalculation when cantilevers change
  useEffect(() => {
    if (vanes.length > 0) triggerVaneCalculation(vanes, cantilevers);
  }, [cantilevers, vanes, triggerVaneCalculation]);

  // Save to API
  const saveScene = useCallback(async (
    tracks = completedTracksRef.current,
    poleList = polesRef.current,
    cantList = cantileversRef.current,
    vaneList = vanesRef.current,
  ) => {
    if (!locationId || !location) return;
    const labelMap = new Map<string, { x: number; z: number; y?: number; r?: number; label?: string }[]>();
    tracks.forEach(tr => {
      const lbl = (tr[0] as any)?.label ?? '';
      if (!labelMap.has(lbl)) labelMap.set(lbl, []);
      labelMap.get(lbl)!.push(...tr);
    });
    const trackData = Array.from(labelMap.entries()).map(([label, pts]) => ({
      label, points: pts.map(({ label: _l, ...rest }) => rest),
    }));
    const scene: SceneData = { tracks: trackData, poles: poleList, cantilevers: cantList, vanes: vaneList };
    setSaving(true); setSaveError(null);
    try {
      await api.locations.update(locationId, location.name, scene);
    } catch (e: any) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  }, [locationId, location]);

  // viewer-click handler
  useEffect(() => {
    const handleViewerClick = (e: Event) => {
      const { x, z, y, r, mode, cantileverIdx } = (e as CustomEvent).detail;

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
            setCompletedTracks(prev => { const next = [...prev, finalTrack]; saveScene(next); return next; });
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
        setCantileverModal({ x1: x, z1: z, x2raw: foot.x, z2raw: foot.z, tx: foot.tx, tz: foot.tz });

      } else if (mode === 'vane') {
        const firstIdx = vaneFirstCantIdxRef.current;
        const clickedIdx: number = cantileverIdx ?? -1;
        if (clickedIdx < 0) return; // must click on a cantilever endpoint
        const cantList = cantileversRef.current;

        if (firstIdx === null) {
          // First click: record first cantilever
          setVaneFirstCantIdx(clickedIdx);
        } else {
          // Second click: must be a different cantilever
          if (clickedIdx === firstIdx) return;

          // Check max-2 vanes per cantilever constraint
          const currentVanes = vanesRef.current;
          const c1Vanes = currentVanes.filter(v => v.cantileverIdx1 === firstIdx || v.cantileverIdx2 === firstIdx).length;
          const c2Vanes = currentVanes.filter(v => v.cantileverIdx1 === clickedIdx || v.cantileverIdx2 === clickedIdx).length;
          if (c1Vanes >= 2) { alert('Cantilever 1 already has 2 vanes'); return; }
          if (c2Vanes >= 2) { alert('Cantilever 2 already has 2 vanes'); return; }

          // Check not already connected
          const alreadyLinked = currentVanes.some(v =>
            (v.cantileverIdx1 === firstIdx && v.cantileverIdx2 === clickedIdx) ||
            (v.cantileverIdx1 === clickedIdx && v.cantileverIdx2 === firstIdx)
          );
          if (alreadyLinked) { alert('These cantilevers are already linked by a vane'); return; }

          const c1 = cantList[firstIdx];
          const c2 = cantList[clickedIdx];
          if (!c1 || !c2) return;

          setVaneModal({ x1: c1.x2, z1: c1.z2, x2: c2.x2, z2: c2.z2 });
          setVaneFirstCantIdx(null);
          setVaneFormLabel('');
          setVaneFormDroppers(0);
          setVaneFormInitialSep(5000);
          // Store pending cantilever indices via a ref for use in saveVane
          (pendingVaneCantRef as any).current = { cantileverIdx1: firstIdx, cantileverIdx2: clickedIdx };
        }
      }
    };

    const handleViewerSelect = (e: Event) => {
      const { minX, maxX, minZ, maxZ, isPoint, hovered } = (e as CustomEvent).detail;

      // If the user clicked (point) while an item was hovered, select exactly that item
      if (isPoint && hovered) {
        setSelectedTracks(hovered.type === 'track' ? [hovered.index] : []);
        setSelectedPoles(hovered.type === 'pole' ? [hovered.index] : []);
        setSelectedCantilevers(hovered.type === 'cantilever' ? [hovered.index] : []);
        setSelectedVanes(hovered.type === 'vane' ? [hovered.index] : []);
        return;
      }

      const selT = new Set<number>();
      const selP = new Set<number>();
      const selC = new Set<number>();
      const selV = new Set<number>();
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
      if (selFilterRef.current.cantilevers) {
        cantileversRef.current.forEach((c, i) => {
          if (inB(c.x1, c.z1) || inB(c.x2, c.z2)) selC.add(i);
        });
      }
      if (selFilterRef.current.vanes) {
        vanesRef.current.forEach((v, i) => {
          if (inB(v.x1, v.z1) || inB(v.x2, v.z2)) selV.add(i);
        });
      }
      setSelectedTracks(Array.from(selT));
      setSelectedPoles(Array.from(selP));
      setSelectedCantilevers(Array.from(selC));
      setSelectedVanes(Array.from(selV));
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
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selT = selectedTracksRef.current;
        const selP = selectedPolesRef.current;
        const selC = selectedCantiRef.current;
        const selV = selectedVanesRef.current;
        if (selT.length || selP.length || selC.length || selV.length) {
          setCompletedTracks(prev => prev.filter((_, i) => !selT.includes(i)));
          setPoles(prev => prev.filter((_, i) => !selP.includes(i)));
          if (selC.length) {
            // Build index remapping: old index → new index (-1 if deleted)
            const oldCants = cantileversRef.current;
            const newCants = oldCants.filter((_, i) => !selC.includes(i));
            const idxMap = new Array(oldCants.length).fill(-1);
            let ni = 0;
            oldCants.forEach((_, oi) => { if (!selC.includes(oi)) idxMap[oi] = ni++; });

            setCantilevers(newCants);
            setVanes(prev => prev
              .filter(v => idxMap[v.cantileverIdx1] !== -1 && idxMap[v.cantileverIdx2] !== -1)
              .map(v => ({ ...v, cantileverIdx1: idxMap[v.cantileverIdx1], cantileverIdx2: idxMap[v.cantileverIdx2] }))
            );
          } else {
            setVanes(prev => prev.filter((_, i) => !selV.includes(i)));
          }
          setSelectedTracks([]); setSelectedPoles([]); setSelectedCantilevers([]); setSelectedVanes([]);
        }
      } else if (e.key === 'Escape') {
        setTrackPoints([]); setVaneFirstCantIdx(null);
        if (drawMode !== 'none') { setDrawMode('none'); engineRef.current?.setDrawMode('none'); }
        setSelectedTracks([]); setSelectedPoles([]); setSelectedCantilevers([]); setSelectedVanes([]);
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

  const handleCreateFromPanel = (updated: CantileverData) => {
    if (!cantileverModal) return;
    if (!updated.label?.trim()) { alert('Label is required'); return; }

    const dx = cantileverModal.x2raw - cantileverModal.x1;
    const dz = cantileverModal.z2raw - cantileverModal.z1;
    const len = Math.hypot(dx, dz);
    let ux = 0, uz = 0;
    if (len > 0) { ux = dx / len; uz = dz / len; }

    const newC: CantileverData = {
      ...updated,
      x2: cantileverModal.x2raw + ux * (updated.zigzag ?? 250),
      z2: cantileverModal.z2raw + uz * (updated.zigzag ?? 250),
      x2raw: cantileverModal.x2raw,
      z2raw: cantileverModal.z2raw,
      tx: cantileverModal.tx,
      tz: cantileverModal.tz,
    };
    setCantilevers(prev => {
      const next = [...prev, newC];
      saveScene(completedTracksRef.current, polesRef.current, next, vanesRef.current);
      return next;
    });
    setCantileverModal(null);
  };

  const saveVane = () => {
    if (!vaneModal) return;
    if (!vaneFormLabel.trim()) { alert('Label is required'); return; }
    const pending = pendingVaneCantRef.current;
    if (!pending) return;
    const newV: VaneData = {
      cantileverIdx1: pending.cantileverIdx1,
      cantileverIdx2: pending.cantileverIdx2,
      x1: vaneModal.x1, z1: vaneModal.z1,
      x2: vaneModal.x2, z2: vaneModal.z2,
      label: vaneFormLabel.trim(),
      qtyDroppers: vaneFormDroppers,
      initialSeparation: vaneFormInitialSep,
    };
    setVanes(prev => {
      const next = [...prev, newV];
      saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, next);
      triggerVaneCalculation([newV], cantileversRef.current);
      return next;
    });
    pendingVaneCantRef.current = null;
    setVaneModal(null);
  };

  const openEditCantilever = (idx: number) => {
    if (!cantilevers[idx]) return;
    setEditCantileverIdx(idx);
    const c = cantilevers[idx];
    if (engineRef.current) {
      setViewMode('3D');
      setDrawMode('none');
      engineRef.current.setDrawMode('none');
      engineRef.current.focusCantilever(c);
    }
  };

  const handleSaveFromPanel = (updated: CantileverData) => {
    if (editCantileverIdx === null) return;
    setCantilevers(prev => {
      const next = [...prev];
      const old = next[editCantileverIdx];
      let result = { ...updated };
      if ((updated.zigzag ?? 250) !== (old.zigzag ?? 250)) {
        const newZz = updated.zigzag ?? 250;
        if (old.x2raw !== undefined && old.x1 !== undefined) {
          const dx = old.x2raw - old.x1;
          const dz = old.z2raw! - old.z1;
          const len = Math.hypot(dx, dz);
          let ux = 0, uz = 0;
          if (len > 0) { ux = dx / len; uz = dz / len; }
          result = { ...result, x2: old.x2raw + ux * newZz, z2: old.z2raw! + uz * newZz };
        } else {
          const dx = old.x2 - old.x1, dz = old.z2 - old.z1;
          const len = Math.hypot(dx, dz);
          if (len > 0) {
            const oldZz = old.zigzag ?? 250;
            const dirX = dx / len, dirZ = dz / len;
            result = { ...result, x2: (old.x2 - dirX * oldZz) + dirX * newZz, z2: (old.z2 - dirZ * oldZz) + dirZ * newZz };
          }
        }
      }
      next[editCantileverIdx] = result;
      saveScene(completedTracksRef.current, polesRef.current, next, vanesRef.current);
      return next;
    });
    setEditCantileverIdx(null);
    setSelectedCantilevers([]);
    setViewMode('2D');
    engineRef.current?.setViewMode('2D');
    engineRef.current?.resetCamera();
  };

  const handleCalculateFromPanel = (updated: CantileverData) => {
    if (editCantileverIdx === null) return;
    const temp = [...cantilevers];
    const old = temp[editCantileverIdx];
    let result = { ...updated };
    if ((updated.zigzag ?? 250) !== (old.zigzag ?? 250)) {
      const newZz = updated.zigzag ?? 250;
      if (old.x2raw !== undefined && old.x1 !== undefined) {
        const dx = old.x2raw - old.x1;
        const dz = old.z2raw! - old.z1;
        const len = Math.hypot(dx, dz);
        let ux = 0, uz = 0;
        if (len > 0) { ux = dx / len; uz = dz / len; }
        result = { ...result, x2: old.x2raw + ux * newZz, z2: old.z2raw! + uz * newZz };
      } else {
        const dx = old.x2 - old.x1, dz = old.z2 - old.z1;
        const len = Math.hypot(dx, dz);
        if (len > 0) {
          const oldZz = old.zigzag ?? 250;
          const dirX = dx / len, dirZ = dz / len;
          result = { ...result, x2: (old.x2 - dirX * oldZz) + dirX * newZz, z2: (old.z2 - dirZ * oldZz) + dirZ * newZz };
        }
      }
    }
    temp[editCantileverIdx] = result;
    triggerCalculation(temp);
  };


  const openEditVane = (idx: number) => {
    const v = vanes[idx];
    if (!v) return;
    setVaneFormLabel(v.label ?? '');
    setVaneFormDroppers(v.qtyDroppers ?? 0);
    setVaneFormInitialSep(v.initialSeparation ?? 5000);
    setEditVaneIdx(idx);
  };

  const saveEditVane = () => {
    if (editVaneIdx === null) return;
    if (!vaneFormLabel.trim()) { alert('Label is required'); return; }
    setVanes(prev => {
      const next = [...prev];
      next[editVaneIdx] = {
        ...next[editVaneIdx], label: vaneFormLabel.trim(),
        qtyDroppers: vaneFormDroppers,
        initialSeparation: vaneFormInitialSep,
      };
      saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, next);
      triggerVaneCalculation([next[editVaneIdx]], cantileversRef.current);
      return next;
    });
    setEditVaneIdx(null);
    setSelectedVanes([]);
  };

  const totalSelected = selectedTracks.length + selectedPoles.length + selectedCantilevers.length + selectedVanes.length;

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="ocs-app">
      <nav className="ocs-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0 }}>
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
            <button onClick={() => saveScene()} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: saving ? '#1e293b' : '#3b82f6', border: '1px solid #3b82f6', color: '#fff', borderRadius: 6, cursor: saving ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 500 }}>
              <Save size={14} /> {saving ? 'Saving…' : 'Save'}
            </button>
          )}
          <button className={`view-toggle ${viewMode === '3D' ? 'view-toggle--3d' : ''}`} onClick={toggleView}>
            {viewMode === '2D' ? <><Box size={15} /><span>3D</span></> : <><Square size={15} /><span>2D</span></>}
          </button>
        </div>
      </nav>

      <div className="ocs-body">
        <aside className="ocs-toolbar">
          <div className="tool-group">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
              <ToolButton icon={<MousePointer2 size={17} />} label="Select" active={drawMode === 'none'} onClick={() => selectDraw('none')} />
              {drawMode === 'none' && viewMode === '2D' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, animation: 'fadeInDown 0.2s ease-out', fontSize: 11 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.tracks} onChange={e => setSelFilter(f => ({ ...f, tracks: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Tracks</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.poles} onChange={e => setSelFilter(f => ({ ...f, poles: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Poles</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.cantilevers} onChange={e => setSelFilter(f => ({ ...f, cantilevers: e.target.checked }))} style={{ accentColor: '#f59e0b', cursor: 'pointer' }} /> Cantilevers</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.vanes} onChange={e => setSelFilter(f => ({ ...f, vanes: e.target.checked }))} style={{ accentColor: '#9333ea', cursor: 'pointer' }} /> Vanes</label>
                  {totalSelected > 0 && (
                    <div style={{ marginTop: 4, paddingTop: 6, borderTop: '1px solid #334155', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ color: '#94a3b8', fontSize: 10 }}>{totalSelected} selected</span>
                      {selectedCantilevers.length === 1 && (
                        <button onClick={() => openEditCantilever(selectedCantilevers[0])} style={{ padding: '3px 8px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: 3, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>Edit Cantilever</button>
                      )}
                      {selectedVanes.length === 1 && (
                        <button onClick={() => openEditVane(selectedVanes[0])} style={{ padding: '3px 8px', background: '#9333ea', border: 'none', color: '#fff', borderRadius: 3, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>Edit Vane</button>
                      )}
                      {selectedPoles.length === 1 && (
                        <button onClick={() => setEditPoleIdx(selectedPoles[0])} style={{ padding: '3px 8px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: 3, cursor: 'pointer', fontSize: 10, fontWeight: 600 }}>Edit Pole</button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="tool-sep" />

          <div className="tool-group">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
              <ToolButton
                icon={<Minus size={17} />}
                label={drawMode === 'track' ? (trackMode === 'rect' ? 'Rect Track' : 'Poly Track') : 'Track'}
                active={drawMode === 'track'} disabled={viewMode === '3D'}
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
            <LegendItem color="#9333ea" label="Vane" />
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
          <PolePanel
            pole={{ x: poleModal.x, z: poleModal.z, y: poleModal.y, label: '', h: 3000, cantileversQuantity: 1, catSeparation: 720 }}
            onSave={(updated) => {
              if (!updated.label?.trim()) { alert('Label is required'); return; }
              setPoles(prev => { const next = [...prev, updated]; saveScene(completedTracksRef.current, next); return next; });
              setPoleModal(null);
            }}
            onClose={() => setPoleModal(null)}
          />
        )}

        {trackModal && (
          <Modal title="Configure Track" onClose={() => setTrackModal(null)}>
            <label style={LBL}>Label <span style={{ color: '#ef4444' }}>*</span></label>
            <input id="track-label-input" style={INP} autoFocus />
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => setTrackModal(null)}>Cancel</button>
              <button style={{ padding: '6px 16px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => {
                const lbl = (document.getElementById('track-label-input') as HTMLInputElement).value.trim();
                if (!lbl) { alert('Label is required'); return; }
                const finalTrack = trackModal!.map(t => ({ ...t, label: lbl }));
                setCompletedTracks(prev => { const next = [...prev, finalTrack]; saveScene(next); return next; });
                setTrackModal(null);
              }}>Save</button>
            </div>
          </Modal>
        )}

        {cantileverModal && (
          <CantileverPanel
            cantilever={{
              x1: cantileverModal.x1, z1: cantileverModal.z1,
              x2: cantileverModal.x2raw,
              z2: cantileverModal.z2raw,
              x2raw: cantileverModal.x2raw,
              z2raw: cantileverModal.z2raw,
              tx: cantileverModal.tx,
              tz: cantileverModal.tz,
              label: '',
              contactWireHeight: 5400,
              systemHeight: 1000,
              contactWireVerticalOffset: 120,
              zigzag: 250,
              supportOffset: 1440,
              fixingDistance: 1500,
              bottomFixedHeight: 5440,
              u: 0,
              curveRadiusDirection: 'inside',
              trackGauge: 1435,
              configuration: 'TDP>2.2',
              steadyArmAlpha: -2,
              registerArmAlpha: 2,
              steadyArmLength: 1200,
            }}
            onSave={handleCreateFromPanel}
            onClose={() => setCantileverModal(null)}
          />
        )}

        {vaneModal && (
          <Modal title="Configure Vane" onClose={() => { setVaneModal(null); pendingVaneCantRef.current = null; }}>
            <label style={LBL}>Label <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={vaneFormLabel} onChange={e => setVaneFormLabel(e.target.value)} style={INP} autoFocus />
            <div style={ROW}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Qty Droppers <span style={{ color: '#64748b', fontSize: 10 }}>(0 = auto)</span></label>
                <input type="number" min={0} value={vaneFormDroppers} onChange={e => setVaneFormDroppers(+e.target.value)} style={INP} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Initial Separation (mm)</label>
                <input type="number" min={0} value={vaneFormInitialSep} onChange={e => setVaneFormInitialSep(+e.target.value)} style={INP} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
              Inter-dropper spacing = (vane length − 2 × initial separation) ÷ (droppers − 1), calculated automatically.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => { setVaneModal(null); pendingVaneCantRef.current = null; }}>Cancel</button>
              <button style={{ padding: '6px 16px', background: '#9333ea', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }} onClick={saveVane}>Save</button>
            </div>
          </Modal>
        )}

        {/* ── Edit: Pole ── */}
        {editPoleIdx !== null && poles[editPoleIdx] && (
          <PolePanel
            pole={poles[editPoleIdx]}
            onSave={(updated) => {
              if (!updated.label?.trim()) { alert('Label is required'); return; }
              setPoles(prev => { const n = [...prev]; n[editPoleIdx!] = updated; saveScene(completedTracksRef.current, n); return n; });
              setEditPoleIdx(null); setSelectedPoles([]);
            }}
            onClose={() => { setEditPoleIdx(null); }}
          />
        )}

        {/* ── Edit: Cantilever (slide-in panel) ── */}
        {editCantileverIdx !== null && cantilevers[editCantileverIdx] && (
          <CantileverPanel
            cantilever={cantilevers[editCantileverIdx]}
            onSave={handleSaveFromPanel}
            onCalculate={handleCalculateFromPanel}
            onClose={() => {
              setEditCantileverIdx(null);
              triggerCalculation(cantilevers);
              setViewMode('2D');
              engineRef.current?.setViewMode('2D');
              engineRef.current?.resetCamera();
            }}
          />
        )}

        {/* ── Edit: Vane ── */}
        {editVaneIdx !== null && (
          <Modal title={`Edit Vane: ${vaneFormLabel}`} onClose={() => setEditVaneIdx(null)}>
            <label style={LBL}>Label <span style={{ color: '#ef4444' }}>*</span></label>
            <input value={vaneFormLabel} onChange={e => setVaneFormLabel(e.target.value)} style={INP} autoFocus />
            <div style={ROW}>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Qty Droppers <span style={{ color: '#64748b', fontSize: 10 }}>(0 = auto)</span></label>
                <input type="number" min={0} value={vaneFormDroppers} onChange={e => setVaneFormDroppers(+e.target.value)} style={INP} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={LBL}>Initial Separation (mm)</label>
                <input type="number" min={0} value={vaneFormInitialSep} onChange={e => setVaneFormInitialSep(+e.target.value)} style={INP} />
              </div>
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
              Inter-dropper spacing = (vane length − 2 × initial separation) ÷ (droppers − 1), calculated automatically.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => setEditVaneIdx(null)}>Cancel</button>
              <button style={{ padding: '6px 16px', background: '#9333ea', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }} onClick={saveEditVane}>Save</button>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
