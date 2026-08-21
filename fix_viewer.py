import sys
import re

path = '/home/fares00/documents/projects/ocs/ocs-web/src/viewer/ViewerEngine.ts'
with open(path, 'r') as f:
    code = f.read()

if 'import * as SkeletonUtils' not in code:
    code = code.replace(
        "import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';",
        "import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';\nimport * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';"
    )

# 1. Update initTrainPlaceholder
old_init = """  private initTrainPlaceholder() {
    // Try loading GLB model first, fall back to simple geometry
    this.trainGroup = new THREE.Group();
    this.trainGroup.visible = false;
    this.scene.add(this.trainGroup);

    const loader = new GLTFLoader();
    loader.load(
      '/models/train.glb',
      (gltf) => {
        const model = gltf.scene;

        // GLB files are typically in meters — our scene is in mm, so scale ×1000
        model.scale.set(1000, 1000, 1000);

        // Update world matrices so getWorldPosition works correctly after scaling
        model.updateMatrixWorld(true);

        // Find the Pantograph group and its parts for IK animation
        this.pantoGroup = model.getObjectByName('Pantograph') ?? undefined;
        this.pantoArmLower = model.getObjectByName('PantographArmLower') ?? undefined;
        this.pantoArmUpperGroup = model.getObjectByName('PantographArmUpperGroup') ?? undefined;
        this.pantoHeadGroup = model.getObjectByName('PantographHeadGroup') ?? undefined;

        // Find PantographHead (the part that touches the wire)
        const pantoHead = model.getObjectByName('PantographHead');

        if (pantoHead) {
          // Compute rest height: how high PantographHead sits above trainGroup origin
          const headWorld = new THREE.Vector3();
          pantoHead.getWorldPosition(headWorld);
          const modelWorld = new THREE.Vector3();
          model.getWorldPosition(modelWorld);
          this.pantoRestHeight = headWorld.y - modelWorld.y;
          console.log(`[OCS] GLB loaded — PantographHead rest height: ${this.pantoRestHeight.toFixed(0)} mm`);
        } else {
          console.warn('[OCS] GLB loaded but PantographHead not found — pantograph tracking disabled');
          this.pantoRestHeight = 5400;
        }

        if (!this.pantoGroup) {
          console.warn('[OCS] GLB loaded but Pantograph group not found — will move PantographHead directly');
        }

        // Make all meshes cast/receive shadows and set layers for 3D
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          child.layers.set(2); // Only visible in 3D mode
        });

        // Clear placeholder geometry if any
        while (this.trainGroup!.children.length) {
          const c = this.trainGroup!.children[0] as any;
          if (c.geometry) c.geometry.dispose();
          if (c.material) {
            if (Array.isArray(c.material)) c.material.forEach((m: any) => m.dispose());
            else c.material.dispose();
          }
          this.trainGroup!.remove(c);
        }

        this.trainGroup!.add(model);
        this.trainGlbLoaded = true;
        console.log('[OCS] Train GLB model loaded successfully');
      },
      undefined,
      (err) => {
        console.warn('[OCS] Failed to load train GLB, using placeholder geometry:', err);
        this._buildPlaceholderTrain();
      }
    );

    // Build placeholder immediately (will be replaced if GLB loads)
    this._buildPlaceholderTrain();
  }

  private _buildPlaceholderTrain() {
    if (!this.trainGroup) return;
    const bodyGeo = new THREE.BoxGeometry(2500, 3500, 15000); // W=2.5m, H=3.5m, L=15m
    bodyGeo.translate(0, 1750, 0); // Origin at bottom
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.name = 'TrainBody';
    this.trainGroup.add(body);

    const pantoGeo = new THREE.BoxGeometry(2000, 100, 100);
    const pantoMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
    const panto = new THREE.Mesh(pantoGeo, pantoMat);
    panto.name = 'PantographHead';
    panto.position.set(0, 5400, 0); // ~5.4m high
    this.trainGroup.add(panto);

    this.pantoGroup = undefined;
    this.pantoRestHeight = 5400;
    this.trainGlbLoaded = false;
  }"""

new_init = """  private initTrainPlaceholder() {
    this.trainTemplate = new THREE.Group();
    const loader = new GLTFLoader();
    loader.load(
      '/models/train.glb',
      (gltf) => {
        const model = gltf.scene;
        model.scale.set(1000, 1000, 1000);
        model.updateMatrixWorld(true);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
          child.layers.set(2);
        });
        this.trainTemplate!.add(model);
        this.trainGlbLoaded = true;
      },
      undefined,
      (err) => {
        const bodyGeo = new THREE.BoxGeometry(2500, 3500, 15000);
        bodyGeo.translate(0, 1750, 0);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.name = 'TrainBody';
        this.trainTemplate!.add(body);
        const pantoGeo = new THREE.BoxGeometry(2000, 100, 100);
        const pantoMat = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        const panto = new THREE.Mesh(pantoGeo, pantoMat);
        panto.name = 'PantographHead';
        panto.position.set(0, 5400, 0);
        this.trainTemplate!.add(panto);
        this.trainGlbLoaded = false;
      }
    );
  }

  public addTrain(id: string) {
    if (!this.trainTemplate) return;
    const group = SkeletonUtils.clone(this.trainTemplate) as THREE.Group;
    this.scene.add(group);
    
    let pantoGroup, pantoHeadGroup;
    let pantoRestHeight = 5400;
    const pantoHead = group.getObjectByName('PantographHead');
    if (pantoHead) {
        group.updateMatrixWorld(true);
        const headWorld = new THREE.Vector3();
        pantoHead.getWorldPosition(headWorld);
        const modelWorld = new THREE.Vector3();
        group.getWorldPosition(modelWorld);
        pantoRestHeight = headWorld.y - modelWorld.y;
    }
    pantoGroup = group.getObjectByName('Pantograph');
    pantoHeadGroup = group.getObjectByName('PantographHeadGroup');

    this.trainInstances.set(id, {
        group,
        pantoGroup,
        pantoHeadGroup,
        pantoRestHeight,
        progress: 0,
        speedMultiplier: 1,
        direction: 1,
        isPlaying: true
    });
  }

  public removeTrain(id: string) {
    const t = this.trainInstances.get(id);
    if (t) {
        this.scene.remove(t.group);
        this.trainInstances.delete(id);
    }
  }

  public updateTrain(id: string, updates: Partial<{progress: number, speedMultiplier: number, direction: 1|-1, isPlaying: boolean}>) {
    const t = this.trainInstances.get(id);
    if (t) {
        if (updates.progress !== undefined) t.progress = updates.progress;
        if (updates.speedMultiplier !== undefined) t.speedMultiplier = updates.speedMultiplier;
        if (updates.direction !== undefined) t.direction = updates.direction;
        if (updates.isPlaying !== undefined) t.isPlaying = updates.isPlaying;
    }
  }
"""

if "addTrain(id" not in code:
    code = code.replace(old_init, new_init)

# Now loop function
loop_start = """    if (this.simState === 'playing' && this.trainGroup && this.trackCurve) {
      this.trainProgress += 0.005;
      if (this.trainProgress > 1) this.trainProgress = 0;

      const pos = this.trackCurve.getPointAt(this.trainProgress);
      const tangent = this.trackCurve.getTangentAt(this.trainProgress);
      const lookAtTarget = pos.clone().add(tangent);

      this.trainGroup.position.copy(pos);
      // For TrainGLB, model.rotation.y = Math.PI is applied inside the group, 
      this.trainGroup.lookAt(lookAtTarget);"""

loop_mid_old = """      // ─── Camera Tracking ───────────────────────────────────────────────────
      
      if (this.simCameraMode === 'chase') {
        const offset = tangent.clone().multiplyScalar(-this.chaseCamDistance);
        offset.y += 2000;
        const camPos = pos.clone().add(offset);
        this.cam3D.position.lerp(camPos, 0.1);
        this.controls.target.lerp(pos, 0.1);
      } else if (this.simCameraMode === 'side') {
        const up = new THREE.Vector3(0, 1, 0);
        const right = tangent.clone().cross(up).normalize();
        const offset = right.multiplyScalar(this.chaseCamDistance);
        const targetHeight = this.simCWHeight;
        offset.y += targetHeight;
        
        const camPos = pos.clone().add(offset);
        this.cam3D.position.lerp(camPos, 0.12);

        const camTarget = pos.clone().add(new THREE.Vector3(0, targetHeight, 0));
        this.controls.target.lerp(camTarget, 0.12);
      } else if (this.simCameraMode === 'front') {
        const offset = tangent.clone().multiplyScalar(this.chaseCamDistance);
        const targetHeight = this.simCWHeight * 0.5;
        offset.y += targetHeight;
        
        const camPos = pos.clone().add(offset);
        this.cam3D.position.lerp(camPos, 0.12);

        const camTarget = pos.clone().add(new THREE.Vector3(0, targetHeight, 0));
        this.controls.target.lerp(camTarget, 0.12);
      }
    }"""

# A regex to replace the entire single-train update logic inside the loop!
import re

loop_regex = re.compile(r"    if \(this\.simState === 'playing' && this\.trainGroup && this\.trackCurve\) \{.*?this\.controls\.target\.lerp\(camTarget, 0\.12\);\n      \}\n    \}", re.DOTALL)

loop_new = """    if (this.simState !== 'stopped' && this.trackCurve) {
      for (const [id, t] of this.trainInstances.entries()) {
        t.group.visible = true;
        if (t.isPlaying) {
          t.progress += 0.001 * t.speedMultiplier * t.direction;
          if (t.progress > 1) t.progress -= 1;
          if (t.progress < 0) t.progress += 1;
        }

        const pos = this.trackCurve.getPointAt(t.progress);
        const tangent = this.trackCurve.getTangentAt(t.progress);
        const lookAtTarget = pos.clone().add(tangent);

        t.group.position.copy(pos);
        t.group.lookAt(lookAtTarget);

        let targetHeight = 5400;
        let zigzagOffset = 0;
        if (this.trackCantilevers.length > 0) {
            let nextC = this.trackCantilevers.find(c => c.progress >= t.progress) || this.trackCantilevers[0];
            let prevC = [...this.trackCantilevers].reverse().find(c => c.progress <= t.progress) || this.trackCantilevers[this.trackCantilevers.length - 1];
            
            if (nextC && prevC) {
              let dist = nextC.progress - prevC.progress;
              if (dist < 0) dist += 1;
              let p = t.progress - prevC.progress;
              if (p < 0) p += 1;
              let ratio = dist === 0 ? 0 : p / dist;
              
              const h1 = prevC.c.contactWireHeight ?? 5400;
              const h2 = nextC.c.contactWireHeight ?? 5400;
              targetHeight = h1 + (h2 - h1) * ratio;

              const z1 = prevC.c.zigzag ?? 250;
              const z2 = nextC.c.zigzag ?? -250;
              zigzagOffset = z1 + (z2 - z1) * ratio;
            }
        }
        
        // Dispatch HUD events only for focused train
        if (this.focusedTrainId === id) {
            this.simCWHeight = targetHeight;
            this.simZigzag = zigzagOffset;
            this.container.dispatchEvent(new CustomEvent('viewer-hud', { 
              detail: { zigzag: zigzagOffset, cwHeight: targetHeight }
            }));
        }

        // Adjust Pantograph geometry using Y-scaling hack
        if (t.pantoGroup && t.pantoHeadGroup) {
          const pantoBaseWorld = new THREE.Vector3();
          t.pantoGroup.getWorldPosition(pantoBaseWorld);
          
          const currentRelY = t.pantoRestHeight;
          const adjustedTargetHeight = targetHeight - 50; 
          const desiredHeight = adjustedTargetHeight - (pantoBaseWorld.y - t.group.position.y);
          
          if (currentRelY > 0) {
            const scaleY = desiredHeight / currentRelY;
            t.pantoGroup.scale.set(1, scaleY, 1);
            t.pantoHeadGroup.scale.set(1, 1 / scaleY, 1);
          }
        }
        
        // Update camera if focused
        if (this.focusedTrainId === id && this.simCameraMode !== 'free') {
            if (this.simCameraMode === 'chase') {
              const offset = tangent.clone().multiplyScalar(-this.chaseCamDistance);
              offset.y += 2000;
              const camPos = pos.clone().add(offset);
              this.cam3D.position.lerp(camPos, 0.1);
              this.controls.target.lerp(pos, 0.1);
            } else if (this.simCameraMode === 'side') {
              const up = new THREE.Vector3(0, 1, 0);
              const right = tangent.clone().cross(up).normalize();
              const offset = right.multiplyScalar(this.chaseCamDistance);
              offset.y += targetHeight;
              const camPos = pos.clone().add(offset);
              this.cam3D.position.lerp(camPos, 0.12);
              const camTarget = pos.clone().add(new THREE.Vector3(0, targetHeight, 0));
              this.controls.target.lerp(camTarget, 0.12);
            } else if (this.simCameraMode === 'front') {
              const offset = tangent.clone().multiplyScalar(this.chaseCamDistance);
              offset.y += targetHeight * 0.5;
              const camPos = pos.clone().add(offset);
              this.cam3D.position.lerp(camPos, 0.12);
              const camTarget = pos.clone().add(new THREE.Vector3(0, targetHeight * 0.5, 0));
              this.controls.target.lerp(camTarget, 0.12);
            }
        }
      }
    } else {
        for (const [id, t] of this.trainInstances.entries()) {
            t.group.visible = false;
        }
    }"""

if "for (const [id, t] of this.trainInstances.entries()) {" not in code:
    code = loop_regex.sub(loop_new, code)

# Fix simState setSimulationState
simstate_old = """  public setSimulationState(state: 'playing' | 'paused' | 'stopped') {
    this.simState = state;
    if (!this.trainGroup) return;

    if (state === 'stopped') {
      this.trainGroup.visible = false;
      this.simProgress = 0;
      this.trackCurve = undefined;
    } else {"""
simstate_new = """  public setSimulationState(state: 'playing' | 'paused' | 'stopped') {
    this.simState = state;

    if (state === 'stopped') {
      for (const t of this.trainInstances.values()) t.group.visible = false;
      this.trackCurve = undefined;
    } else {"""

code = code.replace(simstate_old, simstate_new)

with open(path, 'w') as f:
    f.write(code)

print("done")
