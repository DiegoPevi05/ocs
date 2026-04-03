import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { ApiLine, ApiResponse, DrawMode, ViewMode } from '../types';

// ─── Constants ────────────────────────────────────────────────────────────────

const GRID_LINE_COUNT = 120;
const GRID_COLOR = 0x334155;   // slate-700 — visible against dark bg
const BG_COLOR = '#0f172a';
const CURSOR_COLOR = 0xe2e8f0;

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
  public drawMode: DrawMode = 'none';
  public cantileverZigzag: number = 250;

  // Grid (2D)
  private gridGroup: THREE.Group;
  private gridH: THREE.Line[] = [];
  private gridV: THREE.Line[] = [];

  // Cursor crosshair (2D)
  private cursorGroup: THREE.Group;
  private coordsEl?: HTMLElement;

  // API geometry
  private dataGroup: THREE.Group;

  // Dynamic UI geometry
  private dynamicGroup: THREE.Group;
  private rubberbandGroup: THREE.Group;
  private labelsContainer: HTMLDivElement;
  private selectionBoxDiv: HTMLDivElement;

  private isSelecting: boolean = false;
  private selectStartX: number = 0;
  private selectStartY: number = 0;

  // Track current dynamic data for rubberband & snap context
  private dynData: { trackPoints: { x: number, z: number, y?: number, r?: number }[], poles: { x: number, z: number, y?: number, h?: number, label?: string }[], completedTracks?: { x: number, z: number, y?: number, r?: number, label?: string }[][], cantileverPoints?: { x: number, z: number, y?: number }[], cantilevers?: { x1: number, z1: number, x2: number, z2: number, label?: string }[], vanes?: { x1: number, z1: number, x2: number, z2: number, label?: string }[], vanePoints?: { x: number, z: number }[], selectedCantilevers?: number[], selectedVanes?: number[] } = { trackPoints: [], poles: [] };
  public trackMode: 'rect' | 'poly' = 'rect';

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
    this.cam2D = this.buildCam2D();
    this.cam3D = this.buildCam3D();
    this.controls = this.buildControls();

    this.gridGroup = this.buildGrid();
    this.cursorGroup = this.buildCursor();
    this.dataGroup = new THREE.Group();
    this.dataGroup.name = 'data';
    this.dynamicGroup = new THREE.Group();
    this.dynamicGroup.name = 'dynamic';
    this.rubberbandGroup = new THREE.Group();
    this.rubberbandGroup.name = 'rubberband';

    this.scene.add(this.gridGroup, this.dataGroup, this.dynamicGroup, this.rubberbandGroup, this.cursorGroup);

    this.labelsContainer = document.createElement('div');
    this.labelsContainer.style.cssText = 'position: absolute; top: 0; left: 0; pointer-events: none; width: 100%; height: 100%; z-index: 5; overflow: hidden;';
    this.container.appendChild(this.labelsContainer);

    this.selectionBoxDiv = document.createElement('div');
    this.selectionBoxDiv.style.cssText = 'position: absolute; border: 1px dashed rgba(255, 255, 255, 0.8); background: rgba(59, 130, 246, 0.1); display: none; pointer-events: none; z-index: 10;';
    this.container.appendChild(this.selectionBoxDiv);

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
    const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 1, 300000);
    // y=-1e5 ensures local_x=world+X and local_y=world+Z (no axis flip).
    cam.up.set(0, 0, 1);               // +Z points to the top of the screen
    cam.position.set(1500, -1e5, 0);  // below XZ plane, looking toward +Y
    cam.lookAt(1500, 0, 0);
    cam.layers.enable(1);
    return cam;
  }

  private buildCam3D(): THREE.PerspectiveCamera {
    const { offsetWidth: w, offsetHeight: h } = this.container;
    const cam = new THREE.PerspectiveCamera(55, w / h, 1, 500000);
    cam.position.set(8000, 10000, 25000);
    cam.lookAt(1500, 6000, 10000);
    cam.layers.enable(2);
    return cam;
  }

  private buildControls(): OrbitControls {
    const ctrl = new OrbitControls(this.cam3D, this.renderer.domElement);
    ctrl.target.set(1500, 6000, 10000);
    ctrl.enableDamping = true;
    ctrl.dampingFactor = 0.06;
    ctrl.enabled = false; // disabled until 3D mode
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

    const cam = this.cam2D;
    const visW = (cam.right - cam.left) / cam.zoom;
    const visH = (cam.top - cam.bottom) / cam.zoom;
    const cx = cam.position.x;
    const cz = cam.position.z;  // 2D vertical axis is Z

    const L = cx - visW / 2;
    const R = cx + visW / 2;
    const B = cz - visH / 2;  // bottom in Z
    const T = cz + visH / 2;  // top in Z

    const sp = calcSpacing(visW);

    const startX = Math.floor(L / sp) * sp;
    const startZ = Math.floor(B / sp) * sp;

    // Vertical grid lines — vary X, span Z (at y=-0.5)
    let vi = 0;
    for (let x = startX; x < R + sp && vi < this.gridV.length; x += sp, vi++) {
      const line = this.gridV[vi];
      const pa = line.geometry.attributes.position.array as Float32Array;
      pa[0] = x; pa[1] = -0.5; pa[2] = B - sp;
      pa[3] = x; pa[4] = -0.5; pa[5] = T + sp;
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = true;
    }
    for (let i = vi; i < this.gridV.length; i++) this.gridV[i].visible = false;

    // Horizontal grid lines — vary Z, span X (at y=-0.5)
    let hi = 0;
    for (let z = startZ; z < T + sp && hi < this.gridH.length; z += sp, hi++) {
      const line = this.gridH[hi];
      const pa = line.geometry.attributes.position.array as Float32Array;
      pa[0] = L - sp; pa[1] = -0.5; pa[2] = z;
      pa[3] = R + sp; pa[4] = -0.5; pa[5] = z;
      line.geometry.attributes.position.needsUpdate = true;
      line.visible = true;
    }
    for (let i = hi; i < this.gridH.length; i++) this.gridH[i].visible = false;
  }

  // ─── Cursor ──────────────────────────────────────────────────────────────────

  private buildCursor(): THREE.Group {
    const group = new THREE.Group();
    const mat = new THREE.LineBasicMaterial({
      color: CURSOR_COLOR, transparent: true, opacity: 0.65,
    });
    const SZ = 500; // base world-space size at zoom=1

    const mkLine = (pts: [number, number, number][]) =>
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z))),
        mat.clone()
      );

    // Cursor lives in the XZ plane (Y is height, not shown in 2D)
    const Y = 0.5; // slight Y offset so it renders above the XZ geometry
    const h = mkLine([[-SZ, Y, 0], [SZ, Y, 0]]);       // horizontal (X axis)
    const v = mkLine([[0, Y, -SZ], [0, Y, SZ]]);      // vertical   (Z axis)
    const sq = mkLine([
      [-SZ * 0.07, Y, -SZ * 0.07],
      [SZ * 0.07, Y, -SZ * 0.07],
      [SZ * 0.07, Y, SZ * 0.07],
      [-SZ * 0.07, Y, SZ * 0.07],
      [-SZ * 0.07, Y, -SZ * 0.07],
    ]);

    h.renderOrder = 100;
    v.renderOrder = 100;
    sq.renderOrder = 100;

    group.add(h, v, sq);
    group.visible = false;
    group.renderOrder = 100;
    return group;
  }

  // ─── Coordinates display ─────────────────────────────────────────────────────

  private buildCoordsDisplay(): HTMLElement {
    const el = document.createElement('div');
    el.style.cssText = `
      position: absolute; top: 0; left: 0; pointer-events: auto;
      background: rgba(15,23,42,0.85); color: #94a3b8;
      padding: 6px; border-radius: 4px;
      font-family: monospace; font-size: 12px;
      display: none; border: 1px solid rgba(51,65,85,0.5);
      z-index: 10; display: flex; flex-direction: column; gap: 4px;
    `;

    const createInput = (axis: string, isReadOnly: boolean = true) => {
      const wrap = document.createElement('div');
      wrap.style.display = 'flex';
      wrap.style.alignItems = 'center';
      wrap.style.justifyContent = 'space-between';

      const lbl = document.createElement('label');
      lbl.textContent = `${axis}: `;
      lbl.style.marginRight = '4px';

      const input = document.createElement('input');
      input.type = 'text';
      input.readOnly = isReadOnly;
      input.style.cssText = `
        width: 60px; background: transparent; border: none; 
        color: #e2e8f0; font-family: monospace; font-size: 13px;
        border-bottom: 1px solid transparent; outline: none; text-align: right;
      `;

      input.onfocus = () => { input.readOnly = false; input.style.borderBottom = '1px solid #3b82f6'; };
      input.onblur = () => { input.readOnly = isReadOnly; input.style.borderBottom = '1px solid transparent'; };

      wrap.appendChild(lbl);
      wrap.appendChild(input);
      return { wrap, input };
    };

    const xCtl = createInput('X');
    const zCtl = createInput('Z');
    const yCtl = createInput('Y'); // Elevation
    const lCtl = createInput('L');
    const aCtl = createInput('A');
    const rCtl = createInput('R'); // Radius for polyline
    const dCtl = createInput('D'); // Perpendicular offset distance (pole)

    el.appendChild(xCtl.wrap);
    el.appendChild(zCtl.wrap);
    el.appendChild(yCtl.wrap);
    el.appendChild(lCtl.wrap);
    el.appendChild(aCtl.wrap);
    el.appendChild(rCtl.wrap);
    el.appendChild(dCtl.wrap);

    const controls = [xCtl, zCtl, yCtl, lCtl, aCtl, rCtl, dCtl];

    const onKeyDown = (e: KeyboardEvent, index: number) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        // find next visible control
        let nextIndex = (index + 1) % controls.length;
        while (controls[nextIndex].wrap.style.display === 'none') {
          nextIndex = (nextIndex + 1) % controls.length;
        }
        controls[nextIndex].input.focus();
      } else if (e.key === 'Enter') {
        e.preventDefault();

        // Use polar coordinates (L, A) if editing those
        if (index === 3 || index === 4) {
          const a = parseFloat(aCtl.input.value);
          // Derive len either from input if visible or from dynamic cursor offset
          let l = parseFloat(lCtl.input.value);
          if (this.dynData.trackPoints.length > 0 && lCtl.wrap.style.display === 'none') {
            const lastP = this.dynData.trackPoints[this.dynData.trackPoints.length - 1];
            l = Math.hypot(this.cursorGroup.position.x - lastP.x, this.cursorGroup.position.z - lastP.z);
          }

          const r = parseFloat(rCtl.input.value) || 0;
          const yVal = parseFloat(yCtl.input.value) || 0;
          if (!isNaN(l) && !isNaN(a) && this.dynData.trackPoints.length > 0) {
            const lastIdx = this.dynData.trackPoints.length - 1;
            const lastP = this.dynData.trackPoints[lastIdx];
            const nx = lastP.x + l * Math.cos(a * Math.PI / 180);
            const nz = lastP.z + l * Math.sin(a * Math.PI / 180);
            this.setCursorPositionCore(nx, nz);
            // Dispatch special geometry properties via standard fields or let parent handle
            this.container.dispatchEvent(new CustomEvent('viewer-click', { detail: { x: nx, y: yVal, z: nz, r: r, mode: this.drawMode } }));
            return;
          }
        }

        // Otherwise cartesian fallback
        const nx = parseFloat(xCtl.input.value);
        const nz = parseFloat(zCtl.input.value);
        const yVal = parseFloat(yCtl.input.value) || 0;
        if (!isNaN(nx) && !isNaN(nz)) {
          this.setCursorPositionCore(nx, nz);
          const r = this.trackMode === 'rect' ? 0 : (parseFloat(rCtl.input.value) || 0);
          this.container.dispatchEvent(new CustomEvent('viewer-click', { detail: { x: nx, y: yVal, z: nz, r: r, mode: this.drawMode } }));
        }
      }
    };

    controls.forEach((ctl, i) => {
      ctl.input.addEventListener('keydown', (e) => onKeyDown(e, i));
    });

    this.container.style.position = 'relative';
    this.container.appendChild(el);

    // Attach to instance so we can update them in loop
    (this as any)._xInput = xCtl.input;
    (this as any)._zInput = zCtl.input;
    (this as any)._yInput = yCtl.input;
    (this as any)._yWrap = yCtl.wrap;
    (this as any)._lWrap = lCtl.wrap;
    (this as any)._lInput = lCtl.input;
    (this as any)._aWrap = aCtl.wrap;
    (this as any)._aInput = aCtl.input;
    (this as any)._rWrap = rCtl.wrap;
    (this as any)._rInput = rCtl.input;
    (this as any)._dWrap = dCtl.wrap;
    (this as any)._dInput = dCtl.input;

    return el;
  }

  // ─── Mouse → world coords ────────────────────────────────────────────────────

  private toWorldPos(clientX: number, clientY: number): THREE.Vector2 {
    const cam = this.cam2D;
    const rect = this.container.getBoundingClientRect();
    const visW = (cam.right - cam.left) / cam.zoom;
    const visH = (cam.top - cam.bottom) / cam.zoom;
    const L = cam.position.x - visW / 2;
    const B = cam.position.z - visH / 2;  // vertical axis is Z
    const wx = L + ((clientX - rect.left) / rect.width) * visW;
    const wz = B + ((rect.height - (clientY - rect.top)) / rect.height) * visH;
    return new THREE.Vector2(wx, wz);  // .x = world X, .y stores world Z
  }

  private toWorld(e: MouseEvent | WheelEvent): THREE.Vector2 {
    return this.toWorldPos(e.clientX, e.clientY);
  }

  public enableSnap = true;

  private snapToGrid(wx: number, wz: number): THREE.Vector2 {
    const visW = (this.cam2D.right - this.cam2D.left) / this.cam2D.zoom;
    const sp = calcSpacing(visW);
    const threshold = sp * 0.20; // 20% of grid spacing

    if (!this.enableSnap) return new THREE.Vector2(wx, wz);

    // Auto-snap to tracks connections if drawing track
    if (this.drawMode === 'track') {
      let closestObj: THREE.Vector2 | null = null;
      let minD = threshold;

      const checkPt = (vx: number, vz: number) => {
        const dx = wx - vx, dz = wz - vz;
        const d = Math.sqrt(dx * dx + dz * dz);
        if (d < minD) { minD = d; closestObj = new THREE.Vector2(vx, vz); }
      };

      this.dataGroup.traverse((obj) => {
        const line = obj as THREE.Line;
        if (line.userData && line.userData.apiLine) {
          const al = line.userData.apiLine as ApiLine;
          checkPt(al.start[0], al.start[2]);
          checkPt(al.end[0], al.end[2]);
        }
      });
      // Snap to in-progress points
      this.dynData.trackPoints.forEach(p => checkPt(p.x, p.z));
      // Snap to ALL completed track endpoints
      if (this.dynData.completedTracks) {
        this.dynData.completedTracks.forEach(tr => {
          if (tr.length > 0) {
            checkPt(tr[0].x, tr[0].z);
            checkPt(tr[tr.length - 1].x, tr[tr.length - 1].z);
          }
        });
      }
      if (closestObj) return closestObj;
    }

    // Cantilever snapping
    if (this.drawMode === 'cantilever') {
      const cantPts = this.dynData.cantileverPoints || [];
      // Single click: snap to nearest pole
      if (cantPts.length === 0) {
        let closestPole: THREE.Vector2 | null = null;
        let minD = Infinity;
        this.dynData.poles.forEach(p => {
          const d = Math.hypot(wx - p.x, wz - p.z);
          if (d < minD) { minD = d; closestPole = new THREE.Vector2(p.x, p.z); }
        });
        if (closestPole && minD < 5000) return closestPole;
      }
    }

    // Vane snapping — snap to nearest cantilever track-side endpoint (x2,z2)
    if (this.drawMode === 'vane') {
      const cantilevers = this.dynData.cantilevers || [];
      let closestPt: THREE.Vector2 | null = null;
      let minD = 5000;
      cantilevers.forEach(c => {
        const d = Math.hypot(wx - c.x2, wz - c.z2);
        if (d < minD) { minD = d; closestPt = new THREE.Vector2(c.x2, c.z2); }
      });
      if (closestPt) return closestPt;
    }

    const sx = Math.round(wx / sp) * sp;
    const sz = Math.round(wz / sp) * sp;

    const dx = wx - sx;
    const dz = wz - sz;

    if (Math.sqrt(dx * dx + dz * dz) < threshold) {
      return new THREE.Vector2(sx, sz);
    }
    return new THREE.Vector2(wx, wz);
  }

  public setCursorPositionCore(wx: number, wz: number) {
    const scale = 1 / this.cam2D.zoom;
    this.cursorGroup.position.set(wx, 0, wz);  // place in XZ plane
    this.cursorGroup.scale.setScalar(scale);
    this.cursorGroup.visible = true;

    if (this.coordsEl) {
      this.coordsEl.style.display = 'flex';
      const xInput = (this as any)._xInput as HTMLInputElement;
      const zInput = (this as any)._zInput as HTMLInputElement;
      const yInput = (this as any)._yInput as HTMLInputElement;
      const yWrap = (this as any)._yWrap as HTMLElement;
      const lWrap = (this as any)._lWrap as HTMLElement;
      const aWrap = (this as any)._aWrap as HTMLElement;
      const rWrap = (this as any)._rWrap as HTMLElement;
      const lInput = (this as any)._lInput as HTMLInputElement;
      const aInput = (this as any)._aInput as HTMLInputElement;

      if (document.activeElement !== xInput) xInput.value = Math.round(wx).toString();
      if (document.activeElement !== zInput) zInput.value = Math.round(wz).toString();
      if (document.activeElement !== yInput) {
        const prevY = this.dynData.trackPoints.length > 0 ? this.dynData.trackPoints[this.dynData.trackPoints.length - 1].y || 0 : 0;
        yInput.value = prevY.toString();
      }

      // Show/hide D input for pole mode
      const dWrap = (this as any)._dWrap as HTMLElement;
      if (this.drawMode === 'pole') {
        dWrap.style.display = 'flex';
      } else {
        dWrap.style.display = 'none';
      }

      if (this.drawMode === 'track' && this.dynData.trackPoints.length > 0) {
        if (this.trackMode === 'rect') {
          aWrap.style.display = 'flex';
          lWrap.style.display = 'none';
          rWrap.style.display = 'none';
          const rInp = (this as any)._rInput as HTMLInputElement;
          if (rInp) rInp.value = '0';
        } else {
          aWrap.style.display = 'none';
          lWrap.style.display = 'none';
          rWrap.style.display = 'flex';
        }

        const lastP = this.dynData.trackPoints[this.dynData.trackPoints.length - 1];
        const dx = wx - lastP.x;
        const dz = wz - lastP.z;
        const len = Math.sqrt(dx * dx + dz * dz);
        const ang = Math.atan2(dz, dx) * 180 / Math.PI;

        // Always store len to avoid NaN even if not shown
        lInput.value = len.toString();
        if (document.activeElement !== aInput) aInput.value = Math.round(ang).toString();
      } else {
        lWrap.style.display = 'none';
        aWrap.style.display = 'none';
        rWrap.style.display = 'none';
      }
    }
  }

  // ─── Event handlers ──────────────────────────────────────────────────────────

  private onMouseMove(e: MouseEvent): void {
    if (this.viewMode !== '2D') return;

    const rect = this.container.getBoundingClientRect();
    const inBounds =
      e.clientX >= rect.left && e.clientX <= rect.right &&
      e.clientY >= rect.top && e.clientY <= rect.bottom;

    // Pan drag
    if (this.panning) {
      const visW = (this.cam2D.right - this.cam2D.left) / this.cam2D.zoom;
      const visH = (this.cam2D.top - this.cam2D.bottom) / this.cam2D.zoom;
      const dx = -(e.clientX - this.panOrigin.x) / rect.width * visW;
      const dz = (e.clientY - this.panOrigin.y) / rect.height * visH;  // vertical is Z
      this.cam2D.position.x += dx;
      this.cam2D.position.z += dz;
      this.panOrigin.set(e.clientX, e.clientY);
      this.updateGrid();
    }

    // Crosshair cursor
    if (inBounds) {
      if (this.isSelecting) {
        const x1 = this.selectStartX - rect.left;
        const y1 = this.selectStartY - rect.top;
        const x2 = e.clientX - rect.left;
        const y2 = e.clientY - rect.top;
        this.selectionBoxDiv.style.left = Math.min(x1, x2) + 'px';
        this.selectionBoxDiv.style.top = Math.min(y1, y2) + 'px';
        this.selectionBoxDiv.style.width = Math.abs(x2 - x1) + 'px';
        this.selectionBoxDiv.style.height = Math.abs(y2 - y1) + 'px';
      }

      const w = this.toWorld(e);  // w.x = world X, w.y = world Z
      const snapped = this.snapToGrid(w.x, w.y);
      let finalX = snapped.x, finalZ = snapped.y;

      // When placing a pole with D set, slide cursor along the D-offset curve
      if (this.drawMode === 'pole') {
        const dVal = parseFloat(((this as any)._dInput as HTMLInputElement)?.value) || 0;
        if (dVal > 0) {
          // Track whether the closest foot is on an arc and record arc center
          let footX = snapped.x, footZ = snapped.y, minDist = Infinity;
          let arcCX: number | null = null, arcCZ: number | null = null, arcR = 0;
          let segNX = 0, segNZ = 0;
          const checkSegment = (ax: number, az: number, bx: number, bz: number) => {
            const dx = bx - ax, dz = bz - az;
            const len2 = dx * dx + dz * dz;
            if (len2 === 0) return;
            const t = Math.max(0, Math.min(1, ((snapped.x - ax) * dx + (snapped.y - az) * dz) / len2));
            const px = ax + t * dx, pz = az + t * dz;
            const d = Math.hypot(snapped.x - px, snapped.y - pz);
            if (d < minDist) {
              minDist = d; footX = px; footZ = pz; arcCX = null;
              const len = Math.sqrt(len2);
              segNX = -dz / len; segNZ = dx / len;
            }
          };
          const sampleT = (tr: { x: number, z: number, r?: number }[]) => {
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
                  for (let s = 0; s <= 64; s++) {
                    const a = sa + (ea - sa) * s / 64;
                    const px = cx + R * Math.cos(a), pz = cz + R * Math.sin(a);
                    const dist = Math.hypot(snapped.x - px, snapped.y - pz);
                    if (dist < minDist) {
                      minDist = dist; footX = px; footZ = pz;
                      arcCX = cx; arcCZ = cz; arcR = R;
                    }
                  }
                  continue;
                }
              }
              checkSegment(prev.x, prev.z, curr.x, curr.z);
            }
          };
          if (this.dynData.completedTracks) this.dynData.completedTracks.forEach(tr => sampleT(tr));
          sampleT(this.dynData.trackPoints);

          if (minDist < Infinity) {
            if (arcCX !== null && arcCZ !== null) {
              // Arc: radial unit vector from arc center through the foot
              const rux = (footX - arcCX) / arcR, ruz = (footZ - arcCZ) / arcR;
              // Determine side: cursor outside arc circle → +D, inside → -D
              const cursorDistFromCenter = Math.hypot(snapped.x - arcCX, snapped.y - arcCZ);
              const side = cursorDistFromCenter >= arcR ? 1 : -1;
              finalX = arcCX + (arcR + side * dVal) * rux;
              finalZ = arcCZ + (arcR + side * dVal) * ruz;
            } else {
              // Straight segment: use segment normal, side by dot product
              const dot = (snapped.x - footX) * segNX + (snapped.y - footZ) * segNZ;
              const side = dot >= 0 ? 1 : -1;
              finalX = footX + side * segNX * dVal;
              finalZ = footZ + side * segNZ * dVal;
            }
          }
        }
      }

      this.setCursorPositionCore(finalX, finalZ);

      if (this.coordsEl) {
        const rx = e.clientX + 20;
        const ry = e.clientY + 20;
        this.coordsEl.style.left = `${rx}px`;
        this.coordsEl.style.top = `${ry}px`;
      }

      this.updateRubberband(finalX, finalZ);
    } else {
      this.cursorGroup.visible = false;
      if (this.coordsEl) this.coordsEl.style.display = 'none';
      while (this.rubberbandGroup.children.length) {
        this.rubberbandGroup.remove(this.rubberbandGroup.children[0]);
      }
    }
  }

  private onMouseDown(e: MouseEvent): void {
    if (this.viewMode !== '2D') return;
    if (e.button === 1 || e.button === 2 || (e.button === 0 && e.ctrlKey)) {
      this.panning = true;
      this.panOrigin.set(e.clientX, e.clientY);
      this.container.style.cursor = 'grabbing';
    } else if (e.button === 0 && this.drawMode !== 'none') {
      // Left click while drawing: trigger custom draw event
      const cx = this.cursorGroup.position.x;
      const cz = this.cursorGroup.position.z;
      const r = parseFloat(((this as any)._rInput as HTMLInputElement)?.value) || 0;
      const y = parseFloat(((this as any)._yInput as HTMLInputElement)?.value) || 0;
      this.container.dispatchEvent(new CustomEvent('viewer-click', {
        detail: { x: cx, z: cz, y: y, r: r, mode: this.drawMode }
      }));
    } else if (e.button === 0 && this.drawMode === 'none') {
      this.isSelecting = true;
      this.selectStartX = e.clientX;
      this.selectStartY = e.clientY;
      const rect = this.container.getBoundingClientRect();
      this.selectionBoxDiv.style.left = (e.clientX - rect.left) + 'px';
      this.selectionBoxDiv.style.top = (e.clientY - rect.top) + 'px';
      this.selectionBoxDiv.style.width = '0px';
      this.selectionBoxDiv.style.height = '0px';
      this.selectionBoxDiv.style.display = 'block';
    }
  }

  private onMouseUp(e: MouseEvent): void {
    if (this.panning) {
      this.panning = false;
      this.container.style.cursor = '';
    } else if (this.isSelecting) {
      this.isSelecting = false;
      this.selectionBoxDiv.style.display = 'none';

      const dx = Math.abs(e.clientX - this.selectStartX);
      const dy = Math.abs(e.clientY - this.selectStartY);

      const w1 = this.toWorldPos(this.selectStartX, this.selectStartY);
      const w2 = this.toWorld(e);

      const minX = Math.min(w1.x, w2.x) - (dx < 3 ? 50 : 0);
      const maxX = Math.max(w1.x, w2.x) + (dx < 3 ? 50 : 0);
      const minZ = Math.min(w1.y, w2.y) - (dy < 3 ? 50 : 0);
      const maxZ = Math.max(w1.y, w2.y) + (dy < 3 ? 50 : 0);

      this.container.dispatchEvent(new CustomEvent('viewer-select', {
        detail: { minX, maxX, minZ, maxZ, isPoint: dx < 3 && dy < 3 }
      }));
    }
  }

  private onWheel(e: WheelEvent): void {
    if (this.viewMode !== '2D') return;
    e.preventDefault();

    const factor = e.deltaY > 0 ? 0.875 : 1 / 0.875;
    const w = this.toWorld(e);
    const oldZoom = this.cam2D.zoom;
    const newZoom = Math.max(0.00005, Math.min(oldZoom * factor, 1000));

    // Zoom toward mouse: keep world point under cursor
    const ratio = oldZoom / newZoom;
    this.cam2D.position.x = w.x + (this.cam2D.position.x - w.x) * ratio;
    this.cam2D.position.z = w.y + (this.cam2D.position.z - w.y) * ratio;  // w.y holds world Z
    this.cam2D.zoom = newZoom;
    this.cam2D.updateProjectionMatrix();

    this.updateGrid();
  }

  private onResize(): void {
    const { offsetWidth: w, offsetHeight: h } = this.container;
    this.renderer.setSize(w, h);

    const a = w / h;
    const hs = (this.cam2D.top - this.cam2D.bottom) / 2;
    this.cam2D.left = -hs * a;
    this.cam2D.right = hs * a;
    this.cam2D.updateProjectionMatrix();

    this.cam3D.aspect = a;
    this.cam3D.updateProjectionMatrix();

    this.updateGrid();
  }

  // ─── Render loop ─────────────────────────────────────────────────────────────

  private loop = (): void => {
    requestAnimationFrame(this.loop);
    if (this.viewMode === '3D') {
      this.controls.update();
    }
    this.updateLabels();
    this.renderer.render(this.scene, this.viewMode === '2D' ? this.cam2D : this.cam3D);
  };


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
      poleGroup.name = `pole_${pi} `;

      pole.lines.forEach((apiLine) => poleGroup.add(this.makeApiLine(apiLine)));

      pole.cantilevers.forEach((cat, ci) => {
        const catGroup = new THREE.Group();
        catGroup.name = `cat_${pi}_${ci} `;
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
    const geo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(apiLine.start[0], apiLine.start[1], apiLine.start[2]),
      new THREE.Vector3(apiLine.end[0], apiLine.end[1], apiLine.end[2]),
    ]);
    const mat = new THREE.LineBasicMaterial({ color });
    const line = new THREE.Line(geo, mat);
    line.name = apiLine.name;
    line.userData.apiLine = apiLine;
    return line;
  }

  // ─── Dynamic UI Objects ───────────────────────────────────────────────────────

  private updateRubberband(wx: number, wz: number): void {
    while (this.rubberbandGroup.children.length) {
      const c = this.rubberbandGroup.children[0] as any;
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
      this.rubberbandGroup.remove(c);
    }
    if (this.drawMode === 'track' && this.dynData.trackPoints.length > 0) {
      const prev = this.dynData.trackPoints[this.dynData.trackPoints.length - 1];
      let pts: THREE.Vector3[] = [];
      let hasCurve = false;

      if (this.trackMode === 'poly' && this.coordsEl) {
        const rCtl = (this as any)._rInput as HTMLInputElement;
        const r = parseFloat(rCtl.value);
        const d = Math.hypot(wx - prev.x, wz - prev.z);
        if (!isNaN(r) && Math.abs(r) > d / 2 && Math.abs(r) > 1) {
          hasCurve = true;
          const mx = (prev.x + wx) / 2;
          const mz = (prev.z + wz) / 2;
          const ux = (wx - prev.x) / d;
          const uz = (wz - prev.z) / d;
          const R = Math.abs(r);
          const h = Math.sqrt(R * R - (d / 2) * (d / 2));
          const sign = r > 0 ? 1 : -1;
          const cx = mx - uz * h * sign;
          const cz = mz + ux * h * sign;

          const startA = Math.atan2(prev.z - cz, prev.x - cx);
          const endA = Math.atan2(wz - cz, wx - cx);
          const clockWise = r < 0;
          const curve = new THREE.EllipseCurve(cx, cz, R, R, startA, endA, clockWise, 0);
          pts = curve.getPoints(24).map(p => new THREE.Vector3(p.x, 0, p.y));
        }
      }

      if (!hasCurve) {
        pts = [new THREE.Vector3(prev.x, prev.y || 0, prev.z), new THREE.Vector3(wx, parseFloat(((this as any)._yInput as HTMLInputElement)?.value) || 0, wz)];
      }

      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineDashedMaterial({ color: 0x3b82f6, dashSize: 200, gapSize: 200 });
      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      this.rubberbandGroup.add(line);
    } else if (this.drawMode === 'pole') {
      const yVal = parseFloat(((this as any)._yInput as HTMLInputElement)?.value) || 0;
      const dVal = parseFloat(((this as any)._dInput as HTMLInputElement)?.value) || 0;

      // ─── Find nearest point on any completed track segment ─────────────────
      let footX = wx, footZ = wz;
      let minDist = Infinity;

      const nearestOnSegment = (ax: number, az: number, bx: number, bz: number): { x: number, z: number, d: number } => {
        const dx = bx - ax, dz = bz - az;
        const len2 = dx * dx + dz * dz;
        if (len2 === 0) return { x: ax, z: az, d: Math.hypot(wx - ax, wz - az) };
        const t = Math.max(0, Math.min(1, ((wx - ax) * dx + (wz - az) * dz) / len2));
        const px = ax + t * dx, pz = az + t * dz;
        return { x: px, z: pz, d: Math.hypot(wx - px, wz - pz) };
      };

      const sampleTrack = (tr: { x: number, z: number, r?: number }[]) => {
        for (let i = 1; i < tr.length; i++) {
          const prev = tr[i - 1], curr = tr[i];
          if (curr.r && Math.abs(curr.r) > 1) {
            // Sample arc at 32 steps
            const d = Math.hypot(curr.x - prev.x, curr.z - prev.z);
            const R = Math.abs(curr.r);
            if (R > d / 2) {
              const mx = (prev.x + curr.x) / 2, mz = (prev.z + curr.z) / 2;
              const ux = (curr.x - prev.x) / d, uz = (curr.z - prev.z) / d;
              const h = Math.sqrt(R * R - (d / 2) * (d / 2));
              const sign = curr.r > 0 ? 1 : -1;
              const cx = mx - uz * h * sign, cz = mz + ux * h * sign;
              const sa = Math.atan2(prev.z - cz, prev.x - cx);
              const ea = Math.atan2(curr.z - cz, curr.x - cx);
              const steps = 32;
              for (let s = 0; s <= steps; s++) {
                const a = sa + (ea - sa) * s / steps;
                const px = cx + R * Math.cos(a), pz = cz + R * Math.sin(a);
                const dist = Math.hypot(wx - px, wz - pz);
                if (dist < minDist) { minDist = dist; footX = px; footZ = pz; }
              }
              continue;
            }
          }
          const res = nearestOnSegment(prev.x, prev.z, curr.x, curr.z);
          if (res.d < minDist) { minDist = res.d; footX = res.x; footZ = res.z; }
        }
      };

      if (this.dynData.completedTracks) {
        this.dynData.completedTracks.forEach(tr => sampleTrack(tr));
      }
      sampleTrack(this.dynData.trackPoints);

      // If D is set, snap cursor onto perpendicular at exactly dVal distance
      let poleX = wx, poleZ = wz;
      if (dVal > 0 && minDist < Infinity) {
        const perpX = wx - footX, perpZ = wz - footZ;
        const perpLen = Math.hypot(perpX, perpZ);
        if (perpLen > 0.1) {
          poleX = footX + (perpX / perpLen) * dVal;
          poleZ = footZ + (perpZ / perpLen) * dVal;
        }
      }

      // ─── Draw perpendicular dashed line foot → pole ────────────────────────
      if (minDist < Infinity) {
        const perpPts = [new THREE.Vector3(footX, yVal, footZ), new THREE.Vector3(poleX, yVal, poleZ)];
        const perpGeo = new THREE.BufferGeometry().setFromPoints(perpPts);
        const perpMat = new THREE.LineDashedMaterial({ color: 0xffffff, dashSize: 120, gapSize: 80 });
        const perpLine = new THREE.Line(perpGeo, perpMat);
        perpLine.computeLineDistances();
        this.rubberbandGroup.add(perpLine);
      }

      // ─── Render hover circle (2D) ──────────────────────────────────────────
      const cgeo = new THREE.CircleGeometry(250, 32);
      cgeo.rotateX(-Math.PI / 2);
      const cmat = new THREE.MeshBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.6, side: THREE.DoubleSide });
      const mesh = new THREE.Mesh(cgeo, cmat);
      mesh.position.set(poleX, yVal, poleZ);
      mesh.layers.set(1);
      this.rubberbandGroup.add(mesh);

      // ─── Render hover cylinder (3D) ────────────────────────────────────────
      const height = 3000;
      const cylGeo = new THREE.CylinderGeometry(150, 150, height, 16);
      cylGeo.translate(0, height / 2, 0);
      const cylMat = new THREE.MeshPhongMaterial({ color: 0xef4444, transparent: true, opacity: 0.5 });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.set(poleX, yVal, poleZ);
      cyl.layers.set(2);
      this.rubberbandGroup.add(cyl);
    } else if (this.drawMode === 'vane') {
      const vanePts = this.dynData.vanePoints || [];
      if (vanePts.length === 1) {
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(vanePts[0].x, 0, vanePts[0].z),
          new THREE.Vector3(wx, 0, wz),
        ]);
        const mat = new THREE.LineBasicMaterial({ color: 0xeab308 });
        this.rubberbandGroup.add(new THREE.Line(geo, mat));
      }
    } else if (this.drawMode === 'cantilever') {
      // Find nearest track foot + track segment direction for zigzag
      let footX = wx, footZ = wz;
      let minDist = Infinity;
      let segDirX = 1, segDirZ = 0;

      const sampleForFoot = (tr: { x: number, z: number, r?: number }[]) => {
        for (let i = 1; i < tr.length; i++) {
          const prev = tr[i - 1], curr = tr[i];
          if (curr.r && Math.abs(curr.r) > 1) {
            const d = Math.hypot(curr.x - prev.x, curr.z - prev.z);
            const R = Math.abs(curr.r);
            if (R > d / 2) {
              const mx = (prev.x + curr.x) / 2, mz = (prev.z + curr.z) / 2;
              const ux = (curr.x - prev.x) / d, uz = (curr.z - prev.z) / d;
              const h = Math.sqrt(R * R - (d / 2) * (d / 2));
              const sign = curr.r > 0 ? 1 : -1;
              const cx = mx - uz * h * sign, cz = mz + ux * h * sign;
              const sa = Math.atan2(prev.z - cz, prev.x - cx);
              const ea = Math.atan2(curr.z - cz, curr.x - cx);
              for (let s = 0; s <= 32; s++) {
                const a = sa + (ea - sa) * s / 32;
                const qx = cx + R * Math.cos(a), qz = cz + R * Math.sin(a);
                const dist = Math.hypot(wx - qx, wz - qz);
                if (dist < minDist) {
                  minDist = dist; footX = qx; footZ = qz;
                  // tangent direction at arc point
                  segDirX = -Math.sin(a); segDirZ = Math.cos(a);
                  if (curr.r < 0) { segDirX = -segDirX; segDirZ = -segDirZ; }
                }
              }
              continue;
            }
          }
          const dx = curr.x - prev.x, dz = curr.z - prev.z;
          const len2 = dx * dx + dz * dz;
          if (len2 === 0) continue;
          const t = Math.max(0, Math.min(1, ((wx - prev.x) * dx + (wz - prev.z) * dz) / len2));
          const qx = prev.x + t * dx, qz = prev.z + t * dz;
          const dist = Math.hypot(wx - qx, wz - qz);
          if (dist < minDist) {
            minDist = dist; footX = qx; footZ = qz;
            const len = Math.hypot(dx, dz);
            segDirX = len > 0 ? dx / len : 1; segDirZ = len > 0 ? dz / len : 0;
          }
        }
      };

      if (this.dynData.completedTracks) {
        this.dynData.completedTracks.forEach(tr => sampleForFoot(tr));
      }

      if (minDist < Infinity) {
        // Apply zigzag offset along track direction
        const zz = this.cantileverZigzag;
        const zfX = footX + segDirX * zz;
        const zfZ = footZ + segDirZ * zz;

        // Dashed cantilever arm: pole → track foot (zigzag-adjusted)
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(wx, 0, wz),
          new THREE.Vector3(zfX, 0, zfZ),
        ]);
        const mat = new THREE.LineDashedMaterial({ color: 0x22c55e, dashSize: 150, gapSize: 100 });
        const line = new THREE.Line(geo, mat);
        line.computeLineDistances();
        this.rubberbandGroup.add(line);

        // Dot at track foot (zigzag position)
        const cgeo = new THREE.CircleGeometry(120, 16);
        cgeo.rotateX(-Math.PI / 2);
        const cmat = new THREE.MeshBasicMaterial({ color: 0x22c55e, side: THREE.DoubleSide });
        const dot = new THREE.Mesh(cgeo, cmat);
        dot.position.set(zfX, 0, zfZ);
        dot.layers.set(1);
        this.rubberbandGroup.add(dot);

        // Thin perpendicular line from raw foot to zigzag foot (shows offset)
        if (Math.abs(zz) > 0.1) {
          const pgeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(footX, 0, footZ),
            new THREE.Vector3(zfX, 0, zfZ),
          ]);
          const pmat = new THREE.LineBasicMaterial({ color: 0x16a34a, transparent: true, opacity: 0.5 });
          this.rubberbandGroup.add(new THREE.Line(pgeo, pmat));
        }
      }
    }
  }

  public setDynamicGeometry(data: { trackPoints: { x: number, z: number, y?: number, r?: number }[], poles: { x: number, z: number, y?: number, h?: number, label?: string }[], completedTracks?: { x: number, z: number, y?: number, r?: number, label?: string }[][], selectedTracks?: number[], selectedPoles?: number[], cantileverPoints?: { x: number, z: number, y?: number }[], cantilevers?: { x1: number, z1: number, x2: number, z2: number, label?: string }[], vanes?: { x1: number, z1: number, x2: number, z2: number, label?: string }[], vanePoints?: { x: number, z: number }[], selectedCantilevers?: number[], selectedVanes?: number[] }): void {
    this.dynData = data;
    // Clear dynamic group
    this.dynamicGroup.traverse((obj) => {
      const o = obj as THREE.Line | THREE.Mesh;
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        const m = o.material;
        if (Array.isArray(m)) m.forEach((x) => x.dispose());
        else (m as THREE.Material).dispose();
      }
    });
    while (this.dynamicGroup.children.length) {
      this.dynamicGroup.remove(this.dynamicGroup.children[0]);
    }

    const renderTrack = (trackArr: { x: number, z: number, y?: number, r?: number }[], isActive: boolean, isSelected: boolean) => {
      if (trackArr.length === 0) return;
      const pts: THREE.Vector3[] = [];
      trackArr.forEach((curr, i) => {
        if (i === 0 || !curr.r) {
          pts.push(new THREE.Vector3(curr.x, curr.y || 0, curr.z));
          return;
        }
        const prev = trackArr[i - 1];
        const d = Math.hypot(curr.x - prev.x, curr.z - prev.z);
        const R = Math.abs(curr.r);
        if (R > d / 2 && R > 1) {
          const mx = (prev.x + curr.x) / 2;
          const mz = (prev.z + curr.z) / 2;
          const ux = (curr.x - prev.x) / d;
          const uz = (curr.z - prev.z) / d;
          const h = Math.sqrt(R * R - (d / 2) * (d / 2));
          const sign = curr.r > 0 ? 1 : -1;
          const cx = mx - uz * h * sign;
          const cz = mz + ux * h * sign;

          const startA = Math.atan2(prev.z - cz, prev.x - cx);
          const endA = Math.atan2(curr.z - cz, curr.x - cx);
          const clockWise = curr.r < 0;
          const curve = new THREE.EllipseCurve(cx, cz, R, R, startA, endA, clockWise, 0);
          const arcPts = curve.getPoints(24);
          const prevY = prev.y || 0;
          const currY = curr.y || 0;
          for (let j = 1; j < arcPts.length; j++) {
            const fraction = j / (arcPts.length - 1);
            pts.push(new THREE.Vector3(arcPts[j].x, prevY + fraction * (currY - prevY), arcPts[j].y));
          }
        } else {
          pts.push(new THREE.Vector3(curr.x, curr.y || 0, curr.z));
        }
      });
      const geo = new THREE.BufferGeometry().setFromPoints(pts);

      const trackColor = isSelected ? 0xffa500 : (isActive ? 0x3b82f6 : 0x1d4ed8);
      const nodeColor = isSelected ? 0xfde047 : (isActive ? 0x93c5fd : 0x60a5fa);

      const mat = new THREE.LineBasicMaterial({ color: trackColor });
      this.dynamicGroup.add(new THREE.Line(geo, mat));

      // Draw points for track nodes
      trackArr.forEach((p) => {
        const cgeo = new THREE.CircleGeometry(80, 16);
        cgeo.rotateX(-Math.PI / 2); // lie flat in XZ plane
        const cmat = new THREE.MeshBasicMaterial({ color: nodeColor, side: THREE.DoubleSide });
        const mesh = new THREE.Mesh(cgeo, cmat);
        mesh.position.set(p.x, p.y || 0, p.z);
        this.dynamicGroup.add(mesh);
      });
    };

    if (data.completedTracks) {
      data.completedTracks.forEach((tr, i) => renderTrack(tr, false, data.selectedTracks?.includes(i) || false));
    }
    renderTrack(data.trackPoints, true, false);

    // Render poles as circles in 2D / cylinders in 3D
    data.poles.forEach((p, i) => {
      const isSelected = data.selectedPoles?.includes(i) || false;
      const poleColor = isSelected ? 0xffa500 : 0xef4444;

      // 2D representation (flat circle)
      const cgeo = new THREE.CircleGeometry(250, 32);
      cgeo.rotateX(-Math.PI / 2);
      const cmat = new THREE.MeshBasicMaterial({ color: poleColor, side: THREE.DoubleSide }); // red pole
      const mesh2d = new THREE.Mesh(cgeo, cmat);
      mesh2d.position.set(p.x, p.y || 0, p.z);
      mesh2d.layers.set(1);
      this.dynamicGroup.add(mesh2d);

      // 3D representation (tall cylinder)
      const height = p.h || 3000;
      const cylGeo = new THREE.CylinderGeometry(150, 150, height, 16);
      cylGeo.translate(0, height / 2, 0); // move pivot to bottom
      const cylMat = new THREE.MeshPhongMaterial({ color: poleColor });
      const cyl = new THREE.Mesh(cylGeo, cylMat);
      cyl.position.set(p.x, p.y || 0, p.z);
      cyl.layers.set(2);
      this.dynamicGroup.add(cyl);
    });

    // Render committed cantilevers
    if (data.cantilevers) {
      data.cantilevers.forEach((c, ci) => {
        const isSelected = data.selectedCantilevers?.includes(ci) ?? false;
        const color = isSelected ? 0xfbbf24 : 0xf59e0b;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(c.x1, 0, c.z1),
          new THREE.Vector3(c.x2, 0, c.z2)
        ]);
        const mat = new THREE.LineBasicMaterial({ color, linewidth: isSelected ? 3 : 2 });
        this.dynamicGroup.add(new THREE.Line(geo, mat));
        if (isSelected) {
          // Highlight dots at endpoints
          [{ x: c.x1, z: c.z1 }, { x: c.x2, z: c.z2 }].forEach(pt => {
            const cgeo = new THREE.CircleGeometry(120, 16);
            cgeo.rotateX(-Math.PI / 2);
            const cmat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, side: THREE.DoubleSide });
            const mesh = new THREE.Mesh(cgeo, cmat);
            mesh.position.set(pt.x, 1, pt.z);
            this.dynamicGroup.add(mesh);
          });
        }
      });
    }

    // Render committed vanes
    if (data.vanes) {
      data.vanes.forEach((v, vi) => {
        const isSelected = data.selectedVanes?.includes(vi) ?? false;
        const color = isSelected ? 0xfde047 : 0xeab308;
        const geo = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(v.x1, 0, v.z1),
          new THREE.Vector3(v.x2, 0, v.z2)
        ]);
        const mat = new THREE.LineBasicMaterial({ color, linewidth: isSelected ? 3 : 2 });
        this.dynamicGroup.add(new THREE.Line(geo, mat));
        [{ x: v.x1, z: v.z1 }, { x: v.x2, z: v.z2 }].forEach(pt => {
          const cgeo = new THREE.CircleGeometry(isSelected ? 100 : 60, 12);
          cgeo.rotateX(-Math.PI / 2);
          const cmat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
          const mesh = new THREE.Mesh(cgeo, cmat);
          mesh.position.set(pt.x, 0, pt.z);
          this.dynamicGroup.add(mesh);
        });
      });
    }
  }

  private updateLabels() {
    if (!this.labelsContainer) return;
    this.labelsContainer.innerHTML = '';
    const cam = this.viewMode === '2D' ? this.cam2D : this.cam3D;

    const addLbl = (text: string, v: THREE.Vector3) => {
      const clone = v.clone();
      clone.project(cam);
      if (clone.z > 1 || clone.z < -1) return; // behind camera
      const x = (clone.x * .5 + .5) * this.container.offsetWidth;
      const y = (clone.y * -.5 + .5) * this.container.offsetHeight;
      const div = document.createElement('div');
      div.textContent = text;
      div.style.cssText = `position: absolute; left: ${x}px; top: ${y}px; transform: translate(-50%, -50%); background: rgba(15,23,42,0.8); border: 1px solid rgba(51,65,85,0.5); color: #fff; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-family: monospace; white-space: nowrap; transition: opacity 0.1s; letter-spacing: -0.2px; font-weight: 600;`;
      this.labelsContainer.appendChild(div);
    };

    this.dynData.poles.forEach(p => {
      if (p.label) addLbl(`${p.label} (H: ${Math.round(p.h || 3000)})`, new THREE.Vector3(p.x + 400, (p.y || 0) + (p.h || 3000) + 200, p.z));
    });

    if (this.dynData.completedTracks) {
      this.dynData.completedTracks.forEach(tr => {
        if (tr.length > 0 && tr[0].label) {
          const mid = Math.floor(tr.length / 2);
          const p = tr[mid];
          addLbl(tr[0].label, new THREE.Vector3(p.x, (p.y || 0) + 100, p.z));
        }
      });
    }

    if (this.dynData.cantilevers) {
      this.dynData.cantilevers.forEach(c => {
        if (c.label) {
          const mx = (c.x1 + c.x2) / 2, mz = (c.z1 + c.z2) / 2;
          addLbl(c.label, new THREE.Vector3(mx, 100, mz));
        }
      });
    }

    if (this.dynData.vanes) {
      this.dynData.vanes.forEach(v => {
        if (v.label) {
          const mx = (v.x1 + v.x2) / 2, mz = (v.z1 + v.z2) / 2;
          addLbl(v.label, new THREE.Vector3(mx, 120, mz));
        }
      });
    }
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

    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    bbox.getSize(size);
    bbox.getCenter(center);

    const pad = 1.25;
    const { offsetWidth: w, offsetHeight: h } = this.container;
    const aspect = w / h;

    // 2D orthographic: fit XZ plan view (X horizontal, Z vertical, Y = height)
    const neededH = Math.max(size.x / aspect, size.z) * pad;
    this.cam2D.left = -neededH * aspect / 2;
    this.cam2D.right = neededH * aspect / 2;
    this.cam2D.top = neededH / 2;
    this.cam2D.bottom = -neededH / 2;
    this.cam2D.zoom = 1;
    this.cam2D.position.set(center.x, -1e5, center.z);  // below XZ plane, looking up
    this.cam2D.updateProjectionMatrix();

    // 3D perspective: pull back to see full scene
    const maxDim = Math.max(size.x, size.y, size.z);
    const dist = maxDim * 1.5;
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
      this.controls.enabled = true;
      this.cursorGroup.visible = false;
      this.gridGroup.visible = false;
      if (this.coordsEl) this.coordsEl.style.display = 'none';
      this.container.style.cursor = '';
      // Disable our wheel/mousedown for pan — OrbitControls takes over
      this.container.removeEventListener('wheel', this._onWH);
      this.container.removeEventListener('mousedown', this._onMD);
    } else {
      this.controls.enabled = false;
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
