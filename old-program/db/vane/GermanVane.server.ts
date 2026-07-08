import { Vane } from "./Vane.server";

class GermanVane extends Vane {

  // Constructor to initialize the CantileverGerman properties.
  //
  dimensions:Dimensions[];
  dropper_indexes: number[];
  dropper_weights: number[];
  diffElementsWeights:number[];
  diffElementsPositions: number[];
  diffElementsArrow:number[];
  diffHeights:number[];
  reaction_ay:number;
  reaction_ax:number;
  previous_reaction_ax:number;
  reaction_by:number;
  step:number;
  constructor(
    model:VaneModelInterface,
    contact_wire:ContactWire,
    support_wire: SupportWire,
    system_height_a:number,
    system_height_b:number,
    vane_length:number,
    initial_separation:number,
    qty_droppers:number,
    dropper_weight:number
  ) {
    // Call the parent constructbior to initialize inherited properties.
    super(model,contact_wire, support_wire, system_height_a, system_height_b,vane_length, initial_separation, qty_droppers, dropper_weight );


    this.dimensions = [];
    this.step = 100;
    this.reaction_ay = 0;
    this.reaction_ax = 0;
    this.reaction_by = 0;
    this.previous_reaction_ax = 0;
    this.diffElementsPositions = [];
    this.diffElementsWeights = [];
    this.diffHeights = [];
    this.diffElementsArrow = [];
    this.dropper_indexes = [];
    this.dropper_weights = Array.from({ length: this.qty_droppers }, () => 0);
    this.generateInterations(2);

  }

  private generateDiffElements():void {

    /*const initialElements = this.initial_separation / this.step;
    const diffInitialElements = Array.from(
      { length: initialElements }, 
      (_, index) => index * this.step
    );

    const diffMiddleElements = [];
    for (let i = 0; i < (this.qty_droppers - 1); i++) {
      const startPosition = this.initial_separation + i * this.dropper_separation;
      const steps = this.dropper_separation / this.step;
      const array_limit = Array.from(
        { length: steps }, 
        (_, index) => startPosition + index * this.step
      );
      diffMiddleElements.push(...array_limit);
    }

    const lastElements = this.initial_separation / this.step;
    const diffLastElements = Array.from(
      { length: lastElements + 1 }, 
      (_, index) => 
        this.initial_separation + (this.qty_droppers - 1) * this.dropper_separation + index * this.step
    );

    this.diffElementsPositions = [
      ...diffInitialElements,
      ...diffMiddleElements,
      ...diffLastElements
    ];*/

    for(let i=0; i < this.qty_droppers+2; i++){

      if(i == 0 ){

        this.diffElementsPositions[i] = 0;

      }else if(i == this.qty_droppers+1  || i == 1 ){

        this.diffElementsPositions[i] = this.diffElementsPositions[i - 1] + this.initial_separation;

      }else{

        this.diffElementsPositions[i] = this.diffElementsPositions[i - 1] + this.dropper_separation;
      }
      
    }


    for(let i=0; i < this.qty_droppers; i++){
      let droper_position = this.diffElementsPositions.findIndex((item) => item == this.initial_separation + i*this.dropper_separation);
      this.dropper_indexes.push(droper_position);
    }

    this.diffElementsArrow = Array.from({ length: this.diffElementsPositions.length }, () => 0);

  }

  private getRelDiffMoments(n:number):number{
    let sum = 0;
    for(let x = 1 ; x < n ; x++ ){
      sum = sum +this.diffElementsWeights[x]*(this.diffElementsPositions[n] - this.diffElementsPositions[x]);
    };
    return sum;
  }

  private getAbsDiffMoments():number{
    let sum = 0;
    for(let x = 1 ; x <= this.diffElementsPositions.length - 2 ; x++ ){
      sum = sum +this.diffElementsWeights[x]*((this.vane_length - this.diffElementsPositions[x]));
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


        const calculatedWeight = (this.diffElementsPositions[x + 1] - this.diffElementsPositions[x])*totalWeight  + dropper_weight;
        this.diffElementsWeights[x] = calculatedWeight;
      }
    }
  }

  private generateReactions(){

    let L  = this.vane_length;
    let p = this.support_wire.weight;
    let MB = this.getAbsDiffMoments() + (p*Math.pow(L,2)/2);
    let h  = (this.system_height_a - this.system_height_b);
    let Ta = this.support_wire.tension_force;

    this.reaction_ax = (MB*h + Math.sqrt( (Math.pow(Ta,2)*Math.pow(L,2)*(Math.pow(L,2)+Math.pow(h,2)))-Math.pow(MB,2)*Math.pow(L,2) ))/((Math.pow(L,2)+Math.pow(h,2)))
    this.reaction_ay =  Math.sqrt( Math.pow(this.support_wire.tension_force,2) - Math.pow(this.reaction_ax,2) )

    //this.reaction_ay = (this.getAbsDiffMoments() - h*this.support_wire.tension_force) /this.vane_length;

    //this.reaction_ax = this.support_wire.tension_force;

    const total_weight = this.diffElementsWeights.reduce((sum, value) => sum + value, 0);
    this.reaction_by = total_weight - this.reaction_ay;
  }

  private generateContactWireArrow(): void {
      let maximumArrow = (0.068 / 60) * this.vane_length;
      
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

  private generateHeights():void{
    for(let x = 0 ; x <= this.diffElementsPositions.length - 1 ; x++ ){
      if(x == 0 || x == this.diffElementsPositions.length - 1){
        if(x== 0) {
          this.diffHeights[x] = this.system_height_a;
        }else{
          this.diffHeights[x] = this.system_height_b;
        }
      }else{
        let support_wire_arrow = (this.diffElementsPositions[x]*this.reaction_ay - this.getRelDiffMoments(x) - (this.support_wire.weight*Math.pow(this.diffElementsPositions[x],2)/2))/this.reaction_ax;
        //let support_wire_arrow = (this.diffElementsPositions[x]*this.reaction_ay - this.getRelDiffMoments(x))/this.reaction_ax;
        this.diffHeights[x] = this.system_height_a -  support_wire_arrow;

        const dropperIndex = this.dropper_indexes.indexOf(x);

        if (dropperIndex !== -1) {
          this.dropper_weights[dropperIndex] = (this.system_height_a -  support_wire_arrow + this.diffElementsArrow[x])*this.dropper_weight;
        }

        this.previous_reaction_ax = this.reaction_ax;

      }
    };
  }

  private calculateEpsilon():number{
    return Math.abs((this.previous_reaction_ax - this.reaction_ax)/this.reaction_ax) 

  }

  private generateInterations(n:number):void{

    this.generateDiffElements();

    for(let x = 0; x < n; x++){
        this.generateDiffWeights();
        this.generateReactions();
        this.generateContactWireArrow();
        this.generateHeights();
        /*if(x > 0){
          console.log(this.calculateEpsilon());
        }*/
    }

  }

  getCenters():{vane_center:{x:number,y:number,z:number}, global_center:{x:number,y:number,z:number}}{
    let vane_center = {x:0,y:0,z:0};
    let global_center = {x:0,y:0,z:0};

    vane_center.x = 0;//this.vane_length/2;

    vane_center.y = (this.system_height_a)/2 ;

    vane_center.z = this.vane_length/2;

    global_center.x = 0;

    global_center.y = (this.contact_wire.height  + this.system_height_a)/2;

    global_center.z = this.vane_length/2;

    return {vane_center, global_center};
  }
 
  generateLinks():{rects:{x1:number,y1:number,z1:number, x2:number,y2:number,z2:number}[], curves: { curve: {x:number, y:number, z:number}[] }[]}{

    let rects:{x1:number,y1:number,z1:number, x2:number,y2:number,z2:number}[] = [];


    for(let i = 0; i < this.dropper_indexes.length ; i++){

      rects.push({  x1:0 , y1:-this.diffElementsArrow[this.dropper_indexes[i]],z1:-this.diffElementsPositions[this.dropper_indexes[i]],
                 x2:0 , y2:this.diffHeights[this.dropper_indexes[i]],z2:-this.diffElementsPositions[this.dropper_indexes[i]] });

    }

    //rects.push({ x1:0, y1:0, z1:0, x2:0, y2: 0, z2: -this.vane_length })

    let curves:{ curve: {x:number, y:number, z:number}[] }[] = []

    let curve:{x:number, y:number, z:number}[] = [];
    for(let i = 0; i < this.diffElementsPositions.length ; i++){
      curve.push({ x:0 , y: this.diffHeights[i], z:-this.diffElementsPositions[i] })
    }

    curves.push({ curve });

    let curve2:{x:number, y:number, z:number}[] = [];
    for(let i = 0; i < this.diffElementsArrow.length ; i++){
      curve2.push({ x:0 , y: -this.diffElementsArrow[i], z:-this.diffElementsPositions[i] })
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
          x:0,
          y:0,
          z:-this.diffElementsPositions[this.dropper_indexes[i]]
        },
        end:{
          x:0,
          y:this.diffHeights[this.dropper_indexes[i]],
          z:-this.diffElementsPositions[this.dropper_indexes[i]]
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
        x:0,
        y:0,
        z:0
      },
      end:{
        x:0,
        y:0,
        z:-this.vane_length
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

    for (let i = 0; i < this.dropper_indexes.length; i++) {
      let point1: { x: number, y: number, z: number } = {
        x: 0,
        y: - this.diffElementsArrow[this.dropper_indexes[i]],
        z: -this.diffElementsPositions[this.dropper_indexes[i]]
      };

      let point2: { x: number, y: number, z: number } = {
        x: 0,
        y: this.diffHeights[this.dropper_indexes[i]],
        z: -this.diffElementsPositions[this.dropper_indexes[i]]
      };

      let dropper_length = this.getDistanceBetweenTwoPoints3D(point1, point2);

      // Instead of assigning to [0], directly assign the value to results[i]
      dropper_lengths[i] = dropper_length;
    }

    results[0] = dropper_lengths;

    return results;
  }


  // Override the serialize method to include CantileverGerman-specific properties.
  serialize(): string {
    return JSON.stringify({
      model: this.model,
      contact_wire:this.contact_wire,
      support_wire: this.support_wire,
      system_height_a:this.system_height_b,
      vane_length: this.vane_length,
      initial_separation: this.initial_separation
    });
  }

  // Deserialize data specifically for CantileverGerman.
  static deserialize(data: VaneGermanParams): GermanVane {
    return new GermanVane(
      data.model,
      data.contact_wire,
      data.support_wire,
      data.system_height_a,
      data.system_height_b,
      data.vane_length,
      data.initial_separation,
      data.qty_droppers,
      data.dropper_weight
    );
  }

}

export default GermanVane;
