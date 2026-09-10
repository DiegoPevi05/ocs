# OCS Cantilever 3D Truss Stress Analysis - Implementation Plan

This document outlines the architecture and step-by-step plan for implementing a 3D truss structural analysis engine into the OCS C++ backend, along with a visual stress heatmap in the React/Three.js frontend.

## 1. Architectural Overview

We will implement a **Direct Stiffness Method (DSM)** 3D space truss solver. The cantilever geometry already calculates precise 3D node coordinates for every clamp and tube end. We will treat these points as nodes in a truss network.

### Node & Element Mapping
*   **Nodes**: Pole attachments (fixed), isolator ends, clamp pins, wire support points, and tube extremities.
*   **Elements**:
    *   **Tubes** (Stay Tube, Bracket Tube, Steady Arm, Register Arm, Reinforcement): Modeled as linear elastic truss members with area $A = \pi s(d-s)$.
    *   **Fittings & Isolators**: Modeled as rigid links (truss members with artificially high stiffness) to transmit forces strictly to the tubes without internal deformation.
    *   **Cables/Wires**: Modeled as tension-only members.

### Loads & Boundary Conditions
*   **Boundary Conditions**: The two attachment points on the pole mast will be treated as Pinned/Fixed supports ($U_x=U_y=U_z=0$).
*   **External Forces**: 
    *   Applied at the **Contact Wire (CW)** and **Messenger Wire (MW)** nodes.
    *   The primary forces are the **radial loads** (components in the plane of the cantilever) arising from:
        1. Wire stagger (zigzag) pulling the wire laterally.
        2. Curve radius deflection (if applicable).
    *   Vertical loads include wire weight, dropper weight, and member self-weight.

## 2. Backend Implementation (`ocs-calculator`)

### Step 2.1: Add Truss Solver Engine
Create a new module `src/math/TrussSolver.cpp` with the following capabilities:
1.  Assemble a global stiffness matrix $[K]$ from element local stiffness matrices.
2.  Apply boundary conditions (reduce the matrix).
3.  Solve the linear system $[K]\{U\} = \{F\}$ for nodal displacements $\{U\}$.
4.  Compute internal axial forces ($N$) and stresses ($\sigma = N/A$) for each element.

### Step 2.2: Extract Truss Topology
In `server.cpp`, after `poleOrchestrator.buildAll()`:
1.  Extract all nodes (e.g., `upperPoleFixedPoint`, `wireSupportFixedPoint`, etc.) from the populated assemblies.
2.  Create structural elements mapping these nodes to their respective `SteelTube` cross-sections (diameter, thickness, density) and material properties (Young's Modulus $E \approx 70,000$ MPa for Aluminum, $210,000$ MPa for Steel).

### Step 2.3: Compute & Attach Stress Data
1. Calculate the Utilization ratio: $U = \text{Stress} / \text{Allowable Limit}$.
2. Inject this data into the JSON response:
    *   **Tube Results**: Add `axial_force`, `stress`, and `utilization` to `ApiResult`.
    *   **3D Lines**: Subdivide the visual lines of the tubes into 5-10 segments, assigning a linearly interpolated `utilization` value to each segment's `ApiLine` JSON so the frontend can render a smooth gradient.

## 3. Frontend Implementation (`ocs-web`)

### Step 3.1: Update Types
Extend the types in `types.ts`:
```typescript
export interface ApiLine {
  // ... existing ...
  utilization?: number; // 0.0 (zero stress) to 1.0 (at yield limit)
}
export interface ApiResult {
  // ... existing ...
  axial_force?: number;
  stress?: number;
  utilization?: number;
}
```

### Step 3.2: ViewerEngine Stress Heatmap Mode
In `ViewerEngine.ts`:
1.  Implement a colormap function mapping utilization `0.0 -> 1.0` to `Green -> Yellow -> Red`.
2.  Add a `stressMode` boolean flag.
3.  When updating materials in `makeApiLine`, check if `stressMode` is true. If so, override the default color with the heatmapped color derived from `apiLine.utilization`. Since the backend will send subdivided segments, this will naturally form a gradient pattern along the tubes.

### Step 3.3: UI Controls & Results Table
In `EditorPage.tsx` and `CantileverPanel.tsx`:
1.  Add a toggle switch in the UI: **"View Stress Heatmap"**.
2.  Update the floating `.results-tbl` overlay to include tabs for **"Dimensions"** and **"Structural"**, displaying the computed forces (kN) and stresses (MPa) for each component.

## 4. Execution Phases

1.  **Phase 1 (Backend Core)**: Implement `TrussSolver`, build the $[K]$ matrix, define external load configurations (Tension & Zigzag forces).
2.  **Phase 2 (Backend Integration)**: Connect `CantileverFrame` points to the solver, calculate stresses, and embed `utilization` into the STOMP JSON payloads.
3.  **Phase 3 (Frontend)**: Update the React UI to display the force tables and the Three.js viewer to map utilization values to the Green-Red color gradient.
