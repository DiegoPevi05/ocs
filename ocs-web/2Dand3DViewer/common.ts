import * as THREE from 'three';
import { subtractVectors,normalizeVector, addVectors, scaleVector, lengthVector, crossVectors } from "../../../utils/helper";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Add a 3D line between two points in the scene.
 *
 * @param external_id - The name to assign to the line (for future reference or cleanup)
 * @param start - The starting point of the line
 * @param end - The ending point of the line
 * @param scene - The THREE.Scene to add the line to
 * @param color - The line color (as a hex number, e.g. 0xff0000)
 */
export function add3DVia(
  external_id: string,
  start: Vector3,
  end: Vector3,
  scene: THREE.Scene,
  color: number
): void {
  // Define geometry from start and end points
  const geometry = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(start.x, start.y, start.z),
    new THREE.Vector3(end.x, end.y, end.z)
  ]);

  // Create a basic line material
  const material = new THREE.LineBasicMaterial({ color });

  // Create the line object
  const line = new THREE.Line(geometry, material);

  // Set the name for later reference
  line.name = external_id;

  // Add it to the scene
  scene.add(line);
}

export function add3DVane(
  vaneDataContent:VaneDataContent,
  scene: THREE.Scene,
  color: number
):void {

  vaneDataContent.links.curves.forEach((item,index) => {

    for(let i = 0; i < (item.curve.length - 1); i++){
      const start = new THREE.Vector3(item.curve[i].x, item.curve[i].y, item.curve[i].z);
      const end = new THREE.Vector3(item.curve[i+1].x, item.curve[i+1].y, item.curve[i+1].z);

      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      direction.normalize();

      // Create the cylinder geometry
      const cylinderGeometry = new THREE.CylinderGeometry(12, 12, length, 24);
      const cylinderMaterial = new THREE.MeshBasicMaterial({ color, wireframe: false });
      const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

      // Position the cylinder at the midpoint
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      cylinder.position.copy(midPoint);

      // Align the cylinder with the direction vector
      const axis = new THREE.Vector3(0, 1, 0); // Default up axis of cylinder
      const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
      cylinder.setRotationFromQuaternion(quaternion);

      // Store custom data in the mesh
      //cylinder.name = link.elementId;
      cylinder.userData.color = color;
      cylinder.userData.type = 'vane_link';
      cylinder.userData.start = start;
      cylinder.userData.end = end;
      cylinder.name = vaneDataContent.vane.id+'_vane_curves_'+index+"_"+i;

      // Add the cylinder to the scene
      scene.add(cylinder);
    }

  })

  vaneDataContent.links.rects.forEach((link,index) => {
    // Create points for the line
    const start = new THREE.Vector3(link.x1, link.y1, link.z1);
    const end = new THREE.Vector3(link.x2, link.y2, link.z2);

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();
    // Create the cylinder geometry
    const cylinderGeometry = new THREE.CylinderGeometry(12, 12, length, 24);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color, wireframe: false });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

    // Position the cylinder at the midpoint
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midPoint);

    // Align the cylinder with the direction vector
    const axis = new THREE.Vector3(0, 1, 0); // Default up axis of cylinder
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
    cylinder.setRotationFromQuaternion(quaternion);

    // Store custom data in the mesh
    //cylinder.name = link.elementId;
    cylinder.userData.color = color;
    cylinder.userData.type = 'vane_link';
    cylinder.userData.start = start;
    cylinder.userData.end = end;
    cylinder.name = vaneDataContent.vane.id+'_vane_rects_'+index;
    //cylinder.userData.id = `${link.elementId}`;

    // Add the cylinder to the scene
    scene.add(cylinder);

  })
}


export function add3DAxisLine(
    external_id:string,
    scene: THREE.Scene,
    polePosition:{ x:number, y:number, z:number },
    pv:{ x:number, y:number, z:number } ,
    via_axis: { x:number, y:number, z:number  }, 
    system_height: number, 
    cw: { x:number, y:number, z:number }, 
    mw: { x:number, y:number, z:number },
    u:number
  ) {

    const diffVector = subtractVectors(via_axis,pv);

    const dirAxis = normalizeVector(diffVector);

    const newAxisVector = addVectors(pv,scaleVector(dirAxis, (lengthVector(diffVector)+500)));

    const pvDir = normalizeVector(subtractVectors({x:pv.x,y:0,z:pv.z},{x:polePosition.x,y:0,z:polePosition.z }))

    /******************************************************************************/
    /*********************************** DESVIATION PV LINE  ***************************/
    /******************************************************************************/

    const vertices = new Float32Array([
        pv.x, pv.y, pv.z,
        newAxisVector.x, newAxisVector.y, newAxisVector.z,
    ]);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    const lineMaterial = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // #fca5a5
        dashSize: 10,     // Size of each dash
        gapSize: 2,    // Gap between dashes
        linewidth: 10,    // Line width
    });

    // Create the line and compute its dash array
    const centerLine = new THREE.Line(lineGeometry, lineMaterial);

    centerLine.computeLineDistances(); // Required for dashed lines to render correctly

    centerLine.userData.type = 'axis';
    centerLine.name = "axis_line_desviation_"+external_id;
    // Add the line to the scene
    scene.add(centerLine);

    /******************************************************************************/
    /*********************************** CENTER PV LINE  ***************************/
    /******************************************************************************/


    const verticesCentered = new Float32Array([
        pv.x, pv.y, pv.z,
        pv.x, newAxisVector.y, pv.z,
    ]);

    const lineGeometryCentered = new THREE.BufferGeometry();
    lineGeometryCentered.setAttribute('position', new THREE.BufferAttribute(verticesCentered, 3));

    const lineMaterialCentered = new THREE.LineDashedMaterial({
        color: 0xfde68a, // #fde68a 
        dashSize: 10,     // Size of each dash
        gapSize: 2,    // Gap between dashes
        linewidth: 10,    // Line width
    });

    // Create the line and compute its dash array
    const centerLineCentered = new THREE.Line(lineGeometryCentered, lineMaterialCentered);
    centerLineCentered.computeLineDistances(); // Required for dashed lines to render correctly

    centerLineCentered.userData.type = 'axis';
    centerLineCentered.name = "axis_line_centered_"+external_id;
    // Add the line to the scene
    scene.add(centerLineCentered);


    /******************************************************************************/
    /***********************************CONTACT PLANE  ***************************/
    /******************************************************************************/

    const EPSILON = 0.0001;

    let perpVector = pvDir;

    const isDirAxisDifferent = (
      Math.abs(dirAxis.x) >= EPSILON ||
      Math.abs(dirAxis.y - 1) >= EPSILON ||
      Math.abs(dirAxis.z) >= EPSILON
    );

    const isCWDifferentFromViaAxis = (
      cw.x !== via_axis.x ||
      cw.y !== via_axis.y ||
      cw.z !== via_axis.z
    );

    if (isDirAxisDifferent && isCWDifferentFromViaAxis) {
      perpVector = normalizeVector(subtractVectors(cw, via_axis));
    }

    const max_zig_zag = 600;

    const startPointContactPlane = subtractVectors(via_axis,scaleVector(perpVector,max_zig_zag))
    const endPointContactPlane   = addVectors(via_axis,scaleVector(perpVector,max_zig_zag))

    const verticesContactPlane = new Float32Array([
      startPointContactPlane.x, startPointContactPlane.y, startPointContactPlane.z,
      endPointContactPlane.x, endPointContactPlane.y, endPointContactPlane.z,
    ]);

    const lineGeometryContactPlane = new THREE.BufferGeometry();
    lineGeometryContactPlane.setAttribute('position', new THREE.BufferAttribute(verticesContactPlane, 3));

    const lineMaterial_contact_plane = new THREE.LineDashedMaterial({
      color: 0xfca5a5, // #fca5a5
      dashSize: 10,     // Size of each dash
      gapSize: 2,    // Gap between dashes
      linewidth: 10,    // Line width
    });

    // Create the line and compute its dash array
    const contactPlane = new THREE.Line(lineGeometryContactPlane, lineMaterial_contact_plane);

    contactPlane.computeLineDistances(); // Required for dashed lines to render correctly

    contactPlane.userData.type = 'axis';
    contactPlane.name = "axis_line_contact_plane_"+external_id;
    // Add the line to the scene
    scene.add(contactPlane);



    /******************************************************************************/
    /***********************************ZERO PLANE BASE ***************************/
    /******************************************************************************/

    const ZeroPlaneVertices = new Float32Array([
        pv.x, 0, pv.z,
        polePosition.x, 0, polePosition.z,
    ]);

    const ZeroPlanelineGeometry = new THREE.BufferGeometry();
    ZeroPlanelineGeometry.setAttribute('position', new THREE.BufferAttribute(ZeroPlaneVertices, 3));

    const ZeroPlanelineMaterial = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // #fca5a5
        dashSize: 10,     // Size of each dash
        gapSize: 2,    // Gap between dashes
        linewidth: 10,    // Line width
    });

    // Create the line and compute its dash array
    const ZeroPlaneCenterLine = new THREE.Line(ZeroPlanelineGeometry, ZeroPlanelineMaterial);

    ZeroPlaneCenterLine.computeLineDistances(); // Required for dashed lines to render correctly

    ZeroPlaneCenterLine.userData.type = 'axis';
    ZeroPlaneCenterLine.name = "zero_plane_"+external_id;
    // Add the line to the scene
    scene.add(ZeroPlaneCenterLine);

    /******************************************************************************/
    /************************SUPER ELEVATION PLANE BASE ***************************/
    /******************************************************************************/

    const SuperElevationVertices = new Float32Array([
        pv.x, u, pv.z,
        polePosition.x, u, polePosition.z,
    ]);

    const SuperElevationlineGeometry = new THREE.BufferGeometry();
    SuperElevationlineGeometry.setAttribute('position', new THREE.BufferAttribute(SuperElevationVertices, 3));

    const SuperElevationMaterialLine = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // #fca5a5
        dashSize: 10,     // Size of each dash
        gapSize: 2,    // Gap between dashes
        linewidth: 10,    // Line width
    });

    // Create the line and compute its dash array
    const SuperElevationLine = new THREE.Line(SuperElevationlineGeometry, SuperElevationMaterialLine);

    SuperElevationLine.computeLineDistances(); // Required for dashed lines to render correctly

    SuperElevationLine.userData.type = 'axis';
    SuperElevationLine.name = "zero_plane_elevation_"+external_id;
    // Add the line to the scene
    scene.add(SuperElevationLine);

}



