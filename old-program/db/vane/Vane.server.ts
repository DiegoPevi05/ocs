class Vane {
  // Properties common to all cantilevers.
  model:VaneModelInterface;
	contact_wire:ContactWire;
  support_wire: SupportWire;
  //system_height_a:number;
	//system_height_b:number;
	vane_length:number;
	initial_separation:number;
  qty_droppers:number;
  dropper_separation:number;
  dropper_weight:number;
  arrow:boolean;
  arrow_length:number;
  lifting:boolean;
  separation_calculation:boolean;
  default_properties:defaultProperties;
  lifting_ref:{ position: number, value:number  };
  cantilevers:CantileverDataContent[];
  pov:"local"|"global";
  poles:{ 
    contact_wire_point:{x:number,y:number,z:number},
    support_wire_point:{x:number,y:number,z:number}
  }[];
  // Constructor to initialize the properties.
  constructor(
    model:VaneModelInterface,
    contact_wire:ContactWire,
    support_wire: SupportWire,
    initial_separation:number,
    qty_droppers:number,
    dropper_weight:number,
    arrow:boolean,
    arrow_length:number,
    lifting:boolean,
    separation_calculation:boolean,
    default_properties:defaultProperties,
    cantilevers:CantileverDataContent[],
    pov:"local"|"global"
  ) {

    this.poles = [];
    this.model = model;
    this.contact_wire = contact_wire;
    this.support_wire = support_wire;

    this.initial_separation = initial_separation;
    this.qty_droppers = qty_droppers;
    this.dropper_weight = dropper_weight;

    this.arrow = arrow;
    this.arrow_length = arrow_length;
    this.lifting = lifting;
    this.cantilevers = cantilevers;
    this.pov = pov;
    this.default_properties = default_properties;
    this.separation_calculation = separation_calculation;

    this.setPoles();
    this.setDropperQuantityCalculation();
    this.lifting_ref = this.getLifting();
    this.vane_length = this.getVaneLength();
    this.dropper_separation = ((this.vane_length)- (2*this.initial_separation))/(this.qty_droppers-1);

  }

  setPoles():void{

    if(this.pov === "global"){

      this.poles.push({ contact_wire_point : this.cantilevers[0].cw, support_wire_point:this.cantilevers[0].mw });
      this.poles.push({ contact_wire_point : this.cantilevers[1].cw, support_wire_point:this.cantilevers[1].mw });


    }else if(this.cantilevers.length > 0 && this.pov === "local"){

      const lengthXZ    = (v) => Math.sqrt(v.x * v.x + v.z * v.z);
      const ModuleCW_0  = lengthXZ(this.cantilevers[0].cw);
      const ModuleCW_1  = lengthXZ(this.cantilevers[1].cw);

      const isFirstOneSmallerThanSecond = ModuleCW_0 <  ModuleCW_1;

      const translateXYCoord = (a,b) => {
        return {
          x: b.x - a.x,
          y: b.y,
          z: b.z - a.z
        }
      }

      this.poles.push({ 
        contact_wire_point : (isFirstOneSmallerThanSecond ? translateXYCoord(this.cantilevers[0].cw, this.cantilevers[0].cw): translateXYCoord(this.cantilevers[1].cw, this.cantilevers[0].cw)),
        support_wire_point: (isFirstOneSmallerThanSecond ? translateXYCoord(this.cantilevers[0].mw, this.cantilevers[0].mw): translateXYCoord(this.cantilevers[1].mw, this.cantilevers[0].mw))
      });

      this.poles.push({
        contact_wire_point : (isFirstOneSmallerThanSecond ? translateXYCoord(this.cantilevers[0].cw, this.cantilevers[1].cw): translateXYCoord(this.cantilevers[1].cw, this.cantilevers[1].cw)),
        support_wire_point: (isFirstOneSmallerThanSecond ? translateXYCoord(this.cantilevers[0].mw, this.cantilevers[1].mw): translateXYCoord(this.cantilevers[1].mw, this.cantilevers[1].mw))
      });

    }else{

      this.poles.push({ 
        contact_wire_point: { 
          x:0, 
          y: (this.default_properties.contact_wire_height_a), 
          z:0 
        }, 
        support_wire_point: { 
          x:0, 
          y:(this.default_properties.contact_wire_height_a + this.default_properties.system_height_a), 
          z:0 
        } 
      });

      this.poles.push({ 
        contact_wire_point: { 
          x: this.default_properties.vane_length, 
          y:(this.default_properties.contact_wire_height_b), 
          z:0 
        }, 
        support_wire_point:  { 
          x: this.default_properties.vane_length, 
          y:(this.default_properties.contact_wire_height_b + this.default_properties.contact_wire_height_b), 
          z:0 
        } 
      });
    }
  }
  
  setDropperQuantityCalculation():void{

    if(this.separation_calculation){

      const { initial_separation, qty_droppers } =  this.getDroppersQuantity();

      this.initial_separation = initial_separation;
      this.qty_droppers = qty_droppers;

    }

  }

  getLifting():{ position: number, value:number  } {

    if(this.poles[0].contact_wire_point.y == this.poles[1].contact_wire_point.y){
      return {position:0, value:0};
    }

    if(this.lifting){
      if(this.poles[0].contact_wire_point.y > this.poles[1].contact_wire_point.y){
        const lifting = this.poles[0].contact_wire_point.y - this.poles[1].contact_wire_point.y;
        return {position:0, value:lifting};

      }else{
        const lifting = this.poles[1].contact_wire_point.y - this.poles[0].contact_wire_point.y;
        return {position:1, value:lifting};

      }
    }else{
      return {position:0, value:0};
    }


  }

  radiansToDegrees(radians: number): number {
    return radians * (180 / Math.PI);
  }

  getVaneLength():number{
    return this.getDistanceBetweenTwoPoints3D(
      this.poles[0].contact_wire_point,
      this.poles[this.poles.length-1].contact_wire_point
    );
  };

  getSystemHeightA():number{
    if(this.lifting && this.lifting_ref.position == 0){
      return this.getVerticalDistanceBetweenTwoPoints3D(
        { x: this.poles[0].contact_wire_point.x, y: this.poles[1].contact_wire_point.y, z: this.poles[0].contact_wire_point.z },
        { x: this.poles[0].support_wire_point.x, y: this.poles[0].support_wire_point.y, z: this.poles[0].support_wire_point.z }
      );
    }

    return this.getVerticalDistanceBetweenTwoPoints3D(
      this.poles[0].contact_wire_point,
      this.poles[0].support_wire_point
    );

  }

  getSystemHeightB():number{

    if(this.lifting && this.lifting_ref.position == 1){
      return this.getVerticalDistanceBetweenTwoPoints3D(
        { x: this.poles[1].contact_wire_point.x, y: this.poles[0].contact_wire_point.y, z: this.poles[1].contact_wire_point.z },
        { x: this.poles[1].support_wire_point.x, y: this.poles[1].support_wire_point.y, z: this.poles[1].support_wire_point.z }
      );
    }

    return this.getVerticalDistanceBetweenTwoPoints3D(
      this.poles[this.poles.length-1].contact_wire_point,
      this.poles[this.poles.length-1].support_wire_point
    );
  }

  getInitialContactWireHeight():number{
    return this.poles[0].contact_wire_point.y;
  }

  getAverageContactWireHeight():number{
    return (this.poles[0].contact_wire_point.y + this.poles[this.poles.length-1].contact_wire_point.y)/2;
  }

  getVerticalDistanceBetweenTwoPoints3D(point1: {x: number, y: number, z: number}, point2: {x: number, y: number, z: number}): number {
    return Math.abs(point1.y - point2.y);
  }

  getDropperInclination(contact_wire_point: {x:number, y:number, z:number}, support_wire_point: {x:number, y:number, z:number}): number {
    //let vector1 = {x:contact_wire_point.x - support_wire_point.x, y:contact_wire_point.y - support_wire_point.y, z:contact_wire_point.z - support_wire_point.z};
    let vector1= {x:support_wire_point.x - contact_wire_point.x, y:support_wire_point.y - contact_wire_point.y, z:support_wire_point.z - contact_wire_point.z};
    let vector2 = {x:0, y:0, z:1};
    return this.getAngleBetweenTwoVectors(vector1, vector2);
  }

  getAngleBetweenTwoVectors(vector1: {x: number, y: number, z: number}, vector2: {x: number, y: number, z: number}): number {
    const dotProduct = vector1.x * vector2.x + vector1.y * vector2.y + vector1.z * vector2.z;
    const magnitude1 = Math.sqrt(vector1.x * vector1.x + vector1.y * vector1.y + vector1.z * vector1.z);
    const magnitude2 = Math.sqrt(vector2.x * vector2.x + vector2.y * vector2.y + vector2.z * vector2.z);
    return Math.acos(dotProduct / (magnitude1 * magnitude2));
  }

  getPointAlongVector(
    startPoint: {x: number, y: number, z: number}, 
    endPoint: {x: number, y: number, z: number}, 
    distance: number
  ): {x: number, y: number, z: number} {

    // Get total length between points
    const totalLength = this.getDistanceBetweenTwoPoints3D(startPoint, endPoint);
    
    // Calculate the ratio (0 to 1) based on distance
    const ratio = Math.min(Math.max(distance / totalLength, 0), 1);
    
    // Linear interpolation for each coordinate
    return {
      x: startPoint.x + (endPoint.x - startPoint.x) * ratio,
      y: startPoint.y + (endPoint.y - startPoint.y) * ratio,
      z: startPoint.z + (endPoint.z - startPoint.z) * ratio
    };
  }


  getDistanceBetweenTwoPoints3D(point1: {x: number, y: number, z: number}, point2: {x: number, y: number, z: number}): number {
    return Math.sqrt(
      Math.pow((point2.x - point1.x), 2) + 
      Math.pow((point2.y - point1.y), 2) + 
      Math.pow((point2.z - point1.z), 2)
    );
  }

  subtractVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}): Vector3 {
    return {
      x: a.x - b.x, 
      y: a.y - b.y, 
      z: a.z - b.z
    };
  }

  lengthVector(v: Vector3){
    return Math.sqrt(this.dotVectors(v,v))

  }

  getDroppersQuantity():{ initial_separation:number, qty_droppers:number }{

    const vaneLength = this.getDistanceBetweenTwoPoints3D(this.poles[0].contact_wire_point, this.poles[1].contact_wire_point);

    let initial_separation = this.initial_separation;
    let qty_droppers = this.qty_droppers;

    initial_separation = 2000;

    if(vaneLength <= 20000){

      qty_droppers = 4;
    
    }else if(vaneLength > 20000 && vaneLength < 30000){
      
      qty_droppers = 4;

    }else if(vaneLength >= 30000 && vaneLength < 34000){
      
      qty_droppers = 6;

    }else if(vaneLength >= 34000 && vaneLength < 38000){
      
      qty_droppers = 6;

    }else if(vaneLength >= 38000 && vaneLength < 40000){
      
      qty_droppers = 7;

    }else if(vaneLength >= 40000 && vaneLength < 60000){
      
      qty_droppers = 7;

    }else if(vaneLength >= 60000){
      
      qty_droppers = 11;
    }


    return {initial_separation , qty_droppers};
  }

}



export { Vane };
