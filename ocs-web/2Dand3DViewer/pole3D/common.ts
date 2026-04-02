import * as THREE from 'three';
import { subtractVectors,normalizeVector, addVectors, scaleVector } from "../../../utils/helper";

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export function addPole(
  external_id:string,
  scene: THREE.Scene,
  position: Vector3,
  esc: number,
  model: PoleModelInterface,
  pv: Vector3 = { x: 1, y: 0, z: 0 },
): void {

  const direction = normalizeVector(subtractVectors({x:position.x,y:0,z:position.z},{x:pv.x,y:0,z:pv.z}));

  // Choose geometry based on model type
  const geometry =
    model.type.shape === 'CIRCLE'
      ? new THREE.CylinderGeometry(
          model.measures.width / 2,
          model.measures.length / 2,
          model.measures.height,
          32
        )
      : new THREE.BoxGeometry(
          model.measures.width || 1,
          model.measures.height,
          model.measures.length || 1
        );

  // Material (you can customize or pass it in later)
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff00,
    wireframe: false,
  });

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);

  // Position
  mesh.position.set(position.x, position.y + (model.measures.height / 2 - esc + model.measures.bottom_screw), position.z);

  // Scale uniformly by esc
  //mesh.scale.setScalar(esc);

  // Compute rotation around Y so the pole faces the given XZ-direction
  const dirVec = new THREE.Vector3(direction.x, 0, direction.z).normalize();
  const angleY = Math.atan2(dirVec.x, dirVec.z) + Math.PI/2;
  mesh.rotation.y = angleY;

  mesh.name = external_id;

  // Add to scene
  scene.add(mesh);
}


export function addCantileverSupport(
  external_id:string,
  scene: THREE.Scene,
  bottom_fixed_height:number,
  fixing_distance:number,
  pole_position: Vector3,
  model: PoleModelInterface,
  qtyCant:number,
  support_offset:number,
  cat_separation:number,
  pv: Vector3 = { x: 1, y: 0, z: 0 },
){

  const direction = normalizeVector(subtractVectors({x:pole_position.x,y:0,z:pole_position.z},{x:pv.x,y:0,z:pv.z}));

  const geometry = new THREE.BoxGeometry(
    support_offset,
    support_offset,
    cat_separation * (qtyCant - 1)
  );

  const createSupport = (height:number, index:number ) => {

    const material = new THREE.MeshStandardMaterial({ color: 0x808080, wireframe: false });

    const mesh = new THREE.Mesh(geometry, material);

    const dirVec = new THREE.Vector3(direction.x, 0, direction.z).normalize();
    const angleY = Math.atan2(dirVec.x, dirVec.z) + Math.PI/2;
    mesh.rotation.y = angleY;

    const finalPosition = addVectors({x: pole_position.x, y:height, z:pole_position.z },scaleVector(direction, ((model.measures.width / 2) + support_offset/2 ) * -1 ))
    mesh.position.set(finalPosition.x, finalPosition.y, finalPosition.z);


    mesh.name = external_id + "_support_"+index;
    // Add to scene
    scene.add(mesh);
  }

  createSupport(bottom_fixed_height,1);
  createSupport(bottom_fixed_height + fixing_distance,2);
}
