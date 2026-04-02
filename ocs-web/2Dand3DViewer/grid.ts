import * as THREE from 'three';
import { handleCameraWorldCoordinates } from './helper';

export function addGrid(scene: THREE.Scene, grid: { current: THREE.Group, horizontalLines: THREE.Line[], verticalLines: THREE.Line[], spacing: number }, height: number, width: number): void {
    grid.current = new THREE.Group();
    grid.horizontalLines = [];
    grid.verticalLines = [];

    const material = new THREE.LineBasicMaterial({
        color: 0xE0E0E0,
        transparent: true,
        opacity: 0.5
    });

    const maxLines = 100;
    for (let i = 0; i < maxLines; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        const line = new THREE.Line(geometry, material);
        line.visible = false;
        grid.horizontalLines.push(line);
        grid.current.add(line);
    };

    for (let i = 0; i < maxLines; i++) {
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        const line = new THREE.Line(geometry, material);
        line.visible = false;
        grid.verticalLines.push(line);
        grid.current.add(line);
    };

    scene.add(grid.current);

    const spacing                   = calculateGridSpacing(width);
    const offset                    = calculateFirstGridPoint(0, 0, spacing);
    updateLines(grid.verticalLines, Math.floor(width / spacing) + 1, spacing, offset.x, height, true);
    updateLines(grid.horizontalLines, Math.floor(height / spacing) + 1, spacing, offset.y, width, false);
    grid.spacing                    = spacing;
}

export function updateGrid(
    grid: { current: THREE.Group, horizontalLines: THREE.Line[], verticalLines: THREE.Line[], spacing: number },
    camera: THREE.Camera | undefined,
    container: HTMLElement | undefined,
    event: MouseEvent | WheelEvent
): void {
    if (!grid.current || !camera || !container) return;

    if (camera instanceof THREE.OrthographicCamera) {

        const worldCoords = handleCameraWorldCoordinates(camera, container, event);

        if (!worldCoords) return;

        const newSpacing = calculateGridSpacing(worldCoords.visibleWidth);

        const offset = calculateFirstGridPoint(worldCoords.viewLeft, worldCoords.viewBottom, newSpacing);
        const numDivisionsX = Math.floor(worldCoords.visibleWidth / newSpacing) + 1;
        const numDivisionsY = Math.floor(worldCoords.visibleHeight / newSpacing) + 1;

        updateLines(grid.verticalLines, numDivisionsX, newSpacing, offset.x, worldCoords.visibleHeight, true);
        updateLines(grid.horizontalLines, numDivisionsY, newSpacing, offset.y, worldCoords.visibleWidth, false);

        grid.spacing = newSpacing;
        grid.current.position.set(worldCoords.viewLeft, worldCoords.viewBottom, 0);

    }
}

function updateLines(
    lines: THREE.Line[],
    numDivisions: number,
    spacing: number,
    offset: number,
    length: number,
    isVertical: boolean
): void {
    const requiredLines = numDivisions;
    const availableLines = lines.length;


    for (let i = 0; i < requiredLines; i++) {
        if (i < availableLines) {
            const line = lines[i];
            const pos = i * spacing + offset;
            const points = isVertical
                ? [new THREE.Vector3(pos, 0, 0), new THREE.Vector3(pos, length, 0)]
                : [new THREE.Vector3(0, pos, 0), new THREE.Vector3(length, pos, 0)];
            line.geometry.setFromPoints(points);
            line.visible = true;
        }
    }

    for (let i = requiredLines; i < availableLines; i++) {
        lines[i].visible = false;
    }
}

// Define possible spacings (adjustable based on your needs)
const possibleSpacings = [5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, 2000000, 5000000, 10000000, 20000000, 50000000, 100000000];

function calculateGridSpacing(visibleWidth: number): number {
    // Ideal spacing to maintain ~40 grid lines
    const idealSpacing = visibleWidth > 50000 ? visibleWidth/20 : visibleWidth/40;

    // Find the spacing closest to the ideal
    let closest = possibleSpacings[0];
    let minDiff = Math.abs(idealSpacing - closest);

    for (const spacing of possibleSpacings) {
        const diff = Math.abs(idealSpacing - spacing);
        if (diff < minDiff) {
            minDiff = diff;
            closest = spacing;
        }
    }

    return closest;
}

function calculateFirstGridPoint(left: number, bottom: number, spacing: number): THREE.Vector3 {
    const firstPointX = Math.abs(left - Math.ceil(left / spacing) * spacing);
    const firstPointY = Math.abs(bottom - Math.ceil(bottom / spacing) * spacing); // Fix this typo!
    return new THREE.Vector3(firstPointX, firstPointY, 0);
}
