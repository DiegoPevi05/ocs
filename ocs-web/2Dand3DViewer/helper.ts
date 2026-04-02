import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
export function generateUniqueId():string{
  return uuidv4();
}


export const vec3ToObj = (vec) => ({ x: vec.x, y: vec.y, z: vec.z });

export const objToVec3 = (obj: { x: number; y: number; z: number; }) =>
  new THREE.Vector3(obj.x, obj.y, obj.z);

export const isPointOnSegment = (point, segStart, segEnd) => {
  const v1 = new THREE.Vector3().subVectors(point, segStart);
  const v2 = new THREE.Vector3().subVectors(segEnd, segStart);
  const cross = new THREE.Vector3().crossVectors(v1, v2);

  // Check if vectors are colinear
  const isColinear = cross.length() < 1e-6;

  // Check if the point lies between segStart and segEnd
  const dot = v1.dot(v2);
  const inSegment = dot >= 0 && dot <= v2.lengthSq();

  return isColinear && inSegment;
};

export function cleanUpPreviewElements(elements: {current: THREE.Mesh | THREE.Line | undefined}[], scene: THREE.Scene): void {
    elements.forEach(element => {
        if (element.current) {
            element.current.geometry.dispose();
            (element.current.material as THREE.Material).dispose();
            scene.remove(element.current);
            element.current = undefined;
        }
    });
}

export function handleZoom(camera:THREE.Camera, container:HTMLElement|undefined, event:MouseEvent|WheelEvent):{
    visibleWidth:number, 
    visibleHeight:number,
    viewLeft:number, 
    viewBottom:number,
    worldX:number,
    worldY:number
  }|undefined{
    if(!camera || !container) return undefined;

    if(camera instanceof THREE.OrthographicCamera){
    
      const visibleWidth = (camera.right - camera.left) / camera.zoom;
      const visibleHeight = (camera.top - camera.bottom) / camera.zoom;

      const centerX = (camera.left + camera.right) / 2; // Center of the camera's view
      const centerY = (camera.top + camera.bottom) / 2; // Center of the camera's view  

      const viewLeft = centerX - visibleWidth / 2; // Left edge of the visible area
      const viewBottom = centerY - visibleHeight / 2; // Bottom edge of the visible area

      const rect = container.getBoundingClientRect();
      // Convert mouse position to world coordinates based on current view
      const worldX = viewLeft + ((event.clientX - rect.left) / rect.width) * visibleWidth;
      const worldY = viewBottom + ((rect.height - (event.clientY - rect.top)) / rect.height) * visibleHeight;


      return {visibleWidth, visibleHeight, viewLeft, viewBottom, worldX, worldY};
    }
  }

  export function handleCameraWorldCoordinates(camera:THREE.Camera, container:HTMLElement|undefined, event:MouseEvent):{
    visibleWidth:number,
    visibleHeight:number,
    viewLeft:number,
    viewBottom:number,
    worldX:number,
    worldY:number
  }|undefined{
    if(!camera || !container) return undefined;

    if(camera instanceof THREE.OrthographicCamera){
      const visibleWidth = (camera.right - camera.left) / camera.zoom;
      const visibleHeight = (camera.top - camera.bottom) / camera.zoom;

      const viewLeft = getCanvasCornerWorldPosition(camera, 'leftBottom').x;
      const viewBottom = getCanvasCornerWorldPosition(camera, 'leftBottom').y;

      const rect = container.getBoundingClientRect();
      // Convert mouse position to world coordinates based on current view
      const worldX = viewLeft + ((event.clientX - rect.left) / rect.width) * visibleWidth;
      const worldY = viewBottom + ((rect.height - (event.clientY - rect.top)) / rect.height) * visibleHeight;

      return {visibleWidth, visibleHeight, viewLeft, viewBottom, worldX, worldY};
    }
  }

  export function getCanvasCornerWorldPosition(camera:THREE.Camera, corner: 'leftBottom' | 'rightTop' | 'leftTop' | 'rightBottom'): THREE.Vector3 {
    // Check if the camera is initialized
    if (!camera) {
      console.warn('Camera is not initialized.');
      return new THREE.Vector3();
    }
  
    // Define NDC coordinates for each corner
    let ndc: THREE.Vector3;
    switch (corner) {
      case 'leftBottom':
        ndc = new THREE.Vector3(-1, -1, 0); // Left bottom corner in NDC
        break;
      case 'rightTop':
        ndc = new THREE.Vector3(1, 1, 0); // Right top corner in NDC
        break;
      case 'leftTop':
        ndc = new THREE.Vector3(-1, 1, 0); // Left top corner in NDC
        break;
      case 'rightBottom':
        ndc = new THREE.Vector3(1, -1, 0); // Right bottom corner in NDC
        break;
      default:
        console.warn('Invalid corner specified.');
        ndc = new THREE.Vector3(0, 0, 0);
    }
  
    // Unproject NDC to world coordinates
    ndc.unproject(camera);
  
    // Since the grid is at z = 0, set the z component to 0
    return new THREE.Vector3(ndc.x, ndc.y, 0);
  }


  export function doLinesIntersect(
    start1: THREE.Vector3,
    end1: THREE.Vector3,
    start2: THREE.Vector3,
    end2: THREE.Vector3
  ): boolean {
    const epsilon = 0.1; // Threshold for point matching
  
    // Check endpoints
    if (
      start1.distanceTo(start2) < epsilon ||
      start1.distanceTo(end2) < epsilon ||
      end1.distanceTo(start2) < epsilon ||
      end1.distanceTo(end2) < epsilon
    ) {
      return true;
    }
  
    // Check if point is on line segment
    const isPointOnLine = (point: THREE.Vector3, lineStart: THREE.Vector3, lineEnd: THREE.Vector3): boolean => {
      const d = lineEnd.clone().sub(lineStart); // Line direction vector
      const length = d.length();
      
      if (length === 0) return false;
      
      d.normalize();
      
      const pointVector = point.clone().sub(lineStart);
      const dot = pointVector.dot(d);
      
      // Check if point projection is within line segment
      if (dot < 0 || dot > length) return false;
      
      // Check if point is close enough to line
      const projection = lineStart.clone().add(d.multiplyScalar(dot));
      return point.distanceTo(projection) < epsilon;
    };
  
    // Check if start1 or end1 lies on line2
    if (
      isPointOnLine(start1, start2, end2) ||
      isPointOnLine(end1, start2, end2)
    ) {
      return true;
    }
  
    // Check if start2 or end2 lies on line1
    if (
      isPointOnLine(start2, start1, end1) ||
      isPointOnLine(end2, start1, end1)
    ) {
      return true;
    }
  
    return false;
  }


/**
 * Helper: draw a circle (line) centered at origin in the X-Y plane
 * @param {number} diameter - diameter of the circle
 * @param {number} color - hex color
 * @param {number} segments - number of segments to approximate the circle
 * @returns {THREE.Line}
 */

export function drawCircle(diameter, color, segments = 32) {
  const radius = diameter / 2;
  const points = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0));
  }
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });
  return new THREE.Line(geometry, material);
}

/**
 * Helper: draw a rectangle (line loop + diagonals) centered at origin in X-Y plane
 * @param {number} width - horizontal width
 * @param {number} height - vertical height
 * @param {number} color - hex color
 * @returns {THREE.Group} - group containing the rectangle edges and diagonals
 */

export function drawRectangle(width, height, color) {
  const hw = width / 2;
  const hh = height / 2;

  // Corners
  const topLeft     = new THREE.Vector3(-hw,  hh, 0);
  const topRight    = new THREE.Vector3( hw,  hh, 0);
  const bottomRight = new THREE.Vector3( hw, -hh, 0);
  const bottomLeft  = new THREE.Vector3(-hw, -hh, 0);

  // Rectangle edges (closed loop)
  const rectGeom = new THREE.BufferGeometry().setFromPoints([
    topLeft, topRight, bottomRight, bottomLeft, topLeft
  ]);
  const mat = new THREE.LineBasicMaterial({ color });
  const edgeLoop = new THREE.Line(rectGeom, mat);

  // Diagonals
  const diagGeom1 = new THREE.BufferGeometry().setFromPoints([topLeft, bottomRight]);
  const diag1 = new THREE.Line(diagGeom1, mat);

  const diagGeom2 = new THREE.BufferGeometry().setFromPoints([topRight, bottomLeft]);
  const diag2 = new THREE.Line(diagGeom2, mat);

  const group = new THREE.Group();
  group.add(edgeLoop, diag1, diag2);
  return group;
}

export function drawCross(length,color) {
  const half = length/2
  // Corners
  const top         = new THREE.Vector3(0, half, 0);
  const right    = new THREE.Vector3(half,  0, 0);
  const bottom = new THREE.Vector3(0, -half, 0);
  const left  = new THREE.Vector3(-half,0, 0);

  const mat = new THREE.LineBasicMaterial({ color });

  const HorizontalLine = new THREE.BufferGeometry().setFromPoints([left, right]);
  const hLine = new THREE.Line(HorizontalLine, mat);

  const VerticalLine = new THREE.BufferGeometry().setFromPoints([top, bottom]);
  const vLine = new THREE.Line(VerticalLine, mat);

  const group = new THREE.Group();
  group.add(vLine, hLine);
  return group;

};


  export function checkLineIntersection(
    start: THREE.Vector3, 
    end: THREE.Vector3,
    lines:LocationLines
  ): 
    {
      line: THREE.Line,
      type:'via'|'vane'|'cantilever'|'via_ticks'
    }[] 
    {

    const intersectingVias: {
      line: THREE.Line,
      type:'via'|'vane'|'cantilever'|'via_ticks'
    }[] = [];
    
    for (const item of lines.current) {
      if (item.type === 'via' && doLinesIntersect(start, end, item.line.userData.start, item.line.userData.end)) {
        if (!intersectingVias.some(via => via.userData.external_id === item.line.userData.external_id)) {
            intersectingVias.push(item);
          }
          break; // Skip checking other lines in this group
        }
    }
    
    return intersectingVias;
  }

export function getDirectionVector(from: {x:number, y:number, z:number}, to: {x:number, y:number, z:number}): Vector3 {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dz = to.z - from.z;

    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);

    if (length === 0) throw new Error("Points are the same; direction is undefined.");

    return {
      x: dx / length,
      y: dy / length,
      z: dz / length
    };
  }

  export function getPointFromDirection(origin: {x:number, y:number, z:number}, direction: Vector3, magnitude: number): Vector3 {
    return {
      x: origin.x + direction.x * magnitude,
      y: origin.y + direction.y * magnitude,
      z: origin.z + direction.z * magnitude
    };
  }

  export function subtractVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}): Vector3 {
    return {
      x: a.x - b.x, 
      y: a.y - b.y, 
      z: a.z - b.z
    };
  }

  export function addVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}){
    return {
      x: a.x + b.x, 
      y: a.y + b.y, 
      z: a.z + b.z
    }
  }

  export function scaleVector(v: Vector3, s: number){
    return {
      x: v.x*s, y: v.y*s, z: v.z*s
    }
  }

  export function dotVectors(a: Vector3, b: Vector3){
    return a.x*b.x + a.y*b.y + a.z*b.z;
  }

  export function crossVectors(a: Vector3, b: Vector3){
    return {
      x: a.y*b.z - a.z*b.y,
      y: a.z*b.x - a.x*b.z,
      z: a.x*b.y - a.y*b.x
    }
  }

  export function lengthVector(v: Vector3){
    return Math.sqrt(dotVectors(v,v))

  }

  export function normalizeVector(v: Vector3){
    const len = lengthVector(v);
    if (len === 0) throw new Error("Zero vector");
    return scaleVector(v, 1/len);

  }

  export function invertVectorDirection(v: Vector3): Vector3 {
    return {
      x: -v.x,
      y: -v.y,
      z: -v.z,
      };
  }
