import * as THREE from 'three';

export function addVaneCurves(scene: THREE.Scene, vane:VaneDataContent, camera:'orthographic'|'perspective' ): void {

  console.log(vane.links.curves);
  vane.links.curves.forEach((item) => {
    for(let i = 0; i < (item.curve.length - 1); i++){
      // Create points for the line
      const start = new THREE.Vector3(item.curve[i].x, item.curve[i].y, item.curve[i].z);
      const end = new THREE.Vector3(item.curve[i+1].x, item.curve[i+1].y, item.curve[i+1].z);

      if (camera === 'perspective') {

        //CylinderGeometry
        // Calculate the direction and length
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        direction.normalize();

        // Create the cylinder geometry
        const cylinderGeometry = new THREE.CylinderGeometry(12, 12, length, 24);
        const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: false });
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
        cylinder.userData.color = 0x808080;
        cylinder.userData.type = 'link';
        cylinder.userData.start = start;
        cylinder.userData.end = end;
        //cylinder.userData.id = `${link.elementId}`;

        // Add the cylinder to the scene
        scene.add(cylinder);

      }else{
        // 2D Line representation for orthographic view (Z -> X, Y -> Y)
        const start2D = new THREE.Vector3(start.x, start.y , 0);
        const end2D = new THREE.Vector3(end.x, end.y, 0);
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([start2D, end2D]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        
        line.userData.type = 'link';
        line.userData.start = start2D;
        line.userData.end = end2D;
        
        scene.add(line);

      }

    }
  });
}

export function addVaneRects(scene: THREE.Scene, vane:VaneDataContent, camera:'orthographic'|'perspective'): void {

  vane.links.rects.forEach((link) => {
    // Create points for the line
    const start = new THREE.Vector3(link.x1, link.y1, link.z1);
    const end = new THREE.Vector3(link.x2, link.y2, link.z2);

    if (camera === 'perspective') {
      //CylinderGeometry
      // Calculate the direction and length
      const direction = new THREE.Vector3().subVectors(end, start);
      const length = direction.length();
      direction.normalize();

        // Create the cylinder geometry
        const cylinderGeometry = new THREE.CylinderGeometry(12, 12, length, 24);
        const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x808080, wireframe: false });
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
        cylinder.userData.color = 0x808080;
        cylinder.userData.type = 'link';
        cylinder.userData.start = start;
        cylinder.userData.end = end;
        //cylinder.userData.id = `${link.elementId}`;

        // Add the cylinder to the scene
        scene.add(cylinder);
    }else{

        // 2D Line representation for orthographic view (Z -> X, Y -> Y)
        const start2D = new THREE.Vector3(start.x, start.y, 0);
        const end2D = new THREE.Vector3(end.x, end.y , 0);
        
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([start2D, end2D]);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x808080 });
        const line = new THREE.Line(lineGeometry, lineMaterial);
        
        line.userData.type = 'link';
        line.userData.start = start2D;
        line.userData.end = end2D;
        
        scene.add(line);

    }
  });
}
