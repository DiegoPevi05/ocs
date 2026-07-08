// actions.server.ts
import { prisma } from "~/db/db.server"; 
import VaneGerman from "~/db/vane/GermanVane.server";
import VaneBrazilian from "~/db/vane/BrazilianVane.server";
import {requireUser} from "../auth/session.server";
import {createHistory} from "../history/actions.server";
import {requirePermission} from "../permission/actions.server";
import { ArePoleSamePosition, calculateParams } from "./helper.server";
import Pole from "~/db/pole/Pole.server"; // Import PoleGerman model for serialization

export function getVaneClass(
  data:VaneParamsProps,
  cantilevers:CantileverDataContent[],
  pov:"local"|"global",
):VaneGerman|VaneBrazilian {

  if(data.model.code == "BR"){
    return VaneBrazilian.deserialize(data as VaneBrazilianParams,cantilevers,pov)
  }else if(data.model.code == "GY"){
    return VaneGerman.deserialize(data as VaneGermanParams, cantilevers,pov)
  }else{
    return VaneBrazilian.deserialize(data as VaneBrazilianParams,cantilevers,pov)
  }
}


// Create a new vane for a user
export async function createVane(request: Request, vaneData: VaneParams):Promise<VaneParams|null> {

  const user = await requireUser(request);

  await requirePermission(user,'store','Vane',vaneData.project_id)

  const cantileverIds = vaneData.cantilevers
    .map(c => c.id)
    .filter((id): id is number => !!id);

  if(vaneData.params.calculation_type == "automatic"){

    if(cantileverIds.length == 0 || cantileverIds.length > 2 ) return null;

    if(cantileverIds[0] === cantileverIds[1]) return null;

  }

  const createData:any = {
    external_id:vaneData.external_id,
    params: JSON.stringify(vaneData.params),
    created_by:user.username 
  }

  if (cantileverIds.length == 0) {
    createData.location = vaneData.location ?? null;
    createData.location_id = vaneData.location_id ?? null;
    createData.project = vaneData.project ?? null;
    createData.project_id = vaneData.project_id ?? null;
  }

  if (cantileverIds.length > 0) {
    createData.cantilevers = {
      connect: cantileverIds.map((id) => ({ id })),
    };
  }

  const vane = await prisma.vane.create({
    data: createData,
  });

  const vaneWithCantilevers = await prisma.vane.findUnique({
      where: { id: vane.id },
      include: {
        cantilevers: {
          include: {
            pole: {
              include: {
                via: {
                  include: { location: true },
                },
              },
            },
          },
        },
      },
  });

  const minimalCantis = vaneWithCantilevers!.cantilevers
    .map(c => ({ id: c.id, external_id: c.external_id }));

  await createHistory(
    vaneData.project_id,
    vaneData.external_id,
    user.id,
    user.username,
    user.imageUrl,
    'CREATE',
    vane.id,
    'Vane', 
    null,
    JSON.stringify(vane)
  );

  return {
    id:vaneWithCantilevers.id,
    external_id:   vaneWithCantilevers!.external_id,
    location:      vaneWithCantilevers!.cantilevers[0]?.pole?.via?.location.external_id ?? vaneWithCantilevers.location ?? null,
    location_id:   vaneWithCantilevers!.cantilevers[0]?.pole?.via?.location_id ?? vaneWithCantilevers.location_id ?? null,
    project:       vaneWithCantilevers!.cantilevers[0]?.pole?.via?.project ?? vaneWithCantilevers.project ?? null,
    project_id:    vaneWithCantilevers!.cantilevers[0]?.pole?.via?.project_id ?? vaneWithCantilevers.project_id ?? null,
    params:        JSON.parse(vaneWithCantilevers!.params),
    cantilevers:   minimalCantis,
    created_by:    vaneWithCantilevers!.created_by,
    createdAt:     vaneWithCantilevers!.createdAt,
    updatedAt:     vaneWithCantilevers!.updatedAt,
  }

}


// Update a vane by ID for a specific user
export async function updateVane(request: Request, vaneId: number, projectId:number, updatedData: VaneParams):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Vane', projectId )

  // 2. Pull out the ordered list of IDs
  const cantileverIds: number[] = updatedData.cantilevers
    .map(item => item.id)
    .filter((id): id is number => typeof id === 'number');

  if(updatedData.params.calculation_type == "automatic"){

    if(cantileverIds.length == 0 || cantileverIds.length > 2 ) return;

    if(cantileverIds[0] === cantileverIds[1]) return;

  }

  // 3. Update pole data (excluding cantilevers)
  const updtData: any = {
    external_id:updatedData.external_id,
    params: JSON.stringify(updatedData.params),
    updatedAt: new Date()
  };

  if (cantileverIds.length == 0) {
    updtData.location = updatedData.location ?? null;
    updtData.location_id = updatedData.location_id ?? null;
    updtData.project = updatedData.project ?? null;
    updtData.project_id = updatedData.project_id ?? null;
  }

  try{

    await prisma.vane.update({
      where: { id: vaneId },
      data: {
        ...updtData,
        cantilevers: {
          // remove *all* existing links...
          set: [],
          // ...and then re-connect the new list (if any)
          ...(cantileverIds.length > 0 && {
            connect: cantileverIds.map((id) => ({ id })),
          }),
        },
      },
    });

    await createHistory(
      projectId,
      updatedData.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'UPDATE',
       vaneId,
      'Vane',
      null,
      JSON.stringify(updtData)
    );

    return true;


  }catch(error){

    console.error("Error updating vane:", error);
    return false;

  }

}

// Delete a vane by ID for a specific user
export async function deleteVane(request: Request, vaneId: number, projectId:number):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'destroy','Vane', projectId )

  try{

    const vane = await prisma.vane.findUnique({
      where: { id: vaneId },
    })

    if(!vane) return false;

    await prisma.vane.delete({
      where: { id: vaneId }
    });

    await createHistory(
      projectId,
      vane.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'DELETE',
       vaneId,
      'Vane',
      null,
      null
    );

    return true;

  }catch(error){

    console.error("Error deleting vane:", error);
    return false;

  }

}

export function parseVaneAndPoleAndCantilever (
  vane:any,
  pov:"local"|"global"
):VaneDataContent{

  const cantileversDataContent:CantileverDataContent[] = vane.cantilevers.map(cant =>  {

    const pole = cant.pole;
    const order: number[] = (pole.cantileversOrder as number[]) || [];
    const rawCantis = pole.cantilevers;
    const parsedParams = JSON.parse(pole.params);

    const orderMap = new Map<number, number>();
    order.forEach((id, idx) => orderMap.set(id, idx));

    const cantisWithParams: CantileverParams[] = rawCantis
      .map(c => ({ ...c, params: JSON.parse(c.params) }))
      .sort((a, b) => {
        const pa = orderMap.get(a.id) ?? Infinity;
        const pb = orderMap.get(b.id) ?? Infinity;
        return pa - pb;
      });

    const domainPole = Pole.deserialize(parsedParams, cantisWithParams, "global");

    const cantileversRelatedToPole =  domainPole.getCantilevers();

    return  cantileversRelatedToPole.find((ct) => ct.cantilever.external_id == cant.external_id);

  });

  const vaneParsed = JSON.parse(vane.params);

  const VaneClass = getVaneClass(vaneParsed, cantileversDataContent,pov);

  const minimalCantis = vane.cantilevers
    .map(c => ({ id: c.id, external_id: c.external_id }));
  
  return {
    vane: { 
      ...vane,
      params:vaneParsed, 
      location:      vane.cantilevers[0]?.pole?.via?.location.external_id ?? pole.location ?? null,
      location_id:   vane.cantilevers[0]?.pole?.via?.location_id ?? pole.location_id ?? null,
      project:       vane.cantilevers[0]?.pole?.via?.project ?? pole.project ?? null,
      project_id:    vane.cantilevers[0]?.pole?.via?.project_id ?? pole.project_id ?? null,
      cantilevers: minimalCantis  
    },
    links: VaneClass.generateLinks(),
    centers: VaneClass.getCenters(),
    wires: [
      {
        contact_wire_point:cantileversDataContent[0].cw,
        support_wire_point:cantileversDataContent[0].mw,
      },
      {
        contact_wire_point:cantileversDataContent[1].cw,
        support_wire_point:cantileversDataContent[1].mw,
      }
    ],
    dimensions: VaneClass.generateDimensions(),
    report_params: VaneClass.generateReportParams(),
    results: VaneClass.generateResults(),
  };

}

export async function getVanes(
  request: Request,
  projectId:number,
  page: number = 1,
  size: number = 5,
  pov:'local'|'global',
  filters: Record<string, string | null>
): Promise<{ vanes: VaneDataContent[]; lastPage: number; currentPage: number } | null> {

  const user = await requireUser(request);

  await requirePermission(user,'view','Vane', projectId )

  // Define filter criteria
  const whereClause: Record<string, any> = {};

  whereClause.OR = [
    { project_id: projectId},
    {
        cantilevers: {
          some: {
            pole: {
              via: {
                location: {
                  project_id: projectId
                }
              }
            }
          }
        }
    }
  ];

  if (filters.external_id) {
    whereClause.external_id = decodeURIComponent(filters.external_id);
  }

  if (filters.location) {

    whereClause.OR = [
      { location: decodeURIComponent(filters.location) },
      {
        cantilevers: {
          some: {
            pole: {
              via: {
                location: {
                  include: {
                    external_id:decodeURIComponent(filters.location),
                  }
                }
              }
            }
          }
        }
      }
    ];
  }

  if (filters.location_id) {
    whereClause.OR = [
      { location_id: Number(filters.location_id) },
      {
        cantilevers: {
          some: {
            pole: {
              via: {
                location_id: locationId
              }
            }
          }
        }
      }
    ];
  }

  const totalVanes = await prisma.vane.count({ where: whereClause });

  if (totalVanes === 0) return null;

  const lastPage = Math.ceil(totalVanes / size);
  const currentPage = Math.max(page, 1);

  // Fetch vanes with or without filters
  const vanes = await prisma.vane.findMany({
    where: whereClause, // Only apply filtering if whereClause is defined
    skip: (currentPage - 1) * size,
    take: size,
    orderBy: { createdAt: 'desc' },
    include:{
      cantilevers:{ 
        include: { 
          pole: { 
            include : { 
              via: { 
                include: { location: true } 
              },
              cantilevers: true,
            } 
          } 
        } 
      }
    }
  });

  const VaneClasses: VaneDataContent[] = await Promise.all(

    vanes.map(async (vane) => {
      return parseVaneAndPoleAndCantilever(vane,pov);
    })
  );

  return {
    vanes: VaneClasses,
    lastPage,
    currentPage,
  };
}


// Get all vanes for a specific user
export async function getVaneData(
  request: Request, 
  projectId:number,
  vaneId:number,
  pov:'local'|'global',
  params?:VaneParams
):Promise<VaneDataContent|null> {

  const user = await requireUser(request);

  await requirePermission(user,'view','Vane', projectId )

  const vane = await prisma.vane.findUnique({
    where: {  id:vaneId },
    include:{
      cantilevers:{ 
        include: { 
          pole: { 
            include : { 
              via: { 
                include: { location: true } 
              },
              cantilevers: true,
            } 
          } 
        } 
      }
    }
  });

  if(!vane) return null;
  
  const parsedParams = JSON.parse(vane.params);

  const vaneModified = {
    ...vane,
    params: params
      ? JSON.stringify({ 
          // start with existing, but let `params` override
          ...parsedParams,      
          ...params.params          
        })
      : JSON.stringify(parsedParams),
  };

  return parseVaneAndPoleAndCantilever(vaneModified,pov);
}

// Get all vanes by type and value
export async function getVanesByTypeAndValue(
  request: Request, 
  projectId:number,
  type: "external_id"| "location" | "location_id",
  value:string,
  pov: 'local' | 'global',
): Promise<VaneDataContent[] |null> {

  const user = await requireUser(request);
  await requirePermission(user,'view','Vane', projectId )

  // Define filter criteria
  const whereClause: Record<string, any> = {};

  whereClause.OR = [
    { project_id: projectId},
    {
        cantilevers: {
          some: {
            pole: {
              via: {
                location: {
                  project_id: projectId
                }
              }
            }
          }
        }
    }
  ];

  if (type === "external_id") {

    whereClause.external_id = decodeURIComponent(value);

  }else if(type === "location"){

    whereClause.OR = [
      { location: decodeURIComponent(value) },
      {
        cantilevers: {
          some: {
            pole: {
              via: {
                location: {
                  include: {
                    external_id:decodeURIComponent(value),
                  }
                }
              }
            }
          }
        }
      }
    ];

  } else if (type === "location_id") {
    whereClause.OR = [
      { location_id: Number(value) },
      {
        cantilevers: {
          some: {
            pole: {
              via: {
                location_id: locationId
              }
            }
          }
        }
      }
    ];
  }

  // Fetch vanes with the specified criteria
  const vanes = await prisma.vane.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include:{
      cantilevers:{ 
        include: { 
          pole: { 
            include : { 
              via: { 
                include: { location: true } 
              },
              cantilevers: true,
            } 
          } 
        } 
      }
    }
  });

  if (!vanes.length) return null;

  return vanes.map((vane) => {
    return parseVaneAndPoleAndCantilever(vane,pov);
  });
}
