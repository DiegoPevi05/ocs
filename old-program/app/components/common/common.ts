export function getDistanceBetweenTwoPoints3D(point1: {x: number, y: number, z: number}, point2: {x: number, y: number, z: number}): number {
    return Math.sqrt(
      Math.pow((point2.x - point1.x), 2) + 
      Math.pow((point2.y - point1.y), 2) + 
      Math.pow((point2.z - point1.z), 2)
    );
}

export function translate3DPoint(point: {x: number, y: number, z: number}, translation: {x: number, y: number, z: number}): {x: number, y: number, z: number} {
    return {
        x: point.x + translation.x,
        y: point.y + translation.y,
        z: point.z + translation.z
    }
}

export function rotate3DPoint(point:{x:number,y:number,z:number}, axis:string, angle:number, origin:{x:number,y:number,z:number}): {x:number,y:number,z:number} {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = point.x - origin.x;
    const y = point.y - origin.y;
    const z = point.z - origin.z;
    
    if (axis === 'x') {
        return {
            x: x,
            y: y * cos - z * sin,
            z: y * sin + z * cos
        }
    } else if (axis === 'y') {
        return {
            x: x * cos + z * sin,
            y: y,
            z: -x * sin + z * cos
        }
    } else if (axis === 'z') {
        return {
            x: x * cos - y * sin,
            y: x * sin + y * cos,
            z: z
        }
    }
    return point;
}