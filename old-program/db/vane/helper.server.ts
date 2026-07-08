// actions.server.ts
import { prisma } from "~/db/db.server"; 
import Pole from "../pole/Pole.server";
import {getDistanceBetweenTwoPoints3D} from "~/components/common/common";

export function ArePoleSamePosition(params: VaneParamsProps): boolean {
  const [pole1, pole2] = params.poles;

  if (!pole1 || !pole2) return false; // Ensure two poles exist

  return (
    pole1.position.x === pole2.position.x &&
    pole1.position.y === pole2.position.y &&
    pole1.position.z === pole2.position.z
  );
}

function getDroppersQuantity(params:VaneParamsProps):{ initial_separation:number, qty_droppers:number }{


  const vaneLength = getDistanceBetweenTwoPoints3D(params.poles[0].contact_wire_point, params.poles[1].contact_wire_point);

  let initial_separation = params.initial_separation;
  let qty_droppers = params.qty_droppers;

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


  return {...params, initial_separation , qty_droppers};
}

function getDroppersQuantity2(params:VaneParamsProps):{ initial_separation:number, qty_droppers:number }{


  const vaneLength = getDistanceBetweenTwoPoints3D(params.poles[0].contact_wire_point, params.poles[1].contact_wire_point);
  const RadiusOfCurvature = 10000;

  let initial_separation = params.initial_separation;
  let qty_droppers = params.qty_droppers;

  if(RadiusOfCurvature > 700){

    initial_separation = 5000;

    if(vaneLength <= 25000){

      qty_droppers = 2;

    }else if(vaneLength > 25000 && vaneLength <= 33000){

      qty_droppers = 3;

    }else if(vaneLength > 33000 && vaneLength <= 42000){
      
      qty_droppers = 4;

    }else if(vaneLength > 42000 && vaneLength <= 55000){
      
      qty_droppers = 5;
      
    }else if(vaneLength > 55000 ){
      
      qty_droppers = 6;
      
    }
  }

  if(RadiusOfCurvature <= 700){

    initial_separation = 10;

    if(vaneLength <= 25000){

      initial_separation = vaneLength/2;
      qty_droppers = 1;
    
    }else if(vaneLength > 25000 && vaneLength <= 33000){
      
      qty_droppers = 2;

    }else if(vaneLength > 33000 && vaneLength <= 42000){
      
      qty_droppers = 3;

    }else if(vaneLength > 42000 && vaneLength <= 55000){
      
      qty_droppers = 4;

    }else if(vaneLength > 55000 ){
      
      initial_separation = 0;
      qty_droppers = 0;

    }
  }

  return {...params, initial_separation , qty_droppers};
}

export async function calculateParams(params:VaneParamsProps):Promise<VaneParamsProps>{



  /*if(params.calculation_type == "automatic"){


    const poles = await prisma.pole.findMany({
      where:{
        id:{
          in:params.poles.map((pole)=>pole.pole_id)
        }
      }
    });


    if(!poles || poles.length == 0) return params;

    
    for(let i = 0; i < poles.length; i++){

      const pole = poles.find((pole)=>pole.id == params.poles[i].pole_id);

      if(!pole) continue;

      let poleParsed = { ...pole, params: JSON.parse(pole.params), cantilevers: JSON.parse(pole.cantilevers)};

      const cantileversIds: number[] = poleParsed.cantilevers
        .map((item:any) => item?.id)
        .filter((id:any): id is number => id !== undefined);

      let cantileversParams:CantileverParams[] = []

      if (cantileversIds.length > 0) {
        const cantilevers = await prisma.cantilever.findMany({
          where: {
            id: {
              in: cantileversIds,
            },
          },
        });

      // Map external_id or id to the order defined in poleParsed.cantilevers
        const cantileversOrder = poleParsed.cantilevers.map(
          (item: any) => item.id
        );

        // Sort fetched cantilevers based on the original order
        cantilevers.sort(
          (a, b) =>
            cantileversOrder.indexOf(a.id) - cantileversOrder.indexOf(b.id)
        );

        cantilevers.forEach((cant) => {
          cantileversParams.push({
            ...cant,
            params: JSON.parse(cant.params), // Parse params field
          });
        });
      }


      const selectedCantilever = cantileversParams.find((cantilever) => cantilever.id === params.poles[i].cantilever_id);

      if(!selectedCantilever) continue;

      const PoleClass = Pole.deserialize(poleParsed.params, cantileversParams);
      const CantileverDataContent =PoleClass.getCantilevers(); 


      const cantileverSelected = CantileverDataContent?.find((cantilever) => cantilever.cantilever.id === params.poles[i].cantilever_id)
      if(!cantileverSelected) continue;

      params.poles[i].position = poleParsed.params.position;
      params.poles[i].contact_wire_point = cantileverSelected.cw;
      params.poles[i].support_wire_point = cantileverSelected.mw;

    }

  }*/

  if(params.separation_calculation){

    const { initial_separation, qty_droppers } =  getDroppersQuantity(params);

    params.initial_separation = initial_separation;
    params.qty_droppers = qty_droppers;
  }

  return params;
}
