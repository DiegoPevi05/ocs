import * as THREE from 'three';
import { handleCameraWorldCoordinates, objToVec3 } from './helper';

export function toogleViewCursor(
  cursorGroup:THREE.Group|undefined, 
  container:HTMLElement, 
  coordinatesElement:{current:HTMLSpanElement|undefined}, 
  event:MouseEvent
):void{
  if(!cursorGroup || !container || !coordinatesElement.current) return;
  const rect = container.getBoundingClientRect();
    
  if (coordinatesElement.current) {
      const biggerThanLimitX = event.clientX > rect.right;
      const smallerThanLimitX = event.clientX < rect.left;
      const biggerThanLimitY = event.clientY > rect.bottom;
      const smallerThanLimitY = event.clientY < rect.top;
      
      if(biggerThanLimitX || smallerThanLimitX || biggerThanLimitY || smallerThanLimitY){
        cursorGroup.visible = false;
        coordinatesElement.current.style.display = 'none';
        document.body.style.cursor = 'default';
      }else{
        cursorGroup.visible = true;
        coordinatesElement.current.style.display = 'block';
        document.body.style.cursor = 'none';
      }
  }
}

export function createCursorCoordinates(container:HTMLElement):HTMLSpanElement {
    const coordinatesContainer = document.createElement('span');
    coordinatesContainer.classList.add('cursor-coordinates-container');

    const xCoordinateContainer = document.createElement('span');
    xCoordinateContainer.classList.add('cursor-coordinates');

    const xCoordinateLabel = document.createElement('label');
    xCoordinateLabel.textContent = 'x:';
    xCoordinateLabel.classList.add('cursor-coordinates-label');
    xCoordinateContainer.appendChild(xCoordinateLabel);

    const xCoordinate = document.createElement('input');
    xCoordinate.id = 'cursor-x-coordinate';
    xCoordinate.type = 'text';
    xCoordinate.value = '0';
    xCoordinate.readOnly = true;
    xCoordinate.classList.add('cursor-coordinates-input');
    xCoordinateContainer.appendChild(xCoordinate);


    const yCoordinateContainer = document.createElement('span');
    yCoordinateContainer.classList.add('cursor-coordinates');

    const yCoordinateLabel = document.createElement('label');
    yCoordinateLabel.textContent = 'y:';
    yCoordinateLabel.classList.add('cursor-coordinates-label');
    yCoordinateContainer.appendChild(yCoordinateLabel);

    const yCoordinate = document.createElement('input');
    yCoordinate.id = 'cursor-y-coordinate';
    yCoordinate.type = 'text';
    yCoordinate.value = '0';
    yCoordinate.readOnly = true;
    yCoordinate.classList.add('cursor-coordinates-input');
    yCoordinateContainer.appendChild(yCoordinate);


    coordinatesContainer.appendChild(xCoordinateContainer);
    coordinatesContainer.appendChild(yCoordinateContainer);

    container.appendChild(coordinatesContainer);

    return coordinatesContainer;
}


export function addCursor(container:HTMLElement, scene:THREE.Scene):THREE.Group|undefined {
    if (!container) return;

    const lineSize = 3000;
    const squareSize = lineSize/10;

    const cursorGroup = new THREE.Group();

    const linesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });

    const horizontalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-lineSize, 0, 0),
      new THREE.Vector3(lineSize, 0, 0)
    ]);
    const horizontalLine = new THREE.Line(horizontalGeometry, linesMaterial);
    horizontalLine.name = 'horizontal-line';

    const verticalGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, -lineSize, 0),
      new THREE.Vector3(0, lineSize, 0)
    ]);
    const verticalLine = new THREE.Line(verticalGeometry, linesMaterial);
    verticalLine.name = 'vertical-line';
    
    const squareGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-squareSize, -squareSize, 0),
      new THREE.Vector3(squareSize, -squareSize, 0),
      new THREE.Vector3(squareSize, squareSize, 0),
      new THREE.Vector3(-squareSize, squareSize, 0),
      new THREE.Vector3(-squareSize, -squareSize, 0)
    ]);
    const square = new THREE.Line(squareGeometry, linesMaterial);
    square.name = 'square';

    const snapCircle = createSnapCircle({ spacing: lineSize});
    snapCircle.name = 'snap-circle';
    snapCircle.visible = false;
    
    cursorGroup.add(horizontalLine);
    cursorGroup.add(verticalLine);
    cursorGroup.add(square);
    cursorGroup.add(snapCircle);
    
    cursorGroup.visible = true;
    scene.add(cursorGroup);

    return cursorGroup;
  }

  export function updateCursor(cursorGroup: THREE.Group | undefined, cameraZoom: number): void {
    if (!cursorGroup || cameraZoom <= 0) return; // Guard against invalid inputs

    // Base sizes from the original addCursor setup
    const baseLineSize = 3000;
    const baseSquareSize = baseLineSize/10;
    const baseSpacing = baseLineSize;

    // Calculate new sizes based on camera zoom
    const newLineSize = baseLineSize / cameraZoom;
    const newSquareSize = baseSquareSize / cameraZoom;
    const newSnapRadius = (baseSpacing*0.15) / cameraZoom;

    // Retrieve objects by name
    const horizontalLine = cursorGroup.getObjectByName('horizontal-line') as THREE.Line;
    const verticalLine = cursorGroup.getObjectByName('vertical-line') as THREE.Line;
    const square = cursorGroup.getObjectByName('square') as THREE.Line;
    const snapCircle = cursorGroup.getObjectByName('snap-circle') as THREE.Line;

    // Update horizontal line geometry
    if (horizontalLine && horizontalLine.geometry) {
        const positions = horizontalLine.geometry.attributes.position.array as Float32Array;
        positions[0] = -newLineSize; // x1
        positions[1] = 0;           // y1
        positions[2] = 0;           // z1
        positions[3] = newLineSize; // x2
        positions[4] = 0;           // y2
        positions[5] = 0;           // z2
        horizontalLine.geometry.attributes.position.needsUpdate = true; // Flag for update
    }

    // Update vertical line geometry
    if (verticalLine && verticalLine.geometry) {
        const positions = verticalLine.geometry.attributes.position.array as Float32Array;
        positions[0] = 0;           // x1
        positions[1] = -newLineSize; // y1
        positions[2] = 0;           // z1
        positions[3] = 0;           // x2
        positions[4] = newLineSize; // y2
        positions[5] = 0;           // z2
        verticalLine.geometry.attributes.position.needsUpdate = true; // Flag for update
    }

    // Update square geometry
    if (square && square.geometry) {
        const positions = square.geometry.attributes.position.array as Float32Array;
        positions[0] = -newSquareSize; // x1
        positions[1] = -newSquareSize; // y1
        positions[2] = 0;             // z1
        positions[3] = newSquareSize;  // x2
        positions[4] = -newSquareSize; // y2
        positions[5] = 0;             // z2
        positions[6] = newSquareSize;  // x3
        positions[7] = newSquareSize;  // y3
        positions[8] = 0;             // z3
        positions[9] = -newSquareSize; // x4
        positions[10] = newSquareSize; // y4
        positions[11] = 0;            // z4
        positions[12] = -newSquareSize; // x5 (close loop)
        positions[13] = -newSquareSize; // y5
        positions[14] = 0;             // z5
        square.geometry.attributes.position.needsUpdate = true; // Flag for update
    }

    // Update snap circle geometry
    if (snapCircle && snapCircle.geometry) {
      const positions = snapCircle.geometry.attributes.position.array as Float32Array;
      const segments = 32; // Match createSnapCircle

      for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          positions[i * 3] = newSnapRadius * Math.cos(theta);     // x
          positions[i * 3 + 1] = newSnapRadius * Math.sin(theta); // y
          positions[i * 3 + 2] = 0;                               // z
      }
      snapCircle.geometry.attributes.position.needsUpdate = true; // Flag for update
  }
}

export function getClosestViaPerpendicularPoint(
  refPoint: THREE.Vector3 | undefined,
  lines: LocationLines,
  threshold: number,
  snapObjects: ('via' | 'cantilever' | 'vane')[] = ['via']
): { closestPoint: THREE.Vector3 | null, closestLine:THREE.Line | null } {
  if (!refPoint) return null;

  let closestPoint: THREE.Vector3 | null = null;
  let closestLine: THREE.Line | null = null;
  let minDistance = threshold;

  lines.current.forEach(item => {

    if(item.type === 'cantilever') return ;

    if (!snapObjects.includes(item.type)) return;

    const start = item.line.userData.start;
    const end = item.line.userData.end;

    const lineVector = end.clone().sub(start);
    const refVector = refPoint.clone().sub(start);

    const lineLengthSq = lineVector.lengthSq();
    if (lineLengthSq === 0) return; // Avoid division by zero if start == end

    // Projection scalar from refPoint onto line
    const t = Math.max(0, Math.min(1, refVector.dot(lineVector) / lineLengthSq));

    // Projected point on the line segment
    const projectedPoint = start.clone().add(lineVector.clone().multiplyScalar(t));

    const distance = refPoint.distanceTo(projectedPoint); // Distance from refPoint to projection


    if (distance < minDistance) {
      minDistance = distance;
      closestPoint = projectedPoint;
      closestLine = item.line;

    }
  });

  return { closestPoint, closestLine } ;
}

export function getClosestPerpendicularProjection(
  refPoint: THREE.Vector3,
  point: THREE.Vector3,
  lines: LocationLines,
  threshold: number,
  snapObjects: ('via' | 'cantilever' | 'vane')[] = ['via']
): { closestPoint: THREE.Vector3 | null; closestLine: THREE.Line | null } {
  let closestPoint: THREE.Vector3 | null = null;
  let closestLine: THREE.Line | null = null;
  let minDistance = threshold;

  if(point.distanceTo(refPoint) === 0) return;

  lines.current.forEach(item => {
    if (!snapObjects.includes(item.type)) return;

    const start = item.line.userData.start as THREE.Vector3;
    const end = item.line.userData.end as THREE.Vector3;

    const lineVec = end.clone().sub(start);
    const refVec = refPoint.clone().sub(start);

    const lineLengthSq = lineVec.lengthSq();
    if (lineLengthSq === 0) return; // skip zero-length lines

    // Scalar projection of refVec onto the line vector
    const t = Math.max(0, Math.min(1, refVec.dot(lineVec) / lineLengthSq));
    const projection = start.clone().add(lineVec.multiplyScalar(t));

    // Now check if the current mouse `point` is near this projection
    const mouseToProjectionDist = point.distanceTo(projection);

    if (mouseToProjectionDist < minDistance) {
      minDistance = mouseToProjectionDist;
      closestPoint = projection;
      closestLine = item.line;
    }
  });

  return { closestPoint, closestLine };
}

function getClosestPoint(
  point: THREE.Vector3,
  firstPoint: { point: THREE.Vector3 | undefined , selectedItem: THREE.Mesh| undefined }, 
  circles: { current: {circle: THREE.Group, type: 'pole'}[] }, 
  lines: LocationLines, 
  threshold: number,
  options: LocationViewerOptions
): { closestPoint: THREE.Vector3 | null; closestItem: THREE.Line | THREE.Group | null } {
    
  let closestPoint = null;
  let closestItem  = null;
  let minDistance = threshold;

  circles.current.forEach(item => {
      const distance = point.distanceTo(item.circle.position);
      if (distance < minDistance) {
          minDistance = distance;
          closestPoint = item.circle.position;
          closestItem  = item.circle;
      }
  });


  if(options.draw.via){
    lines.current.forEach(item => {
      if(item.type === 'cantilever') return ;
      const start = item.line.userData.start;
      const end = item.line.userData.end;

      const distanceToStart = point.distanceTo(start);
      const distanceToEnd = point.distanceTo(end);

      if (distanceToStart < minDistance) {
        minDistance = distanceToStart;
        closestPoint = start;
        closestItem = item.line;
      }
      if (distanceToEnd < minDistance) {
        minDistance = distanceToEnd;
        closestPoint = end;
        closestItem = item.line;
      }
    });
  }


  if(options.draw.cantilever && firstPoint.point){
    const calculatedPoint =  getClosestPerpendicularProjection(firstPoint.point,point, lines,4000,['via']);
    closestPoint = calculatedPoint.closestPoint; 
    closestItem  = calculatedPoint.closestLine

  }


  if(options.draw.via){
    // Check lines including points along the line segments
    lines.current.forEach(item => {

      if(item.type === 'cantilever') return ;

      const start = item.line.userData.start;
      const end = item.line.userData.end;
      
      // Calculate the closest point on the line segment
      const lineVector = end.clone().sub(start);
      const pointVector = point.clone().sub(start);
      
      // Calculate the projection of pointVector onto lineVector
      const lineLengthSq = lineVector.lengthSq();
      const t = Math.max(0, Math.min(1, pointVector.dot(lineVector) / lineLengthSq));
      
      // Only consider points that are at least 'threshold' distance from start and end
      if (t > threshold/lineVector.length() && t < 1 - threshold/lineVector.length()) {
          // Get the actual closest point on the line segment
          const closestPointOnLine = start.clone().add(lineVector.multiplyScalar(t));
          
          const distance = point.distanceTo(closestPointOnLine);
          if (distance < minDistance) {
              minDistance   = distance;
              closestPoint  = closestPointOnLine;
              closestItem   = item.line;
          }
      }
    });
  }


    if(options.draw.vane){

      lines.current.forEach(item => {

        if(item.type !== 'cantilever') return ;

        const cantileverGroup = item.line;
        
        cantileverGroup.children.forEach((child) => {
          if (child instanceof THREE.Line && child.userData.type === 'cantilever') {
            const end: THREE.Vector3 = objToVec3(child.userData.wEnd);

            const distance = point.distanceTo(end);

            if (distance < minDistance) {

                minDistance   = distance;
                closestPoint  = end;
                closestItem   = child;
            }
          }
        })

      });
    }
   

  return { closestPoint, closestItem};
}

 
  export function updatePositionCursor(
    event:MouseEvent, 
    container:HTMLElement|undefined, 
    camera:THREE.Camera|undefined, 
    cursorGroup:THREE.Group|undefined,
    grid:{ spacing: number },
    circles: { current: {position: THREE.Vector3, type: 'pole'}[] },
    lines: LocationLines,
    options: LocationViewerOptions,
    firstPoint: { point: THREE.Vector3 | undefined , selectedItem: THREE.Mesh| undefined }, 
  ):void{
    if(!container || !camera || !cursorGroup) return;
      const worldCoords = handleCameraWorldCoordinates(camera, container, event);
      if(!worldCoords) return;

      const { worldX, worldY } = worldCoords;
      const currentPoint = new THREE.Vector3(worldX, worldY, 0);

      // Check for snapping to existing objects first
      const snapCircle = cursorGroup.getObjectByName('snap-circle');
      const snapThreshold = grid.spacing * 0.2; // Adjust threshold as needed

      if(options.snap_object){
        const {closestPoint, closestItem } = getClosestPoint(currentPoint, firstPoint, circles, lines, snapThreshold, options);
        if (closestPoint) {
            // Snap to existing object
            if(snapCircle) snapCircle.visible = true;
            cursorGroup.position.copy(closestPoint);
            cursorGroup.userData.closestItem  = closestItem;

            return;
        }
      }

      if(options.snap_grid && !options.draw.cantilever && !options.draw.vane){
        const snappedPos = getSnappedIntersection(worldX, worldY, { spacing: grid.spacing });
        if (snappedPos) {
          if(snapCircle) snapCircle.visible = true;
          cursorGroup.position.set(snappedPos.x, snappedPos.y, 0);
          return;
        }
      }

      if(snapCircle) snapCircle.visible = false;
      cursorGroup.position.set(worldX, worldY, 0);
    
  }

  export function updateCursorCoordinates(
    event:MouseEvent, 
    container:HTMLElement|undefined, 
    coordinatesElement:HTMLSpanElement|undefined, 
    cursorGroup: THREE.Group | undefined
  ): void 
  {
    if(!container || !coordinatesElement || !cursorGroup) return;

    const rect = container.getBoundingClientRect();
        
    // Update HTML element position and content
    if(event.clientX < rect.left + rect.width * 0.8){
      coordinatesElement.style.left = `${event.clientX - rect.left + 20}px`;
    }else{
      const width = coordinatesElement.offsetWidth;
      coordinatesElement.style.left = `${event.clientX - rect.left - width - 20}px`;
    }

    if(event.clientY < rect.top + rect.height * 0.8){
      coordinatesElement.style.top = `${event.clientY - rect.top + 20}px`;
    }else{
      const height = coordinatesElement.offsetHeight;
      coordinatesElement.style.top = `${event.clientY - rect.top - height - 20}px`;
    }

    (coordinatesElement.querySelector('#cursor-x-coordinate')! as HTMLInputElement).value = `${Math.round(cursorGroup.position.x)}`;
    (coordinatesElement.querySelector('#cursor-y-coordinate')! as HTMLInputElement).value = `${Math.round(cursorGroup.position.y)}`;

  }

  export function createSnapCircle(grid: { spacing: number }): THREE.Line {
      // Create points for circle outline
      const points = [];
      const segments = 32;
      const radius = grid.spacing * 0.15;
      
      for (let i = 0; i <= segments; i++) {
          const theta = (i / segments) * Math.PI * 2;
          points.push(new THREE.Vector3(
              radius * Math.cos(theta),
              radius * Math.sin(theta),
              0
          ));
      }
      
      const outlineGeometry = new THREE.BufferGeometry().setFromPoints(points);
      const circleMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
      
      return new THREE.Line(outlineGeometry, circleMaterial);
  }

 
  function getSnappedIntersection(worldX: number, worldY: number, grid: { spacing: number }): { x: number, y: number } | null {
    // Check if grid or grid.spacing is unavailable
    if (!grid || !grid.spacing || grid.spacing <= 0) return null;

    // Find the nearest grid intersection
    const m = Math.round(worldX / grid.spacing); // Nearest integer for x
    const n = Math.round(worldY / grid.spacing); // Nearest integer for y
    const gridX = m * grid.spacing;              // x-coordinate of the intersection
    const gridY = n * grid.spacing;              // y-coordinate of the intersection

    // Calculate the Euclidean distance to the intersection
    const dx = worldX - gridX;
    const dy = worldY - gridY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Define the snapping threshold (5% of grid spacing)
    const threshold = 0.20 * grid.spacing;

    // Return the intersection position if within threshold, else null
    if (distance < threshold) {
        return { x: gridX, y: gridY };
    } else {
        return null;
    }
}

export function setupInputs(
  firstPoint: {current: { point: THREE.Vector3 | undefined , selectedItem: THREE.Mesh| undefined }}, 
  drawOptions: { vane: boolean; via: boolean; cantilever: boolean },
  updateCursorPosition: (x: number, y: number) => void,
  updateDimensionElements: () => void,
): void {
  const xCoordInput = document.getElementById(
    'cursor-x-coordinate'
  ) as HTMLInputElement;
  const yCoordInput = document.getElementById(
    'cursor-y-coordinate'
  ) as HTMLInputElement;
  const dimensionInput = document.getElementById(
    'dimension-input'
  ) as HTMLInputElement;
  const dimensionInputAngle = document.getElementById(
    'dimension-input-angle'
  ) as HTMLInputElement;

  if (!xCoordInput || !yCoordInput) return;

  const drawMode = drawOptions.vane || drawOptions.via || drawOptions.cantilever;
  const inputs: HTMLInputElement[] = drawMode
    ? [xCoordInput, yCoordInput, dimensionInput, dimensionInputAngle].filter(
        Boolean
      ) as HTMLInputElement[]
    : [xCoordInput, yCoordInput];

  const calculateNewPosition = (): { newX: number; newY: number } | undefined => {
    if (!firstPoint.current.point || !dimensionInput || !dimensionInputAngle) return;
    const length = parseFloat(dimensionInput.value) || 0;
    const angle = parseFloat(dimensionInputAngle.value) || 0;
    const rad = (angle * Math.PI) / 180;
    return {
      newX: firstPoint.current.point.x + length * Math.cos(rad),
      newY: firstPoint.current.point.y + length * Math.sin(rad),
    };
  };

  inputs.forEach((input, index) => {
    // overwrite any previous handler
    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (input === yCoordInput) {
          updateCursorPosition(
            parseFloat(xCoordInput.value),
            parseFloat(yCoordInput.value)
          );
          updateDimensionElements();
        } else if (
          input === dimensionInput ||
          input === dimensionInputAngle
        ) {
          const np = calculateNewPosition();
          if (np) {
            updateCursorPosition(np.newX, np.newY);
            updateDimensionElements();
          }
        }

        input.blur();
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        input.blur();
        const next = inputs[(index + 1) % inputs.length];
        next.focus();
      }
      if (e.key === 'Escape') {
        input.blur();
      }
    };

    // also overwrite focus/blur
    input.onfocus = () => {
      input.readOnly = false;
    };
    input.onblur = () => {
      input.readOnly = true;
    };
  });
}

export function updateCoordinatesDisplay(
  x: number, 
  y: number, 
  cursorGroup: THREE.Group,
  camera: THREE.Camera,
  container: HTMLElement,
  coordinatesElement: HTMLElement,
  options: { draw: { pole: boolean, vane: boolean, via: boolean } },
  previewRefs: { 
      circleRef: { current?: THREE.Mesh }, 
      lineRef: { current?: THREE.Line } 
  }
): void {
  cursorGroup.position.set(x, y, 0);
  
  if (previewRefs.circleRef.current && options.draw.pole) {
      previewRefs.circleRef.current.position.copy(cursorGroup.position);
      previewRefs.circleRef.current.userData.end  = new THREE.Vector3(cursorGroup.position.x, cursorGroup.position.y, cursorGroup.position.z);
  }

  if (previewRefs.lineRef.current && (options.draw.vane || options.draw.via)) {
      // Extract start and end from preview line userData
      const start = previewRefs.lineRef.current!.userData.start;
      const end   = new THREE.Vector3(x,y,0);

      // Create geometry from start and end points
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(start.x, start.y, start.z),
        new THREE.Vector3(end.x, end.y, end.z),
      ]);
      previewRefs.lineRef.current.geometry = geometry;
      previewRefs.lineRef.current.userData.end  =  new THREE.Vector3(cursorGroup.position.x, cursorGroup.position.y, cursorGroup.position.z);
  }

  const vector = new THREE.Vector3(x, y, 0).project(camera);
  const rect = container.getBoundingClientRect();
  
  const screenX = ((vector.x + 1) / 2) * rect.width + rect.left;
  const screenY = ((-vector.y + 1) / 2) * rect.height + rect.top;

  coordinatesElement.style.left = `${screenX + 10}px`;
  coordinatesElement.style.top = `${screenY + 10}px`;

  const xInput = document.getElementById('cursor-x-coordinate') as HTMLInputElement;
  const yInput = document.getElementById('cursor-y-coordinate') as HTMLInputElement;
  
  if (xInput && yInput) {
      xInput.value = x.toFixed(0);
      yInput.value = y.toFixed(0);
  }
}
