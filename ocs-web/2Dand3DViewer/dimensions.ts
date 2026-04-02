
  import * as THREE from 'three';
  import { getClosestViaPerpendicularPoint} from './cursor';
  import { handleCameraWorldCoordinates} from './helper';

  export function generateDimensionsInputs() {
      const dimensionInput = document.createElement('input');
      dimensionInput.type = 'text';
      dimensionInput.id = 'dimension-input';
      dimensionInput.classList.add('dimension-input');
      dimensionInput.style.display ='none';
      document.body.appendChild(dimensionInput);

      const dimensionInputAngle = document.createElement('input');
      dimensionInputAngle.type = 'text';
      dimensionInputAngle.id = 'dimension-input-angle';
      dimensionInputAngle.classList.add('dimension-input');
      dimensionInputAngle.style.display = 'none';
      document.body.appendChild(dimensionInputAngle);

      const dimensionInputPk = document.createElement('input');
      dimensionInputPk.type = 'text';
      dimensionInputPk.id = 'dimension-input-pk';
      dimensionInputPk.classList.add('dimension-input');
      dimensionInputPk.style.display = 'none';
      document.body.appendChild(dimensionInputPk);

      return { dimensionInput, dimensionInputAngle, dimensionInputPk}
  }

  export function createDimensionElements(
    dimensionGroup: THREE.Group,
    scene: THREE.Scene,
    color: number
  ): void {

    const material = new THREE.LineBasicMaterial({ color });

    // always create these three
    const extLine1              = new THREE.Line(new THREE.BufferGeometry(), material);
    const extLine2              = new THREE.Line(new THREE.BufferGeometry(), material);
    const dimLine               = new THREE.Line(new THREE.BufferGeometry(), material);
    const angleHorizontalLine   = new THREE.Line(new THREE.BufferGeometry(), material);
    const arcLine               = new THREE.Line(new THREE.BufferGeometry(), material);
    dimensionGroup.add(extLine1, extLine2, dimLine, angleHorizontalLine, arcLine);
    dimensionGroup.visible = false;

    scene.add(dimensionGroup);
  }

  export function updateDimensionElementsForLines(
    dimensionGroup: THREE.Group,
    firstPoint: {current: { point: THREE.Vector3 | undefined , selectedItem: THREE.Mesh| undefined } }, 
    cursorGroup: THREE.Group,
    scene:THREE.scene,
    camera:THREE.Camera|undefined, 
    container:HTMLElement,
    dimensionInput: HTMLInputElement,
    dimensionInputAngle: HTMLInputElement,
    dimensionInputPk: HTMLInputElement,
    color:number
  ):void {

    if (!firstPoint || !firstPoint.current ||!firstPoint.current.point || !cursorGroup || !cursorGroup.position || !camera || !container) return;

    const start = firstPoint.current.point.clone();
    const end = cursorGroup.position.clone();

    if(start.equals(end)){
      return
    }

    const V = end.clone().sub(start);
    const P = new THREE.Vector3(-V.y, V.x, 0).normalize();
    const D = 0.1 * V.length();

    // Positions for extension lines and dimension line
    const extStart1 = start.clone().add(P.clone().multiplyScalar(D*0.2));
    const extEnd1 = start.clone().add(P.clone().multiplyScalar(D)); // Clone P to avoid modifying it
    const extStart2 = end.clone().add(P.clone().multiplyScalar(D*0.2));
    const extEnd2 = end.clone().add(P.clone().multiplyScalar(D)); // Clone P again
    const dimStart = start.clone().add(P.clone().multiplyScalar(D*0.8));
    const dimEnd = end.clone().add(P.clone().multiplyScalar(D*0.8));

    const angleHorizontalStart = start.clone();
    const DistanceHorizontal = start.distanceTo(end)*0.5;
    const angleHorizontalEnd = start.clone().add(new THREE.Vector3(1,0,0).clone().multiplyScalar(DistanceHorizontal));

    // Arc-specific calculations
    const angleArcStart = start.clone().add(new THREE.Vector3(1, 0, 0).clone().multiplyScalar(DistanceHorizontal * 0.5));
    const radius = angleHorizontalStart.distanceTo(angleArcStart); // Radius of the arc
    const center = angleHorizontalStart.clone(); // Center of the arc

    // Calculate the angle between start-end and start-angleHorizontalEnd
    const V2 = end.clone().sub(start); // Vector from start to end
    const V1 = angleHorizontalEnd.clone().sub(start); // Vector from start to angleHorizontalEnd
    const dotProduct = V1.dot(V2);
    const magV1 = V1.length();
    const magV2 = V2.length();
    const cosTheta = dotProduct / (magV1 * magV2);
    let angleRadians = Math.acos(Math.max(-1, Math.min(1, cosTheta))); // Clamp to avoid NaN

    // Determine the direction (clockwise or counterclockwise) using the cross product
    const crossProduct = V1.x * V2.y - V1.y * V2.x; // 2D cross product (z-component)
    if (crossProduct < 0) {
        angleRadians = -angleRadians; // Adjust for clockwise direction if needed
    }

    // Define the start and end angles for the arc
    const startAngle = 0; // Starting along the x-axis (angleArcStart direction)
    const endAngle = angleRadians; // End angle based on the calculated angle

    // Generate arc points
    const curve = new THREE.ArcCurve(
        center.x, center.y, // Center of the arc
        radius,             // Radius
        startAngle,         // Start angle
        endAngle,           // End angle
        crossProduct < 0    // Clockwise if cross product is negative
    );
    const points = curve.getPoints(32); // 32 points for smooth arc
    const arcGeometry = new THREE.BufferGeometry().setFromPoints(points);

    (dimensionGroup.children[0] as THREE.Line).geometry.setFromPoints([extStart1.clone(), extEnd1.clone()]);
    (dimensionGroup.children[1] as THREE.Line).geometry.setFromPoints([extStart2.clone(), extEnd2.clone()]);
    (dimensionGroup.children[2] as THREE.Line).geometry.setFromPoints([dimStart.clone(), dimEnd.clone()]);
    (dimensionGroup.children[3] as THREE.Line).geometry.setFromPoints([angleHorizontalStart.clone(), angleHorizontalEnd.clone()]);
    (dimensionGroup.children[4] as THREE.Line).geometry.copy(arcGeometry);

    dimensionGroup.visible = true;

    // Calculate the midpoint angle
    const midAngle = (startAngle + endAngle) / 2;

    // Calculate the midpoint position on the arc
    const arcMidpoint = new THREE.Vector3(
      center.x + radius * Math.cos(midAngle),
      center.y + radius * Math.sin(midAngle),
      center.z // Assuming z remains the same (0 in this case)
    );

    const rect = container.getBoundingClientRect();

    const midpointArc = arcMidpoint.clone();
    const vectorArc = midpointArc.clone().project(camera);
    const screenXArc = ((vectorArc.x + 1) / 2) * rect.width + rect.left;
    const screenYArc = ((-vectorArc.y + 1) / 2) * rect.height + rect.top;

    dimensionInputAngle.style.left = `${screenXArc}px`;
    dimensionInputAngle.style.top = `${screenYArc}px`;
    dimensionInputAngle.value = (Math.abs(endAngle)* 180 / Math.PI).toFixed(2);

    dimensionInputAngle.style.display = 'block';


    const midpoint = start.clone().add(end).multiplyScalar(0.5).add(P.clone().multiplyScalar(D)); // Clone P here too
    const vector = midpoint.clone().project(camera);
    const screenX = ((vector.x + 1) / 2) * rect.width + rect.left;
    const screenY = ((-vector.y + 1) / 2) * rect.height + rect.top;

    dimensionInput.style.left = `${screenX}px`;
    dimensionInput.style.top = `${screenY}px`;
    dimensionInput.value = V.length().toFixed(2);
    //this.dimensionInput.style.transformOrigin = 'center';
    dimensionInput.style.transform = `translate(${-dimensionInput.offsetWidth/2 }px, -${dimensionInput.offsetHeight/2}px)`;
    
    //this.dimensionInput.style.transform = `rotate(-${angleDegrees}deg)`;
    dimensionInput.style.display = 'block';

    dimensionInputPk.style.display = 'none';

  }


export function updateDimensionElementsForPoles(
  dimensionGroup: THREE.Group,
  mouseEvent: MouseEvent | null,
  scene: THREE.Scene,
  camera: THREE.Camera | undefined,
  container: HTMLElement,
  dimensionInput: HTMLInputElement,
  dimensionInputPk:HTMLInputElement,
  dimensionInputAngle:HTMLInputElement,
  color: number,
  lines: LocationLines,
  grid: number,
  options:LocationViewerOptions,
  previewCircleRef:{ current: THREE.Mesh | undefined }
): void {
  if (!camera || !container || !previewCircleRef.current) return;

  const snapThreshold = 5000; // Adjust threshold as needed


  let start =   new THREE.Vector3(0, 0, 0);
  let end   =   new THREE.Vector3(0, 0, 0);
  let currentPk:number = 0;


  if(mouseEvent){

      const worldCoords = handleCameraWorldCoordinates(camera, container, mouseEvent);

      if(!worldCoords) return;

      const { worldX, worldY } = worldCoords;

      end = new THREE.Vector3(worldX, worldY, 0);

      const { closestPoint , closestLine }= getClosestViaPerpendicularPoint(end, lines, snapThreshold, ['via']);

      if(closestLine && closestPoint){

        const distanceToPoint = (closestLine.userData.start).distanceTo(closestPoint);

        currentPk = closestLine.userData.pk + distanceToPoint;

        start = closestPoint;

        if (previewCircleRef.current) {

          previewCircleRef.current.userData.line_point = start;
          previewCircleRef.current.userData.line_name = closestLine.name;
          previewCircleRef.current.userData.via_id = closestLine.userData.via_id;
          previewCircleRef.current.userData.pk = currentPk;
          
        }
      }



  }else{

      if(dimensionInput.value && dimensionInputPk.value){

        //start = calculatePkPosition(dimensionInput.value, dimensionInputPk.value,lines, snapThreshold, options);

      }

      end = fixedValues;

  }



  if (!start || start.lengthSq() === 0) {

    // No valid snap point found
    dimensionInput.style.display = 'none';
    return;
  }

  if (start.equals(end)) {
    // No distance to draw
    dimensionInput.style.display = 'none';
    return;
  }

  // Direction and offset
  const V = end.clone().sub(start);
  const P = new THREE.Vector3(-V.y, V.x, 0).normalize();
  const D = 0.1 * V.length();

  // Extension and dimension line positions
  const dimStart  = start.clone();
  const dimEnd    = end.clone();

  // Update geometries
  (dimensionGroup.children[2] as THREE.Line).geometry.setFromPoints([dimStart, dimEnd]);

  dimensionGroup.visible = true;

  const rect = container.getBoundingClientRect();

  // Position and update input label
  const midpoint = start.clone().add(end).multiplyScalar(0.5).add(P.clone().multiplyScalar(D));
  const projected = midpoint.clone().project(camera);
  const screenX = ((projected.x + 1) / 2) * rect.width + rect.left;
  const screenY = ((-projected.y + 1) / 2) * rect.height + rect.top;

  dimensionInput.style.left = `${screenX}px`;
  dimensionInput.style.top = `${screenY}px`;
  dimensionInput.value = "PV: "+ V.length().toFixed(2);
  dimensionInput.style.transform = `translate(${-dimensionInput.offsetWidth}px, -${dimensionInput.offsetHeight/2}px)`;
  dimensionInput.style.display = 'block';


  dimensionInputPk.style.left = `${screenX}px`;
  dimensionInputPk.style.top = `${screenY}px`;
  dimensionInputPk.value = "PK: " + (currentPk/1000000).toFixed(4);
  dimensionInputPk.style.transform = `translate(${-dimensionInputPk.offsetWidth*2 - 5}px, -${dimensionInputPk.offsetHeight/2}px)`;
  dimensionInputPk.style.display = 'block';
  dimensionInputAngle.style.display = 'none';
}
