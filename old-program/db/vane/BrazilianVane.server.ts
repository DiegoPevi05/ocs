import { Vane } from "./Vane.server";

class BrazilianVane extends Vane {

  // Constructor to initialize the CantileverBrazilian properties.
  //
  dimensions:Dimensions[];
  dropper_indexes: number[];
  dropper_weights: number[];
  diffElementsWeights:number[];
  diffElementsPositions: {x:number,y:number,z:number}[];
  diffElementsArrow:number[];
  diffHeights:number[];
  diffElementsLifting:number[];
  reaction_ay:number;
  reaction_ax:number;
  previous_reaction_ax:number;
  reaction_bx:number;
  reaction_by:number;
  step:number;
  startPoint:{x:number,y:number,z:number};
  endPoint:{x:number,y:number,z:number};
  h:number;

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
    defaultProperties:defaultProperties,
    cantilevers:CantileverDataContent[],
    pov:"local"|"global"
  ) {

    // Call the parent constructbior to initialize inherited properties.
    super(
        model,
        contact_wire,
        support_wire,
        initial_separation,
        qty_droppers,
        dropper_weight,
        arrow,
        arrow_length,
        lifting,
        separation_calculation,
        defaultProperties,
        cantilevers,
        pov 
    );


    this.dimensions = [];
    this.step = 100;
    this.reaction_ay = 0;
    this.reaction_ax = 0;
    this.reaction_bx = 0;
    this.reaction_by = 0;
    this.previous_reaction_ax = 0;
    this.diffElementsPositions = [];
    this.diffElementsWeights = [];
    this.diffHeights = [];
    this.diffElementsLifting = [];
    this.diffElementsArrow = [];
    this.dropper_indexes = [];
    this.dropper_weights = Array.from({ length: this.qty_droppers }, () => 0);
    this.startPoint = this.getReferencePoints().startPoint;
    this.endPoint = this.getReferencePoints().endPoint;
    this.h = this.getSystemHeightA() - this.getSystemHeightB();
    this.generateInterations(2);
  }

  private getReferencePoints():{startPoint:{x:number,y:number,z:number}, endPoint:{x:number,y:number,z:number}}{

    let startPoint = this.poles[0].contact_wire_point;
    let endPoint   =  this.poles[1].contact_wire_point;

    if(this.lifting){

      if(this.lifting_ref.position == 1){

        endPoint = { x:this.poles[1].contact_wire_point.x, y:this.poles[0].contact_wire_point.y, z:this.poles[1].contact_wire_point.z };

      }else{
        
        startPoint = { x:this.poles[0].contact_wire_point.x, y:this.poles[1].contact_wire_point.y, z:this.poles[0].contact_wire_point.z };
      }
    }

    return {startPoint, endPoint};
  }

  private generateDiffElements():void {

      /*this.diffElementsPositions = [];

      // 1. Generate step-based distances
      const stepDistances = [];
      for (let k = 0; k <= Math.floor(this.vane_length / this.step); k++) {
        stepDistances.push(k * this.step);
      }

      // 2. Generate dropper distances
      const dropperDistances = [];
      for (let i = 0; i < this.qty_droppers; i++) {
        const dropperDistance = this.initial_separation + i * this.dropper_separation;
        if (dropperDistance <= this.vane_length) { // Ensure it doesn’t exceed vane_length
          dropperDistances.push(dropperDistance);
        }
      }

      // 3. Include the end point explicitly if not already in stepDistances
      if (!stepDistances.includes(this.vane_length)) {
        stepDistances.push(this.vane_length);
      }

      // 4. Combine all distances, remove duplicates, and sort
      const allDistances = [...new Set([...stepDistances, ...dropperDistances])].sort((a, b) => a - b);

      // 5. Generate points for all unique distances
      this.diffElementsPositions = allDistances.map(distance =>
        this.getPointAlongVector(this.startPoint, this.endPoint, distance)
      );

      // 6. Find dropper indices with a small tolerance for floating-point precision
      this.dropper_indexes = [];
      for (let i = 0; i < this.qty_droppers; i++) {
        const targetDistance = this.initial_separation + i * this.dropper_separation;
        const droper_position = this.diffElementsPositions.findIndex((point) => {
          const distanceFromStart = this.getDistanceBetweenTwoPoints3D(this.startPoint, point);
          return Math.abs(distanceFromStart - targetDistance) < 1e-6; // Very small tolerance
        });
        this.dropper_indexes.push(droper_position);
      }*/

    for(let i=0; i < this.qty_droppers+2; i++){

      if(i == 0 ){

        this.diffElementsPositions[i] = this.startPoint;

      }else if(i == 1 ){

        this.diffElementsPositions[i] = this.getPointAlongVector(
          this.startPoint,
          this.endPoint,
          this.initial_separation
        );

      }else if(i == this.qty_droppers+1){

        this.diffElementsPositions[i] = this.endPoint;

      }else{

        this.diffElementsPositions[i] = this.getPointAlongVector(
          this.startPoint,
          this.endPoint,
          this.initial_separation + (i-1)*this.dropper_separation
        );
      }
      
    }

    // Reset dropper_indexes before populating
    this.dropper_indexes = [];

    for(let i = 0; i < this.qty_droppers; i++) {

      const targetDistance = this.initial_separation + i * this.dropper_separation;
      //console.log("targetDistance: ",targetDistance)
      // Find the position index where the distance matches most closely
      const droper_position = this.diffElementsPositions.findIndex((point) => {
        // Calculate distance from start pole to this point
        const distanceFromStart = this.getDistanceBetweenTwoPoints3D(
          this.startPoint,
          point
        );
        //console.log("distanceFromStart: ",distanceFromStart)
        return Math.abs(distanceFromStart - targetDistance) < 0.1; // Small tolerance for floating point comparison
      });
      
      this.dropper_indexes.push(droper_position);
    }

    this.diffElementsArrow = Array.from({ length: this.diffElementsPositions.length }, () => 0);

  }

  private getRelDiffMoments(n:number):number{
    let sum = 0;
    const relative_element_length = this.getDistanceBetweenTwoPoints3D(this.startPoint, this.diffElementsPositions[n]);
    for(let x = 1 ; x < n ; x++ ){
      const element_length = this.getDistanceBetweenTwoPoints3D(this.startPoint, this.diffElementsPositions[x]);
      sum = sum +this.diffElementsWeights[x]*(relative_element_length - element_length);
    };
    return sum;
  }

  private getAbsDiffMoments():number{
    let sum = 0;
    for(let x = 1 ; x <= this.diffElementsPositions.length - 2 ; x++ ){
      const element_length = this.getDistanceBetweenTwoPoints3D(this.startPoint, this.diffElementsPositions[x]);
      sum = sum +this.diffElementsWeights[x]*((this.vane_length - element_length));
    };
    return sum;
  }

  private generateDiffWeights():void{

    let totalWeight = this.contact_wire.weight; //+ this.support_wire.weight; 

    for(let x = 0 ; x < this.diffElementsPositions.length - 1; x++ ){
      if(x == 0 || x == this.diffElementsPositions.length - 1){
        this.diffElementsWeights[x] = 0;
      }else{

        let dropper_weight = 0;
        const index = this.dropper_indexes.indexOf(x);

        if (index !== -1) {
          dropper_weight = this.dropper_weights[index];
        }

        const previousElementHalf = this.getDistanceBetweenTwoPoints3D(this.diffElementsPositions[x - 1], this.diffElementsPositions[x])/2;
        const nextElementHalf     = this.getDistanceBetweenTwoPoints3D(this.diffElementsPositions[x + 1], this.diffElementsPositions[x])/2;
        
        const calculatedWeight = (previousElementHalf + nextElementHalf)*totalWeight  + dropper_weight;
        this.diffElementsWeights[x] = calculatedWeight;
      }
    }
  }

  private generateReactions(){
    let L  = this.vane_length;
    let p = this.support_wire.weight;
    let MB = this.getAbsDiffMoments() + (p*Math.pow(L,2)/2);
    let h  = (this.getSystemHeightA() - this.getSystemHeightB());
    let Ta = this.support_wire.tension_force;

    this.reaction_ax = (MB*h + Math.sqrt( (Math.pow(Ta,2)*Math.pow(L,2)*(Math.pow(L,2)+Math.pow(h,2)))-Math.pow(MB,2)*Math.pow(L,2) ))/((Math.pow(L,2)+Math.pow(h,2)))
    //this.reaction_ay =  Math.sqrt( Math.pow(this.support_wire.tension_force,2) - Math.pow(this.reaction_ax,2) )

    //this.reaction_ax = this.support_wire.tension_force;
    this.reaction_by = (MB - h * this.reaction_ax)/L;

    const total_weight = this.diffElementsWeights.reduce((sum, value) => sum + value, 0) + p*L;
    this.reaction_ay = total_weight - this.reaction_by;
    //this.reaction_by = total_weight - this.reaction_ay;

    this.reaction_bx = this.reaction_ax;
  }

  private generateContactWireArrow(): void {
      let maximumArrow = this.arrow ?  (this.arrow_length > 0 ? this.arrow_length : (0.068 / 60) * this.vane_length) : 0;
      
      let x1 = this.dropper_indexes[0];
      let x2 = this.dropper_indexes[this.dropper_indexes.length - 1];
      let x_v = (x1 + x2) / 2; // Centro de la parábola
      let y_v = maximumArrow; // Altura máxima
      
      let a = -y_v / Math.pow(x1 - x_v, 2); // Coeficiente de la parábola

      for (let x = 0; x < this.diffElementsPositions.length; x++) {
          if (x >= x1 && x <= x2) {
              this.diffElementsArrow[x] = a * Math.pow(x - x_v, 2) + y_v;
          } else {
              this.diffElementsArrow[x] = 0;
          }
      }
  }

  private generateLifting(): void {

      const L = Math.sqrt((2 * this.contact_wire.tension_force * this.lifting_ref.value) / this.contact_wire.weight);
      let center = L;
      if (this.lifting_ref.position == 1) {
          center = this.vane_length - L;
      }

      for (let x = 0; x <= this.diffElementsPositions.length - 1; x++) {
          const pos_x = this.getDistanceBetweenTwoPoints3D(this.diffElementsPositions[0], this.diffElementsPositions[x]);

          if (this.lifting_ref.position == 0) {
              if(pos_x == 0){
                this.diffElementsLifting[x] = this.lifting_ref.value;
              }else if (pos_x <= L) {
                  this.diffElementsLifting[x] = this.lifting_ref.value * (1 - (pos_x / L)) ** 2;
              } else {
                  this.diffElementsLifting[x] = 0;
              }
          } else if (this.lifting_ref.position == 1) {
              if(pos_x == 0){
                this.diffElementsLifting[x] = 0;
              } else if (pos_x >= center) {
                  this.diffElementsLifting[x] = this.lifting_ref.value * (1 - ((this.vane_length - pos_x) / L)) ** 2;
              } else {
                  this.diffElementsLifting[x] = 0;
              }
          }
      }

  }

  private generateHeights():void{
    for(let x = 0 ; x <= this.diffElementsPositions.length - 1 ; x++ ){
      if(x == 0 || x == this.diffElementsPositions.length - 1){
        if(x== 0) {
          this.diffHeights[x] = this.getSystemHeightA();
        }else{
          this.diffHeights[x] = this.getSystemHeightB();
        }
      }else{

          if(this.getDistanceBetweenTwoPoints3D(this.startPoint, this.diffElementsPositions[x]) < this.vane_length/2){

            const element_length = this.getDistanceBetweenTwoPoints3D(this.startPoint, this.diffElementsPositions[x]);
            let support_wire_arrow = (element_length*this.reaction_ay - this.getRelDiffMoments(x) - (this.support_wire.weight*Math.pow(element_length,2)/2))/this.reaction_ax;
            //let support_wire_arrow = (this.diffElementsPositions[x]*this.reaction_ay - this.getRelDiffMoments(x))/this.reaction_ax;
            if(this.h < 0){
              this.diffHeights[x] = this.getSystemHeightA() -  support_wire_arrow + this.h;
            }else{
              this.diffHeights[x] = this.getSystemHeightA() -  support_wire_arrow;
            }

            const dropperIndex = this.dropper_indexes.indexOf(x);

            if (dropperIndex !== -1) {
              this.dropper_weights[dropperIndex] = (this.diffHeights[x] + this.diffElementsArrow[x])*this.dropper_weight;
            }

          }else{

            const element_length = this.getDistanceBetweenTwoPoints3D(this.startPoint, this.diffElementsPositions[x]);
            let support_wire_arrow = (element_length*this.reaction_by - this.getRelDiffMoments(x) - (this.support_wire.weight*Math.pow(element_length,2)/2))/this.reaction_bx;
            //let support_wire_arrow = (this.diffElementsPositions[x]*this.reaction_ay - this.getRelDiffMoments(x))/this.reaction_ax;
            if(this.h > 0){
              this.diffHeights[x] = this.getSystemHeightB() -  support_wire_arrow - this.h;
            }else{
              this.diffHeights[x] = this.getSystemHeightB() -  support_wire_arrow;
            }

            const dropperIndex = this.dropper_indexes.indexOf(x);

            if (dropperIndex !== -1) {
              this.dropper_weights[dropperIndex] = (this.diffHeights[x] + this.diffElementsArrow[x])*this.dropper_weight;
            }

          }
      }
    };
  }


  private generateInterations(n:number):void{

      this.generateDiffElements();
      this.generateLifting();

      for(let x = 0; x < n; x++){
          this.generateDiffWeights();
          this.generateReactions();
          this.generateContactWireArrow();
          this.generateHeights();
      }

  }

  getCenters():{vane_center:{x:number,y:number,z:number}, global_center:{x:number,y:number,z:number}}{
    let vane_center = {x:0,y:0,z:0};
    let global_center = {x:0,y:0,z:0};

    vane_center.x = 0;//this.vane_length/2;

    vane_center.y = (this.getSystemHeightA())/2 ;

    vane_center.z =  this.vane_length/2;

    global_center.x = 0;

    global_center.y = (this.getAverageContactWireHeight()  + this.getSystemHeightA())/2;

    global_center.z = this.vane_length/2;

    return {vane_center, global_center};
  }
 
  generateLinks():{rects:{x1:number,y1:number,z1:number, x2:number,y2:number,z2:number}[], curves: { curve: {x:number, y:number, z:number}[] }[]}{

    let rects:{x1:number,y1:number,z1:number, x2:number,y2:number,z2:number}[] = [];

    for(let i = 0; i < this.dropper_indexes.length ; i++){

      rects.push(
        {  x1: this.diffElementsPositions[this.dropper_indexes[i]].x, 
           y1: this.diffElementsPositions[this.dropper_indexes[i]].y -this.diffElementsArrow[this.dropper_indexes[i]] + this.diffElementsLifting[this.dropper_indexes[i]],
           z1: this.diffElementsPositions[this.dropper_indexes[i]].z ,
           x2: this.diffElementsPositions[this.dropper_indexes[i]].x,
           y2: this.diffElementsPositions[this.dropper_indexes[i]].y + this.diffHeights[this.dropper_indexes[i]],
           z2: this.diffElementsPositions[this.dropper_indexes[i]].z 
        }
      );
    }



    //rects.push({ x1:0, y1:0, z1:0, x2:0, y2: 0, z2: -this.vane_length })

    let curves:{ curve: {x:number, y:number, z:number}[] }[] = []

    let curve:{x:number, y:number, z:number}[] = [];
    for(let i = 0; i < this.diffElementsPositions.length ; i++){
      curve.push(
        { x: this.diffElementsPositions[i].x , 
          y: this.diffElementsPositions[i].y + this.diffHeights[i],
          z: this.diffElementsPositions[i].z
        })
    }

    curves.push({ curve });

    let curve2:{x:number, y:number, z:number}[] = [];
    for(let i = 0; i < this.diffElementsArrow.length ; i++){
      curve2.push(
        { x: this.diffElementsPositions[i].x, 
          y: this.diffElementsPositions[i].y - this.diffElementsArrow[i] + this.diffElementsLifting[i],
          z: this.diffElementsPositions[i].z 
        })
    }

    curves.push({ curve:curve2 });

    return {
      rects,
      curves
    };
  }

  generateDimensions():Dimensions[]{

    for(let i = 0; i < this.dropper_indexes.length ; i++){

      this.dimensions.push({  
        start:{
          x: this.diffElementsPositions[this.dropper_indexes[i]].x,
          y: this.diffElementsPositions[this.dropper_indexes[i]].y - this.diffElementsArrow[i] + this.diffElementsLifting[i],
          z: this.diffElementsPositions[this.dropper_indexes[i]].z
        },
        end:{
          x: this.diffElementsPositions[this.dropper_indexes[i]].x,
          y: this.diffElementsPositions[this.dropper_indexes[i]].y + this.diffHeights[this.dropper_indexes[i]],
          z: this.diffElementsPositions[this.dropper_indexes[i]].z
        },
        groupId:"dropper",
        line:{
          arrows:{
            arrowHeight:40,
            arrowRadius:15,
            arrowSegments:16
          },
          radius:6,
          offset:{
            orientation:{ x:0,y:0,z:1 },
            distance:300
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
      });
    }

    this.dimensions.push({  
      start:{
        x: this.diffElementsPositions[0].x,
        y: this.diffElementsPositions[0].y,
        z: this.diffElementsPositions[0].z
      },
      end:{
        x: this.diffElementsPositions[this.diffElementsPositions.length - 1].x,
        y: this.diffElementsPositions[this.diffElementsPositions.length - 1].y,
        z: this.diffElementsPositions[this.diffElementsPositions.length - 1].z
      },
      groupId:"vane_length",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:300
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
    });


    return this.dimensions;
  }

  generateResults(): number[][] {
    let results: number[][] = [];

    let dropper_lengths:number[] = [];
    let distance_eye_to_eye:number[] = [];
    let distance_cw:number[] = [];
    let distance_pole_dropper:number[] = [];
    let distance_dropper_dropper:number[] = [];
    let distance_cw_h:number[] = [];
    let dropper_inclination:number[] = [];


    for (let i = 0; i < this.dropper_indexes.length; i++) {

      let point1: { x: number, y: number, z: number } = {
        x: this.diffElementsPositions[this.dropper_indexes[i]].x,
        y: this.diffElementsPositions[this.dropper_indexes[i]].y - this.diffElementsArrow[this.dropper_indexes[i]] + this.diffElementsLifting[this.dropper_indexes[i]],
        z: this.diffElementsPositions[this.dropper_indexes[i]].z
      };

      let point2: { x: number, y: number, z: number } = {
        x: this.diffElementsPositions[this.dropper_indexes[i]].x,
        y: this.diffElementsPositions[this.dropper_indexes[i]].y + this.diffHeights[this.dropper_indexes[i]],
        z: this.diffElementsPositions[this.dropper_indexes[i]].z
      };

      let dropper_length = this.getDistanceBetweenTwoPoints3D(point1, point2);

      // Instead of assigning to [0], directly assign the value to results[i]
      dropper_lengths[i] = dropper_length/1000 - 0.112 + 0.705;
      distance_eye_to_eye[i] = dropper_length/1000 -0.112;
      distance_cw[i] = dropper_length/1000;
      distance_pole_dropper[i] = this.getDistanceBetweenTwoPoints3D(this.diffElementsPositions[0], this.diffElementsPositions[this.dropper_indexes[i]])/1000;
      distance_dropper_dropper[i] = i == 0 ? this.initial_separation/1000 : this.dropper_separation/1000;
      distance_cw_h[i] = point1.y/1000;
      dropper_inclination[i] = this.radiansToDegrees(this.getDropperInclination(point1, point2)) - 90;

    }

    //Add Point A
    dropper_lengths.unshift(0);
    distance_eye_to_eye.unshift(0);
    distance_cw.unshift(this.getSystemHeightA()/1000 - (this.lifting_ref.position == 0 ? this.lifting_ref.value : 0)/1000);
    distance_pole_dropper.unshift(0);
    distance_dropper_dropper.unshift(0);
    distance_cw_h.unshift((this.diffElementsPositions[0].y - this.diffElementsArrow[0] + this.diffElementsLifting[0])/1000);
    dropper_inclination.unshift(0);

    //Add Point B
    dropper_lengths.push(0);
    distance_eye_to_eye.push(0);
    distance_cw.push(this.getSystemHeightB()/1000 - (this.lifting_ref.position == 1 ? this.lifting_ref.value : 0)/1000);
    distance_pole_dropper.push(this.vane_length/1000);
    distance_dropper_dropper.push(this.initial_separation/1000);
    distance_cw_h.push((this.diffElementsPositions[this.diffElementsPositions.length - 1].y - this.diffElementsArrow[this.diffElementsPositions.length - 1] + this.diffElementsLifting[this.diffElementsPositions.length - 1])/1000);
    dropper_inclination.push(0);

    results[0] = dropper_lengths;
    results[1] = distance_eye_to_eye;
    results[2] = distance_cw;
    results[3] = distance_pole_dropper;
    results[4] = distance_dropper_dropper;
    results[5] = distance_cw_h;
    results[6] = dropper_inclination;

    return results;
  }

  generateReportParams(){
    return {
      cantilever_name_a: this.cantilevers.length ? this.cantilevers[0].cantilever.external_id : this.default_properties.pole_name_a,
      cantilever_name_b: this.cantilevers.length ? this.cantilevers[1].cantilever.external_id : this.default_properties.pole_name_b,
      vane_length: (this.vane_length).toFixed(2),
      cw_tension_force: this.contact_wire.tension_force.toFixed(2),
      mw_tension_force: this.support_wire.tension_force.toFixed(2),
      initial_separation: (this.initial_separation).toFixed(2)
    }
  }

  // Override the serialize method to include CantileverBrazilian-specific properties.
  serialize(): string {
    return JSON.stringify({
      model: this.model,
      contact_wire:this.contact_wire,
      support_wire: this.support_wire,
      initial_separation: this.initial_separation,
      qty_droppers: this.qty_droppers,
      dropper_weight: this.dropper_weight,
      poles: this.poles,
    });
  }

  // Deserialize data specifically for CantileverBrazilian.
  static deserialize(data: VaneBrazilianParams,cantilevers:CantileverDataContent[],pov): BrazilianVane {

    return new BrazilianVane(
      data.model,
      data.contact_wire,
      data.support_wire,
      data.initial_separation,
      data.qty_droppers,
      data.dropper_weight,
      data.arrow,
      data.arrow_length,
      data.lifting,
      data.separation_calculation,
      data.defaultProperties,
      cantilevers,
      pov
    );
  }

}

export default BrazilianVane;
