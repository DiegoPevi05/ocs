import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three-stdlib';

export const DefaultDimension:Dimensions = {
  start: { x:0,y:0,z:0 },
  end: {x:0, y:0,z:0},
  groupId:'none',
  line:{
    arrows:{
      arrowHeight:40,
      arrowRadius:15,
      arrowSegments:16
    },
    radius:6,
    offset:{
      orientation:{ x:0,y:0,z:1 },
      distance:-200
    }
  },
  text:{
    size:48,
    height:4,
    offset:{
      orientation:{ x:0,y:1,z:0 },
      distance:50
    }
  }
}

export function addPoints(
  scene: THREE.Scene,
  points: { x: number, y: number, z: number }[]
) {
  const sphereRadius = 12; // Define the radius of the spheres
  const sphereMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 }); // Red color for the spheres

  points.forEach(({ x, y, z }) => {
    // Create a sphere geometry
    const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);

    // Create a mesh with the sphere geometry and material
    const sphereMesh = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // Set the position of the sphere to the current point
    sphereMesh.position.set(x, y, z);

    // Add the sphere to the scene
    scene.add(sphereMesh);
  });
}

export function addDefaultPole(
    scene: THREE.Scene,
    esc:number,
    pole_height:number,
    bottom_fixed_height:number,
    u:number,
    options:CantileverViewerOptions
    ):void{
    const start = new THREE.Vector3(0, -esc, 0);
    const end = new THREE.Vector3(0, pole_height - (esc - u), 0);

    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();

    // Create the cylinder geometry
    const cylinderGeometry = new THREE.CylinderGeometry(12, 12, length, 8);
    const cylinderMaterial = new THREE.MeshBasicMaterial({ color: 0x808080 });
    const cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);

    // Position the cylinder at the midpoint
    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    cylinder.position.copy(midPoint);

    // Align the cylinder with the direction vector
    const axis = new THREE.Vector3(0, 1, 0); // Default up axis of cylinder
    const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
    cylinder.setRotationFromQuaternion(quaternion);

    cylinder.userData.color = 0x808080;
    cylinder.userData.type = 'pole';
    cylinder.userData.start = start;
    cylinder.userData.end = end;
    cylinder.userData.id = `pole_default`;

    let dimension0:Dimensions = {  
      start:{
        x:0,
        y:-esc,
        z:0
      },
      end:{
        x:0,
        y:0,
        z:0
      },
      groupId:"esc",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-150
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    }

    let dimension1:Dimensions = {  
      start:{
        x:0,
        y:0,
        z:0
      },
      end:{
        x:0,
        y:bottom_fixed_height,
        z:0
      },
      groupId:"bottom_fixed_point",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-150
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    }

    let dimension2:Dimensions = {  
      start:{
        x:0,
        y:-esc,
        z:0
      },
      end:{
        x:0,
        y:pole_height - esc,
        z:0
      },
      groupId:"pole_height",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:-500
        }
      },
      text:{
        size:48,
        height:4,
        offset:{
          orientation:{ x:0,y:1,z:0 },
          distance:50
        }
      }
    }

    if(options.labels){
        addDimensions(scene, dimension0)
        addDimensions(scene, dimension1)
        addDimensions(scene, dimension2)
    }

    // Add the cylinder to the scene
    scene.add(cylinder);
}

export function addAxisLine(
    scene: THREE.Scene, 
    pv:{ x:number, y:number, z:number } ,
    via_axis: { x:number, y:number, z:number  }, 
    system_height: number, 
    cw: { x:number, y:number, z:number }, 
    mw: { x:number, y:number, z:number },
    u:number
  ) {
    // Calculate the direction vector from the first point to the second
    const startX = pv.x;
    const startY = pv.y;
    const endX = via_axis.x;
    const endY = via_axis.y;

    const dx = endX - startX;
    const dy = endY - startY;

    // Normalize the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitDx = dx / length;
    const unitDy = dy / length;

    // Calculate the extended endpoint
    const extendedX = endX + unitDx * system_height;
    const extendedY = endY + unitDy * system_height;

    // Create geometry for the line with rotation
    const lineGeometry = new THREE.BufferGeometry();
    const vertices = new Float32Array([
        startX, startY, pv.z,
        endX, endY, pv.z,
        extendedX, extendedY, pv.z, // Extended point
    ]);
    lineGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

    // Create a dashed line material
    const lineMaterial = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // #fca5a5
        dashSize: 1,     // Size of each dash
        gapSize: 0.5,    // Gap between dashes
        linewidth: 1,    // Line width
    });

    // Create the line and compute its dash array
    const centerLine = new THREE.Line(lineGeometry, lineMaterial);
    centerLine.computeLineDistances(); // Required for dashed lines to render correctly

    centerLine.userData.type = 'axis';
    // Add the line to the scene
    scene.add(centerLine);

    // Create geometry for the line without rotation
    const lineGeometryCentered = new THREE.BufferGeometry();
    const verticesCentered = new Float32Array([
        pv.x, 0, pv.z,
        pv.x, cw.y, pv.z,
        pv.x, mw.y, pv.z, // Extended point
    ]);
    lineGeometryCentered.setAttribute('position', new THREE.BufferAttribute(verticesCentered, 3));

    // Create a dashed line material
    const lineMaterialCentered = new THREE.LineDashedMaterial({
        color: 0xfde68a, // #fde68a 
        dashSize: 1,     // Size of each dash
        gapSize: 0.5,    // Gap between dashes
        linewidth: 1,    // Line width
    });

    // Create the line and compute its dash array
    const centerLineCentered = new THREE.Line(lineGeometryCentered, lineMaterialCentered);
    centerLineCentered.computeLineDistances(); // Required for dashed lines to render correctly

    centerLineCentered.userData.type = 'axis';

    // Add the line to the scene
    scene.add(centerLineCentered);

    // Calculate the perpendicular direction vector
    const perpDx = -unitDy; // Perpendicular vector x
    const perpDy = unitDx;  // Perpendicular vector y

    // Set the point where the perpendicular line passes through
    const baseX = via_axis.x;
    const baseY = via_axis.y;

    // Extend the perpendicular line in both directions
    const max_zig_zag = 600;

    const perpStartX = baseX - perpDx * max_zig_zag;
    const perpStartY = baseY - perpDy * max_zig_zag;
    const perpEndX = baseX + perpDx * max_zig_zag;
    const perpEndY = baseY + perpDy * max_zig_zag;

    // Create geometry for the perpendicular line
    const perpLineGeometry = new THREE.BufferGeometry();
    const perpVertices = new Float32Array([
        perpStartX, perpStartY, pv.z,
        baseX, baseY, pv.z,
        perpEndX, perpEndY, pv.z,
    ]);
    perpLineGeometry.setAttribute('position', new THREE.BufferAttribute(perpVertices, 3));

    // Create a dashed line material for the perpendicular line
    const perpLineMaterial = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // #fca5a5
        dashSize: 1,     // Size of each dash
        gapSize: 0.5,    // Gap between dashes
        linewidth: 1,    // Line width
    });

    // Create the perpendicular line and compute its dash array
    const contactLinePlane = new THREE.Line(perpLineGeometry, perpLineMaterial);
    contactLinePlane.computeLineDistances(); // Required for dashed lines to render correctly

    contactLinePlane.userData.type = 'axis';

    // Add the perpendicular line to the scene
    scene.add(contactLinePlane);


    // Create geometry for the line with rotation
    const baselineGeometry = new THREE.BufferGeometry();
    const basevertices = new Float32Array([
        0, 0, pv.z,
        pv.x, 0, pv.z,
        pv.x + 1000, 0, pv.z, // Extended point
    ]);

    baselineGeometry.setAttribute('position', new THREE.BufferAttribute(basevertices, 3));

    // Create a dashed line material
    const baselineMaterial = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // #fca5a5
        dashSize: 20,     // Size of each dash
        gapSize: 5,    // Gap between dashes
        linewidth: 1,    // Line width
    });

    // Create the line and compute its dash array
    const basecenterLine = new THREE.Line(baselineGeometry, baselineMaterial);
    basecenterLine.computeLineDistances(); // Required for dashed lines to render correctly

    basecenterLine.userData.type = 'axis';
    // Add the line to the scene
    scene.add(basecenterLine);


    // Parameters for the circle
    const radius = 100; // Radius of the circle
    const segments = 100; // Number of segments to approximate the circle

    // Create geometry for the circle
    const circleGeometry = new THREE.BufferGeometry();
    const circleVertices = [];

    // Generate points for the circle
    for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2; // Angle in radians
        const x = pv.x + radius * Math.cos(theta);
        const y = pv.y + radius * Math.sin(theta);
        circleVertices.push(x, y, pv.z); // Z remains constant
    }

    // Convert the vertices array to a Float32Array
    circleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(circleVertices, 3));

    // Create a dashed line material
    const circleMaterial = new THREE.LineDashedMaterial({
        color: 0xfca5a5, // Red color (#fca5a5)
        dashSize: 20,     // Size of each dash
        gapSize: 4,      // Gap between dashes
        linewidth: 2,    // Line width
    });

    // Create the dashed circle line
    const dashedCircle = new THREE.Line(circleGeometry, circleMaterial);
    dashedCircle.computeLineDistances(); // Required for dashed lines to render correctly

    dashedCircle.userData.type = 'circle';
    // Add the circle to the scene
    scene.add(dashedCircle);


    // Line Track Elevation
      // Create geometry for the line with rotation
      const ulineGeometry = new THREE.BufferGeometry();
      const uvertices = new Float32Array([
          0, u, pv.z,
          pv.x, u, pv.z,
          pv.x + 1000, u, pv.z, // Extended point
      ]);

      ulineGeometry.setAttribute('position', new THREE.BufferAttribute(uvertices, 3));

      // Create a dashed line material
      const ulineMaterial = new THREE.LineDashedMaterial({
          color: 0xfca5a5, // #fca5a5
          dashSize: 20,     // Size of each dash
          gapSize: 5,    // Gap between dashes
          linewidth: 1,    // Line width
      });

      // Create the line and compute its dash array
      const uLine = new THREE.Line(ulineGeometry, ulineMaterial);
      uLine.computeLineDistances(); // Required for dashed lines to render correctly

      uLine.userData.type = 'axis';
      // Add the line to the scene
      scene.add(uLine);


}

export function addPantograph(
    scene: THREE.Scene, 
    pv:{ x:number, y:number, z:number } ,
    via_axis: { x:number, y:number, z:number  }, 
    pantograh_length:number,
){

    // Calculate the direction vector from the first point to the second
    const startX = pv.x;
    const startY = pv.y;
    const endX = via_axis.x;
    const endY = via_axis.y;

    const dx = endX - startX;
    const dy = endY - startY;

    // Normalize the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitDx = dx / length;
    const unitDy = dy / length;

    // Calculate the perpendicular direction vector
    const perpDx = -unitDy; // Perpendicular vector x
    const perpDy = unitDx;  // Perpendicular vector y
    // Set the point where the perpendicular line passes through
    const baseX = via_axis.x;
    const baseY = via_axis.y;

    //Add pantograph of Train
    const PantographLength = pantograh_length;
    const X = 218;
    const Y = 174;
    const Z = 275;
    const W = 85;
    const P = 50;
    const theta1 = 20;
    const theta2 = 21;
    const theta3 = 24;
    const theta4 = 25;
    const r1 = 250; 
    const r2 = 100;

    //Pantograph

    const Point1X = baseX - perpDx * PantographLength/2;
    const Point1Y = baseY - perpDy * PantographLength/2;
    const Point2X = baseX + perpDx * PantographLength/2;
    const Point2Y = baseY + perpDy * PantographLength/2;

    const Point3X = baseX - perpDx * (PantographLength/2 + X);
    const Point3Y = baseY - perpDy * (PantographLength/2 + X);

    const Point4X = baseX + perpDx * (PantographLength/2 + X);
    const Point4Y = baseY + perpDy * (PantographLength/2 + X);

    const currentAngle = Math.atan2(Point4Y - Point3Y, Point4X - Point3X);

    const newAngle = currentAngle + theta1 * (Math.PI / 180);
    // Point5
    const Point5X = Point3X - Math.cos(newAngle) * Y;
    const Point5Y = Point3Y + Math.sin(newAngle) * Y;
    // Point6
    const Point6X = Point4X + Math.cos(newAngle) * Y;
    const Point6Y = Point4Y + Math.sin(newAngle) * Y;

    const newAngle2 = newAngle +  theta2 *  (Math.PI/ 180); 

    const Point7X =  Point5X - Math.cos(newAngle2) *  Z;
    const Point7Y =  Point5Y + Math.sin(newAngle2) * Z;

    const Point8X =  Point6X + Math.cos(newAngle2) * Z;
    const Point8Y =  Point6Y + Math.sin(newAngle2) * Z;

    const newAngle3 = newAngle2 +  theta3 *  (Math.PI/ 180); 

    const Point9X =  Point7X - Math.cos(newAngle3) *  W;
    const Point9Y =  Point7Y + Math.sin(newAngle3) * W;

    const Point10X =  Point8X + Math.cos(newAngle3) * W;
    const Point10Y =  Point8Y + Math.sin(newAngle3) * W;

    const newAngle4 = newAngle3 +  theta4 *  (Math.PI/ 180); 

    const Point11X =  Point9X + Math.cos(newAngle4) *  P;
    const Point11Y =  Point9Y + Math.sin(newAngle4) * P;

    const Point12X =  Point10X - Math.cos(newAngle4) * P;
    const Point12Y =  Point10Y + Math.sin(newAngle4) * P;

    // Create geometry for the perpendicular line
    addLine(
      scene,
      [ 
        Point4X, Point4Y, pv.z,
        Point1X,Point1Y,pv.z,
        Point2X,Point2Y,pv.z,
        Point3X, Point3Y, pv.z,
      ],
      0xfde68a
    );

    addArc(
      scene,
      { x:Point4X, y:Point4Y, z:pv.z }, 
      {x:Point6X, y:Point6Y, z:pv.z},
      r1,  
      0xfde68a,
      false,
      false
    );

    addArc(
      scene,
      {x:Point3X, y:Point3Y, z:pv.z},
      { x:Point5X, y:Point5Y, z:pv.z }, 
      r1,  
      0xfde68a,
      true
    );

    addLine(
      scene,
      [ 
        Point8X, Point8Y, pv.z,
        Point6X, Point6Y, pv.z,
      ],
      0xfde68a
    );

    addLine(
      scene,
      [ 
        Point5X, Point5Y, pv.z,
        Point7X, Point7Y, pv.z,
      ],
      0xfde68a
    );


    addArc(
      scene,
      { x:Point8X, y:Point8Y, z:pv.z }, 
      {x:Point10X, y:Point10Y, z:pv.z},
      r2,  
      0xfde68a,
      false,
      false
    );

    addArc(
      scene,
      {x:Point7X, y:Point7Y, z:pv.z},
      { x:Point9X, y:Point9Y, z:pv.z }, 
      r2,  
      0xfde68a,
      true
    );

    addLine(
      scene,
      [ 
        Point10X, Point10Y, pv.z,
        Point12X, Point12Y, pv.z,
      ],
      0xfde68a
    );

    addLine(
      scene,
      [ 
        Point9X, Point9Y, pv.z,
        Point11X, Point11Y, pv.z,
      ],
      0xfde68a
    );
}

export function addOffsetPantograph(
    scene: THREE.Scene, 
    pv:{ x:number, y:number, z:number } ,
    via_axis: { x:number, y:number, z:number  }, 
    pantograh_length:number,
    offset:number
){

    // Calculate the direction vector from the first point to the second
    const startX = pv.x;
    const startY = pv.y;
    const endX = via_axis.x;
    const endY = via_axis.y;

    const dx = endX - startX;
    const dy = endY - startY;

    // Normalize the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const unitDx = dx / length;
    const unitDy = dy / length;

    const perpDx = -unitDy; // Perpendicular vector x
    const perpDy = unitDx;  // Perpendicular vector y
    // Set the point where the perpendicular line passes through
    const baseX = via_axis.x;
    const baseY = via_axis.y;

    //Galibo
    const X = 1000 - 980/2;
    const Y = 168;
    const Z = 270;
    const W = 90;
    const r1 = 250;
    const r2 = 100;
    const theta1 = 19;
    const theta2 = 21;
    const theta3 = 23;

    const newBaseX = baseX + unitDx * offset;
    const newBaseY = baseY + unitDy * offset;

    const GPoint01X = newBaseX + perpDx * pantograh_length/2; 
    const GPoint01Y = newBaseY + perpDy * pantograh_length/2;

    const GPoint1X = GPoint01X + perpDx * X; 
    const GPoint1Y = GPoint01Y + perpDy * X;

    const currentAngle = Math.atan2(GPoint1Y - newBaseY, GPoint1X - newBaseX);

    const GInclinationFirstCorner = theta1 * (Math.PI / 180);

    const GnewAngle = currentAngle + GInclinationFirstCorner;

    const GPoint2X = GPoint1X + Math.cos(GnewAngle) * Y;
    const GPoint2Y = GPoint1Y + Math.sin(GnewAngle) * Y;

    const GnewAngle2 = GnewAngle +  theta2 * (Math.PI/180);

    const GPoint3X = GPoint2X + Math.cos(GnewAngle2) * Z;
    const GPoint3Y = GPoint2Y + Math.sin(GnewAngle2) * Z;

    const GnewAngle3 = GnewAngle2 + theta3 * (Math.PI/180);

    const GPoint4X = GPoint3X + Math.cos(GnewAngle3) * W;
    const GPoint4Y = GPoint3Y + Math.sin(GnewAngle3) * W;

    const GPoint05X = newBaseX - perpDx * pantograh_length/2; 
    const GPoint05Y = newBaseY - perpDy * pantograh_length/2; 

    const GPoint5X = GPoint05X - perpDx * X; 
    const GPoint5Y = GPoint05Y - perpDy * X; 

    const GPoint6X = GPoint5X - Math.cos(GnewAngle) * Y;
    const GPoint6Y = GPoint5Y + Math.sin(GnewAngle) * Y;

    const GPoint7X = GPoint6X - Math.cos(GnewAngle2) * Z;
    const GPoint7Y = GPoint6Y + Math.sin(GnewAngle2) * Z;

    const GPoint8X = GPoint7X - Math.cos(GnewAngle3) * W;
    const GPoint8Y = GPoint7Y + Math.sin(GnewAngle3) * W;

    addLine(
      scene,
      [ 
        newBaseX,newBaseY,pv.z,
        GPoint01X,GPoint01Y,pv.z,
        GPoint1X,GPoint1Y,pv.z,
      ],
      0xff8000
    );

    addLine(
      scene,
      [ newBaseX,newBaseY,pv.z,
        GPoint05X,GPoint05Y,pv.z,
        GPoint5X,GPoint5Y,pv.z,
      ],
      0xff8000
    );

    addArc(
      scene,
      { x:GPoint2X, y:GPoint2Y, z:pv.z }, 
      {x:GPoint1X, y:GPoint1Y, z:pv.z},
      r1,  
      0xff8000,
      true,
      true
    );

    addArc(
      scene,
      {x:GPoint5X, y:GPoint5Y, z:pv.z},
      { x:GPoint6X, y:GPoint6Y, z:pv.z }, 
      r1,  
      0xff8000,
      true
    );


    addLine(
      scene,
      [ GPoint2X,GPoint2Y,pv.z,
        GPoint3X,GPoint3Y,pv.z,
      ],
      0xff8000
    );

    addLine(
      scene,
      [ GPoint6X,GPoint6Y,pv.z,
        GPoint7X,GPoint7Y,pv.z,
      ],
      0xff8000
    );

    addArc(
      scene,
      {x:GPoint3X, y:GPoint3Y,z: pv.z},
      { x:GPoint4X, y:GPoint4Y, z:pv.z }, 
      r2,  
      0xff8000,
      false,
      false
    );

    addArc(
      scene,
      {x:GPoint7X, y:GPoint7Y,z: pv.z},
      { x:GPoint8X, y:GPoint8Y, z:pv.z }, 
      r1,  
      0xff8000,
      true
    );
}

function addLine(
  scene: THREE.Scene, 
  array: number[], 
  color:number
){
    // Create geometry for the perpendicular line
    const LineGeometry = new THREE.BufferGeometry();
    const Vertices = new Float32Array(array);

    LineGeometry.setAttribute('position', new THREE.BufferAttribute(Vertices, 3));

    // Create a dashed line material for the perpendicular line
    const LineMaterial = new THREE.LineBasicMaterial({
        color: color, // Yellow color
        linewidth: 1,    // Line width
    });

    // Create the perpendicular line and compute its dash array
    const Line = new THREE.Line(LineGeometry, LineMaterial);
    Line.computeLineDistances(); // Required for dashed lines to render correctly

    Line.userData.type = 'axis';
    // Add the perpendicular line to the scene
    scene.add(Line);

}

function addArc(
  scene: THREE.Scene,
  point1: { x: number; y: number; z: number },
  point2: { x: number; y: number; z: number },
  radiusArc: number,
  color: number,
  invertCenter: boolean = false,
  isClockwise: boolean = true
) {
  // Calculate the midpoint between point1 and point2
  const midX = (point1.x + point2.x) / 2;
  const midY = (point1.y + point2.y) / 2;

  // Calculate the vector perpendicular to the line (from point1 to point2)
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpDx = -dy / length; // Perpendicular unit vector
  const perpDy = dx / length;

  // Adjust the direction of the radius center based on invertCenter
  const adjustedPerpDx = invertCenter ? -perpDx : perpDx;
  const adjustedPerpDy = invertCenter ? -perpDy : perpDy;

  // Calculate the center of the arc
  const distanceToCenter = Math.sqrt(radiusArc * radiusArc - (length / 2) ** 2);
  const centerX = midX + adjustedPerpDx * distanceToCenter;
  const centerY = midY + adjustedPerpDy * distanceToCenter;

  // Calculate angles for the arc
  let startAngle = Math.atan2(point1.y - centerY, point1.x - centerX);
  let endAngle = Math.atan2(point2.y - centerY, point2.x - centerX);

  // Normalize angles to range [0, 2π]
  if (startAngle < 0) startAngle += 2 * Math.PI;
  if (endAngle < 0) endAngle += 2 * Math.PI;

  // Ensure the shortest path for the arc
  if (isClockwise && endAngle > startAngle) {
    endAngle -= 2 * Math.PI;
  } else if (!isClockwise && startAngle > endAngle) {
    startAngle -= 2 * Math.PI;
  }

  // Create arc vertices
  const arcSegments = 50; // Number of segments for the arc
  const arcVertices = [];
  for (let i = 0; i <= arcSegments; i++) {
    const angle = startAngle + (i / arcSegments) * (endAngle - startAngle);
    const x = centerX + Math.cos(angle) * radiusArc;
    const y = centerY + Math.sin(angle) * radiusArc;
    arcVertices.push(x, y, point1.z); // Assuming z-coordinate remains the same
  }

  // Create the geometry for the arc
  const arcGeometry = new THREE.BufferGeometry();
  arcGeometry.setAttribute('position', new THREE.Float32BufferAttribute(arcVertices, 3));

  // Create material for the arc
  const arcMaterial = new THREE.LineBasicMaterial({
    color: color, // Specified color
    linewidth: 1,
  });

  // Create the arc as a line
  const arcLine = new THREE.Line(arcGeometry, arcMaterial);

  // Add the arc to the scene
  scene.add(arcLine);
}



/**
* Rotates an object around a specified point in world space.
*/
function rotateAroundPoint(
  object: THREE.Object3D,
  point: THREE.Vector3,
  axis: THREE.Vector3,
  angle: number
): void {
  // Translate the object to the origin (relative to the rotation point)
  object.position.sub(point);

  // Apply rotation
  object.position.applyAxisAngle(axis, angle);

  // Translate the object back to its original position
  object.position.add(point);

  // Rotate the object's orientation
  object.rotateOnWorldAxis(axis, angle);
}

export function addRail(
    scene: THREE.Scene,
    pv:{x:number,y:number,z:number},
    u:number,
    gauge:number,
    sleepers: { width:number, height:number },
    skate: { ht:number, hw:number, bw:number },
    curve_radius_direction:'inside'|'outside'
): void {
    // Draw the skate (rails)
    const railOffset = gauge / 2; // Distance from center to the rail
    const railHeight = skate.ht;
    const railWidthTop = skate.hw;
    const railWidthBottom = skate.bw;

    const angle_rotation = curve_radius_direction == 'inside' ? Math.asin(u/(gauge + (skate.hw))) : Math.asin(u/(gauge + (skate.hw)))*-1;
    // Define center of rotation
    const centerOfRotation = curve_radius_direction == 'inside' ? new THREE.Vector3(pv.x + gauge/2 + skate.hw/2, 0, pv.z) : new THREE.Vector3(pv.x - (gauge/2 + skate.hw/2), 0, pv.z);
    //const centerOfRotation = new THREE.Vector3(pv.x + gauge/2 + skate.hw/2, 0, pv.z);

    // Draw the sleepers
    const sleeperWidth = sleepers.width;
    const sleeperHeight = sleepers.height;
    const sleeperGeometry = new THREE.BoxGeometry(sleeperWidth, sleeperHeight, sleeperWidth*0.2);
    const sleeperMaterial = new THREE.MeshBasicMaterial({ color:  0xa8a29e }); // Brown for wood
    const sleeper = new THREE.Mesh(sleeperGeometry, sleeperMaterial);
    sleeper.position.set(pv.x, - (sleeperHeight / 2 + railHeight) + u , pv.z); // Centered and slightly below the rail
    // Rotate the sleeper around the center (this.pv, 0, 0)
    sleeper.position.sub(centerOfRotation); // Move to the origin (0, 0, 0)
    sleeper.rotateZ(angle_rotation); // Apply rotation around the Z-axis
    sleeper.position.add(centerOfRotation); // Move back to the original position

    sleeper.userData.color = 0xa8a29e;
    sleeper.userData.type = 'sleeper';
    sleeper.name = 'sleeper';

    scene.add(sleeper);

    const drawRail = (offsetX: number) => {
        const railShape = new THREE.Shape();

        // Define the rail profile (cross-section) in the XY plane
        railShape.moveTo(-railWidthBottom / 2, 0); // Bottom left
        railShape.lineTo(-railWidthBottom / 2, railHeight * 0.4); // Bottom vertical
        railShape.lineTo(-railWidthTop / 2, railHeight); // Top vertical left
        railShape.lineTo(railWidthTop / 2, railHeight); // Top horizontal
        railShape.lineTo(railWidthBottom / 2, railHeight * 0.4); // Bottom vertical right
        railShape.lineTo(railWidthBottom / 2, 0); // Bottom right
        railShape.closePath();

        // Create the geometry and mesh for the rail
        const railGeometry = new THREE.ShapeGeometry(railShape);
        const railMaterial = new THREE.MeshBasicMaterial({ color: 0x6b7280 }); // Gray for metal
        const rail = new THREE.Mesh(railGeometry, railMaterial);

        // Position the rail to be parallel to the XY plane
        rail.rotation.set(0, 0, 0); // Ensure no rotation to align with the XY plane
        rail.position.set(offsetX+pv.x, -railHeight + u, pv.z); // Offset along the X axis for the rail

        // Apply rotation around the center of rotation
        rotateAroundPoint(rail, centerOfRotation, new THREE.Vector3(0, 0, 1), angle_rotation);

        rail.name = 'skate';
        rail.userData.color = 0x6b7280;
        rail.userData.type = 'rail';

        scene.add(rail);
    };

    // Add both rails
    drawRail(-railOffset); // Left rail
    drawRail(railOffset); // Right rail
  }

export function addDimensions(scene: THREE.Scene, dimensions: Dimensions): void {
  const dimensionGroup = new THREE.Group();
  dimensionGroup.name = dimensions.groupId; // Assign a symbolic ID

  const start = new THREE.Vector3(dimensions.start.x, dimensions.start.y, dimensions.start.z);
  const end = new THREE.Vector3(dimensions.end.x, dimensions.end.y, dimensions.end.z);

  const RealLength = start.distanceTo(end);
  
  if(RealLength == 0) return;

  const coneHeight = dimensions.line.arrows.arrowHeight;

  // Adjust start and end points for the shortened line
  const direction = new THREE.Vector3().subVectors(end, start).normalize();
  const adjustedStart = start.clone().add(direction.clone().multiplyScalar(coneHeight / 2));
  const adjustedEnd = end.clone().sub(direction.clone().multiplyScalar(coneHeight / 2));

  // Calculate the new length and midpoint
  const length = adjustedStart.distanceTo(adjustedEnd);
  const midpoint = new THREE.Vector3().lerpVectors(adjustedStart, adjustedEnd, 0.5);

  // Calculate perpendicular offset
  const upVector = new THREE.Vector3(0, 0, 1); // Assuming Z is the up-axis
  const perpendicular3D = new THREE.Vector3().crossVectors(direction, upVector).normalize();
  const offsetDistance = dimensions.line.offset.distance; // Distance from the original line

  const offsetStart = adjustedStart.clone().add(perpendicular3D.clone().multiplyScalar(offsetDistance));
  const offsetEnd = adjustedEnd.clone().add(perpendicular3D.clone().multiplyScalar(offsetDistance));
  const offsetMidpoint = midpoint.clone().add(perpendicular3D.clone().multiplyScalar(offsetDistance)); // Corrected midpoint

  // Add a solid red cylinder as the dimension line
  const dimensionCylinderGeometry = new THREE.CylinderGeometry(dimensions.line.radius, dimensions.line.radius, length, 16);
  const dimensionMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const dimensionCylinder = new THREE.Mesh(dimensionCylinderGeometry, dimensionMaterial);

  // Align the cylinder with the direction vector
  const axis = new THREE.Vector3(0, 1, 0); // Default up axis of cylinder
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
  dimensionCylinder.setRotationFromQuaternion(quaternion);

  // Position the cylinder at the offset midpoint
  dimensionCylinder.position.copy(offsetMidpoint);
  dimensionGroup.add(dimensionCylinder);

  // Add cones at both ends
  const coneRadius = dimensions.line.arrows.arrowRadius;
  const coneSegments = dimensions.line.arrows.arrowSegments;

  // Geometry and material for the cones
  const coneGeometry = new THREE.ConeGeometry(coneRadius, coneHeight, coneSegments);
  const coneMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  // Create and position the start cone
  const startCone = new THREE.Mesh(coneGeometry, coneMaterial);
  startCone.position.copy(offsetStart);

  // Align the start cone to point outward
  const startQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Default up axis of cone
    direction.clone().negate() // Reverse the direction for outward pointing
  );
  startCone.setRotationFromQuaternion(startQuaternion);
  dimensionGroup.add(startCone);

  // Create and position the end cone
  const endCone = new THREE.Mesh(coneGeometry, coneMaterial);
  endCone.position.copy(offsetEnd);

  // Align the end cone to point outward
  const endQuaternion = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0), // Default up axis of cone
    direction // Same direction for outward pointing
  );
  endCone.setRotationFromQuaternion(endQuaternion);
  dimensionGroup.add(endCone);

  // Position and add the text
  const offsetTextDirection = new THREE.Vector3(0, 1, 0); // Assuming Z is the up-axis
  const textPosition = offsetMidpoint.clone().add(offsetTextDirection.clone().multiplyScalar(dimensions.text.offset.distance));

  // Load the font and create the text geometry
  const LengthInLabel = dimensions.groupId == "zig_zag" ?  RealLength : (RealLength/1000);
  const LengthInLabelFormatted = dimensions.groupId == "zig_zag" ? LengthInLabel.toFixed(0) : LengthInLabel.toFixed(2)

  const loader = new FontLoader();
  loader.load('/fonts/helvetiker_regular.typeface.json', (font) => {
    const textGeometry = new TextGeometry(LengthInLabelFormatted, {
      font: font,
      size: dimensions.text.size, // Font size
      height: dimensions.text.height, // Text extrusion depth
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);

    // Position the text at the midpoint
    textMesh.position.copy(textPosition);

    // Add the text mesh to the scene
    dimensionGroup.add(textMesh);
  });

  scene.add(dimensionGroup);
}

export function addCantileverLinks(scene: THREE.Scene, cantilever:CantileverDataContent): void {

  cantilever.links.forEach((link) => {
    // Create points for the line
    const start = new THREE.Vector3(link.x1,link.y1, link.z1 );
    const end = new THREE.Vector3(link.x2, link.y2, link.z2  );

    //CylinderGeometry
    // Calculate the direction and length
    const direction = new THREE.Vector3().subVectors(end, start);
    const length = direction.length();
    direction.normalize();

    if(link.shape === 'circle'){
      // Create the cylinder geometry
      const cylinderGeometry = new THREE.CylinderGeometry((link.dimensions.height/2), (link.dimensions.width/2), length, 24);
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
      cylinder.name = link.elementId;
      cylinder.userData.color = 0x808080;
      cylinder.userData.type = 'link';
      cylinder.userData.start = start;
      cylinder.userData.end = end;
      cylinder.userData.id = `${link.elementId}`;

      // Add the cylinder to the scene
      scene.add(cylinder);
    }else if (link.shape === 'isolator') {
      const group = new THREE.Group();
      // Heights for the rings
      const borderHeight = length * 0.2 / 2;
      const MainRingCount = 3;
      const mainHeight = (length * 0.3) / MainRingCount;
      const connectionHeight = length * 0.5 / Math.floor(MainRingCount + 1);

      const borderRadiusOutside = link.dimensions.width / 2;
      const borderRadiusInside = borderRadiusOutside * 1.5;
      const connectionRadius = borderRadiusOutside * 1.5;
      const mainRadius = borderRadiusOutside * 3;

      // Add border ring at start
      const addRing = (position: THREE.Vector3, topRadius: number, bottomRadius: number, height: number) => {
        const geometry = new THREE.CylinderGeometry(topRadius, bottomRadius, height, 24);
        const material = new THREE.MeshBasicMaterial({ color: 0xaaf2ef, wireframe: false });
        const ring = new THREE.Mesh(geometry, material);

        ring.position.copy(position);

        const axis = new THREE.Vector3(0, 1, 0); // Default up axis of cylinder
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction.clone().normalize());
        ring.setRotationFromQuaternion(quaternion);

        group.add(ring);
      };

      // Add border ring at the start
      let currentPosition = new THREE.Vector3().copy(start);
      currentPosition = currentPosition.add(direction.clone().multiplyScalar(borderHeight/2));
      addRing(currentPosition, borderRadiusInside, borderRadiusOutside, borderHeight);
      currentPosition = currentPosition.add(direction.clone().multiplyScalar(borderHeight/2));

      // Add connection, main, and remaining rings
      let remainingHeight = length - 2 * borderHeight; // Exclude border rings
      let isMainRing = false;

      while (remainingHeight > 0) {
        let ringHeight = isMainRing ? mainHeight : connectionHeight;
        const radius = isMainRing ? mainRadius : connectionRadius;

        // Update current position and add the ring
        currentPosition = currentPosition.add(direction.clone().multiplyScalar(ringHeight/2));
        addRing(currentPosition, radius, radius, ringHeight);
        currentPosition = currentPosition.add(direction.clone().multiplyScalar(ringHeight/2));
        remainingHeight -= ringHeight;
        isMainRing = !isMainRing; // Alternate between main and connection rings
      }

      // Add border ring at the end
      currentPosition = currentPosition.add(direction.clone().multiplyScalar(borderHeight/2));
      addRing(currentPosition, borderRadiusOutside, borderRadiusInside, borderHeight);

      // Store custom data in the group
      group.name = link.elementId;
      group.userData.color = 0x808080;
      group.userData.type = 'link';
      group.userData.start = start;
      group.userData.end = end;
      group.userData.id = `${link.elementId}`;

      // Add the group to the scene
      scene.add(group);
    }
  });
}

export function setMeshColor(object: THREE.Object3D | null, color: number): void {
    if (object && object instanceof THREE.Mesh) {
      const material = object.material;
      if (Array.isArray(material)) {
        material.forEach(mat => {
          if (mat instanceof THREE.MeshBasicMaterial) {
            mat.color.set(color);
          }
        });
      } else if (material instanceof THREE.MeshBasicMaterial) {
        material.color.set(color);
      }
    }
  }

export function onFieldActive(scene:THREE.Scene, id: string): void {
  // Try to find the object by its name (which is now set to link.elementId)
  const group = scene.getObjectByName(id);

  if (group) {
    if (group instanceof THREE.Group) {
      // Iterate over each object within the group
      group.children.forEach((object: THREE.Object3D) => {
        // Ensure the object is a mesh before setting color
        if (object instanceof THREE.Mesh) {
          setMeshColor(object, 0x00ff00); // Set the mesh color to green
        }
      });
    } else if (group instanceof THREE.Mesh) {
      // If it's not a group but a mesh, just paint it directly
      setMeshColor(group, 0x00ff00); // Set the mesh color to green
    }
  } else {
    console.warn(`No object found with ID: ${id}`);
  }
}

export function onFieldInactive(scene:THREE.Scene, id: string): void {
  const group = scene.getObjectByName(id);

  if(group){
    if (group instanceof THREE.Group) {
      // Iterate over each object within the group
      group.children.forEach((object: THREE.Object3D) => {
        // Ensure the object is a mesh before setting color
        if (object instanceof THREE.Mesh) {
          setMeshColor(object, 0xff0000); // Set the mesh color to blue (or your desired color)
          console.log(`Object with ID ${id} is now active. Painted object ${object.name}.`);
        }
      });
    }else if(group instanceof THREE.Mesh){
      const object = group;
      setMeshColor(object, object.userData.color); // Set the mesh color to blue (or your desired color)
      
    }
  }else{
    console.warn(`No group found with ID: ${id}`);
  }
}
