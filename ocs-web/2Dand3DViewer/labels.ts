import { TextGeometry, Font } from 'three-stdlib';
import * as THREE from 'three';
import { vec3ToObj, objToVec3, drawCircle } from './helper';

function createTextMesh(
  text: string,
  font: Font,
  size: number,
  height: number,
  color: number
): THREE.Mesh<THREE.TextGeometry, THREE.MeshBasicMaterial> {
  const geom = new TextGeometry(text, {
    font,
    size,
    height,
    curveSegments: 8,
    bevelEnabled: false,
  });
  geom.computeBoundingBox();
  const center = new THREE.Vector3();
  geom.boundingBox!.getCenter(center);
  geom.translate(-center.x, -center.y, -center.z);

  const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide, depthTest: false });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.frustumCulled = false;
  return mesh;
}

export function addViaAndTickLabels(
  line: THREE.Line,
  font: Font | undefined,
  color: number,
  fontsProps:FontsProps,
) {
  if (!font) return;

  const positions = line.geometry.attributes.position.array as number[];
  const start = new THREE.Vector3(positions[0], positions[1], positions[2]);
  const end   = new THREE.Vector3(positions[3], positions[4], positions[5]);
  const mid   = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

  // helper to orient a mesh perpendicular to the line
  const dir = end.clone().sub(start).normalize();
  const angle = Math.atan2(dir.y, dir.x);
  const perp  = new THREE.Vector3(-dir.y, dir.x, 0);

  // --- 1) main via label ---
  const viaMesh = createTextMesh(
    line.userData.external_id, 
    font,
    fontsProps.via.label.size,
    5, 
    color
  );
  const flip   = Math.abs(angle) > Math.PI / 2;
  const effAng = flip ? angle + Math.PI : angle;
  const offset = flip ? perp.clone().negate() : perp;

  viaMesh.rotation.z = effAng;

  // Base offset perpendicular to the line
  const baseOffset = offset.clone().multiplyScalar(fontsProps.via.label.size);

  // Additional offset along the line direction (use -10 or your custom value)
  const forwardOffset = new THREE.Vector3(
    (flip ? -fontsProps.via.label.offset : fontsProps.via.label.offset ) * Math.cos(effAng),
    (flip ? -fontsProps.via.label.offset : fontsProps.via.label.offset ) * Math.sin(effAng),
    0
  );

  viaMesh.position.copy(mid).add(baseOffset).add(forwardOffset);

  line.add(viaMesh);

  // --- 2) tick labels for each “thick” child ---
  line.children.forEach((child) => {
    if (!(child instanceof THREE.Line)) return;
    if (child.userData.type !== 'thick') return;

    const pos = child.geometry.attributes.position.array;
    const p1 = new THREE.Vector3(pos[0], pos[1], pos[2]);
    const p2 = new THREE.Vector3(pos[3], pos[4], pos[5]);
    const m  = new THREE.Vector3().addVectors(p1,p2).multiplyScalar(0.5);

    // derive orientation a from p1→p2…
    const d = p2.clone().sub(p1).normalize();
    const angle = Math.atan2(d.y,d.x);
    const perp  = new THREE.Vector3(-d.y, d.x, 0);

    const flip   = Math.abs(angle) > Math.PI / 2;
    const effAng = flip ? angle + Math.PI : angle;
    const offset = flip ? perp.clone().negate() : perp;

    let formatted_pk = "PK "  + (child.userData.pk/1000000).toFixed(2);

    const thickMesh = createTextMesh(
      formatted_pk,
      font,
      fontsProps.via.thick.size,
      5,
      color
    );

    thickMesh.rotation.z = effAng;

    // Base offset perpendicular to the line
    const baseOffset = offset.clone().multiplyScalar(fontsProps.via.thick.size);

    // Additional offset along the line direction (use -10 or your custom value)
    const forwardOffset = new THREE.Vector3(
      (flip ? -fontsProps.via.thick.offset : fontsProps.via.thick.offset ) * Math.cos(effAng),
      (flip ? -fontsProps.via.thick.offset : fontsProps.via.thick.offset ) * Math.sin(effAng),
      0
    );

    thickMesh.position.copy(p2).add(baseOffset).add(forwardOffset);


    line.add(thickMesh);
  });
}

export function addPoleLabels(
  pole: THREE.Group,
  font: Font | undefined,
  fontsProps: FontsProps
) {
  if (!font) return;

  const dir = pole.userData.dir as THREE.Vector3;
  if (!dir) return;

  // Compute perpendicular and forward vectors once
  const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
  const forward = dir.clone().setZ(0).normalize();

  // Determine if we need to flip the text
  const angle = Math.atan2(dir.y, dir.x);
  const flip = angle > 0;

  // Helper to create, rotate, position, and flip a label mesh
  const createLabelMesh = (
    text: string,
    size: number,
    color: number,
    position: THREE.Vector3
  ) => {
    const mesh = createTextMesh(text, font, size, 5, color);
    mesh.position.copy(position);
    mesh.rotation.z = flip ? -Math.PI/2  : Math.PI/2;
    return mesh;
  };

  // Pole type label
  const typeOffset =  forward.clone().add(perp.clone().multiplyScalar((flip ? fontsProps.pole.type.offset : -fontsProps.pole.type.offset)));
  const poleTypeMesh = createLabelMesh(
    pole.userData.pole_type,
    fontsProps.pole.type.size,
    fontsProps.pole.type.color,
    typeOffset
  );
  pole.add(poleTypeMesh);

  // PV label — relative to poleTypeMesh position
  const pvOffset = perp.clone().multiplyScalar((flip ? fontsProps.pole.pv.offset : -fontsProps.pole.pv.offset));
  const polePvMesh = createLabelMesh(
    (pole.userData.pv / 1000).toFixed(2),
    fontsProps.pole.type.size,
    fontsProps.pole.type.color,
    poleTypeMesh.position.clone().add(pvOffset)
  );
  pole.add(polePvMesh);

  addReferenceIndicator(pole,font,fontsProps);

  addPoleName(pole,font,fontsProps);
}

export function addReferenceIndicator(
  pole: THREE.Group,
  font: Font | undefined,
  fontsProps: FontsProps
) {
  if (!font) return;

  const color = fontsProps.pole.coordinates.color;
  const fontSize = fontsProps.pole.coordinates.size; 
  const indicatorGroup = new THREE.Group(); // This will be centered at pole.position

  // 1️⃣ Get and normalize the horizontal direction
  const rawDir = pole.userData.dir as THREE.Vector3;
  if (!rawDir) return;
  const dir = rawDir.clone().setZ(0).normalize();

  // Determine if we need to flip the text
  const angle = Math.atan2(dir.y, dir.x);
  const flip = angle > 0;

  indicatorGroup.rotation.z = flip ? Math.PI : Math.PI;

  // --- Step 1: Define vectors ---
  const diagDir = new THREE.Vector3(1, 1.4, 0).normalize(); // 45-degree direction
  const verticalDir = new THREE.Vector3(-1, 0, 0);         // down direction

  const diagLength = fontsProps.pole.coordinates.lines.horizontal;
  const vertLength = -1 * fontsProps.pole.coordinates.lines.vertical;

  const start = new THREE.Vector3(0, 0, 0); // local to group
  const diagEnd = diagDir.clone().multiplyScalar(diagLength);
  const vertEnd = diagEnd.clone().add(verticalDir.clone().multiplyScalar(vertLength));

  // --- Step 2: Draw lines ---
  const diagGeom = new THREE.BufferGeometry().setFromPoints([start, diagEnd]);
  const diagLine = new THREE.Line(diagGeom, new THREE.LineBasicMaterial({ color }));
  indicatorGroup.add(diagLine);

  const vertGeom = new THREE.BufferGeometry().setFromPoints([diagEnd, vertEnd]);
  const vertLine = new THREE.Line(vertGeom, new THREE.LineBasicMaterial({ color }));
  indicatorGroup.add(vertLine);

  // --- Step 3: Add texts ---
  const offsetText = fontsProps.pole.coordinates.offset;

  const textX = createTextMesh(`x: ${pole.position.x.toFixed(4)}`, font, fontSize, 5, color);
  textX.geometry.computeBoundingBox();
  const bbox = textX.geometry.boundingBox!;
  const textWidthX = bbox.max.x - bbox.min.x;

  // Then offset position subtracting half width along X
  textX.position.copy(vertEnd).add(new THREE.Vector3(-textWidthX/2, -offsetText, 0));
  //textX.rotation.z = Math.PI/2;
  indicatorGroup.add(textX);

  const textY = createTextMesh(`y: ${pole.position.y.toFixed(4)}`, font, fontSize, 5, color);
  textY.geometry.computeBoundingBox();
  const bboy = textY.geometry.boundingBox!;
  const textWidthY = bboy.max.x - bboy.min.x;
  textY.position.copy(vertEnd).add(new THREE.Vector3(-textWidthY/2, offsetText, 0)); // below
  //textY.rotation.z = Math.PI/2;
  indicatorGroup.add(textY);

  // --- Step 5: Attach to pole ---
  indicatorGroup.position.set(0, 0, 0); // local to pole
  pole.add(indicatorGroup); // pole's own position already places this in world
}


export function addPoleName(
  pole: THREE.Group,
  font: Font | undefined,
  fontsProps: FontsProps
) {
  if (!font) return;

  // 1️⃣ Get and normalize the horizontal direction
  const rawDir = pole.userData.dir as THREE.Vector3;
  if (!rawDir) return;
  const dir = rawDir.clone().setZ(0).normalize();

  // 3️⃣ Grab styling props
  const {
    size,
    color,
    offset,
    border_color,
    circlePadding = 10,
  } = fontsProps.pole.name;

  // 4️⃣ Create text meshes
  //const topText    = createTextMesh("10",               font, size, 5, color);
  const topText    = createTextMesh(pole.userData.id.toString(),               font, size, 5, color);
  const bottomText = createTextMesh(pole.userData.external_id, font, size, 5, color);

  // 5️⃣ Measure both to find max dimensions
  topText.geometry.computeBoundingBox();
  bottomText.geometry.computeBoundingBox();
  const topBB    = topText.geometry.boundingBox!;
  const botBB    = bottomText.geometry.boundingBox!;
  const topW     = topBB.max.x - topBB.min.x;
  const topH     = topBB.max.y - topBB.min.y;
  const botW     = botBB.max.x - botBB.min.x;
  const botH     = botBB.max.y - botBB.min.y;
  const textW    = Math.max(topW, botW);
  const textH    = Math.max(topH, botH);

  // 6️⃣ Draw the circle
  const diameter = Math.max(textW, textH) + circlePadding * 4;
  const radius   = diameter / 2;
  const circle   = drawCircle(diameter, border_color, 64);

  // 7️⃣ Build the group
  const nameGroup = new THREE.Group();
  nameGroup.add(circle);

  // ➡️ Top text in upper half
  topText.position.set(0,  radius/2 , 0);
  nameGroup.add(topText);

  // ➡️ Bottom text in lower half
  bottomText.position.set(0, -radius/2 , 0);
  nameGroup.add(bottomText);

  // ➡️ Dividing line
  const lineGeom = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-radius, 0, 0),
    new THREE.Vector3( radius, 0, 0),
  ]);
  const dividingLine = new THREE.Line(
    lineGeom,
    new THREE.LineBasicMaterial({ color: color })
  );
  nameGroup.add(dividingLine);

  nameGroup.position.add(new THREE.Vector3(-offset, 0, 0)); 

  // Determine if we need to flip the text
  const angle = Math.atan2(dir.y, dir.x);
  const flip = angle > 0;

  nameGroup.rotation.z = flip ? -Math.PI/2 : Math.PI/2;

  // 1️⃣1️⃣ Add to pole (at its local 0,0,0)
  pole.add(nameGroup);
}


export function addCantileverLabels(
  cantilever: THREE.Group,
  font: Font | undefined,
  fontsProps: FontsProps
) {
  if (!font) return;

  // Iterate through each child in the group
  cantilever.children.forEach((child) => {
    if (child instanceof THREE.Line && child.userData.type === 'cantilever') {
      // Extract start & end points
      const start: THREE.Vector3 = objToVec3(child.userData.start);
      const end: THREE.Vector3 = objToVec3(child.userData.end);
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      // Direction from start to end
      const dir = new THREE.Vector3().subVectors(end, start).normalize();
      const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
      // Compute angle in XY plane
      const angle = Math.atan2(dir.y, dir.x);
      // Base rotation: perpendicular to line
      let rotationZ = angle + Math.PI;
      // Flip text if upside down
      const normalized = ((rotationZ % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
      if (normalized > Math.PI / 2 && normalized < (3 * Math.PI) / 2) {
        rotationZ += Math.PI;
      }

      // Text content and style
      const textContent = String(child.userData.zig_zag);
      const size = fontsProps.cantilever.zig_zag.size;
      const height = 5;
      const color = fontsProps.cantilever.zig_zag.color;
      // Create the text mesh
      const textMesh = createTextMesh(textContent, font, size, height, color);

      const sizeName = fontsProps.cantilever.name.size;
      const colorName = fontsProps.cantilever.name.color;
      const cantileverTextMesh = createTextMesh(child.userData.external_id, font, sizeName, height, colorName);

      // Position and orient the text
      textMesh.position.copy(midPoint).add(perp.clone().multiplyScalar(-fontsProps.cantilever.zig_zag.offset));
      textMesh.rotation.z = rotationZ;
      // Add to group
      cantilever.add(textMesh);

      cantileverTextMesh.position.copy(end).add(dir.clone().multiplyScalar(fontsProps.cantilever.name.offset));
      cantileverTextMesh.rotation.z = rotationZ;

      cantilever.add(cantileverTextMesh);

      addZigZagArrow(cantilever,start,end,child.userData.zig_zag,font,fontsProps,color);
    }
  });
}

export function addZigZagArrow(
  cantilever: THREE.Group,
  start:THREE.Vector3,
  end:THREE.Vector3,
  zig_zag:number,
  font: Font | undefined,
  fontsProps: FontsProps,
){
  if (!font) return;

  const arrowLength = fontsProps.cantilever.zig_zag.arrowLength;       // length of arrow body
  const headLength = fontsProps.cantilever.zig_zag.headLength;        // length of arrow tips
  const headAngle = Math.PI / 4;
  const offsetDistance = fontsProps.cantilever.zig_zag.offset;
  
  // Direction and perpendicular in XY
  const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const dir = new THREE.Vector3().subVectors(end, start).normalize();
  const perp = new THREE.Vector3(-dir.y, dir.x, 0).normalize();
  const zig = zig_zag;
  const sign = zig >= 0 ? 1 : -1;
  const arrowDir = dir.clone().multiplyScalar(sign);

  // Build arrow geometry
  const arrowGroup = new THREE.Group();

  // Body line
  const bodyGeom = new THREE.BufferGeometry().setFromPoints([
    arrowDir.clone().multiplyScalar(-arrowLength / 2),
    arrowDir.clone().multiplyScalar(arrowLength / 2)
  ]);
  const material = new THREE.LineBasicMaterial({ color:fontsProps.cantilever.zig_zag.color });
  const bodyLine = new THREE.Line(bodyGeom, material);
  arrowGroup.add(bodyLine);

  // Arrowhead lines at positive end
  const tipPos = arrowDir.clone().multiplyScalar(arrowLength / 2);
  const leftTipDir = arrowDir.clone().applyAxisAngle(new THREE.Vector3(0,0,1), headAngle).normalize();
  const rightTipDir = arrowDir.clone().applyAxisAngle(new THREE.Vector3(0,0,1), -headAngle).normalize();

  const leftGeom = new THREE.BufferGeometry().setFromPoints([
    tipPos,
    tipPos.clone().sub(leftTipDir.multiplyScalar(headLength))
  ]);
  const rightGeom = new THREE.BufferGeometry().setFromPoints([
    tipPos,
    tipPos.clone().sub(rightTipDir.multiplyScalar(headLength))
  ]);
  arrowGroup.add(new THREE.Line(leftGeom, material));
  arrowGroup.add(new THREE.Line(rightGeom, material));
  
  arrowGroup.position.copy(midPoint).add(perp.clone().multiplyScalar(offsetDistance));

  cantilever.add(arrowGroup);


}
