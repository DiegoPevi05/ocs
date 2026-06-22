import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  MousePointer2, Minus, CircleDot, GitMerge, Link2,
  Box, Square, RotateCcw, ArrowLeft, Save, FileDown,
  Anchor, Layout,
} from 'lucide-react';
import { Client as StompClient } from '@stomp/stompjs';
import { ViewerEngine } from '../viewer/ViewerEngine';
import { api, parseSceneData, parseProjectSettings } from '../lib/api';
import { CantileverPanel } from '../components/CantileverPanel';
import { VanePanel } from '../components/VanePanel';
import { PolePanel } from '../components/PolePanel';
import { FoundationPanel } from '../components/FoundationPanel';
import { TrackPanel } from '../components/TrackPanel';
import { AnchorPointPanel } from '../components/AnchorPointPanel';
import { AnchorPanel } from '../components/AnchorPanel';
import type { DrawMode, ViewMode, SceneData, Location, TrackData, CantileverData, VaneData, ApiResponse, PoleData, AnchorPointData, AnchorData, CalcLocationResponse, CalcCantileverEntry, CalcVaneEntry, ProjectSettings } from '../types';
import { DEFAULT_PROJECT_SETTINGS } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

interface TrackFoot { x: number; z: number; y: number; tx: number; tz: number; }

/** Closest XZ point on polyline + track segment direction and elevation. */
function closestPointOnTracks(
  tracks: { x: number; z: number; y?: number; r?: number; label?: string }[][],
  px: number, pz: number
): TrackFoot {
  let footX = px, footZ = pz, footY = 0, minDist = Infinity, tx = 1, tz = 0;

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
              
              // Linear interpolation of height Y
              const progress = s / 64;
              footY = (prev.y ?? 0) + ((curr.y ?? 0) - (prev.y ?? 0)) * progress;
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
        
        // Linear interpolation of height Y
        footY = (prev.y ?? 0) + ((curr.y ?? 0) - (prev.y ?? 0)) * t;
      }
    }
  });

  return { x: footX, z: footZ, y: footY, tx, tz };
}

// ─── Input field helper ────────────────────────────────────────────────────────
const INP = { width: '100%', padding: '6px', marginTop: '4px', background: '#334155', border: '1px solid #475569', color: '#fff', borderRadius: 4 } as const;
const LBL = { display: 'block', marginTop: 12, fontSize: 12, color: '#94a3b8' } as const;
const ROW = { display: 'flex', gap: 10, marginTop: 8 } as const;

// ─── ToolButton ───────────────────────────────────────────────────────────────

function ToolButton({ icon, label, active, disabled, title, onClick }: {
  icon: React.ReactNode; label: string; active?: boolean; disabled?: boolean; title?: string; onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
  const [downloading, setDownloading] = useState(false);

  const [viewMode, setViewMode] = useState<ViewMode>('2D');
  const [drawMode, setDrawMode] = useState<DrawMode>('none');
  const [trackMode, setTrackMode] = useState<'rect' | 'poly'>('rect');
  const [autoSnap, setAutoSnap] = useState(true);

  // Filter dropdown state
  const [showSelectFilter, setShowSelectFilter] = useState(false);
  const selectFilterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showSelectFilter && selectFilterRef.current && !selectFilterRef.current.contains(e.target as Node)) {
        setShowSelectFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSelectFilter]);

  // Drawing state
  const [completedTracks, setCompletedTracks] = useState<{ x: number; z: number; y?: number; r?: number; label?: string }[][]>([]);
  const [trackPoints, setTrackPoints] = useState<{ x: number; z: number; y?: number; r?: number }[]>([]);
  const [poles, setPoles] = useState<PoleData[]>([]);
  const [cantilevers, setCantilevers] = useState<CantileverData[]>([]);
  const [vanes, setVanes] = useState<VaneData[]>([]);
  const [foundations, setFoundations] = useState<FoundationData[]>([]);
  const [vaneFirstCantIdx, setVaneFirstCantIdx] = useState<number | null>(null);
  const [anchorPoints, setAnchorPoints] = useState<AnchorPointData[]>([]);
  const [anchors, setAnchors] = useState<AnchorData[]>([]);
  const [anchorFirstPoleIdx, setAnchorFirstPoleIdx] = useState<number | null>(null);

  // Selection
  const [selectedTracks, setSelectedTracks] = useState<number[]>([]);
  const [selectedPoles, setSelectedPoles] = useState<number[]>([]);
  const [selectedFoundations, setSelectedFoundations] = useState<number[]>([]);
  const [selectedCantilevers, setSelectedCantilevers] = useState<number[]>([]);
  const [selectedVanes, setSelectedVanes] = useState<number[]>([]);
  const [selectedAnchorPoints, setSelectedAnchorPoints] = useState<number[]>([]);
  const [selectedAnchors, setSelectedAnchors] = useState<number[]>([]);
  const [selFilter, setSelFilter] = useState({ tracks: true, poles: true, foundations: true, cantilevers: true, vanes: true, anchorPoints: true, anchors: true });

  // Creation modals
  const [poleModal, setPoleModal] = useState<{ x: number; z: number; y: number; foundationIdx?: number } | null>(null);
  const [foundationModal, setFoundationModal] = useState<FoundationData | null>(null);
  const [trackModal, setTrackModal] = useState<{ x: number; z: number; y?: number; r?: number }[] | null>(null);
  const [cantileverModal, setCantileverModal] = useState<{ x1: number; z1: number; x2raw: number; z2raw: number; tx: number; tz: number } | null>(null);
  const [vaneModal, setVaneModal] = useState<{ x1: number; z1: number; x2: number; z2: number } | null>(null);

  // Creation/edit modals
  const [anchorPointModal, setAnchorPointModal] = useState<AnchorPointData | null>(null);
  const [editAnchorPointIdx, setEditAnchorPointIdx] = useState<number | null>(null);
  const [editAnchorIdx, setEditAnchorIdx] = useState<number | null>(null);

  // Edit modals
  const [editTrackIdx, setEditTrackIdx] = useState<number | null>(null);
  const [editPoleIdx, setEditPoleIdx] = useState<number | null>(null);
  const [editFoundationIdx, setEditFoundationIdx] = useState<number | null>(null);
  const [editCantileverIdx, setEditCantileverIdx] = useState<number | null>(null);
  const [editVaneIdx, setEditVaneIdx] = useState<number | null>(null);

  // Project-level defaults
  const [projectSettings, setProjectSettings] = useState<ProjectSettings>(DEFAULT_PROJECT_SETTINGS);

  // Cantilever form state — only zigzag is kept for the rubber-band preview while drawing
  const [cantFormZZ, setCantFormZZ] = useState(250);

  // Vane modal form state
  const [vaneFormLabel, setVaneFormLabel] = useState('');
  const [vaneFormDroppers, setVaneFormDroppers] = useState(0);
  const [vaneFormInitialSep, setVaneFormInitialSep] = useState(5000);
  const [vaneFormPoleCwHeight, setVaneFormPoleCwHeight] = useState(5400);
  const [vaneFormPoleSysHeight, setVaneFormPoleSysHeight] = useState(1000);

  // Results overlay
  const [lastCantResults, setLastCantResults] = useState<{ name: string; length: number; cut_length: number; diameter: number; thickness: number }[] | null>(null);
  const [lastVaneResults, setLastVaneResults] = useState<{ index: number; dropper_length: number; distance_eye_to_eye: number; distance_cw: number; distance_pole_dropper: number; distance_dropper_dropper: number; distance_cw_h: number; dropper_inclination: number }[] | null>(null);
  const editCantileverIdxRef = useRef<number | null>(null);
  const editVaneIdxRef = useRef<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ViewerEngine | null>(null);
  const stompRef = useRef<StompClient | null>(null);
  const pendingVaneCantRef = useRef<{ cantileverIdx1: number; cantileverIdx2: number } | null>(null);
  const calcDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calcResultsRef = useRef<ApiResponse[]>([]);
  // Per-index caches populated from the initial /calculated fetch
  const calcByCantiIdx = useRef<Map<number, CalcCantileverEntry>>(new Map());
  const calcByVaneIdx = useRef<Map<number, CalcVaneEntry>>(new Map());
  const hasInitialCalc = useRef(false);
  const calcExpectedRef = useRef<number>(0);

  // Stable refs
  const projectSettingsRef = useRef(projectSettings);
  useEffect(() => { projectSettingsRef.current = projectSettings; }, [projectSettings]);
  const completedTracksRef = useRef(completedTracks);
  useEffect(() => { completedTracksRef.current = completedTracks; }, [completedTracks]);
  const polesRef = useRef(poles);
  useEffect(() => { polesRef.current = poles; }, [poles]);
  const foundationsRef = useRef(foundations);
  useEffect(() => { foundationsRef.current = foundations; }, [foundations]);
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
  const selectedFoundationsRef = useRef(selectedFoundations);
  useEffect(() => { selectedFoundationsRef.current = selectedFoundations; }, [selectedFoundations]);
  const selectedCantiRef = useRef(selectedCantilevers);
  useEffect(() => { selectedCantiRef.current = selectedCantilevers; }, [selectedCantilevers]);
  const selectedVanesRef = useRef(selectedVanes);
  useEffect(() => { selectedVanesRef.current = selectedVanes; }, [selectedVanes]);
  const vaneFirstCantIdxRef = useRef(vaneFirstCantIdx);
  useEffect(() => { vaneFirstCantIdxRef.current = vaneFirstCantIdx; }, [vaneFirstCantIdx]);
  const anchorPointsRef = useRef(anchorPoints);
  useEffect(() => { anchorPointsRef.current = anchorPoints; }, [anchorPoints]);
  const anchorsRef = useRef(anchors);
  useEffect(() => { anchorsRef.current = anchors; }, [anchors]);
  const anchorFirstPoleIdxRef = useRef(anchorFirstPoleIdx);
  useEffect(() => { anchorFirstPoleIdxRef.current = anchorFirstPoleIdx; }, [anchorFirstPoleIdx]);
  const selectedAnchorPointsRef = useRef(selectedAnchorPoints);
  useEffect(() => { selectedAnchorPointsRef.current = selectedAnchorPoints; }, [selectedAnchorPoints]);
  const selectedAnchorsRef = useRef(selectedAnchors);
  useEffect(() => { selectedAnchorsRef.current = selectedAnchors; }, [selectedAnchors]);

  // Mount engine
  useEffect(() => {
    if (!containerRef.current) return;
    const engine = new ViewerEngine(containerRef.current);
    engineRef.current = engine;
    return () => { engine.dispose(); engineRef.current = null; };
  }, []);

  // Load location scene + pre-calculated data
  useEffect(() => {
    if (!locationId) return;

    const loadSettings = (loc: Location) => {
      if (loc.projectId) {
        api.projects.get(loc.projectId).then(p => {
          const parsed = parseProjectSettings(p);
          if (parsed) setProjectSettings(parsed);
        }).catch(() => { /* ignore settings load failure */ });
      }
    };

    const applyScene = (loc: Location) => {
      setLocation(loc);
      const scene = parseSceneData(loc);
      if (scene) {
        setFoundations(scene.foundations ?? []);
        setCompletedTracks(scene.tracks.map(t => t.points.map(p => ({ ...p, label: t.label }))));
        setPoles(scene.poles);
        setCantilevers(scene.cantilevers);
        setVanes(scene.vanes);
        setAnchorPoints((scene as any).anchorPoints ?? []);
        setAnchors((scene as any).anchors ?? []);
      }
    };

    fetch(`${import.meta.env.VITE_API_BASE_URL ?? 'http//localhost:8080'}` + `/api/locations/${locationId}/calculated`)
      .then(r => r.json())
      .then((res: CalcLocationResponse) => {
        if (res.status !== 'success') {
          api.locations.get(locationId).then(loc => { applyScene(loc); loadSettings(loc); }).catch(() => { });
          return;
        }

        applyScene(res.location);
        loadSettings(res.location);

        if (res.poles && res.poles.length > 0) {
          // Clear viewer and caches
          engineRef.current?.clearApiData();
          engineRef.current?.clearAllVaneLines();
          calcByCantiIdx.current.clear();
          calcByVaneIdx.current.clear();
          calcResultsRef.current = [];
          const seenVanes = new Set<number>();

          for (const pole of res.poles) {
            for (const canti of pole.cantilevers) {
              // Cache primary wire (wireIndex 0) results for the edit panel
              if (canti.wireIndex === 0) {
                calcByCantiIdx.current.set(canti.cantileverIndex, canti);
              }
              // Reconstruct ApiResponse-shaped object so the viewer can render lines
              const synthetic: ApiResponse = {
                status: 'success', calculation_time_ms: 0,
                poles: [{ lines: [], cantilevers: [{ index: canti.wireIndex, lines: canti.lines, results: canti.results }] }],
              };
              engineRef.current?.addApiData(synthetic);

              // Load vane lines (deduplicated) and cache vane results
              for (const vane of canti.vanes) {
                calcByVaneIdx.current.set(vane.vaneIndex, vane);
                if (!seenVanes.has(vane.vaneIndex)) {
                  seenVanes.add(vane.vaneIndex);
                  if (vane.lines.length > 0)
                    engineRef.current?.loadVaneLines(vane.lines, vane.vaneIndex.toString(), vane.results);
                }
              }
            }
          }
          hasInitialCalc.current = true;
        }
      })
      .catch(() => {
        api.locations.get(locationId).then(loc => { applyScene(loc); loadSettings(loc); }).catch(() => { });
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
            engineRef.current?.clearApiData();
            calcResultsRef.current.forEach(r => engineRef.current?.addApiData(r));

            // Update per-cantilever cache so the edit panel shows fresh results.
            // The batch response poles[] follow the same order as the sent cantilevers[].
            // Reconstruct the cantileverIndex mapping using the current cantilevers state.
            const curCantis = cantileversRef.current;
            const curPoles = polesRef.current;
            let outIdx = 0;
            for (let ci = 0; ci < curCantis.length; ci++) {
              const c = curCantis[ci];
              const matchPole = curPoles.find(p => Math.hypot(p.x - c.x1, p.z - c.z1) < 500);
              const cantQty = matchPole?.cantileversQuantity ?? 1;
              if (outIdx < data.poles.length) {
                const bp = data.poles[outIdx];
                const bc = bp.cantilevers[0];
                if (bc) {
                  const existing = calcByCantiIdx.current.get(ci);
                  calcByCantiIdx.current.set(ci, {
                    cantileverIndex: ci, wireIndex: 0,
                    label: existing?.label, configuration: c.configuration,
                    lines: [...(bp.lines ?? []), ...(bc.lines ?? [])],
                    results: bc.results ?? [],
                    vanes: existing?.vanes ?? [],
                    cwAxis: bc.cwAxis, mwAxis: bc.mwAxis,
                  });
                }
              }
              outIdx += cantQty;
            }

            // Update panel if a cantilever is currently open
            const editIdx = editCantileverIdxRef.current;
            if (editIdx !== null) {
              const cached = calcByCantiIdx.current.get(editIdx);
              if (cached) setLastCantResults(cached.results);
            }
          }
        } catch { /* ignore parse errors */ }
      });

      // Subscribe to vane calculation results
      client.subscribe('/topic/vane-result', msg => {
        try {
          const data = JSON.parse(msg.body);
          if (data.status === 'success' && data.vane && data._vaneIdx !== undefined) {
            const vIdx: number = data._vaneIdx;
            engineRef.current?.loadVaneLines(data.vane.lines || [], vIdx.toString(), data.vane.results || []);

            // Update vane cache
            const vScene = vanesRef.current[vIdx];
            if (vScene !== undefined) {
              const existing = calcByVaneIdx.current.get(vIdx);
              calcByVaneIdx.current.set(vIdx, {
                vaneIndex: vIdx, label: vScene.label,
                lines: data.vane.lines ?? [],
                results: data.vane.results ?? existing?.results ?? [],
              });
            }

            // Update panel if this vane is open
            if (editVaneIdxRef.current !== null) {
              const cached = calcByVaneIdx.current.get(editVaneIdxRef.current);
              if (cached) setLastVaneResults(cached.results);
            }
          }
        } catch { /* ignore */ }
      });

      // Only auto-recalculate on connect if we have no pre-loaded data
      if (!hasInitialCalc.current) {
        triggerCalculation(cantileversRef.current);
      }
    };

    client.activate();
    stompRef.current = client;
    return () => { client.deactivate(); stompRef.current = null; };
  }, []);

  // Sync dynamic geometry to engine
  useEffect(() => {
    const s = projectSettings.anchorPoint;
    
    // Apply foundation coordinates to poles
    const syncedPoles = poles.map(p => {
      if (p.foundationIdx !== undefined && foundations[p.foundationIdx]) {
        const f = foundations[p.foundationIdx];
        return { ...p, x: f.x, z: f.z, y: f.y };
      }
      return p;
    });

    engineRef.current?.setDynamicGeometry({
      foundations, selectedFoundations,
      trackPoints, poles: syncedPoles, completedTracks, selectedTracks, selectedPoles,
      cantileverPoints: [], cantilevers, vanes, vaneFirstCantIdx,
      selectedCantilevers, selectedVanes,
      anchorPoints, anchors, anchorFirstPoleIdx,
      selectedAnchorPoints, selectedAnchors,
      anchorPointPreviewWidth: s.width,
      anchorPointPreviewLength: s.length,
      anchorPointPreviewHeight: s.height,
    });
  }, [trackPoints, poles, foundations, completedTracks, selectedTracks, selectedPoles, selectedFoundations, cantilevers, vanes, vaneFirstCantIdx, selectedCantilevers, selectedVanes, anchorPoints, anchors, anchorFirstPoleIdx, selectedAnchorPoints, selectedAnchors, projectSettings.anchorPoint]);

  // Auto-fit camera in 2D whenever tracks or poles are added (runs after geometry update above).
  useEffect(() => {
    engineRef.current?.resetCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completedTracks.length, poles.length]);

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

      const projectWireConfig = projectSettingsRef.current.catenarySystem === 'DOUBLE_WIRE' ? 'DOUBLE' : 'SINGLE';
      const payloads = cantiList.map(c => {
        const footX = c.x2raw ?? c.x2;
        const footZ = c.z2raw ?? c.z2;
        
        const matchPole = polesRef.current.find(p => {
          let pX = p.x;
          let pZ = p.z || 0;
          if (p.foundationIdx !== undefined && foundationsRef.current[p.foundationIdx]) {
              const f = foundationsRef.current[p.foundationIdx];
              pX = f.x;
              pZ = f.z;
          }
          return Math.hypot(pX - c.x1, pZ - c.z1) < 500;
        });

        const pY = (matchPole?.foundationIdx !== undefined && foundationsRef.current[matchPole.foundationIdx])
          ? (foundationsRef.current[matchPole.foundationIdx].y ?? 0)
          : (matchPole?.y ?? 0);

        const foot = closestPointOnTracks(completedTracksRef.current, footX, footZ);
        const footY = foot.y;

        return {
          configuration: c.configuration ?? 'TDP>2.2',
          contactWireConfiguration: c.contactWireConfiguration ?? projectWireConfig,
          polePosition: [c.x1, pY, -c.z1],
          pv: [footX, footY, -footZ],
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
          poleWidth: matchPole?.width ?? 300,
          poleLength: matchPole?.length ?? 300,
          steadyArmAlpha: c.steadyArmAlpha ?? -2,
          registerArmAlpha: c.registerArmAlpha ?? 2,
          steadyArmLength: c.steadyArmLength ?? 1200,
        };
      });
      stompRef.current?.publish({ destination: '/app/calculate/batch', body: JSON.stringify(payloads) });
    }, 400);
  }, []);

  useEffect(() => { triggerCalculation(cantilevers); }, [cantilevers, triggerCalculation]);

  const triggerVaneCalculation = useCallback((vaneList: VaneData[], cantList: CantileverData[], startIndex: number = 0) => {
    if (!stompRef.current?.connected) return;
    vaneList.forEach((v, vIdx) => {
      const c1 = cantList[v.cantileverIdx1];
      if (!c1) return;
      const c2 = v.cantileverIdx2 !== undefined ? cantList[v.cantileverIdx2] : null;
      if (!c2 && v.poleIdx === undefined) return;

      const cwH1 = c1.contactWireHeight ?? 5400;
      const sysH1 = c1.systemHeight ?? 1000;
      const cwo1 = c1.contactWireVerticalOffset ?? 120;
      
      const cwH2 = c2 ? (c2.contactWireHeight ?? 5400) : (v.poleContactWireHeight ?? 5400);
      const sysH2 = c2 ? (c2.systemHeight ?? 1000) : (v.poleSystemHeight ?? 1000);
      const cwo2 = c2 ? (c2.contactWireVerticalOffset ?? 120) : 0; // offset is usually 0 if attached directly to pole face

      const foot1 = closestPointOnTracks(completedTracksRef.current, c1.x2, c1.z2);
      const y1 = foot1.y;

      // Prefer the calculator's actual solved attachment point (cwAxis/mwAxis) over
      // a flat approximation — once the pole and the track foot sit at different
      // elevations (climbing/descending track, common on curves), the real
      // attachment point tilts off-axis and the flat guess visibly disconnects
      // from the cantilever hardware.
      const c1Calc = calcByCantiIdx.current.get(v.cantileverIdx1);
      const cw_start = c1Calc?.cwAxis ?? [c1.x2, y1 + cwH1 + cwo1, -c1.z2];
      const sw_start = c1Calc?.mwAxis ?? [c1.x2, y1 + cwH1 + cwo1 + sysH1, -c1.z2];

      // If attached to a pole, recalculate attachment point based on latest pole coordinate
      let cw_end: [number, number, number];
      let sw_end: [number, number, number];
      if (v.poleIdx !== undefined && polesRef.current[v.poleIdx]) {
        const p = polesRef.current[v.poleIdx];

        // Check if pole is linked to a foundation, if so use foundation coordinates
        let pX = p.x;
        let pZ = p.z || 0;
        let pY = p.y ?? 0;
        if (p.foundationIdx !== undefined && foundationsRef.current[p.foundationIdx]) {
            const f = foundationsRef.current[p.foundationIdx];
            pX = f.x;
            pZ = f.z;
            pY = f.y ?? 0;
        }

        const foot = closestPointOnTracks(completedTracksRef.current, pX, pZ);
        const vToC1x = c1.x2 - pX;
        const vToC1z = c1.z2 - pZ;
        const dot = vToC1x * foot.tx + vToC1z * foot.tz;
        const sign = dot >= 0 ? 1 : -1;
        const offset = (p.width || 300) / 2;
        const endX = pX + sign * foot.tx * offset;
        const endZ = pZ + sign * foot.tz * offset;
        const endY = pY; // Foundation top / pole base
        cw_end = [endX, endY + cwH2 + cwo2, -endZ];
        sw_end = [endX, endY + cwH2 + cwo2 + sysH2, -endZ];
      } else if (c2) {
          const foot2 = closestPointOnTracks(completedTracksRef.current, c2.x2, c2.z2);
          const c2Calc = calcByCantiIdx.current.get(v.cantileverIdx2!);
          cw_end = c2Calc?.cwAxis ?? [c2.x2, foot2.y + cwH2 + cwo2, -c2.z2];
          sw_end = c2Calc?.mwAxis ?? [c2.x2, foot2.y + cwH2 + cwo2 + sysH2, -c2.z2];
      } else {
        return;
      }

      const payload = {
        _vaneIdx: startIndex + vIdx,
        cw_start, sw_start, cw_end, sw_end,
        qty_droppers: v.qtyDroppers ?? 0,
        initial_separation: v.initialSeparation ?? 5000,
        step_size: 500,  // fixed 500mm rendering grid for smooth wire curves
        cw_weight: v.cwWeight ?? 0.0019,
        cw_tension: v.cwTension ?? 1600,
        sw_weight: v.swWeight ?? 0.0024,
        sw_tension: v.swTension ?? 2000,
        dropper_weight: v.dropperWeight ?? 0.0006,
        lifting_start_distance: v.liftingStartDistance ?? -1.0,
      };
      stompRef.current?.publish({ destination: '/app/calculate/vane', body: JSON.stringify(payload) });
    });
  }, []);

  // Cascade vane recalculation when cantilevers change
  useEffect(() => {
    if (vanes.length > 0) triggerVaneCalculation(vanes, cantilevers);
  }, [cantilevers, vanes, triggerVaneCalculation]);

  const handleTrackSave = (updated: TrackData) => {
    if (editTrackIdx === null) return;
    const newTracks = [...completedTracks];
    newTracks[editTrackIdx] = updated.points.map(p => ({ ...p, label: updated.label }));
    setCompletedTracks(newTracks);
    setEditTrackIdx(null);

    // Regression: Recalculate foot for all cantilevers based on updated tracks
    const updatedCants = cantilevers.map(c => {
      const foot = closestPointOnTracks(newTracks, c.x2raw ?? c.x2, c.z2raw ?? c.z2);
      return { ...c, x2: foot.x, z2: foot.z, tx: foot.tx, tz: foot.tz };
    });
    setCantilevers(updatedCants);

    saveScene(newTracks, poles, updatedCants);
  };

  const handleFoundationSave = (updated: FoundationData) => {
    if (editFoundationIdx === null) return;
    const nextFoundations = [...foundations];
    nextFoundations[editFoundationIdx] = updated;
    setFoundations(nextFoundations);
    setEditFoundationIdx(null);

    // Poles linked to this foundation inherit its position/elevation directly,
    // so persist that onto the pole records (not just at render time) to keep
    // the pole panel and saved scene consistent with the foundation.
    const nextPoles = poles.map(p =>
      p.foundationIdx === editFoundationIdx
        ? { ...p, x: updated.x, z: updated.z, y: updated.y }
        : p
    );
    setPoles(nextPoles);

    // Regression: Poles linked to this foundation should trigger cantilever recalculation
    // (Actual calculation happens via the triggerCalculation effect which depends on cantilevers)
    // We don't necessarily need to change CantileverData unless pole X/Z changed,
    // but foundation Y change should trigger a re-calc.
    // Since cantilevers state won't change if only foundation Y changed, we might need to force it.
    triggerCalculation(cantilevers);

    saveScene(completedTracks, nextPoles, cantilevers, vanes, anchorPoints, anchors, nextFoundations);
  };

  const handlePoleSave = (updated: PoleData) => {
    if (editPoleIdx === null) return;
    const nextPoles = [...poles];
    nextPoles[editPoleIdx] = updated;
    setPoles(nextPoles);
    setEditPoleIdx(null);

    // If this pole is linked to a foundation and its elevation changed, push that
    // elevation back onto the foundation so both stay in sync either direction.
    const oldP = poles[editPoleIdx];
    let nextFoundations = foundations;
    if (updated.foundationIdx !== undefined && foundations[updated.foundationIdx] &&
        (foundations[updated.foundationIdx].y ?? 0) !== (updated.y ?? 0)) {
      nextFoundations = [...foundations];
      nextFoundations[updated.foundationIdx] = { ...nextFoundations[updated.foundationIdx], y: updated.y };
      setFoundations(nextFoundations);
    }

    // If pole moved, update attached cantilevers
    if (oldP.x !== updated.x || oldP.z !== updated.z || oldP.y !== updated.y) {
      const nextCants = cantilevers.map(c => {
        if (Math.hypot(c.x1 - oldP.x, c.z1 - (oldP.z || 0)) < 10) {
          return { ...c, x1: updated.x, z1: updated.z || 0 };
        }
        return c;
      });
      setCantilevers(nextCants);
      saveScene(completedTracks, nextPoles, nextCants, vanes, anchorPoints, anchors, nextFoundations);
    } else {
      saveScene(completedTracks, nextPoles, cantilevers, vanes, anchorPoints, anchors, nextFoundations);
      triggerCalculation(cantilevers); // Re-calc in case params like width/length changed
    }
  };

  // Save to API
  const saveScene = useCallback(async (
    tracks = completedTracksRef.current,
    poleList = polesRef.current,
    cantList = cantileversRef.current,
    vaneList = vanesRef.current,
    apList = anchorPointsRef.current,
    aList = anchorsRef.current,
    foundationList = foundationsRef.current,
  ) => {
    if (!locationId || !location) return;

    const trackData: TrackData[] = tracks.map(tr => ({
      label: tr[0]?.label ?? '', points: tr.map(({ label: _l, ...rest }) => rest),
    }));

    const scene: SceneData = { foundations: foundationList, tracks: trackData, poles: poleList, cantilevers: cantList, vanes: vaneList, anchorPoints: apList, anchors: aList };
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
      const { x, z, y, r, mode, cantileverIdx, poleIdx, anchorPointIdx, foundationIdx } = (e as CustomEvent).detail;

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

      } else if (mode === 'foundation') {
        setFoundationModal({ x, z, y, label: '' });

      } else if (mode === 'pole') {
        setPoleModal({ x, z, y, foundationIdx: foundationIdx !== -1 ? foundationIdx : undefined });

      } else if (mode === 'cantilever') {
        const foot = closestPointOnTracks(completedTracksRef.current, x, z);
        setCantileverModal({ x1: x, z1: z, x2raw: foot.x, z2raw: foot.z, tx: foot.tx, tz: foot.tz });

      } else if (mode === 'vane') {
        const firstIdx = vaneFirstCantIdxRef.current;
        const clickedCantIdx: number = cantileverIdx ?? -1;
        const clickedPoleIdx: number = poleIdx ?? -1;

        if (clickedCantIdx < 0 && clickedPoleIdx < 0) return;

        const cantList = cantileversRef.current;

        if (firstIdx === null) {
          // First click: must be a cantilever
          if (clickedCantIdx < 0) return;
          setVaneFirstCantIdx(clickedCantIdx);
        } else {
          // Second click
          if (clickedCantIdx === firstIdx) return;

          // Check constraints
          const currentVanes = vanesRef.current;
          const c1Vanes = currentVanes.filter(v => v.cantileverIdx1 === firstIdx || v.cantileverIdx2 === firstIdx).length;
          if (c1Vanes >= 2) { alert('Cantilever 1 already has 2 vanes'); return; }
          
          if (clickedCantIdx >= 0) {
            const c2Vanes = currentVanes.filter(v => v.cantileverIdx1 === clickedCantIdx || v.cantileverIdx2 === clickedCantIdx).length;
            if (c2Vanes >= 2) { alert('Cantilever 2 already has 2 vanes'); return; }
            const alreadyLinked = currentVanes.some(v =>
              (v.cantileverIdx1 === firstIdx && v.cantileverIdx2 === clickedCantIdx) ||
              (v.cantileverIdx1 === clickedCantIdx && v.cantileverIdx2 === firstIdx)
            );
            if (alreadyLinked) { alert('These cantilevers are already linked by a vane'); return; }
          } else if (clickedPoleIdx >= 0) {
            const alreadyLinked = currentVanes.some(v =>
              (v.cantileverIdx1 === firstIdx && v.poleIdx === clickedPoleIdx)
            );
            if (alreadyLinked) { alert('This cantilever is already linked to this pole by a vane'); return; }
          }

          const c1 = cantList[firstIdx];
          if (!c1) return;

          let x2 = 0, z2 = 0;
          if (clickedCantIdx >= 0) {
            const c2 = cantList[clickedCantIdx];
            if (!c2) return;
            x2 = c2.x2; z2 = c2.z2;
            (pendingVaneCantRef as any).current = { cantileverIdx1: firstIdx, cantileverIdx2: clickedCantIdx };
          } else if (clickedPoleIdx >= 0) {
            const p = polesRef.current[clickedPoleIdx];
            if (!p) return;
            // Calculate attachment on pole face perpendicular to track
            const foot = closestPointOnTracks(completedTracksRef.current, p.x, p.z || 0);
            
            // Use the track's tangent direction (tx, tz) to offset along the track.
            // Point the offset towards the first cantilever (c1).
            const vToC1x = c1.x2 - p.x;
            const vToC1z = c1.z2 - (p.z || 0);
            const dot = vToC1x * foot.tx + vToC1z * foot.tz;
            const sign = dot >= 0 ? 1 : -1;
            
            const offset = (p.width || 300) / 2;
            x2 = p.x + sign * foot.tx * offset;
            z2 = (p.z || 0) + sign * foot.tz * offset;
            (pendingVaneCantRef as any).current = { cantileverIdx1: firstIdx, poleIdx: clickedPoleIdx };
          }

          setVaneModal({ x1: c1.x2, z1: c1.z2, x2, z2 });
          setVaneFirstCantIdx(null);
          setVaneFormLabel('');
          setVaneFormDroppers(projectSettings.vane.qtyDroppers);
          setVaneFormInitialSep(projectSettings.vane.initialSeparation);
          setVaneFormPoleCwHeight(projectSettings.cantilever.contactWireHeight ?? 5400);
          setVaneFormPoleSysHeight(projectSettings.cantilever.systemHeight ?? 1000);
        }
      } else if (mode === 'anchorPoint') {
        // Show configure panel; compute D (distance to nearest pole center)
        const nearestPole = polesRef.current.reduce<{ d: number; pole: PoleData | null }>((acc, p) => {
          const d = Math.hypot(x - p.x, z - (p.z || 0));
          return d < acc.d ? { d, pole: p } : acc;
        }, { d: Infinity, pole: null });
        const s = projectSettingsRef.current.anchorPoint;
        const newAP: AnchorPointData = {
          x, z, label: '',
          width: s.width,
          length: s.length,
          height: s.height,
          density: s.density,
          D: nearestPole.d < Infinity ? nearestPole.d : undefined,
        };
        setAnchorPointModal(newAP);

      } else if (mode === 'anchor') {
        const firstPoleIdx: number | null = anchorFirstPoleIdxRef.current;
        const clickedPoleIdx: number = poleIdx ?? -1;
        const clickedAPIdx: number = anchorPointIdx ?? -1;

        if (firstPoleIdx === null) {
          // First click: must snap to a pole
          if (clickedPoleIdx < 0) return;
          setAnchorFirstPoleIdx(clickedPoleIdx);
        } else {
          // Second click: must snap to an anchor point
          if (clickedAPIdx < 0) { setAnchorFirstPoleIdx(null); return; }

          const pole = polesRef.current[firstPoleIdx];
          const ap = anchorPointsRef.current[clickedAPIdx];
          if (!pole || !ap) { setAnchorFirstPoleIdx(null); return; }

          // Compute pole face connection point: offset pole center toward anchor point by half pole width
          const dx = ap.x - pole.x;
          const dz = (ap.z || 0) - (pole.z || 0);
          const dist = Math.hypot(dx, dz);
          const poleHalfW = (pole.width ?? 160) / 2;
          const nx = dist > 0 ? dx / dist : 1;
          const nz = dist > 0 ? dz / dist : 0;
          const facePx = pole.x + nx * poleHalfW;
          const facePz = (pole.z || 0) + nz * poleHalfW;

          const s = projectSettingsRef.current.anchorPoint;
          const newAnchor: AnchorData = {
            poleIdx: firstPoleIdx,
            anchorPointIdx: clickedAPIdx,
            px: facePx, pz: facePz,
            ax: ap.x, az: ap.z || 0,
            fixingPointHeight: s.fixingPointHeight,
            label: '',
          };
          setAnchors(prev => {
            const next = [...prev, newAnchor];
            saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, vanesRef.current, anchorPointsRef.current, next);
            return next;
          });
          setAnchorFirstPoleIdx(null);
        }
      }
    };

    const handleViewerSelect = (e: Event) => {
      const { minX, maxX, minZ, maxZ, isPoint, hovered } = (e as CustomEvent).detail;

      // If the user clicked (point) while an item was hovered, select exactly that item
      if (isPoint && hovered) {
        setSelectedTracks(hovered.type === 'track' ? [hovered.index] : []);
        setSelectedPoles(hovered.type === 'pole' ? [hovered.index] : []);
        setSelectedFoundations(hovered.type === 'foundation' ? [hovered.index] : []);
        setSelectedCantilevers(hovered.type === 'cantilever' ? [hovered.index] : []);
        setSelectedVanes(hovered.type === 'vane' ? [hovered.index] : []);
        setSelectedAnchorPoints(hovered.type === 'anchorPoint' ? [hovered.index] : []);
        setSelectedAnchors(hovered.type === 'anchor' ? [hovered.index] : []);
        return;
      }

      const selT = new Set<number>();
      const selP = new Set<number>();
      const selF = new Set<number>();
      const selC = new Set<number>();
      const selV = new Set<number>();
      const selAP = new Set<number>();
      const selA = new Set<number>();

      const inB = (x: number, z: number) => x >= minX && x <= maxX && z >= minZ && z <= maxZ;

      const lineInB = (x1: number, z1: number, x2: number, z2: number) => {
        if (inB(x1, z1) || inB(x2, z2)) return true;
        let tmin = 0, tmax = 1;
        const dx = x2 - x1, dz = z2 - z1;
        for (let i = 0; i < 2; i++) {
          let t1, t2;
          if (i === 0) {
            if (dx === 0) { if (x1 < minX || x1 > maxX) return false; continue; }
            t1 = (minX - x1) / dx; t2 = (maxX - x1) / dx;
          } else {
            if (dz === 0) { if (z1 < minZ || z1 > maxZ) return false; continue; }
            t1 = (minZ - z1) / dz; t2 = (maxZ - z1) / dz;
          }
          tmin = Math.max(tmin, Math.min(t1, t2));
          tmax = Math.min(tmax, Math.max(t1, t2));
        }
        return tmin <= tmax;
      };

      const matchedLabels = new Set<string>();

      if (selFilterRef.current.tracks) {
        completedTracksRef.current.forEach((tr, i) => {
          if (tr.some(p => inB(p.x, p.z))) { selT.add(i); if (tr[0]?.label) matchedLabels.add(tr[0].label); }
          else {
            for (let j = 1; j < tr.length; j++) {
              if (lineInB(tr[j - 1].x, tr[j - 1].z, tr[j].x, tr[j].z)) { selT.add(i); if (tr[0]?.label) matchedLabels.add(tr[0].label); break; }
            }
          }
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
      if (selFilterRef.current.foundations) {
        foundationsRef.current.forEach((f, i) => {
          if (inB(f.x, f.z)) { selF.add(i); if (f.label) matchedLabels.add(f.label); }
        });
      }
      if (selFilterRef.current.cantilevers) {
        cantileversRef.current.forEach((c, i) => {
          if (lineInB(c.x1, c.z1, c.x2, c.z2)) selC.add(i);
        });
      }
      if (selFilterRef.current.vanes) {
        vanesRef.current.forEach((v, i) => {
          if (lineInB(v.x1, v.z1, v.x2, v.z2)) selV.add(i);
        });
      }
      if (selFilterRef.current.anchorPoints) {
        anchorPointsRef.current.forEach((ap, i) => {
          if (inB(ap.x, ap.z || 0)) selAP.add(i);
        });
      }
      if (selFilterRef.current.anchors) {
        anchorsRef.current.forEach((a, i) => {
          if (lineInB(a.px, a.pz, a.ax, a.az)) selA.add(i);
        });
      }
      setSelectedTracks(Array.from(selT));
      setSelectedPoles(Array.from(selP));
      setSelectedFoundations(Array.from(selF));
      setSelectedCantilevers(Array.from(selC));
      setSelectedVanes(Array.from(selV));
      setSelectedAnchorPoints(Array.from(selAP));
      setSelectedAnchors(Array.from(selA));
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
        const selF = selectedFoundationsRef.current;
        const selC = selectedCantiRef.current;
        const selV = selectedVanesRef.current;
        const selAP = selectedAnchorPointsRef.current;
        const selA = selectedAnchorsRef.current;
        if (selT.length || selP.length || selF.length || selC.length || selV.length || selAP.length || selA.length) {
          setCompletedTracks(prev => prev.filter((_, i) => !selT.includes(i)));
          
          let newVanes = vanesRef.current;
          if (selV.length) {
            newVanes = newVanes.filter((_, i) => !selV.includes(i));
          }

          let newPoles = polesRef.current;
          if (selP.length) {
            const oldPoles = polesRef.current;
            newPoles = oldPoles.filter((_, i) => !selP.includes(i));
            const poleIdxMap = new Array(oldPoles.length).fill(-1);
            let np = 0;
            oldPoles.forEach((_, oi) => { if (!selP.includes(oi)) poleIdxMap[oi] = np++; });
            setPoles(newPoles);
            
            // Filter vanes attached to deleted poles
            newVanes = newVanes
              .filter(v => v.poleIdx === undefined || poleIdxMap[v.poleIdx] !== -1)
              .map(v => v.poleIdx !== undefined ? { ...v, poleIdx: poleIdxMap[v.poleIdx] } : v);
          }

          if (selF.length) {
            const oldFoundations = foundationsRef.current;
            const newFoundations = oldFoundations.filter((_, i) => !selF.includes(i));
            const fIdxMap = new Array(oldFoundations.length).fill(-1);
            let nf = 0;
            oldFoundations.forEach((_, oi) => { if (!selF.includes(oi)) fIdxMap[oi] = nf++; });
            setFoundations(newFoundations);

            // Remap poles that reference deleted foundations
            newPoles = newPoles.map(p => {
              if (p.foundationIdx !== undefined) {
                const newIdx = fIdxMap[p.foundationIdx];
                return { ...p, foundationIdx: newIdx !== -1 ? newIdx : undefined };
              }
              return p;
            });
            setPoles(newPoles);
          }

          if (selC.length) {
            const oldCants = cantileversRef.current;
            const newCants = oldCants.filter((_, i) => !selC.includes(i));
            const idxMap = new Array(oldCants.length).fill(-1);
            let ni = 0;
            oldCants.forEach((_, oi) => { if (!selC.includes(oi)) idxMap[oi] = ni++; });
            setCantilevers(newCants);
            
            newVanes = newVanes
              .filter(v => idxMap[v.cantileverIdx1] !== -1 && (v.cantileverIdx2 === undefined || idxMap[v.cantileverIdx2] !== -1))
              .map(v => ({ 
                ...v, 
                cantileverIdx1: idxMap[v.cantileverIdx1], 
                cantileverIdx2: v.cantileverIdx2 !== undefined ? idxMap[v.cantileverIdx2] : undefined 
              }));
          }

          setVanes(newVanes);
          let finalAnchorPoints = anchorPointsRef.current;
          let finalAnchors = anchorsRef.current;
          if (selAP.length) {
            // Remove anchors that reference deleted anchor points, remap indices
            const oldAPs = anchorPointsRef.current;
            const newAPs = oldAPs.filter((_, i) => !selAP.includes(i));
            const apIdxMap = new Array(oldAPs.length).fill(-1);
            let nap = 0;
            oldAPs.forEach((_, oi) => { if (!selAP.includes(oi)) apIdxMap[oi] = nap++; });
            setAnchorPoints(newAPs);
            finalAnchorPoints = newAPs;
            finalAnchors = finalAnchors
              .filter(a => apIdxMap[a.anchorPointIdx] !== -1)
              .map(a => ({ ...a, anchorPointIdx: apIdxMap[a.anchorPointIdx] }));
            setAnchors(finalAnchors);
          } else if (selA.length) {
            finalAnchors = finalAnchors.filter((_, i) => !selA.includes(i));
            setAnchors(finalAnchors);
          }
          
          saveScene(
            completedTracksRef.current.filter((_, i) => !selT.includes(i)),
            newPoles,
            cantileversRef.current.filter((_, i) => !selC.includes(i)),
            newVanes,
            finalAnchorPoints,
            finalAnchors,
            foundationsRef.current.filter((_, i) => !selF.includes(i))
          );

          setSelectedTracks([]); setSelectedPoles([]); setSelectedFoundations([]); setSelectedCantilevers([]); setSelectedVanes([]);
          setSelectedAnchorPoints([]); setSelectedAnchors([]);
        }
      } else if (e.key === 'Escape') {
        setTrackPoints([]); setVaneFirstCantIdx(null); setAnchorFirstPoleIdx(null);
        if (drawMode !== 'none') { setDrawMode('none'); engineRef.current?.setDrawMode('none'); }
        setSelectedTracks([]); setSelectedPoles([]); setSelectedFoundations([]); setSelectedCantilevers([]); setSelectedVanes([]);
        setSelectedAnchorPoints([]); setSelectedAnchors([]);
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
    const pending = pendingVaneCantRef.current as any;
    if (!pending) return;
    const s = projectSettings.vane;
    const newV: VaneData = {
      cantileverIdx1: pending.cantileverIdx1,
      cantileverIdx2: pending.cantileverIdx2,
      poleIdx: pending.poleIdx,
      x1: vaneModal.x1, z1: vaneModal.z1,
      x2: vaneModal.x2, z2: vaneModal.z2,
      label: vaneFormLabel.trim(),
      qtyDroppers: vaneFormDroppers,
      initialSeparation: vaneFormInitialSep,
      cwWeight: s.cwWeight,
      cwTension: s.cwTension,
      swWeight: s.swWeight,
      swTension: s.swTension,
      dropperWeight: s.dropperWeight,
      poleContactWireHeight: pending.poleIdx !== undefined ? vaneFormPoleCwHeight : undefined,
      poleSystemHeight: pending.poleIdx !== undefined ? vaneFormPoleSysHeight : undefined,
    };
    setVanes(prev => {
      const next = [...prev, newV];
      saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, next);
      return next;
    });
    pendingVaneCantRef.current = null;
    setVaneModal(null);
  };

  const openEditCantilever = (idx: number) => {
    if (!cantilevers[idx]) return;
    const cached = calcByCantiIdx.current.get(idx);
    setLastCantResults(cached?.results ?? null);
    editCantileverIdxRef.current = idx;
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
    const cachedVane = calcByVaneIdx.current.get(idx);
    setLastVaneResults(cachedVane?.results ?? null);
    editVaneIdxRef.current = idx;
    setEditVaneIdx(idx);
    engineRef.current?.setEditingVane(idx.toString());
    // Switch to 3D front-elevation view looking perpendicular to the vane
    const c1 = cantilevers[v.cantileverIdx1];
    const c2 = v.cantileverIdx2 !== undefined ? cantilevers[v.cantileverIdx2] : null;
    const h1 = c1?.contactWireHeight ?? 5400;
    const h2 = c2 ? (c2.contactWireHeight ?? 5400) : (v.poleContactWireHeight ?? 5400);
    const cwHeight = (h1 + h2) / 2;
    setViewMode('3D');
    setDrawMode('none');
    engineRef.current?.setDrawMode('none');
    engineRef.current?.focusVane(v, cwHeight);
  };

  const handleCalculateVane = (updatedVane: VaneData) => {
    if (editVaneIdx === null) return;
    const tempVane = { ...updatedVane };
    triggerVaneCalculation([tempVane], cantilevers, editVaneIdx);
  };

  const saveEditVane = (updatedVane?: VaneData) => {
    if (editVaneIdx === null) return;
    const label = updatedVane?.label ?? vaneFormLabel;
    if (!label.trim()) { alert('Label is required'); return; }
    setVanes(prev => {
      const next = [...prev];
      next[editVaneIdx] = updatedVane
        ? { ...next[editVaneIdx], ...updatedVane }
        : { ...next[editVaneIdx], label: vaneFormLabel.trim(), qtyDroppers: vaneFormDroppers, initialSeparation: vaneFormInitialSep };
      saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, next);
      triggerVaneCalculation([next[editVaneIdx]], cantileversRef.current, editVaneIdx);
      return next;
    });
    editVaneIdxRef.current = null;
    setEditVaneIdx(null);
    engineRef.current?.setEditingVane(null);
    setSelectedVanes([]);
    setLastVaneResults(null);
    setViewMode('2D');
    engineRef.current?.setViewMode('2D');
    engineRef.current?.resetCamera();
  };

  const totalSelected = selectedTracks.length + selectedPoles.length + selectedCantilevers.length + selectedVanes.length + selectedAnchorPoints.length + selectedAnchors.length;

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
          {locationId && (
            <button
              disabled={downloading}
              onClick={async () => {
                setDownloading(true);
                try {
                  const name = (location?.name ?? 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
                  await api.locations.downloadReport(locationId, `ocs-report-${name}.pdf`);
                } finally {
                  setDownloading(false);
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', background: downloading ? '#1e293b' : '#166534', border: '1px solid #166534', color: '#fff', borderRadius: 6, cursor: downloading ? 'default' : 'pointer', fontSize: '0.8rem', fontWeight: 500 }}
            >
              <FileDown size={14} /> {downloading ? 'Generating…' : 'Report'}
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
            <div ref={selectFilterRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
              <ToolButton icon={<MousePointer2 size={17} />} label="Select" active={drawMode === 'none'} onClick={(e) => {
                e.stopPropagation();
                if (viewMode === '3D') return;
                if (drawMode !== 'none') {
                  selectDraw('none');
                  setShowSelectFilter(true);
                } else {
                  setShowSelectFilter(p => !p);
                }
              }} />
              {showSelectFilter && drawMode === 'none' && viewMode === '2D' && (
                <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 6, padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4, animation: 'filterScaleIn 0.15s ease-out', transformOrigin: 'top center', fontSize: 11, width: '100%' }}>
                  <style>{`@keyframes filterScaleIn { from { opacity: 0; transform: scaleY(0.95) translateY(-5px); } to { opacity: 1; transform: scaleY(1) translateY(0); } }`}</style>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.tracks} onChange={e => setSelFilter(f => ({ ...f, tracks: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Tracks</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.poles} onChange={e => setSelFilter(f => ({ ...f, poles: e.target.checked }))} style={{ accentColor: '#3b82f6', cursor: 'pointer' }} /> Poles</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.cantilevers} onChange={e => setSelFilter(f => ({ ...f, cantilevers: e.target.checked }))} style={{ accentColor: '#f59e0b', cursor: 'pointer' }} /> Cantilevers</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.vanes} onChange={e => setSelFilter(f => ({ ...f, vanes: e.target.checked }))} style={{ accentColor: '#9333ea', cursor: 'pointer' }} /> Vanes</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.anchorPoints} onChange={e => setSelFilter(f => ({ ...f, anchorPoints: e.target.checked }))} style={{ accentColor: '#f97316', cursor: 'pointer' }} /> Anchor Points</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}><input type="checkbox" checked={selFilter.anchors} onChange={e => setSelFilter(f => ({ ...f, anchors: e.target.checked }))} style={{ accentColor: '#fb923c', cursor: 'pointer' }} /> Anchors</label>
                </div>
              )}
            </div>

            {totalSelected > 0 && (
              <div style={{ marginTop: 12, padding: '8px', background: '#1e293b', border: '1px solid #3b82f6', borderRadius: 6, display: 'flex', flexDirection: 'column', gap: 6, width: '100%', animation: 'filterScaleIn 0.2s', textAlign: 'center' }}>
                <span style={{ color: '#94a3b8', fontSize: 10, fontWeight: 600, letterSpacing: '0.04em' }}>
                  {totalSelected} ITEM{totalSelected === 1 ? '' : 'S'} SELECTED
                </span>
                {selectedCantilevers.length === 1 && (
                  <button onClick={() => openEditCantilever(selectedCantilevers[0])} style={{ padding: '5px 8px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Cantilever</button>
                )}
                {selectedVanes.length === 1 && (
                  <button onClick={() => openEditVane(selectedVanes[0])} style={{ padding: '5px 8px', background: '#9333ea', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Vane</button>
                )}
                {selectedPoles.length === 1 && (
                  <button onClick={() => setEditPoleIdx(selectedPoles[0])} style={{ padding: '5px 8px', background: '#ef4444', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Pole</button>
                )}
                {selectedFoundations.length === 1 && (
                  <button onClick={() => setEditFoundationIdx(selectedFoundations[0])} style={{ padding: '5px 8px', background: '#22c55e', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Foundation</button>
                )}
                {selectedTracks.length === 1 && (
                  <button onClick={() => setEditTrackIdx(selectedTracks[0])} style={{ padding: '5px 8px', background: '#3b82f6', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Track</button>
                )}
                {selectedAnchorPoints.length === 1 && (
                  <button onClick={() => setEditAnchorPointIdx(selectedAnchorPoints[0])} style={{ padding: '5px 8px', background: '#f97316', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Anchor Point</button>
                )}
                {selectedAnchors.length === 1 && (
                  <button onClick={() => setEditAnchorIdx(selectedAnchors[0])} style={{ padding: '5px 8px', background: '#fb923c', border: 'none', color: '#000', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Edit Anchor</button>
                )}
              </div>
            )}
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
            <ToolButton icon={<Square size={17} />} label="Foundation" active={drawMode === 'foundation'} disabled={viewMode === '3D'} onClick={() => selectDraw('foundation')} />
            <ToolButton icon={<GitMerge size={17} />} label="Cantilever" active={drawMode === 'cantilever'} disabled={viewMode === '3D'} onClick={() => selectDraw('cantilever')} />
            <ToolButton icon={<Link2 size={17} />} label="Vane" active={drawMode === 'vane'} disabled={viewMode === '3D'} onClick={() => selectDraw('vane')} title="Connect two cantilever track-side ends" />
            <ToolButton icon={<Layout size={17} />} label="Anchor Pt" active={drawMode === 'anchorPoint'} disabled={viewMode === '3D'} onClick={() => selectDraw('anchorPoint')} title="Place anchor point plate" />
            <ToolButton icon={<Anchor size={17} />} label="Anchor" active={drawMode === 'anchor'} disabled={viewMode === '3D'} onClick={() => { selectDraw('anchor'); setAnchorFirstPoleIdx(null); }} title="Draw anchor: click pole then anchor point" />
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
            <LegendItem color="#f97316" label="Anchor Point" />
            <LegendItem color="#fb923c" label="Anchor" />
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

          {/* ── Results overlay: bottom-left of canvas, fade-in when editing ── */}
          {(() => {
            const visible = editCantileverIdx !== null || editVaneIdx !== null;
            const hasResults = lastCantResults !== null || lastVaneResults !== null;
            if (!visible) return null;
            return (
              <div style={{
                position: 'absolute', bottom: 20, left: 20,
                maxWidth: 420, zIndex: 100,
                background: 'rgba(0,0,0,0.58)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: 8,
                color: '#e2e8f0',
                fontFamily: 'monospace',
                fontSize: 11,
                backdropFilter: 'blur(6px)',
                animation: 'resultsOverlayIn 0.3s ease-out',
                overflow: 'hidden',
              }}>
                <style>{`
                  @keyframes resultsOverlayIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to   { opacity: 1; transform: translateY(0); }
                  }
                  .results-tbl { border-collapse: collapse; width: 100%; }
                  .results-tbl th { color: #64748b; font-weight: 600; padding: 4px 10px; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.07); font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
                  .results-tbl td { padding: 4px 10px; border-bottom: 1px solid rgba(255,255,255,0.04); white-space: nowrap; }
                  .results-tbl tr:last-child td { border-bottom: none; }
                  .results-tbl tr:hover td { background: rgba(255,255,255,0.03); }
                `}</style>

                {/* Header */}
                <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{
                    display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
                    background: editCantileverIdx !== null ? '#f59e0b' : '#9333ea',
                  }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {editCantileverIdx !== null ? 'Cantilever Results' : 'Vane Dropper Results'}
                  </span>
                  {!hasResults && <span style={{ marginLeft: 'auto', color: '#475569', fontStyle: 'italic', fontSize: 10 }}>awaiting calculation…</span>}
                </div>

                {/* Cantilever parts table */}
                {lastCantResults && lastCantResults.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="results-tbl">
                      <thead>
                        <tr>
                          <th>Part</th>
                          <th>Length (mm)</th>
                          <th>Cut (mm)</th>
                          <th>∅ (mm)</th>
                          <th>Thick (mm)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastCantResults.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: '#f59e0b' }}>{r.name}</td>
                            <td>{r.length.toFixed(1)}</td>
                            <td>{r.cut_length.toFixed(1)}</td>
                            <td>{r.diameter.toFixed(1)}</td>
                            <td>{r.thickness.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Vane dropper table */}
                {lastVaneResults && lastVaneResults.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="results-tbl">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Dropper (m)</th>
                          <th>Eye-Eye (m)</th>
                          <th>CW Dist (m)</th>
                          <th>Pole Dist (m)</th>
                          <th>CW Height (m)</th>
                          <th>Tilt (°)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lastVaneResults.map((r, i) => (
                          <tr key={i}>
                            <td style={{ color: '#9333ea' }}>{(r.index ?? i) + 1}</td>
                            <td>{r.dropper_length.toFixed(3)}</td>

                            <td>{r.distance_eye_to_eye.toFixed(3)}</td>
                            <td>{r.distance_cw.toFixed(3)}</td>
                            <td>{r.distance_pole_dropper.toFixed(2)}</td>
                            <td>{r.distance_cw_h.toFixed(3)}</td>
                            <td>{r.dropper_inclination.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}
        </main>

        {/* ── Modals ── */}

        {foundationModal && (
          <FoundationPanel
            foundation={foundationModal}
            settings={projectSettings}
            onSave={(updated) => {
              if (!updated.label?.trim()) { alert('Label is required'); return; }
              setFoundations(prev => { const next = [...prev, updated]; saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, vanesRef.current, anchorPointsRef.current, anchorsRef.current, next); return next; });
              setFoundationModal(null);
            }}
            onClose={() => setFoundationModal(null)}
          />
        )}

        {poleModal && (
          <PolePanel
            pole={{ x: poleModal.x, z: poleModal.z, y: poleModal.y, label: '', h: projectSettings.pole.height, cantileversQuantity: 1, catSeparation: 720 }}
            settings={projectSettings}
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
              contactWireHeight: projectSettings.cantilever.contactWireHeight,
              systemHeight: projectSettings.cantilever.systemHeight,
              contactWireVerticalOffset: projectSettings.cantilever.contactWireVerticalOffset,
              zigzag: projectSettings.cantilever.zigzag,
              supportOffset: projectSettings.cantilever.supportOffset,
              fixingDistance: projectSettings.cantilever.fixingDistance,
              bottomFixedHeight: projectSettings.cantilever.bottomFixedHeight,
              u: projectSettings.cantilever.u,
              curveRadiusDirection: 'inside',
              trackGauge: projectSettings.cantilever.trackGauge,
              configuration: projectSettings.catenarySystem === 'SINGLE_WIRE' ? 'SBA' : 'TDP>2.2',
              contactWireConfiguration: projectSettings.catenarySystem === 'SINGLE_WIRE' ? 'SINGLE' : 'DOUBLE',
              steadyArmAlpha: -2,
              registerArmAlpha: 2,
              steadyArmLength: 1200,
            }}
            catenarySystem={projectSettings.catenarySystem}
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
            
            {(pendingVaneCantRef.current as any)?.poleIdx !== undefined && (
              <div style={{ ...ROW, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={LBL}>Pole CW Height (mm)</label>
                  <input type="number" value={vaneFormPoleCwHeight} onChange={e => setVaneFormPoleCwHeight(+e.target.value)} style={INP} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={LBL}>Pole System Height (mm)</label>
                  <input type="number" value={vaneFormPoleSysHeight} onChange={e => setVaneFormPoleSysHeight(+e.target.value)} style={INP} />
                </div>
              </div>
            )}

            <div style={{ marginTop: 8, fontSize: 11, color: '#64748b' }}>
              Inter-dropper spacing = (vane length − 2 × initial separation) ÷ (droppers − 1), calculated automatically.
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 24, justifyContent: 'flex-end' }}>
              <button style={{ padding: '6px 16px', background: '#475569', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer' }} onClick={() => { setVaneModal(null); pendingVaneCantRef.current = null; }}>Cancel</button>
              <button style={{ padding: '6px 16px', background: '#9333ea', border: 'none', color: '#fff', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }} onClick={saveVane}>Save</button>
            </div>
          </Modal>
        )}

        {/* ── Edit: Track ── */}
        {editTrackIdx !== null && completedTracks[editTrackIdx] && (
          <TrackPanel
            track={{ label: completedTracks[editTrackIdx][0]?.label ?? '', points: completedTracks[editTrackIdx] }}
            onSave={handleTrackSave}
            onClose={() => setEditTrackIdx(null)}
          />
        )}

        {/* ── Edit: Foundation ── */}
        {editFoundationIdx !== null && foundations[editFoundationIdx] && (
          <FoundationPanel
            foundation={foundations[editFoundationIdx]}
            settings={projectSettings}
            onSave={handleFoundationSave}
            onClose={() => setEditFoundationIdx(null)}
          />
        )}

        {/* ── Edit: Pole ── */}
        {editPoleIdx !== null && poles[editPoleIdx] && (
          <PolePanel
            pole={poles[editPoleIdx]}
            settings={projectSettings}
            onSave={handlePoleSave}
            onClose={() => setEditPoleIdx(null)}
          />
        )}

        {/* ── Edit: Cantilever (slide-in panel) ── */}
        {editCantileverIdx !== null && cantilevers[editCantileverIdx] && (
          <CantileverPanel
            cantilever={cantilevers[editCantileverIdx]}
            catenarySystem={projectSettings.catenarySystem}
            onSave={handleSaveFromPanel}
            onCalculate={handleCalculateFromPanel}
            onClose={() => {
              editCantileverIdxRef.current = null;
              setEditCantileverIdx(null);
              setLastCantResults(null);
              triggerCalculation(cantilevers);
              setViewMode('2D');
              engineRef.current?.setViewMode('2D');
              engineRef.current?.resetCamera();
            }}
          />
        )}

        {/* ── Edit: Vane (slide-in panel) ── */}
        {editVaneIdx !== null && vanes[editVaneIdx] && (
          <VanePanel
            vane={vanes[editVaneIdx]}
            onSave={saveEditVane}
            onCalculate={handleCalculateVane}
            onClose={() => {
              editVaneIdxRef.current = null;
              setEditVaneIdx(null);
              engineRef.current?.setEditingVane(null);
              setLastVaneResults(null);
              setSelectedVanes([]);
              setViewMode('2D');
              engineRef.current?.setViewMode('2D');
              engineRef.current?.resetCamera();
            }}
          />
        )}

        {/* ── Create: Anchor Point ── */}
        {anchorPointModal && (
          <AnchorPointPanel
            anchorPoint={anchorPointModal}
            onSave={(updated) => {
              if (!updated.label?.trim()) { alert('Label is required'); return; }
              setAnchorPoints(prev => {
                const next = [...prev, updated];
                saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, vanesRef.current, next, anchorsRef.current);
                return next;
              });
              setAnchorPointModal(null);
            }}
            onClose={() => setAnchorPointModal(null)}
          />
        )}

        {/* ── Edit: Anchor Point ── */}
        {editAnchorPointIdx !== null && anchorPoints[editAnchorPointIdx] && (
          <AnchorPointPanel
            anchorPoint={anchorPoints[editAnchorPointIdx]}
            onSave={(updated) => {
              setAnchorPoints(prev => {
                const next = [...prev];
                next[editAnchorPointIdx!] = updated;
                // Also update anchor connection points if anchor point moved
                setAnchors(aList => aList.map(a =>
                  a.anchorPointIdx === editAnchorPointIdx
                    ? { ...a, ax: updated.x, az: updated.z || 0 }
                    : a
                ));
                saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, vanesRef.current, next, anchorsRef.current);
                return next;
              });
              setEditAnchorPointIdx(null);
              setSelectedAnchorPoints([]);
            }}
            onClose={() => { setEditAnchorPointIdx(null); }}
          />
        )}

        {/* ── Edit: Anchor ── */}
        {editAnchorIdx !== null && anchors[editAnchorIdx] && (
          <AnchorPanel
            anchor={anchors[editAnchorIdx]}
            poleLabel={poles[anchors[editAnchorIdx].poleIdx]?.label}
            anchorPointLabel={anchorPoints[anchors[editAnchorIdx].anchorPointIdx]?.label}
            onSave={(updated) => {
              setAnchors(prev => {
                const next = [...prev];
                next[editAnchorIdx!] = updated;
                saveScene(completedTracksRef.current, polesRef.current, cantileversRef.current, vanesRef.current, anchorPointsRef.current, next);
                return next;
              });
              setEditAnchorIdx(null);
              setSelectedAnchors([]);
            }}
            onClose={() => { setEditAnchorIdx(null); }}
          />
        )}
      </div>
    </div>
  );
}
