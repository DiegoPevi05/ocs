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
  const [viewMode,  setViewMode]  = useState<ViewMode>('2D');
  const [drawMode,  setDrawMode]  = useState<DrawMode>('none');

  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef    = useRef<ViewerEngine | null>(null);

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
            <ToolButton
              icon={<MousePointer2 size={17} />}
              label="Select"
              active={drawMode === 'none'}
              onClick={() => selectDraw('none')}
            />
          </div>

          <div className="tool-sep" />

          {/* Drawing tools */}
          <div className="tool-group">
            <ToolButton
              icon={<Minus size={17} />}
              label="Track"
              active={drawMode === 'track'}
              disabled={viewMode === '3D'}
              onClick={() => selectDraw('track')}
              title="Draw track line"
            />
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

          {/* Legend at bottom of toolbar */}
          <div className="toolbar-legend">
            <div className="toolbar-legend__title">Legend</div>
            <LegendItem color="#646464" label="Pole" />
            <LegendItem color="#0079f1" label="Stay Tube" />
            <LegendItem color="#00e430" label="Bracket Tube" />
            <LegendItem color="#9932cc" label="Register Arm" />
            <LegendItem color="#ff8000" label="Steady Arm" />
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
        </main>

      </div>
    </div>
  );
}
