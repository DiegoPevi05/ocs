import { getCantileverClass } from "../cantilever/actions.server";

class Pole {
  // Properties common to all cantilevers.
  position: { x: number, y: number, z: number };
  model:PoleModelInterface;
  cat_separation:number;
  support_offset:number;
  bottom_fixed_height:number;
  fixing_distance:number;
  pv:{x:number, y:number, z:number };
  esc:number;
  pov:'local'|'global';
  cantilevers: CantileverParams[];
  public dimensions:Dimensions[];
  public calculatedPosition:{x:number, y:number, z:number};
  public calculatedPv:{x:number, y:number, z:number};

  // Constructor to initialize the properties.
  constructor(
    position:{ x: number, y: number, z: number },
    model:PoleModelInterface,
    cat_separation:number,
    support_offset:number,
    bottom_fixed_height:number,
    fixing_distance:number,
    pv:{x:number, y:number, z:number },
    esc:number,
    pov:'local'|'global',
    cantilevers: CantileverParams[],
  ) {
    this.position = position;
    this.model = model;
    this.cat_separation = cat_separation;
    this.support_offset = support_offset;
    this.bottom_fixed_height = bottom_fixed_height;
    this.fixing_distance = fixing_distance;
    this.pv = pv;
    this.esc = esc;
    this.cantilevers = cantilevers;
    this.dimensions = [];
    this.pov = pov;
    this.calculatedPosition = this.getPolePosition();
    this.calculatedPv = this.getPvPosition();
  }

  private getTwoPointsModule(
    a: 
    {
      x: number;
      y: number;
      z: number;
    }, 
    b: {
      x: number;
      y: number;
      z: number;
    }
  ): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private getPolePosition(): Point3D {
      if (this.pov === "local") {
        return {
          x: 0,
          y: 0, //this.model.measures.height / 2 - this.esc + this.model.measures.bottom_screw,
          z: 0,
        };
      } else {
        return {
          x: this.position.x,
          y: this.position.y,
          z: this.position.z// + (this.model.measures.height / 2 - this.esc + this.model.measures.bottom_screw),
        };
      }
  }

  private getPvPosition(): Point3D {
      if (this.pov === "local") {
        const local_pv = this.getTwoPointsModule(this.position, this.pv);
        return {
          x: local_pv,
          y: 0,
          z: 0,
        };
      } else {
        return {
          x: this.pv.x,
          y: this.pv.y,
          z: this.pv.z,
        };
      }
  }

  private getOffsetSupport(){
    let offset = 0;

    if(this.cantilevers.length == 1){

      offset = 0;
    }else{

      offset = this.support_offset;
    }

    return offset;
  }

  private getCantileverPvs(quantityOfCantilevers: number): { x: number, y: number, z: number }[] {

    let pvs: { x: number, y: number, z: number }[] = [];

    let poleProjections:{ x: number, y: number, z: number }[] = [];


    let currentReference = -(this.cat_separation * (quantityOfCantilevers - 1)) / 2;

    Array.from({ length: quantityOfCantilevers }).forEach((_) => {


      let pole_transform = { x:this.calculatedPosition.x, y:this.calculatedPv.z, z:this.calculatedPosition.z  } ;

      if(this.pov == "global"){

        pole_transform = { x:this.calculatedPosition.x, y:this.calculatedPosition.z, z:this.calculatedPosition.y  };

      }

      let pv_transform = this.calculatedPv;

      if(this.pov == "global"){

        pv_transform = {x:this.calculatedPv.x , y:this.calculatedPv.z, z:this.calculatedPv.y  };

      }

      const pv_dir = this.normalizeVector(this.subtractVectors(pole_transform,pv_transform));

      const perpViaDir = this.normalizeVector(this.crossVectors(pv_dir,{x:0,y:1,z:0})); 

      let pv             = this.addVectors(pv_transform, this.scaleVector(perpViaDir, currentReference));

      let poleProjection = this.addVectors(pole_transform, this.scaleVector(perpViaDir, currentReference));

      pvs.push(pv);

      poleProjections.push(poleProjection);

      currentReference += this.cat_separation;
    });

    return {pvs, poleProjections};
  }

  private getFixingDistance():number{

    return this.fixing_distance;
  }

  private getBottomFixedHeight():number{

    return this.bottom_fixed_height;
  }

  private getTrackInclination():number{
    if(this.cantilevers.length == 0) return 0;
    return  this.cantilevers[0].params.u;
  }

  public getUpdatedCantilever():CantileverParams[] {

    let {pvs, poleProjections} = this.getCantileverPvs(this.cantilevers.length);

    let updatedCantilevers: CantileverParams[] = []; // Initialize the array

    this.cantilevers.forEach((cantilever, index) => {
      let cantileverModified = { 
        ...cantilever, 
        params: { 
          ...cantilever.params, 
          poleModel:this.model,
          esc:this.esc,
          fixing_distance:this.getFixingDistance(),
          bottom_fixed_height:this.getBottomFixedHeight(),
          pv: pvs[index], 
          support_offset: this.getOffsetSupport(),
          u:this.getTrackInclination()
        }  
      };
      updatedCantilevers.push(cantileverModified);
    });

    return updatedCantilevers;
  }

  public getCantilevers(): CantileverDataContent[] {

    let {pvs, poleProjections } = this.getCantileverPvs(this.cantilevers.length);

    let cantileversGenerated: CantileverDataContent[] = []; // Initialize the array

    this.cantilevers.forEach((cantilever, index) => {
      let cantileverModified = { 
        ...cantilever, 
        params: { 
          ...cantilever.params, 
          poleModel:this.model,
          esc:this.esc,
          fixing_distance:this.getFixingDistance(),
          bottom_fixed_height:this.getBottomFixedHeight(),
          pv: pvs[index], 
          support_offset: this.getOffsetSupport(),
          u:this.getTrackInclination()
        }  
      };

      const CantileverClass = getCantileverClass(
        cantileverModified.params, 
        {
          position: poleProjections[index],
          model:this.model,
          cat_separation:this.cat_separation,
          support_offset:this.getOffsetSupport(),
          bottom_fixed_height:this.getBottomFixedHeight(),
          fixing_distance:this.getFixingDistance(),
          pv:this.pv,
          esc:this.esc,
          pk:this.pk
        },
        this.pov
      );

      cantileversGenerated.push({
        cantilever: cantileverModified,
        centers: CantileverClass.getCenters(),
        points: CantileverClass.generatePoints(),
        links: CantileverClass.generateLinks(),
        dimensions: CantileverClass.generateDimensions(),
        cw: CantileverClass.cw_axis,
        mw: CantileverClass.mw_axis,
        via_axis: CantileverClass.via_axis,
        pv: CantileverClass.pv,
        polePosition:CantileverClass.polePosition,
        results: CantileverClass.generateResults()
      });
    });

    return cantileversGenerated;
  }

  generateDimensions():Dimensions[]{
    //Pole Dimensions
    this.dimensions.push({  
      start:{
        x:this.model.measures.width/2 + 150,
        y:0,
        z:this.model.measures.length/2
      },
      end:{
        x:this.model.measures.width/2 + 150,
        y:0,
        z:-this.model.measures.length/2
      },
      groupId:"pole_length",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance: 0
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

    this.dimensions.push({  
      start:{
        x:-this.model.measures.width/2,
        y:0,
        z:this.model.measures.length/2 + 150
      },
      end:{
        x:this.model.measures.width/2,
        y:0,
        z:this.model.measures.length/2 + 150
      },
      groupId:"pole_width",
      line:{
        arrows:{
          arrowHeight:40,
          arrowRadius:15,
          arrowSegments:16
        },
        radius:6,
        offset:{
          orientation:{ x:0,y:0,z:1 },
          distance:0
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

    this.dimensions.push({  
      start:{
        x:-this.model.measures.length/2,
        y:0,
        z:0
      },
      end:{
        x:-this.model.measures.length/2,
        y:this.getBottomFixedHeight(),
        z:0
      },
      groupId:"bottom_fixed_height",
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
    });

    this.dimensions.push({  
      start:{
        x:-this.model.measures.length/2,
        y:-this.esc,
        z:0
      },
      end:{
        x:-this.model.measures.length/2,
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
    });

    this.dimensions.push({  
      start:{
        x:-this.model.measures.length/2,
        y:-this.esc + this.model.measures.bottom_screw,
        z:0
      },
      end:{
        x:-this.model.measures.length/2,
        y: this.model.measures.height - this.esc + this.model.measures.bottom_screw,
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
          distance:-350
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

    this.dimensions.push({  
      start:{
        x:-this.model.measures.length/2,
        y:this.getBottomFixedHeight(),
        z:0
      },
      end:{
        x:-this.model.measures.length/2,
        y: this.getBottomFixedHeight()  + this.getFixingDistance(),
        z:0
      },
      groupId:"fixing_distance",
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
    });

    return this.dimensions;
  }

  getCenters():{pole_center:{x:number,y:number,z:number}, global_center:{x:number,y:number,z:number}}{
    let pole_center = {x:0,y:0,z:0};
    let global_center = {x:0,y:0,z:0};

    pole_center.x = this.calculatedPv.z/2;

    pole_center.y = (this.getFixingDistance())/2 + this.getBottomFixedHeight() ;
    pole_center.z = this.calculatedPv.z*0.7;

    global_center.x = this.calculatedPv.z;

    global_center.y = (this.getBottomFixedHeight() + this.getFixingDistance()) /2;

    global_center.z = this.calculatedPv.z*0.5;

    return {pole_center, global_center};
  }

  // Override the serialize method to include CantileverGerman-specific properties.
  serialize(): string {
    return JSON.stringify({
      position: this.position,
      model: this.model,
      cat_separation:this.cat_separation,
      support_offset:this.support_offset,
      pv:this.pv,
      cantilevers:this.cantilevers
    });
  }

  // Deserialize data specifically for CantileverGerman.
  static deserialize(data: PolePropertiesParams, cantilevers:CantileverParams[], pov:'local'|'global'): Pole {
    return new Pole(
      data.position,
      data.model,
      data.cat_separation,
      data.support_offset,
      data.bottom_fixed_height,
      data.fixing_distance,
      data.pv,
      data.esc,
      pov,
      cantilevers
    );
  }

  addVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}){
    return {
      x: a.x + b.x, 
      y: a.y + b.y, 
      z: a.z + b.z
    }
  }

  subtractVectors(a: {x:number, y:number, z:number}, b: {x:number, y:number, z:number}): Vector3 {
    return {
      x: a.x - b.x, 
      y: a.y - b.y, 
      z: a.z - b.z
    };
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

  scaleVector(v: Vector3, s: number){
    return {
      x: v.x*s, y: v.y*s, z: v.z*s
    }
  }

  normalizeVector(v: Vector3){
    const len = this.lengthVector(v);
    if (len === 0) throw new Error("Zero vector");
    return this.scaleVector(v, 1/len);

  }

}

export default Pole;
