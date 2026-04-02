import * as THREE from 'three';
import { handleViaCreation } from './via';
import { handlePoleCreation } from './pole';
import { handleCantileverCreation } from './cantilever';
import { handleVaneCreation } from './vane';
import { Font } from 'three-stdlib';
import { generateUniqueId, vec3ToObj, objToVec3 } from './helper';


export function drawPreviewLine(
    start: THREE.Vector3, 
    end: THREE.Vector3, 
    scene:THREE.Scene, 
    previewLineRef: { current: THREE.Line | undefined },
    color:number,
    type:'via'|'vane'|'cantilever'|'via_ticks'
): void {
      const geometry = new THREE.BufferGeometry();
      const material = new THREE.LineBasicMaterial({ color: color });
      const points = [start, end];
      geometry.setFromPoints(points);


      if(start === undefined || end === undefined){
        return;

      }

      if(start.equals(end)){
        return;
      }
      
      // If this is a preview, update or create preview line
      if (previewLineRef.current) {
          (previewLineRef.current.material as THREE.Material).dispose();
          previewLineRef.current.geometry.dispose();
          previewLineRef.current.geometry = geometry;
          previewLineRef.current.userData.start = start;
          previewLineRef.current.userData.end = end;
          previewLineRef.current.userData.type = type;
          previewLineRef.current.userData.color = color;
      } else {
          previewLineRef.current = new THREE.Line(geometry, material);
          previewLineRef.current.userData.start = start;
          previewLineRef.current.userData.end = end;
          previewLineRef.current.userData.type = type;
          previewLineRef.current.userData.color = color;
          scene.add(previewLineRef.current);
      }
  }

  export function updatePreviewLine(
    firstPoint: {current: { point: THREE.Vector3 | undefined , selectedItem: THREE.Mesh| undefined }}, 
    cursorGroup: THREE.Group,
    previewLineRef: { current: THREE.Line | undefined }, 
    scene:THREE.Scene,
    color:number,
    type:'via'|'vane'|'cantilever'|'via_ticks',
    lines: LocationLines,
    event:MouseEvent,
    font:Font|undefined,
    locationData: LocationParams,
    onViaCreated: (via: ViaParams) => void,
    onCantileverCreated: (viaId: number, newCantilever:PoleDataContent) => void,
    onVaneCreated:(newVane:VaneDataContent) => void,
    pkProps:PkProps,
    fontsProps:FontsProps,
    catenaryType:string,
  ): void {
    
    if (!firstPoint.current.point) {
      // First click - set start point
      firstPoint.current.point = new THREE.Vector3(
          cursorGroup.position.x,
          cursorGroup.position.y,
          cursorGroup.position.z
      );
      firstPoint.current.selectedItem   = cursorGroup.userData.closestItem;
    } else {
        // Extract start and end from preview line userData
        const start = previewLineRef.current!.userData.start;
        const end = previewLineRef.current!.userData.end;

        // Create geometry from start and end points
        const geometry = new THREE.BufferGeometry().setFromPoints([start,end,]);

        // Create the final line
        const finalLine = new THREE.Line(
          geometry,
          new THREE.LineBasicMaterial({ color: color })
        );
        finalLine.userData.type = type;
        finalLine.userData.start = previewLineRef.current!.userData.start;
        finalLine.userData.end = previewLineRef.current!.userData.end;
        finalLine.userData.color = previewLineRef.current!.userData.color;
        finalLine.name = generateUniqueId();

        if(type === 'via'){

          handleViaCreation(
            finalLine, 
            lines, 
            scene, 
            { x: event.clientX, y: event.clientY },
            font, 
            locationData,
            onViaCreated,
            pkProps,
            fontsProps,
          );

        }else if(type === 'cantilever'){
          handleCantileverCreation(
            finalLine, 
            lines, 
            scene, 
            { x: event.clientX, y: event.clientY },
            font, 
            locationData,
            onCantileverCreated,
            fontsProps,
            catenaryType,
            firstPoint.current.selectedItem,
            cursorGroup.userData.closestItem
          );
        }else if(type === 'vane'){
          handleVaneCreation(
            finalLine, 
            lines, 
            scene, 
            { x: event.clientX, y: event.clientY },
            font, 
            locationData,
            onVaneCreated,
            fontsProps,
            catenaryType,
            firstPoint.current.selectedItem,
            cursorGroup.userData.closestItem
          );

        }
        
        // Clean up preview
        if (previewLineRef.current) {
            previewLineRef.current.geometry.dispose();
            (previewLineRef.current.material as THREE.Material).dispose();
            scene.remove(previewLineRef.current);
            previewLineRef.current = undefined;
        }
        firstPoint.current.point = undefined;
        firstPoint.current.selectedItem = undefined;
        cursorGroup.userData.closestItem = undefined;
    }
  }

  

  export function generateCircleGeometry(
    radius:number, 
    segments:number, 
    color:number, 
    position:THREE.Vector3,
    type:'pole'
  ):THREE.Mesh{
    const geometry = new THREE.CircleGeometry(radius, segments);
    const material = new THREE.MeshBasicMaterial({ color: color, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const circle = new THREE.Mesh(geometry, material);
    circle.position.copy(position);
    circle.rotation.z = -Math.PI / 2;
    circle.userData.type = type;
    return circle;
  }

 export function drawCircle(vector: THREE.Vector3, scene:THREE.Scene, previewCircleRef: { current: THREE.Mesh | undefined },  camera:THREE.Camera|undefined, radius:number): void {
    if(camera instanceof THREE.OrthographicCamera){
        
        if(previewCircleRef.current){
          previewCircleRef.current.position.copy(vector);

        }else{
          previewCircleRef.current = generateCircleGeometry(radius, 32, 0x00ff00, vector, 'pole');
          //this.previewCircle.material.opacity = 0.5; // Make preview more transparent
          scene.add(previewCircleRef.current);

        }
    }
  }

  export function updatePreviewCircle(
    cursorGroup: THREE.Group,
    previewCircleRef: { current: THREE.Mesh | undefined }, 
    scene:THREE.Scene,
    circles: LocationCircles,
    event:MouseEvent,
    font:Font|undefined,
    locationData: LocationParams,
    onPoleCreated: (viaId: number, newPole:PoleLocationParams) => void,
    fontsProps:FontsProps,
    catenaryType:string,
    isPoleCreating:{ current:boolean}
  ): void {

    if(!previewCircleRef.current) return;

    handlePoleCreation(
      { 
        pk: previewCircleRef.current.userData.pk,
        line_intersection:previewCircleRef.current.userData.line_point,
        line_name:previewCircleRef.current.userData.line_name,
        via_id:previewCircleRef.current.userData.via_id
      },
      circles,
      scene,
      { x: event.clientX, y: event.clientY },
      previewCircleRef.current.position,
      font,
      locationData,
      onPoleCreated,
      fontsProps,
      catenaryType,
      isPoleCreating
    );

    previewCircleRef.current.visible = true; // Ensure preview is visible for next placement
  }
