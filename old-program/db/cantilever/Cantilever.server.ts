class Cantilever {
  // Properties common to all cantilevers.
  poleModel:PoleModelInterface;
  esc:number;
  system_height:number;
  contact_wire_vertical_offset:number;
  contact_wire_height: number;
  bottom_fixed_height:number;
  fixing_distance:number;
  zig_zag:number;
  track:Track;
  pantograph:Pantrograph;
  support_offset:number;
  u:number;
  curve_radius_direction:'inside'|'outside';
  pv:{ x:number, y:number , z:number };
  model: ModelInterface;
  pov:'local'|'global';
  pole:PolePropertiesParams;
  polePosition:{x:number, y:number, z:number};
  poleProjection:{x:number,y:number,z:number};
  directionPV:{x:number,y:number,z:number};

  public track_inclination: number;
  public cw_axis: {x:number, y:number, z:number};
  public mw_axis: {x:number, y:number, z:number};
  public via_axis: {x:number, y:number, z:number};
  via_direction: {x:number, y:number, z:number};

  // Constructor to initialize the properties.
  constructor(
    poleModel:PoleModelInterface,
    esc:number,
    system_height:number,
    contact_wire_vertical_offset:number,
    contact_wire_height: number,
    bottom_fixed_height:number,
    fixing_distance:number,
    zig_zag:number,
    track:Track,
    pantograph:Pantrograph,
    support_offset:number,
    u:number,
    curve_radius_direction:'inside'|'outside',
    pv:{ x:number, y:number, z:number },
    model:ModelInterface,
    pole:PolePropertiesParams|null,
    pov:'local'|'global'

  ) {
    this.poleModel = poleModel;
    this.esc = esc;
    this.system_height = system_height;
    this.contact_wire_vertical_offset = contact_wire_vertical_offset;
    this.contact_wire_height = contact_wire_height;
    this.bottom_fixed_height = bottom_fixed_height;
    this.fixing_distance = fixing_distance;
    this.zig_zag = zig_zag;
    this.track = track;
    this.pantograph = pantograph;
    this.support_offset = support_offset;
    this.u = u;
    this.curve_radius_direction = curve_radius_direction;
    this.pv = pv;
    this.model = model;
    this.pov = pov;
    this.pole = pole;

    this.initialize();
    this.track_inclination = this.getTrackInclintation();
    this.updatePointOfVia();
    this.via_axis = this.getViaAxis();
    this.cw_axis = this.getCwAxis();
    this.mw_axis = this.getMwAxis();

  }

  private initialize() {
    this.setPolePosition();
    this.setPoleModel();
    this.setPv();
    this.setDirectionPv();
  }

  setPolePosition(){

    if(this.pole !== null && this.pov === 'global'){

      this.polePosition = {x:this.pole.position.x, y:0, z:-this.pole.position.z} 

    }else if(this.pole !== null && this.pov === 'local'){

      this.polePosition = { x:0, y:0, z:this.pole.position.z};
    }else{

      this.polePosition = { x:0, y:0, z:0};

    }

  };

  setPoleModel(){

    if(this.pole !== null && this.pov === 'global'){

      this.poleModel = this.pole.model;

    }

  }

  setPv(){

    if(this.pole !== null && this.pov === 'global'){

      this.pv = {x:this.pv.x, y:0, z:-this.pv.z} 

      return;

    }else if(this.pole !== null && this.pov === 'local'){

      const pvL = this.lengthVector(this.subtractVectors(this.pole.position, this.pv));

      this.pv = {x:pvL, y:0, z:0} 

    }else {

      return;

    }

  }

  setDirectionPv(){

    this.directionPv = this.getDirectionVector(
      { 
        x:this.polePosition.x,
        y:0,
        z:this.polePosition.z
      } ,
      {
        x:this.pv.x,
        y:0,
        z:this.pv.z
      }
    );

    this.via_direction = {x:0, y:1, z:0 };

  }

  getTrackInclintation(): number {
    // Ensure the ratio is between -1 and 1 to avoid errors in acos calculation
    const ratio = this.u / (this.track.gauge + this.track.skate.hw) //this.track.skate.hw );
    // Calculate the angle in radians and return it
    return Math.asin(ratio);
    //return this.degreesToRadians(0);
  }

  // 1) Helper: compute pole’s global Y-rotation from its world PV
  private computePoleYRotation(): number {
    const dx = this.pv.x - this.polePosition.x;
    const dz = this.pv.z - this.polePosition.z;
    // Angle from +Z axis towards +X
    return Math.atan2(dx, dz);
  }

  updatePointOfVia(): void {
    if (this.u === 0) return;

    // radius half-gauge + skate half-height
    const r = this.track.gauge/2 + this.track.skate.hw/2;

    const dirXZ = this.directionPv; // { x, y: 0, z }, and normalized

    const cosAlpha = Math.cos(this.track_inclination);
    const sinAlpha = Math.sin(this.track_inclination);

    // Now scale the XZ direction by cos(alpha) and use sin(alpha) for Y
    let CwXYDir = {
      x: dirXZ.x * sinAlpha * -1,
      y: cosAlpha,
      z: dirXZ.z * sinAlpha * -1,
    };

    if (this.curve_radius_direction === 'outside') {

      CwXYDir = {
        x: dirXZ.x * sinAlpha,
        y: cosAlpha,
        z: dirXZ.z * sinAlpha,
      };

    }

    const xL = r - r*cosAlpha;
    const yL = r*sinAlpha;

    const length = Math.sqrt(xL * xL + yL * yL);

    this.via_direction = CwXYDir;

    this.pv = this.addVectors(this.pv,this.scaleVector(CwXYDir,length));

  }

  getViaAxis(): { x: number; y: number; z: number } {

    return this.addVectors(this.pv,this.scaleVector(this.via_direction,this.contact_wire_height));

  }


  getCwAxis(): { x: number; y: number; z: number } {

    const realPvDir = this.getDirectionVector(this.polePosition, this.pv); 

    const perpPlane = this.normalizeVector(this.crossVectors(realPvDir, {x:0, y:1, z:0 } ))

    const viaDirection = this.normalizeVector(this.crossVectors(realPvDir, perpPlane ))

    const V1 =  this.addVectors(this.via_axis,this.scaleVector(realPvDir,this.zig_zag));

    return this.addVectors(V1,this.scaleVector(this.invertVectorDirection(viaDirection),this.contact_wire_vertical_offset ))
  }


  getMwAxis(): { x: number; y: number; z: number } {

    return  this.addVectors(this.cw_axis,this.scaleVector({x:0,y:1,z:0},this.system_height));

  }

  degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  radiansToDegress(radians:number): number{
    return radians * (180/Math.PI);
  }

  getDistanceBetweenTwoPoints3D(point1: {x: number, y: number, z: number}, point2: {x: number, y: number, z: number}): number {
    return Math.sqrt(
      Math.pow((point2.x - point1.x), 2) + 
      Math.pow((point2.y - point1.y), 2) + 
      Math.pow((point2.z - point1.z), 2)
    );
  }

  getDistanceBetweenTwoPoints(point1:{x:number,y:number},point2:{x:number,y:number}):number{
    return  Math.sqrt(Math.pow((point2.y - point1.y), 2) + Math.pow((point2.x - point1.x),2))  ; 
  }

  getAngleBetweenTwoPoints(point1:{x:number,y:number},point2:{x:number,y:number}):number {

    return this.radiansToDegress(Math.atan((point2.y - point1.y)/(point2.x - point1.x)));
  }

  getIsolatorUtilLength(isolator:Isolator):number{
    return isolator.eye_length - isolator.tube_length
  }

  getClevisEndFittingUtilLength(clevisEndFitting:ClevisEndFitting):number {
    return clevisEndFitting.L - clevisEndFitting.a;
  }

  getSwivelClevisUtilLength(swivel_bracket:SwivelBracket, swivel_clevis:SwivelClevis){
    return swivel_bracket.x_pin + swivel_clevis.pin_eye;

  }



  getMarginViewer():{left:number, right:number, top:number, bottom:number}{
    return {
      left: -1000,
      right:this.getCwAxis().x + 1000,
      bottom: this.getCwAxis().y - 500,
      top:this.getMwAxis().y + 500
    }
  }

  roundToDecimals(value:number, qtyDecimals:number):number{
    const decimals = Math.pow(10, qtyDecimals);
    const rounded = Math.round(value * decimals) / decimals; 
    return  rounded;
  }

  getDirectionVector(from: {x:number, y:number, z:number}, to: {x:number, y:number, z:number}): Vector3 {
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

  getPointFromDirection(origin: {x:number, y:number, z:number}, direction: Vector3, magnitude: number): Vector3 {
    return {
      x: origin.x + direction.x * magnitude,
      y: origin.y + direction.y * magnitude,
      z: origin.z + direction.z * magnitude
    };
  }

  subtractVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}): Vector3 {
    return {
      x: a.x - b.x, 
      y: a.y - b.y, 
      z: a.z - b.z
    };
  }

  addVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}){
    return {
      x: a.x + b.x, 
      y: a.y + b.y, 
      z: a.z + b.z
    }
  }

  scaleVector(v: Vector3, s: number){
    return {
      x: v.x*s, y: v.y*s, z: v.z*s
    }
  }

  dotVectors(a: Vector3, b: Vector3){
    return a.x*b.x + a.y*b.y + a.z*b.z;
  }

  crossVectors(a: Vector3, b: Vector3){
    return {
      x: a.y*b.z - a.z*b.y,
      y: a.z*b.x - a.x*b.z,
      z: a.x*b.y - a.y*b.x
    }
  }

  lengthVector(v: Vector3){
    return Math.sqrt(this.dotVectors(v,v))

  }

  normalizeVector(v: Vector3){
    const len = this.lengthVector(v);
    if (len === 0) throw new Error("Zero vector");
    return this.scaleVector(v, 1/len);

  }

  getVectorsPlaneNormal(
    v1: Vector3,
    v2: Vector3,
    v3: Vector3
  ): Vector3 {
    const H = subtract(v2, v1);
    const U = subtract(v3, v1);
    return normalizeVector(crossVectors(H, U));
  }

  invertVectorDirection(v: Vector3): Vector3 {
    return {
      x: -v.x,
      y: -v.y,
      z: -v.z,
      };
  }

}



export { Cantilever };
