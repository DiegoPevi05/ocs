// actions.server.ts

import { prisma } from "~/db/db.server"; // Import Prisma client instance
import CantileverGerman from "~/db/cantilever/GermanCantilever.server"; // Import CantileverGerman model for serialization
import CantileverBrazilian from "~/db/cantilever/BrazilianCantilever.server";
import {requireUser} from "../auth/session.server";
import { requirePermission } from "../permission/actions.server";
import {formatCantileverConfiguration} from "../pole/actions.server";
import { createHistory } from "../history/actions.server";

export function getCantileverClass(
  data:CantileverGermanParams|CantileverBrazilianParams,
  pole:PolePropertiesParams|null,
  pov:'local'|'global'
):CantileverGerman|CantileverBrazilian {

  if(data.model.code == "BR"){
    return CantileverBrazilian.deserialize(data as CantileverBrazilianParams,pole,pov)
  }else if(data.model.code == "GY"){
    return CantileverGerman.deserialize(data as CantileverGermanParams,pole,pov)
  }else{
    return CantileverBrazilian.deserialize(data as CantileverBrazilianParams,pole,pov)
  }
}


// Create a new cantilever for a user
export async function createCantilever(request: Request, cantileverData: CantileverParams):Promise<CantileverParams|null> {

  const user = await requireUser(request);
  await requirePermission(user,'store','Cantilever',cantileverData.project_id)

  const createData:any = {
    external_id:cantileverData.external_id,
    pole_id:cantileverData.pole_id ?? null,
    params: JSON.stringify(cantileverData.params),
    created_by:user.username
  };

  if (!cantileverData.pole_id) {
    createData.location = cantileverData.location ?? null;
    createData.location_id = cantileverData.location_id ?? null;
    createData.project = cantileverData.project ?? null;
    createData.project_id = cantileverData.project_id ?? null;
  }

  const cantilever = await prisma.cantilever.create({
    data: createData,
    include: {
      pole: {
        include: {
          via: {
            include: {
              location: true, // include location inside via
            },
          },
        },
      },
    },
  });

  if(cantilever.pole_id){
    await linkCantileversToPole([cantilever.id],cantilever.pole_id)
  }

  await createHistory(
    cantilever.pole?.via?.project_id ?? cantileverData.project_id,
    cantilever.external_id,
    user.id,
    user.username,
    user.imageUrl,
    'CREATE',
    cantilever.id,
    'Cantilever',
    null,
    JSON.stringify(cantilever)
  );

  return { 
    id:                       cantilever.id,
    external_id:              cantilever.external_id,
    pole_id:                  cantilever.pole_id ?? null,
    pole:                     cantilever.pole?.external_id ?? null,
    via:                      cantilever.pole?.via?.external_id ?? null,
    via_id:                   cantilever.pole?.via_id ?? null,
    location:                 cantilever.pole?.via?.location?.external_id ?? cantilever.location,
    location_id:              cantilever.pole?.via?.location_id ?? cantilever.location_id,
    project:                  cantilever.pole?.via?.project ?? cantilever.project,
    project_id:               cantilever.pole?.via?.project_id ?? cantilever.project_id,
    params:                   JSON.parse(cantilever.params),
    created_by:               cantilever.created_by
  };

}


// Update a cantilever by ID for a specific user
export async function updateCantilever(request: Request, cantileverId: number, projectId:number, updatedData: CantileverParams):Promise<boolean> {

  const user = await requireUser(request);
  await requirePermission(user,'update','Cantilever',projectId)

  try{

    const updtData:any = {
      external_id:updatedData.external_id,
      pole_id:updatedData.pole_id ?? null,
      params: JSON.stringify(updatedData.params),
      updatedAt: new Date(),
    };

    if (!updatedData.pole_id) {
      updtData.location = updatedData.location ?? null;
      updtData.location_id = updatedData.location_id ?? null;
      updtData.project = updatedData.project ?? null;
      updtData.project_id = updatedData.project_id ?? null;
    }

    await prisma.cantilever.updateMany({
      where: {
        id: cantileverId,
      },
      data: updtData,
    });

    await createHistory(
      projectId,
      updtData.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'UPDATE',
       cantileverId,
      'Cantilever',
      null,
      JSON.stringify(updtData)
    );

    return true;


  }catch(error){

    console.error("Error updating cantilever:", error);
    return false;

  }

}

export async function addCantileverToPole(request:Request, data:{ poleId:number, cantilevers:{ id:number, external_id:string }[] }):Promise<boolean>{

  await requireUser(request);

  try{
    const cantileverIds = data.cantilevers.map((item) => item.id)
    const linked = await linkCantileversToPole(cantileverIds, data.poleId);

    return linked;

  }catch(error){

    console.error("Error adding cantilever:", error);
    return false;

  }
}


export async function linkCantileversToPole(cantileverIds: number[], poleId: number): Promise<boolean> {
  // Verificar que el poste exista
  const pole = await prisma.pole.findUnique({
    where: { id: poleId },
  });

  if (!pole) return false;

  // Verificar que todos los cantilevers existan
  const cantilevers = await prisma.cantilever.findMany({
    where: { id: { in: cantileverIds } },
  });

  if (cantilevers.length !== cantileverIds.length) return false;

  // Asignar pole_id a cada cantilever
  await prisma.cantilever.updateMany({
    where: { id: { in: cantileverIds } },
    data: { pole_id: poleId },
  });

  // Update cantileversOrder in pole
  const currentOrder: number[] = (pole.cantileversOrder as number[]) || [];
  const newOrder = [...currentOrder];

  for (const id of cantileverIds) {
    if (!newOrder.includes(id)) newOrder.push(id);
  }

  await prisma.pole.update({
    where: { id: poleId },
    data: {
      cantileversOrder: newOrder,
    },
  });

  return true;
}

export async function unlinkCantileversFromPole(cantileverIds: number[]): Promise<boolean> {
  if (!cantileverIds.length) return false;

  const existingCantilevers = await prisma.cantilever.findMany({
    where: { id: { in: cantileverIds } },
    include: { pole: true },
  });

  if (existingCantilevers.length !== cantileverIds.length) return false;

  // Group cantilevers by pole to update orders per pole
  const poleMap = new Map<number, number[]>();

  for (const cantilever of existingCantilevers) {
    if (cantilever.pole) {
      const current = poleMap.get(cantilever.pole.id) || [];
      poleMap.set(cantilever.pole.id, [...current, cantilever.id]);
    }
  }

  for (const [poleId, idsToRemove] of poleMap.entries()) {
    const pole = await prisma.pole.findUnique({
      where: { id: poleId },
    });

    if (pole) {
      const currentOrder: number[] = (pole.cantileversOrder as number[]) || [];
      const newOrder = currentOrder.filter(id => !idsToRemove.includes(id));

      await prisma.pole.update({
        where: { id: poleId },
        data: { cantileversOrder: newOrder },
      });
    }
  }

  // Remove pole_id from cantilevers
  await prisma.cantilever.updateMany({
    where: { id: { in: cantileverIds } },
    data: { pole_id: null },
  });

  return true;
}

// Delete a cantilever by ID for a specific user
export async function unlinkCantilever(request: Request, cantileverId: number):Promise<boolean> {

  await requireUser(request);

  try{

    const unlinked = await unlinkCantileversFromPole([cantileverId])

    return unlinked;

  }catch(error){

    console.error("Error deleting cantilever:", error);
    return false;

  }

}



// Delete a cantilever by ID for a specific user
export async function deleteCantilever(request: Request, cantileverId: number, projectId:number):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'destroy','Cantilever',projectId)

  try{

    const cantilever = await prisma.cantilever.findUnique({
      where:{
        id:cantileverId,
      },
      include: {
        pole: {
          include: {
            via: {
              include: {
                location: true, // include location inside via
              },
            },
          },
        },
        vanes: true,
      },
    })

    if(!cantilever) return false;

    if(cantilever.pole){

      await unlinkCantileversFromPole([cantileverId]);

    }

    const vaneIds = cantilever.vanes.map((v) => v.id);
    if (vaneIds.length > 0) {
      await prisma.vane.deleteMany({
        where: { id: { in: vaneIds } },
      });
    }


    await prisma.cantilever.delete({
      where: {
        id: cantileverId,
      },
    });

    await createHistory(
      projectId,
      cantilever.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'DELETE',
       cantileverId,
      'Cantilever',
      JSON.stringify(cantilever),
      null
    );

    return true;

  }catch(error){

    console.error("Error deleting cantilever:", error);
    return false;

  }

}

export async function getCantilevers(
  request: Request,
  projectId:number,
  page: number = 1,
  size: number = 5,
  pov:'local'|'global',
  filters: Record<string, string | null> // Accept filters object
): Promise<{ cantilevers: CantileverDataContent[]; lastPage: number; currentPage: number } | null> {
  const user = await requireUser(request);

  await requirePermission(user,'view','Cantilever',projectId);

  // Define filter criteria
  const whereClause: Record<string, any> = { };

  whereClause.OR = [
    { project_id: projectId},
    {
      pole:{
        project_id:projectId,
      }
    },
    {
      pole:{
        via: {
          location:{
            project_id: projectId
          } 
        }
      }
    }
  ];

  if (filters.external_id) {
    whereClause.external_id = decodeURIComponent(filters.external_id);
  }

  if (filters.via_id) {
    whereClause.pole = {
      via_id:Number(filters.via_id)
    }
  }

  if (filters.via) {
    whereClause.pole = {
      via:{
        external_id: decodeURIComponent(filters.via)
      }
    }
  }

  if (filters.location) {
    whereClause.OR = [
      { location: decodeURIComponent(filters.location)},
      {
        pole:{
          via: {
            location:{
              external_id: decodeURIComponent(filters.location)
            } 
          }
        }
      }
    ];
  }

  if(filters.location_id){
    whereClause.OR = [
      { location_id: Number(filters.location_id) },
      {
        pole:{
          via: {
            location_id: Number(filters.location_id)
          }
        }
      }
    ];
  }

  if (filters.pole_id) {
    whereClause.pole_id = Number(filters.pole_id);
  }

  if (filters.pole) {
    whereClause.pole = {
      external_id: decodeURIComponent(filters.pole)
    };
  }

  // Calculate total count with filtering
  const totalCantilevers = await prisma.cantilever.count({
    where: whereClause,
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
  });

  if (totalCantilevers === 0) return null;

  const lastPage = Math.ceil(totalCantilevers / size);

  if (page < 1) page = 1; // Ensure page is at least 1
  if (size < 1) size = 5; // Default size if invalid


  // Fetch cantilevers with or without filters
  const cantilevers = await prisma.cantilever.findMany({
    where:whereClause,
    skip: (page - 1) * size,
    take: size,
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
    include: {
      pole: {
        include: {
          via: {
            include: {
              location: true, // include location inside via
            },
          },
        },
      },
    },
  });

  if (!cantilevers || cantilevers.length === 0) {
    return null;
  }

  const parsedData = cantilevers.map((cant) => ({
    ...cant,
    params: JSON.parse(cant.params), // Parse params field
    created_by: user.username,
  }));

  const CantileverClasses:CantileverDataContent[] = parsedData.map((cant) => {

      const parsedPoleParams = cant.pole?.params ? JSON.parse(cant.pole.params) : null;

      const formatttedPov = parsedPoleParams == null ? 'local' : pov;

      const CantileverClass = getCantileverClass(cant.params,parsedPoleParams,formatttedPov);

      return {
      cantilever:{ 
        id:                       cant.id,
        external_id:              cant.external_id,
        pole_id:                  cant.pole_id ?? null,
        pole:                     cant.pole?.external_id ?? null,
        via:                      cant.pole?.via?.external_id ?? null,
        via_id:                   cant.pole?.via_id ?? null,
        location:                 cant.pole?.via?.location?.external_id ?? cant.location,
        location_id:              cant.pole?.via?.location_id ?? cant.location_id,
        project:                  cant.pole?.via?.project ?? cant.project,
        project_id:               cant.pole?.via?.project_id ?? cant.project_id,
        params:                   cant.params,
        created_by:               cant.created_by,
        createdAt:                cant.createdAt,
        updatedAt:                cant.updatedAt
      },
      centers:CantileverClass.getCenters(),
      points:CantileverClass.generatePoints(),
      links:CantileverClass.generateLinks(),
      dimensions:CantileverClass.generateDimensions(),
      cw:CantileverClass.cw_axis,
      mw:CantileverClass.mw_axis,
      via_axis:CantileverClass.via_axis,
      pv:CantileverClass.pv,
      polePosition:parsedPoleParams?.position ?? null,
      results:CantileverClass.generateResults()
    }
  })  

  return {
    cantilevers: CantileverClasses,
    lastPage,
    currentPage: page,
  };
}


// Get all cantilevers for a specific user
export async function getCantileverData(
  request: Request,
  projectId:number, 
  cantileverId:number,
  pov:'local'|'global',
  params?:CantileverParams
):Promise<CantileverDataContent|null> {

  const user = await requireUser(request);
  await requirePermission(user,'view','Cantilever',projectId)

  const cantilever = await prisma.cantilever.findUnique({
    where: { id:cantileverId },
    include: {
      pole: {
        include: {
          via: {
            include: {
              location: true, // include location inside via
            },
          },
        },
      },
    },
  });

  if(!cantilever){
    return null;
  }

  let cantileverParsed = { ...cantilever, params: ( params ? params.params : JSON.parse(cantilever.params))  };

  const parsedPoleParams = cantilever.pole?.params ? JSON.parse(cantilever.pole.params) : null;

  const formatttedPov = parsedPoleParams == null ? 'local' : pov;

  const CantileverClass = params ?  getCantileverClass(params.params,parsedPoleParams,formatttedPov) :  getCantileverClass(cantileverParsed.params,parsedPoleParams,pov);



  const returnData =  {
    cantilever:{ 
      id:                       cantileverParsed.id,
      external_id:              cantileverParsed.external_id,
      pole_id:                  cantileverParsed.pole_id ?? null,
      pole:                     cantileverParsed.pole?.external_id ?? null,
      via:                      cantileverParsed.pole?.via?.external_id ?? null,
      via_id:                   cantileverParsed.pole?.via_id ?? null,
      location:                 cantileverParsed.pole?.via?.location?.external_id ?? cantileverParsed.location,
      location_id:              cantileverParsed.pole?.via?.location_id ?? cantileverParsed.location_id,
      project:                  cantileverParsed.pole?.via?.project ?? cantileverParsed.project,
      project_id:               cantileverParsed.pole?.via?.project_id ?? cantileverParsed.project_id,
      params:                   cantileverParsed.params,
      created_by:               cantileverParsed.created_by,
      createdAt:                cantileverParsed.createdAt,
      updatedAt:                cantileverParsed.updatedAt
    },
    centers:CantileverClass.getCenters(),
    points:CantileverClass.generatePoints(),
    links:CantileverClass.generateLinks(),
    dimensions:CantileverClass.generateDimensions(),
    cw:CantileverClass.cw_axis,
    mw:CantileverClass.mw_axis,
    via_axis:CantileverClass.via_axis,
    pv:CantileverClass.pv,
    polePosition:parsedPoleParams.position,
    results:CantileverClass.generateResults()
  } 

  return returnData;
}

// Get all cantilevers by type and value
export async function getCantileversByTypeAndValue(
  request: Request, 
  projectId:number,
  type: "external_id" | "via" | "location" | "pole",
  value:string,
  pov:'local'|'global',
): Promise<{ cantilever: CantileverParams, results: { name: string, diameter: number, thickness: number, length_tube: number, cut_length: number }[] }[] | null> {

  const user = await requireUser(request);

  await requirePermission(user,'view','Cantilever',projectId)

  // Define the search criteria based on the valid type and value
  const where: Record<string, any> = { };

  where.OR = [
    { project_id: projectId},
    {
      pole:{
        project_id:projectId,
      }
    },
    {
      pole:{
        via: {
          location:{
            project_id: projectId
          } 
        }
      }
    }
  ];

  if (type === "external_id") {
    where.external_id = value;
  }else if(type === "via"){
    where.pole = { 
      via: {
        external_id: value
      }
    };
  }else if(type === "location"){
    where.pole = {
      via:{
        location: {
          external_id: value
        }
      }
    };
  }else if(type === "pole"){
    where.pole = {
      external_id: value
    };
  } else {
    // Return null if the type is not valid
    return null;
  }

  // Fetch cantilevers with the specified criteria
  const cantilevers = await prisma.cantilever.findMany({
    where,
    orderBy: {
      createdAt: 'desc', // Orders by `createdAt` in descending order
    },
    include: {
      pole: {
        include: {
          via: {
            include: {
              location: true, // include location inside via
            },
          },
        },
      },
    },
  });

  if (!cantilevers.length) {
    return null;
  }

  // Loop through each cantilever and retrieve relevant data
  const cantileverDataArray = await Promise.all(
    cantilevers.map(async (cantilever) => {
      const cantileverParsed = { ...cantilever, params: JSON.parse(cantilever.params) };

      const parsedPoleParams = cantilever.pole?.params ? JSON.parse(cantilever.pole.params) : null;

      const formatttedPov = parsedPoleParams == null ? 'local' : pov;

      const CantileverClass =  getCantileverClass(cantileverParsed.params,parsedPoleParams,formatttedPov);

      return {
        cantilever:{ 
          id:                       cantileverParsed.id,
          external_id:              cantileverParsed.external_id,
          pole_id:                  cantileverParsed.pole_id ?? null,
          pole:                     cantileverParsed.pole?.external_id ?? null,
          via:                      cantileverParsed.pole?.via?.external_id ?? null,
          via_id:                   cantileverParsed.pole?.via_id ?? null,
          location:                 cantileverParsed.pole?.via?.location?.external_id ?? cantileverParsed.location,
          location_id:              cantileverParsed.pole?.via?.location_id ?? cantileverParsed.location_id,
          project:                  cantileverParsed.pole?.via?.project ?? cantileverParsed.project,
          project_id:               cantileverParsed.pole?.via?.project_id ?? cantileverParsed.project_id,
          params:                   cantileverParsed.params,
          created_by:               cantileverParsed.created_by,
          createdAt:                cantileverParsed.createdAt,
          updatedAt:                cantileverParsed.updatedAt
        },
        results: CantileverClass.generateResults(),
      };
    })
  );

  return cantileverDataArray;
}
