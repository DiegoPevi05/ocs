import { useCallback, useRef, useState } from 'react';
import {
  Upload, X, CheckCircle2, AlertCircle, Layers, FileText,
  ChevronDown, ArrowRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  parseDxf, classifyLayer,
  type ParsedDxfScene, type DxfClassification, type ParsedTrack, type ParsedFoundation,
} from '../lib/dxfParser';
import type { TrackData, FoundationData } from '../types';

// ─── Row model ────────────────────────────────────────────────────────────────
interface Row {
  id: string;
  entityType: string;
  layer: string;
  label: string;
  classification: DxfClassification | 'skip';
  enabled: boolean;
  pointCount: number;
  // original parsed data
  trackData?:      ParsedTrack;
  foundationData?: ParsedFoundation;
}

function buildRows(scene: ParsedDxfScene): Row[] {
  const rows: Row[] = [];

  scene.tracks.forEach((t, i) => {
    const auto = classifyLayer(t.layer);
    rows.push({
      id:             `t-${i}`,
      entityType:     t.entityType,
      layer:          t.layer,
      label:          t.label,
      classification: auto === 'unknown' ? 'track' : (auto as DxfClassification),
      enabled:        auto !== 'unknown' ? true : true, // include all by default
      pointCount:     t.points.length,
      trackData:      t,
    });
  });

  scene.foundations.forEach((f, i) => {
    const auto = classifyLayer(f.layer);
    rows.push({
      id:             `f-${i}`,
      entityType:     'POINT',
      layer:          f.layer,
      label:          f.label,
      classification: auto === 'unknown' ? 'foundation' : (auto as DxfClassification),
      enabled:        true,
      pointCount:     1,
      foundationData: f,
    });
  });

  return rows;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  onImport: (result: { tracks: TrackData[]; foundations: FoundationData[] }) => void;
  onClose: () => void;
}

// ─── Classification badge ─────────────────────────────────────────────────────
const CLASS_COLORS: Record<string, string> = {
  track:      'rgba(59,130,246,0.18)',
  foundation: 'rgba(180,83,9,0.18)',
  skip:       'rgba(100,116,139,0.15)',
};
const CLASS_LABELS: Record<string, string> = {
  track: 'Track', foundation: 'Foundation', skip: 'Skip',
};

// ─── Component ────────────────────────────────────────────────────────────────
export function DxfImportModal({ onImport, onClose }: Props) {
  const [dragging,  setDragging]  = useState(false);
  const [parsed,    setParsed]    = useState<ParsedDxfScene | null>(null);
  const [rows,      setRows]      = useState<Row[]>([]);
  const [scaleInput, setScaleInput] = useState('');
  const [error,     setError]     = useState<string | null>(null);
  const [fileName,  setFileName]  = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Parse helper ─────────────────────────────────────────────────────────
  const parseFile = useCallback((file: File) => {
    setError(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const scene = parseDxf(text);
        setParsed(scene);
        setScaleInput(String(scene.scale));
        setRows(buildRows(scene));
      } catch (err) {
        setError('Failed to parse DXF file. Make sure it is an ASCII DXF.');
      }
    };
    reader.readAsText(file);
  }, []);

  // ── Re-parse with custom scale ─────────────────────────────────────────────
  const reparse = (file: File | null, newScale: number) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const scene = parseDxf(text, newScale);
      setParsed(scene);
      setRows(buildRows(scene));
    };
    reader.readAsText(file);
  };

  // ── Drop / pick handlers ───────────────────────────────────────────────────
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }, [parseFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  };

  // ── Row mutations ──────────────────────────────────────────────────────────
  const setRowClass = (id: string, cls: DxfClassification | 'skip') =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, classification: cls } : r));

  const setRowLabel = (id: string, label: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, label } : r));

  const toggleRow = (id: string) =>
    setRows(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));

  const setAllClass = (cls: DxfClassification | 'skip') =>
    setRows(prev => prev.map(r => ({ ...r, classification: cls })));

  // ── Import ────────────────────────────────────────────────────────────────
  const handleImport = () => {
    const importedTracks:      TrackData[]      = [];
    const importedFoundations: FoundationData[] = [];

    rows.forEach(row => {
      if (!row.enabled) return;
      if (row.classification === 'skip') return;

      if (row.classification === 'track' && row.trackData) {
        importedTracks.push({
          id:     crypto.randomUUID(),
          label:  row.label,
          points: row.trackData.points.map(p => ({ x: p.x, z: p.z, y: p.y, r: p.r })),
        });
      } else if (row.classification === 'foundation' && row.foundationData) {
        importedFoundations.push({
          id:    crypto.randomUUID(),
          label: row.label,
          x:     row.foundationData.x,
          z:     row.foundationData.z,
          y:     row.foundationData.y,
        });
      } else if (row.classification === 'foundation' && row.trackData) {
        // User re-classified a line entity as a foundation — use midpoint
        const pts = row.trackData.points;
        const mid = Math.floor(pts.length / 2);
        importedFoundations.push({
          id:    crypto.randomUUID(),
          label: row.label,
          x:     pts[mid].x,
          z:     pts[mid].z,
          y:     pts[mid].y,
        });
      } else if (row.classification === 'track' && row.foundationData) {
        // User re-classified a point as track — use it as a 1-point placeholder (skip)
        // (a track needs at least 2 points, so skip gracefully)
      }
    });

    onImport({ tracks: importedTracks, foundations: importedFoundations });
    onClose();
  };

  const enabledRows   = rows.filter(r => r.enabled && r.classification !== 'skip');
  const trackCount    = enabledRows.filter(r => r.classification === 'track').length;
  const foundCount    = enabledRows.filter(r => r.classification === 'foundation').length;
  const hasContent    = parsed !== null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1200,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
    }}>
      <div style={{
        background: 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)',
        border: '1px solid rgba(148,163,184,0.15)',
        borderRadius: 16, width: '92vw', maxWidth: 900,
        maxHeight: '90vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
        overflow: 'hidden',
      }}>
        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '18px 24px', borderBottom: '1px solid rgba(148,163,184,0.1)',
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Upload size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Import DXF</div>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
              AutoCAD DXF — lines and polylines become tracks, points become foundations
            </div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            color: '#64748b', cursor: 'pointer', borderRadius: 8, padding: 6,
            display: 'flex', alignItems: 'center', transition: 'color 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
            onMouseLeave={e => (e.currentTarget.style.color = '#64748b')}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Drop zone ─────────────────────────────────────────────── */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#3b82f6' : (hasContent ? '#22c55e55' : 'rgba(148,163,184,0.25)')}`,
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', alignItems: 'center', gap: 16,
              cursor: 'pointer', transition: 'all 0.2s',
              background: dragging ? 'rgba(59,130,246,0.06)' : (hasContent ? 'rgba(34,197,94,0.04)' : 'transparent'),
            }}
          >
            <input ref={fileRef} type="file" accept=".dxf" style={{ display: 'none' }} onChange={onFileChange} />
            {hasContent ? (
              <>
                <CheckCircle2 size={28} color="#22c55e" />
                <div>
                  <div style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 14 }}>{fileName}</div>
                  <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>
                    {parsed!.tracks.length} line/polyline entities · {parsed!.foundations.length} points
                    · Units: <span style={{ color: '#94a3b8' }}>{parsed!.units}</span>
                    · Scale: <span style={{ color: '#94a3b8' }}>{parsed!.scale} mm/unit</span>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', fontSize: 12, color: '#3b82f6' }}>Click to replace</div>
              </>
            ) : (
              <>
                <FileText size={28} color="#64748b" />
                <div>
                  <div style={{ color: '#94a3b8', fontWeight: 600, fontSize: 14 }}>
                    Drop a .dxf file here, or click to browse
                  </div>
                  <div style={{ color: '#475569', fontSize: 12, marginTop: 2 }}>
                    ASCII DXF format (AutoCAD 2000+)
                  </div>
                </div>
              </>
            )}
          </div>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 10, padding: '12px 16px', color: '#fca5a5', fontSize: 13,
            }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          {/* ── Scale override ─────────────────────────────────────────── */}
          {hasContent && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              background: 'rgba(148,163,184,0.06)', borderRadius: 10,
              padding: '12px 16px', border: '1px solid rgba(148,163,184,0.1)',
            }}>
              <Layers size={16} color="#64748b" />
              <span style={{ color: '#94a3b8', fontSize: 13 }}>Scale (mm per DXF unit)</span>
              <input
                type="number" min={0.001} step="any"
                value={scaleInput}
                onChange={e => setScaleInput(e.target.value)}
                onBlur={() => {
                  const s = parseFloat(scaleInput);
                  if (s > 0 && s !== parsed?.scale) {
                    // Re-parse would need original file; for now update existing coords
                    const ratio = s / (parsed?.scale ?? 1);
                    setRows(prev => prev.map(r => ({
                      ...r,
                      trackData: r.trackData ? {
                        ...r.trackData,
                        points: r.trackData.points.map(p => ({ x: p.x * ratio, z: p.z * ratio, y: p.y * ratio })),
                      } : undefined,
                      foundationData: r.foundationData ? {
                        ...r.foundationData,
                        x: r.foundationData.x * ratio,
                        z: r.foundationData.z * ratio,
                        y: r.foundationData.y * ratio,
                      } : undefined,
                    })));
                    setParsed(prev => prev ? { ...prev, scale: s } : prev);
                  }
                }}
                style={{
                  width: 90, background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(148,163,184,0.2)', borderRadius: 6,
                  color: '#f1f5f9', fontSize: 13, padding: '4px 8px', outline: 'none',
                }}
              />
              <span style={{ color: '#475569', fontSize: 12 }}>
                Auto-detected: <strong style={{ color: '#94a3b8' }}>{parsed?.units}</strong>
                {parsed?.units === 'm' && ' → recommend 1000'}
                {parsed?.units === 'mm' && ' → recommend 1'}
              </span>
            </div>
          )}

          {/* ── Preview table ──────────────────────────────────────────── */}
          {hasContent && rows.length > 0 && (
            <div style={{ flex: 1 }}>
              {/* Bulk actions */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10,
                fontSize: 12, color: '#64748b',
              }}>
                <span>Bulk set all:</span>
                {(['track', 'foundation', 'skip'] as const).map(cls => (
                  <button key={cls} onClick={() => setAllClass(cls)} style={{
                    padding: '3px 10px', borderRadius: 5, border: '1px solid rgba(148,163,184,0.2)',
                    background: 'rgba(148,163,184,0.06)', color: '#94a3b8',
                    cursor: 'pointer', fontSize: 12, transition: 'all 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.15)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.06)')}
                  >
                    {CLASS_LABELS[cls]}
                  </button>
                ))}
                <span style={{ marginLeft: 'auto' }}>
                  {rows.filter(r => r.enabled).length} enabled of {rows.length}
                </span>
              </div>

              {/* Table */}
              <div style={{
                borderRadius: 10, border: '1px solid rgba(148,163,184,0.12)',
                overflow: 'hidden',
              }}>
                {/* Head */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '36px 1fr 110px 130px 60px 70px',
                  padding: '8px 14px',
                  background: 'rgba(148,163,184,0.06)',
                  fontSize: 11, color: '#64748b', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  borderBottom: '1px solid rgba(148,163,184,0.1)',
                }}>
                  <span></span>
                  <span>Label</span>
                  <span>Layer</span>
                  <span>Type</span>
                  <span style={{ textAlign: 'right' }}>Pts</span>
                  <span>Entity</span>
                </div>

                {/* Rows */}
                {rows.map((row, idx) => (
                  <div key={row.id} style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr 110px 130px 60px 70px',
                    padding: '7px 14px', alignItems: 'center',
                    borderBottom: idx < rows.length - 1 ? '1px solid rgba(148,163,184,0.06)' : 'none',
                    background: !row.enabled ? 'rgba(0,0,0,0.15)' : 'transparent',
                    opacity: !row.enabled ? 0.45 : 1,
                    transition: 'opacity 0.15s',
                  }}>
                    {/* Enable toggle */}
                    <button onClick={() => toggleRow(row.id)} style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: row.enabled ? '#22c55e' : '#475569', display: 'flex',
                    }}>
                      {row.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                    </button>

                    {/* Label (editable) */}
                    <input
                      value={row.label}
                      onChange={e => setRowLabel(row.id, e.target.value)}
                      style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(148,163,184,0.12)',
                        borderRadius: 5, color: '#e2e8f0', fontSize: 12, padding: '3px 7px',
                        outline: 'none', width: '90%',
                      }}
                    />

                    {/* Layer */}
                    <span style={{
                      fontSize: 11, color: '#64748b',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      paddingRight: 8,
                    }}>{row.layer}</span>

                    {/* Classification dropdown */}
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <select
                        value={row.classification}
                        onChange={e => setRowClass(row.id, e.target.value as DxfClassification | 'skip')}
                        style={{
                          appearance: 'none', WebkitAppearance: 'none',
                          background: CLASS_COLORS[row.classification],
                          border: '1px solid rgba(148,163,184,0.18)',
                          borderRadius: 6, color: '#e2e8f0', fontSize: 12,
                          padding: '3px 24px 3px 8px', cursor: 'pointer',
                          outline: 'none', width: '100%',
                        }}
                      >
                        <option value="track">Track</option>
                        <option value="foundation">Foundation</option>
                        <option value="skip">Skip</option>
                      </select>
                      <ChevronDown size={12} color="#64748b" style={{ position: 'absolute', right: 6, pointerEvents: 'none' }} />
                    </div>

                    {/* Point count */}
                    <span style={{ textAlign: 'right', fontSize: 12, color: '#94a3b8', paddingRight: 8 }}>
                      {row.pointCount}
                    </span>

                    {/* Entity type badge */}
                    <span style={{
                      fontSize: 10, color: '#64748b',
                      background: 'rgba(148,163,184,0.08)',
                      borderRadius: 4, padding: '1px 5px',
                      display: 'inline-block',
                    }}>
                      {row.entityType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasContent && rows.length === 0 && (
            <div style={{
              textAlign: 'center', padding: '32px 0',
              color: '#64748b', fontSize: 14,
            }}>
              No importable entities found in this DXF file.<br />
              <span style={{ fontSize: 12, color: '#475569' }}>
                Make sure your file contains LINE, LWPOLYLINE, POLYLINE, or POINT entities.
              </span>
            </div>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 24px', borderTop: '1px solid rgba(148,163,184,0.1)',
          background: 'rgba(0,0,0,0.2)',
        }}>
          {hasContent && (
            <div style={{ fontSize: 12, color: '#64748b' }}>
              Will import:&nbsp;
              <span style={{ color: '#3b82f6', fontWeight: 600 }}>{trackCount} track{trackCount !== 1 ? 's' : ''}</span>
              &nbsp;and&nbsp;
              <span style={{ color: '#b45309', fontWeight: 600 }}>{foundCount} foundation{foundCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              padding: '8px 18px', borderRadius: 8,
              background: 'rgba(148,163,184,0.08)',
              border: '1px solid rgba(148,163,184,0.15)',
              color: '#94a3b8', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(148,163,184,0.08)')}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!hasContent || (trackCount === 0 && foundCount === 0)}
              style={{
                padding: '8px 20px', borderRadius: 8,
                background: (hasContent && (trackCount > 0 || foundCount > 0))
                  ? 'linear-gradient(135deg, #3b82f6, #6366f1)'
                  : 'rgba(148,163,184,0.1)',
                border: 'none',
                color: (hasContent && (trackCount > 0 || foundCount > 0)) ? '#fff' : '#475569',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.2s',
                opacity: (hasContent && (trackCount > 0 || foundCount > 0)) ? 1 : 0.5,
              }}
            >
              Import {trackCount + foundCount} items <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
