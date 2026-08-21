import re

path = '/home/fares00/documents/projects/ocs/ocs-web/src/viewer/ViewerEngine.ts'
with open(path, 'r') as f:
    code = f.read()

# 1. Update train map properties
code = code.replace("direction: 1 | -1;\n    isPlaying: boolean;\n  }>();", "direction: 1 | -1;\n    isPlaying: boolean;\n    trackIndex: number;\n    trackCurve?: THREE.CatmullRomCurve3;\n    trackCantilevers?: { c: any; progress: number }[];\n  }>();")

# 2. Update addTrain defaults
code = code.replace("direction: 1,\n        isPlaying: true\n    });", "direction: 1,\n        isPlaying: true,\n        trackIndex: 0\n    });")

# 3. Update updateTrain signature
code = code.replace("direction: 1|-1, isPlaying: boolean}>)", "direction: 1|-1, isPlaying: boolean, trackIndex: number}>)")
code = code.replace("if (updates.isPlaying !== undefined) t.isPlaying = updates.isPlaying;\n    }", "if (updates.isPlaying !== undefined) t.isPlaying = updates.isPlaying;\n        if (updates.trackIndex !== undefined) {\n          t.trackIndex = updates.trackIndex;\n          t.trackCurve = undefined;\n          t.trackCantilevers = undefined;\n        }\n    }")

# 4. Extract curve creation logic
# Find setSimulationState
simstate_regex = re.compile(r"  public setSimulationState\(state: 'playing' \| 'paused' \| 'stopped'\) \{.*?this\.trackCurve = undefined;\n      \} else \{\n        for \(const t of this\.trainInstances\.values\(\)\) t\.group\.visible = false;\n        this\.simState = 'stopped';\n      \}\n    \}\n  \}", re.DOTALL)

# We will write a helper to generate curve and use it in the loop
curve_helper = """  private _getTrainTrack(t: any) {
    if (!t.trackCurve) {
        let activeTrackPoints = null;
        if (this.dynData?.completedTracks?.length > t.trackIndex) {
            activeTrackPoints = this.dynData.completedTracks[t.trackIndex];
        } else if (this.dynData?.trackPoints?.length >= 2) {
            activeTrackPoints = this.dynData.trackPoints;
        }

        if (activeTrackPoints && activeTrackPoints.length >= 2) {
            const pts = this._buildSimTrackPts(activeTrackPoints);
            if (pts.length >= 2) {
                t.trackCurve = new THREE.CatmullRomCurve3(pts, false, 'chordal');
                t.trackCantilevers = [];
                if (this.dynData?.cantilevers) {
                    const lut = t.trackCurve.getSpacedPoints(200);
                    this.dynData.cantilevers.forEach((c: any) => {
                        const cx = c.x2 ?? c.x2raw ?? c.x1;
                        const cz = c.z2 ?? c.z2raw ?? c.z1;
                        let minDist = Infinity;
                        let minIdx = -1;
                        for (let i = 0; i < lut.length; i++) {
                            const d = Math.hypot(cx - lut[i].x, cz - lut[i].z);
                            if (d < minDist) { minDist = d; minIdx = i; }
                        }
                        if (minDist < 50000) {
                            t.trackCantilevers.push({ c, progress: minIdx / (lut.length - 1) });
                        }
                    });
                    t.trackCantilevers.sort((a: any, b: any) => a.progress - b.progress);
                }
            }
        }
    }
    return t;
  }

  public setSimulationState(state: 'playing' | 'paused' | 'stopped') {
    this.simState = state;
    if (state === 'stopped') {
        for (const t of this.trainInstances.values()) {
            t.group.visible = false;
            t.trackCurve = undefined;
            t.trackCantilevers = undefined;
        }
    } else {
        for (const t of this.trainInstances.values()) {
            t.group.visible = true;
        }
    }
  }"""

code = simstate_regex.sub(curve_helper, code)

# 5. Update the loop to use t.trackCurve instead of this.trackCurve
code = code.replace("if (this.simState !== 'stopped' && this.trackCurve) {", "if (this.simState !== 'stopped') {")
code = code.replace("const pos = this.trackCurve.getPointAt(t.progress);", "this._getTrainTrack(t);\n        if (!t.trackCurve) continue;\n        const pos = t.trackCurve.getPointAt(t.progress);")
code = code.replace("const tangent = this.trackCurve.getTangentAt(t.progress);", "const tangent = t.trackCurve.getTangentAt(t.progress);")
code = code.replace("if (this.trackCantilevers.length > 0) {", "if (t.trackCantilevers && t.trackCantilevers.length > 0) {")
code = code.replace("let nextC = this.trackCantilevers.find", "let nextC = t.trackCantilevers.find")
code = code.replace("|| this.trackCantilevers[0];", "|| t.trackCantilevers[0];")
code = code.replace("let prevC = [...this.trackCantilevers].reverse().find", "let prevC = [...t.trackCantilevers].reverse().find")
code = code.replace("|| this.trackCantilevers[this.trackCantilevers.length - 1];", "|| t.trackCantilevers[t.trackCantilevers.length - 1];")


with open(path, 'w') as f:
    f.write(code)

print("done")
