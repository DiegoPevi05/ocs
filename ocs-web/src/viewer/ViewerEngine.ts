import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ApiLine, ApiResponse, DrawMode, ViewMode } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_LINE_COUNT  = 120;
const GRID_COLOR       = 0x334155;   // slate-700 — visible against dark bg
const BG_COLOR         = '#0f172a';
const CURSOR_COLOR     = 0xe2e8f0;

const POSSIBLE_SPACINGS = [
  50, 100, 250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000,
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function rgbaToHex(c: [number, number, number, number]): number {
  return (c[0] << 16) | (c[1] << 8) | c[2];
}

function calcSpacing(visibleWidth: number): number {
  const ideal = visibleWidth / 12;
  let best = POSSIBLE_SPACINGS[0];
  let bestDiff = Math.abs(ideal - best);
  for (const s of POSSIBLE_SPACINGS) {
    const d = Math.abs(ideal - s);
    if (d < bestDiff) { bestDiff = d; best = s; }
  }
  return best;
}

// ─── ViewerEngine ─────────────────────────────────────────────────────────────

export class ViewerEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;
  private cam2D: THREE.OrthographicCamera;
  private cam3D: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private viewMode: ViewMode = '2D';
  public  drawMode: DrawMode = 'none';

  // Grid (2D)
  private gridGroup: THREE.Group;
  private gridH: THREE.Line[] = [];
  private gridV: THREE.Line[] = [];

  // Cursor crosshair (2D)
  private cursorGroup: THREE.Group;
  private coordsEl?: HTMLElement;

  // API geometry
  private dataGroup: THREE.Group;

  // Pan state (2D)
  private panning = false;
  private panOrigin = new THREE.Vector2();

  // Bound event refs
  private _onMM: (e: MouseEvent) => void;
  private _onMD: (e: MouseEvent) => void;
  private _onMU: (e: MouseEvent) => void;
  private _onWH: (e: WheelEvent) => void;
  private _onRZ: () => void;
  private _onCM: (e: Event) => void;

  private raf?: number;

  // ─── Constructor ────────────────────────────────────────────────────────────

  constructor(container: HTMLElement) {
    this.container = container;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(BG_COLOR);

    this.renderer = this.buildRenderer();
    this.cam2D    = this.buildCam2D();
    this.cam3D    = this.buildCam3D();
    this.controls = this.buildControls();

    this.gridGroup   = this.buildGrid();
    this.cursorGroup = this.buildCursor();
    this.dataGroup   = new THREE.Group();
    this.dataGroup.name = 'data';

    this.scene.add(this.gridGroup, this.dataGroup, this.cursorGroup);

    // Lights (mainly for 3D mode meshes)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.8));
    const dl = new THREE.DirectionalLight(0xffffff, 0.4);
    dl.position.set(5000, 10000, 8000);
    this.scene.add(dl);

    this.coordsEl = this.buildCoordsDisplay();

    this._onMM = this.onMouseMove.bind(this);
    this._onMD = this.onMouseDown.bind(this);
    this._onMU = this.onMouseUp.bind(this);
    this._onWH = this.onWheel.bind(this);
    this._onRZ = this.onResize.bind(this);
    this._onCM = (e) => e.preventDefault();

    this.container.addEventListener('mousemove', this._onMM);
    this.container.addEventListener('mousedown', this._onMD);
    window.addEventListener('mouseup', this._onMU);
    this.container.addEventListener('wheel', this._onWH, { passive: false });
    window.addEventListener('resize', this._onRZ);
    this.container.addEventListener('contextmenu', this._onCM);

    this.updateGrid();
    this.loop();

    // If container dimensions weren't ready yet (rare CSS edge-case), re-fit once painted
    if (!this.container.offsetWidth || !this.container.offsetHeight) {
      requestAnimationFrame(() => this.onResize());
    }
  }

  // ─── Scene setup ────────────────────────────────────────────────────────────

  private buildRenderer(): THREE.WebGLRenderer {
    const r = new THREE.WebGLRenderer({ antialias: true });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.setSize(this.container.offsetWidth, this.container.offsetHeight);
    this.container.appendChild(r.domElement);
    return r;
  }

  private buildCam2D(): THREE.OrthographicCamera {
    const { offsetWidth: w, offsetHeight: h } = this.container;
    const a = w / h;
    // Base half-height covers 15 000 world units (roughly a 30m pole + surroundings)
    const hs = 15000;
    const cam = new THREE.OrthographicCamera(-hs * a, hs * a, hs, -hs, -1e6, 1e6);
    // Initial position: centered somewhere around a typical cantilever cross-section
    cam.position.set(1500, 6000, 10000);
    cam.lookAt(1500, 6000, 0);
    return cam;
  }

  private buildCam3D(): THREE.PerspectiveCamera {
    const { offsetWidth: w, offsetHeight: h } = this.container;
    const cam = new THREE.PerspectiveCamera(55, w / h, 1, 500000);
    cam.position.set(8000, 10000, 25000);
    cam.lookAt(1500, 6000, 10000);
    return cam;
  }

  private buildControls(): OrbitControls {
    const ctrl = new OrbitControls(this.cam3D, this.renderer.domElement);
    ctrl.target.set(1500, 6000, 10000);
    ctrl.enableDamping  = true;
    ctrl.dampingFactor  = 0.06;
    ctrl.enabled        = false; // disabled until 3D mode
    ctrl.update();
    return ctrl;
  }

  // ─── Grid ────────────────────────────────────────────────────────────────────

  private buildGrid(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({ color: GRID_COLOR });
    for (let i = 0; i < GRID_LINE_COUNT; i++) {
      const makeEmpty = () =>
        new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(0, 0, 0),
        ]);

      const hLine = new THREE.Line(makeEmpty(), mat.clone());
      hLine.visible = false;
      hLine.renderOrder = -2;
      this.gridH.push(hLine);
      group.add(hLine);

      const vLine = new THREE.Line(makeEmpty(), mat.clone());
      vLine.visible = false;
      vLine.renderOrder = -2;
      this.gridV.push(vLine);
      group.add(vLine);
    }
    return group;
  }

  private updateGrid(): void {
    if (this.viewMode !== '2D') return;

    const cam  = this.cam2D;
    const visW = (cam.right - cam.left)  / cam.zoom;
    const visH = (cam.top   - cam.bottom) / cam.zoom;
    const cx   = cam.position.x;
    const cy   = cam.position.y;

    const L = cx - visW / 2;
    const R = cx + visW / 2;
    const B = cy - visH / 2;
    const T = cy + visH / 2;

    const sp = calcSpacing(visW);

    const startX = Math.floor(L / sp) * sp;
    const startY = Math.floor(B / sp) * sp;

    let vi = 0;
    for (let x = startX; x < R + sp && vi < this.gridV.length; x += sp, vi++) {
      const line = this.gridV[vi];
      const pa   = line.geometry.attributes.position.array as Float32Array;
      pa[0] = x; pa[1] = B - sp; pa[2] = -0.5;
      pa[3] = x; pa[4] = T + sp; pa[5] = -0.5;
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = true;
    }
    for (let i = vi; i < this.gridV.length; i++) this.gridV[i].visible = false;

    let hi = 0;
    for (let y = startY; y < T + sp && hi < this.gridH.length; y += sp, hi++) {
      const line = this.gridH[hi];
      const pa   = line.geometry.attributes.position.array as Float32Array;
      pa[0] = L - sp; pa[1] = y; pa[2] = -0.5;
      pa[3] = R + sp; pa[4] = y; pa[5] = -0.5;
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = true;
    }
    for (let i = hi; i < this.gridH.length; i++) this.gridH[i].visible = false;
  }

  // ─── Cursor ──────────────────────────────────────────────────────────────────

  private buildCursor(): THREE.Group {
    const group = new THREE.Group();
    const mat   = new THREE.LineBasicMaterial({
      color: CURSOR_COLOR, transparent: true, opacity: 0.65,
    });
    const SZ = 500; // base world-space size at zoom=1

    const mkLine = (pts: [number, number, number][]) =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
        mat.clone()
      );

    const h  = mkLine([[-SZ, 0, 2], [SZ, 0, 2]]);
    const v  = mkLine([[0, -SZ, 2], [0, SZ, 2]]);
    const sq = mkLine([
      [-SZ * 0.07, -SZ * 0.07, 2],
      [ SZ * 0.07, -SZ * 0.07, 2],
      [ SZ * 0.07,  SZ * 0.07, 2],
      [-SZ * 0.07,  SZ * 0.07, 2],
      [-SZ * 0.07, -SZ * 0.07, 2],
    ]);

    h.renderOrder = 100;
    v.renderOrder = 100;
    sq.renderOrder = 100;

    group.add(h, v, sq);
    group.visible     = false;
    group.renderOrder = 100;
    return group;
  }

  // ─── Coordinates display ─────────────────────────────────────────────────────

  private buildCoordsDisplay(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute; bottom: 10px; left: 10px;
      background: rgba(15,23,42,0.85); color: #94a3b8;
      padding: 4px 10px; border-radius: 4px;
      font-family: monospace; font-size: 12px;
      pointer-events: none; display: none;
      border: 1px solid rgba(51,65,85,0.5);
      user-select: none; z-index: 10;
    `;
    this.container.style.position = 'relative';
    this.container.appendChild(el);
    return el;
  }

  // ─── Mouse → world coords ────────────────────────────────────────────────────

  private toWorld(e: MouseEvent | WheelEvent): THREE.Vector2 {
    const cam  = this.cam2D;
    const rect = this.container.getBoundingClientRect();
    const visW = (cam.right - cam.left)   / cam.zoom;
    const visH = (cam.top   - cam.bottom) / cam.zoom;
    const L    = cam.position.x - visW / 2;
    const B    = cam.position.y - visH / 2;
    const wx   = L + ((e.clientX - rect.left) / rect.width)                   * visW;
    const wy   = B + ((rect.height - (e.clientY - rect.top)) / rect.height)   * visH;
    return new THREE.Vector2(wx, wy);
  }

  // ─── Event handlers ──────────────────────────────────────────────────────────

  private onMouseMove(e: MouseEvent): void {
    if (this.viewMode !== '2D') return;

    const rect     = this.container.getBoundingClientRect();
    const inBounds =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top  && e.clientY <= rect.bottom;

    // Pan drag
    if (this.panning) {
      const visW = (this.cam2D.right - this.cam2D.left)   / this.cam2D.zoom;
      const visH = (this.cam2D.top   - this.cam2D.bottom) / this.cam2D.zoom;
      const dx   = -(e.clientX - this.panOrigin.x) / rect.width  * visW;
      const dy   =  (e.clientY - this.panOrigin.y) / rect.height * visH;
      this.cam2D.position.x += dx;
      this.cam2D.position.y += dy;
      this.panOrigin.set(e.clientX, e.clientY);
      this.updateGrid();
    }

    // Crosshair cursor
    if (inBounds) {
      const w     = this.toWorld(e);
      // Scale keeps cursor constant on screen regardless of zoom
      const scale = 1 / this.cam2D.zoom;
      this.cursorGroup.position.set(w.x, w.y, 0);
      this.cursorGroup.scale.setScalar(scale);
      this.cursorGroup.visible = true;

      if (this.coordsEl) {
        this.coordsEl.style.display = 'block';
        this.coordsEl.textContent   = `x: ${Math.round(w.x).toLocaleString()}   y: ${Math.round(w.y).toLocaleString()}`;
      }
    } else {
      this.cursorGroup.visible = false;
      if (this.coordsEl) this.coordsEl.style.display = 'none';
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.viewMode !== '2D') return;
    if (e.button === 1 || e.button === 2) {
      this.panning = true;
      this.panOrigin.set(e.clientX, e.clientY);
      this.container.style.cursor = 'grabbing';
    }
  }

  private onMouseUp(_e: MouseEvent): void {
    if (this.panning) {
      this.panning = false;
      this.container.style.cursor = '';
    }
  }

  private onWheel(e: WheelEvent): void {
    if (this.viewMode !== '2D') return;
    e.preventDefault();

    const factor   = e.deltaY > 0 ? 0.875 : 1 / 0.875;
    const w        = this.toWorld(e);
    const oldZoom  = this.cam2D.zoom;
    const newZoom  = Math.max(0.00005, Math.min(oldZoom * factor, 1000));

    // Zoom toward mouse: keep world point under cursor
    const ratio = oldZoom / newZoom;
    this.cam2D.position.x = w.x + (this.cam2D.position.x - w.x) * ratio;
    this.cam2D.position.y = w.y + (this.cam2D.position.y - w.y) * ratio;
    this.cam2D.zoom = newZoom;
    this.cam2D.updateProjectionMatrix();

    this.updateGrid();
  }

  private onResize(): void {
    const { offsetWidth: w, offsetHeight: h } = this.container;
    this.renderer.setSize(w, h);

    const a  = w / h;
    const hs = (this.cam2D.top - this.cam2D.bottom) / 2;
    this.cam2D.left   = -hs * a;
    this.cam2D.right  =  hs * a;
    this.cam2D.updateProjectionMatrix();

    this.cam3D.aspect = a;
    this.cam3D.updateProjectionMatrix();

    this.updateGrid();
  }

  // ─── Render loop ─────────────────────────────────────────────────────────────

  private loop(): void {
    this.raf = requestAnimationFrame(() => this.loop());
    if (this.viewMode === '3D') this.controls.update();
    const cam = this.viewMode === '2D' ? this.cam2D : this.cam3D;
    this.renderer.render(this.scene, cam);
  }

  // ─── Data loading ─────────────────────────────────────────────────────────────

  public loadData(data: ApiResponse): void {
    // Dispose and clear existing geometry
    this.dataGroup.traverse((obj) => {
      const o = obj as THREE.Line;
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else (m as THREE.Material).dispose();
      }
    });
    while (this.dataGroup.children.length) {
      this.dataGroup.remove(this.dataGroup.children[0]);
    }

    // Build Three.js geometry from API data
    data.poles.forEach((pole, pi) => {
      const poleGroup = new THREE.Group();
      poleGroup.name  = `pole_${pi}`;

      pole.lines.forEach((apiLine) => poleGroup.add(this.makeApiLine(apiLine)));

      pole.cantilevers.forEach((cat, ci) => {
        const catGroup = new THREE.Group();
        catGroup.name  = `cat_${pi}_${ci}`;
        cat.lines.forEach((apiLine) => catGroup.add(this.makeApiLine(apiLine)));
        poleGroup.add(catGroup);
      });

      this.dataGroup.add(poleGroup);
    });

    this.fitCamera();
    this.updateGrid();
  }

  private makeApiLine(apiLine: ApiLine): THREE.Line {
    const color = rgbaToHex(apiLine.color);
    const geo   = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(apiLine.start[0], apiLine.start[1], apiLine.start[2]),
      new THREE.Vector3(apiLine.end[0],   apiLine.end[1],   apiLine.end[2]),
    ]);
    const mat  = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, mat);
    line.name  = apiLine.name;
    line.userData.apiLine = apiLine;
    return line;
  }

  // ─── Camera fit ───────────────────────────────────────────────────────────────

  private fitCamera(): void {
    const bbox = new THREE.Box3();
    this.dataGroup.traverse((obj) => {
      const line = obj as THREE.Line;
      if (line.isLine) {
        line.geometry.computeBoundingBox();
        if (line.geometry.boundingBox) bbox.union(line.geometry.boundingBox);
      }
    });
    if (bbox.isEmpty()) return;

    const size   = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    const pad    = 1.25;
    const { offsetWidth: w, offsetHeight: h } = this.container;
    const aspect = w / h;

    // 2D orthographic: fit cross-section (x-y plane)
    const neededH = Math.max(size.x / aspect, size.y) * pad;
    this.cam2D.left   = -neededH * aspect / 2;
    this.cam2D.right  =  neededH * aspect / 2;
    this.cam2D.top    =  neededH / 2;
    this.cam2D.bottom = -neededH / 2;
    this.cam2D.zoom   = 1;
    this.cam2D.position.set(center.x, center.y, 10000);
    this.cam2D.updateProjectionMatrix();

    // 3D perspective: pull back to see full scene
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist   = maxDim * 1.5;
    this.cam3D.position.set(
      center.x + dist * 0.55,
      center.y + dist * 0.45,
      center.z + dist * 1.1,
    );
    this.cam3D.lookAt(center.x, center.y, center.z);
    this.controls.target.copy(center);
    this.controls.update();
  }

  // ─── Public API ───────────────────────────────────────────────────────────────

  public setViewMode(mode: ViewMode): void {
    this.viewMode = mode;

    if (mode === '3D') {
      this.controls.enabled    = true;
      this.cursorGroup.visible = false;
      this.gridGroup.visible   = false;
      if (this.coordsEl) this.coordsEl.style.display = 'none';
      this.container.style.cursor = '';
      // Disable our wheel/mousedown for pan — OrbitControls takes over
      this.container.removeEventListener('wheel', this._onWH);
      this.container.removeEventListener('mousedown', this._onMD);
    } else {
      this.controls.enabled  = false;
      this.gridGroup.visible = true;
      this.container.style.cursor = '';
      this.container.addEventListener('wheel', this._onWH, { passive: false });
      this.container.addEventListener('mousedown', this._onMD);
      this.updateGrid();
    }
  }

  public setDrawMode(mode: DrawMode): void {
    this.drawMode = mode;
    // Update cursor style to hint the active tool
    if (this.viewMode === '2D') {
      this.container.style.cursor = mode === 'none' ? '' : 'crosshair';
    }
  }

  public resetCamera(): void {
    this.fitCamera();
    this.updateGrid();
  }

  public dispose(): void {
    if (this.raf) cancelAnimationFrame(this.raf);

    this.container.removeEventListener('mousemove', this._onMM);
    this.container.removeEventListener('mousedown', this._onMD);
    window.removeEventListener('mouseup', this._onMU);
    this.container.removeEventListener('wheel', this._onWH);
    window.removeEventListener('resize', this._onRZ);
    this.container.removeEventListener('contextmenu', this._onCM);

    this.controls.dispose();

    this.scene.traverse((obj) => {
      const o = obj as THREE.Line;
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else (m as THREE.Material).dispose();
      }
    });

    this.renderer.dispose();

    if (this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    if (this.coordsEl?.parentNode) {
      this.coordsEl.parentNode.removeChild(this.coordsEl);
    }
  }
}
