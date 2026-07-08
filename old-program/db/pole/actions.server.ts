// actions.server.ts

import { prisma } from "~/db/db.server"; // Import Prisma client instance
import Pole from "~/db/pole/Pole.server"; // Import PoleGerman model for serialization
import {requireUser} from "../auth/session.server";
import { linkCantileversToPole, unlinkCantileversFromPole } from "../cantilever/actions.server";
import {createHistory} from "../history/actions.server";
import {requirePermission} from "../permission/actions.server";

export function formatCantileverConfiguration(poleData:PoleParams):PoleParams{

 let newConfiguration = 'NONE' as TypePole['cantileverConfiguration'];

 if(poleData.cantilevers.length == 1){
    newConfiguration = 'SINGLE' as TypePole['cantileverConfiguration'];
 }else if(poleData.cantilevers.length > 1){
    newConfiguration = 'MULTIPLE' as TypePole['cantileverConfiguration'];
 }

  const poleDataParsed = { 
    ...poleData, 
    params:{ ...poleData.params, 
              model: { 
                        ...poleData.params.model, 
                        type: { 
                            ...poleData.params.model.type,
                            cantileverConfiguration:newConfiguration,
                        }
              } 
    } 
  }

  return poleDataParsed;
}

// Create a new pole for a user
export async function createPole(
  request: Request, 
  poleData: PoleParams
):Promise<PoleParams|null> {

  const user = await requireUser(request);

  await requirePermission(user,'store','Pole',poleData.project_id)

  // Extract and preserve the order array of cantilever IDs
  const cantileverIds = poleData.cantilevers
    .map(c => c.id)
    .filter((id): id is number => !!id);

  const formattedParams = formatCantileverConfiguration(poleData).params;

  // Fetch and process cantilevers if provided
  if (cantileverIds.length) {
    // 1️⃣ Fetch all cantilevers in bulk
    const cantilevers = await prisma.cantilever.findMany({
      where: { id: { in: cantileverIds } },
    });

    // 2️⃣ Build an id→index map from your original order array
    const orderMap = new Map<number, number>();
    cantileverIds.forEach((id, idx) => orderMap.set(id, idx));

    // 3️⃣ Sort in place by that map
    cantilevers.sort((a, b) => {
      const posA = orderMap.get(a.id) ?? Infinity;
      const posB = orderMap.get(b.id) ?? Infinity;
      return posA - posB;
    });

    const cantileversUnparsed = cantilevers.map(cat => ({
      ...cat,
      params: JSON.parse(cat.params),
    }));

    const poleClass = new Pole(
      formattedParams.position,
      formattedParams.model as PoleModelInterface,
      formattedParams.cat_separation,
      formattedParams.support_offset,
      formattedParams.bottom_fixed_height,
      formattedParams.fixing_distance,
      formattedParams.pv,
      formattedParams.esc,
      cantileversUnparsed
    );

    const updatedCantileversData = poleClass.getUpdatedCantilever();
    for (const cat of updatedCantileversData) {
      await prisma.cantilever.update({
        where: { id: cat.id },
        data: {
          ...cat,
          params: JSON.stringify(cat.params)
        }
      });
    }
  }

  // Create the pole
  const createData: any = {
    external_id: poleData.external_id,
    via_id: poleData.via_id ?? null,
    line_id: poleData.line_id ?? null,
    params: JSON.stringify(formattedParams),
    cantileversOrder: cantileverIds,
    created_by: user.username,
  };

  if (!poleData.via_id) {
    createData.location = poleData.location ?? null;
    createData.location_id = poleData.location_id ?? null;
    createData.project = poleData.project ?? null;
    createData.project_id = poleData.project_id ?? null;
  }

  const pole = await prisma.pole.create({
    data: createData,
    include: {
      via: { include: { location: true } },
    },
  });

  // Link cantilevers to the pole
  if (cantileverIds.length > 0) {
    await prisma.cantilever.updateMany({
      where: { id: { in: cantileverIds } },
      data: { pole_id: pole.id },
    });
  }

  // Fetch only the needed cantilever fields
  const linked = cantileverIds.length
    ? await prisma.cantilever.findMany({
        where: { id: { in: cantileverIds } },
        select: { id: true, external_id: true }
      })
    : [];

  // Sort by the saved order
  const order: number[] = pole.cantileversOrder as number[] || [];
  linked.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));

  // Create history entry
  await createHistory(
    poleData.project_id,
    poleData.external_id,
    user.id,
    user.username,
    user.imageUrl,
    'CREATE',
    pole.id,
    'Pole',
    null,
    JSON.stringify(pole)
  );

  // Return Pole + ordered minimal cantilever info
  return {
      id:            pole.id,
      external_id:   pole.external_id,
      via:           pole.via?.external_id ?? null,
      via_id:        pole.via_id ?? null,
      line_id:       pole.line_id,
      location:      pole.via?.location.external_id ?? pole.location ?? null,
      location_id:   pole.via?.location_id ?? pole.location_id ?? null,
      project:       pole.via?.project ?? pole.project ?? null,
      project_id:    pole.via?.project_id ?? pole.project_id ?? null,
      created_by:    pole.created_by,
      createdAt:     pole.createdAt,
      updatedAt:     pole.updatedAt,
      params:        JSON.parse(pole.params),
      cantilevers:   linked
  }

}


// Update a pole by ID for a specific user
export async function updatePole(
  request: Request,
  poleId: number,
  projectId: number,
  updatedData: PoleParams
): Promise<boolean> {
  const user = await requireUser(request);
  await requirePermission(user, 'update', 'Pole', projectId);

  try {
    // 1. 1️⃣ Recompute formatted params
    const formatted = formatCantileverConfiguration(updatedData);

    // 2. Pull out the ordered list of IDs
    const cantileverIds: number[] = updatedData.cantilevers
      .map(item => item.id)
      .filter((id): id is number => typeof id === 'number');

    // 3. Update pole data (excluding cantilevers)
    const updtData: any = {
      external_id: updatedData.external_id,
      via_id: updatedData.via_id ?? null,
      line_id: updatedData.line_id ?? null,
      params: JSON.stringify(formatted.params),
      cantileversOrder: cantileverIds,
      updatedAt: new Date()
    };

    if (!updatedData.via_id) {
      updtData.location = updatedData.location ?? null;
      updtData.location_id = updatedData.location_id ?? null;
      updtData.project = updatedData.project ?? null;
      updtData.project_id = updatedData.project_id ?? null;
    }


    await prisma.pole.update({
      where: { id: poleId },
      data: updtData,
    });

    // 4. Unlink all existing cantilevers from this pole
    await prisma.cantilever.updateMany({
      where: { pole_id: poleId },
      data: { pole_id: null }
    });

    if (cantileverIds.length) {
        // 5. Fetch all new cantilever records
        const cantilevers = await prisma.cantilever.findMany({
          where: { id: { in: cantileverIds } }
        });

        // 6. Build map for constant-time index lookup
        const orderMap = new Map<number, number>();
        cantileverIds.forEach((id, idx) => orderMap.set(id, idx));

        // 7. Sort fetched cantilevers in the same order
        cantilevers.sort((a, b) => {
          const posA = orderMap.get(a.id) ?? Infinity;
          const posB = orderMap.get(b.id) ?? Infinity;
          return posA - posB;
        });

        // 8. Parse their params and feed into your Pole logic
        const cantileversWithParams = cantilevers.map(cat => ({
          ...cat,
          params: JSON.parse(cat.params),
        }));

        const poleClass = Pole.deserialize(formatted.params,cantileversWithParams,'local'); 
        // 9. Compute any updated cantilever data
        const updatedCantilevers = poleClass.getUpdatedCantilever();

        // 10. Persist each one (link + updated params)
        for (const updated of updatedCantilevers) {
          await prisma.cantilever.update({
            where: { id: updated.id },
            data: {
              pole_id:    poleId,
              params:     JSON.stringify(updated.params),
              updatedAt:  new Date(),
            },
          });
        }
    }

    // 11. Create history
    await createHistory(
      projectId,
      updatedData.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'UPDATE',
      poleId,
      'Pole',
      null,
      JSON.stringify(updtData)
    );

    return true;

  } catch (error) {
    console.error('Error updating pole:', error);
    return false;
  }
}

// Delete a pole by ID for a specific user
export async function deletePole(request: Request, poleId: number, projectId: number): Promise<boolean> {
  const user = await requireUser(request);
  await requirePermission(user, 'destroy', 'Pole', projectId);

  try {
    const pole = await prisma.pole.findUnique({
      where: { id: poleId },
      include: {
        cantilevers: {
          include: { vanes: true },
        },
      },
    });

    if (!pole) return false;

    // Iterate over all cantilevers
    for (const cantilever of pole.cantilevers) {
      for (const vane of cantilever.vanes) {
        const vaneWithCantilevers = await prisma.vane.findUnique({
          where: { id: vane.id },
          include: { cantilevers: true },
        });

        await prisma.vane.delete({ where: { id: vane.id } });
      }

      // Delete cantilever
      await prisma.cantilever.delete({ where: { id: cantilever.id } });
    }

    // Delete the pole
    await prisma.pole.delete({ where: { id: poleId } });

    await createHistory(
      projectId,
      pole.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'DELETE',
      poleId,
      'Pole',
      JSON.stringify(pole),
      null
    );

    return true;

  } catch (error) {
    console.error("Error deleting pole:", error);
    return false;
  }
}

export async function getPoleList(
  request: Request,
  projectId:number,
  locationId:number,
):Promise<{id:number, external_id:string }[]>{

  const user = await requireUser(request);

  await requirePermission(user,'view','Pole',projectId);

  const poles = await prisma.pole.findMany({
    where: {
      OR: [
        {
          project_id: projectId,
          location_id: locationId,
        },
        {
          via: {
            project_id: projectId,
            location_id: locationId,
          },
        },
      ],
    },
    orderBy: { external_id: 'desc' },
    include: {
      via: { include: { location: true } },
      cantilevers: true,
    },
  });

  return poles.map(p => ({
    id: p.id,
    external_id: p.external_id,
  }));
}

export function parsePoleAndCantilever(
  pole:any,
  pov: "local"|"global"// whatever your context is
): PoleDataContent {

  // 1) pull out the order & raw cantilevers
  const order: number[] = (pole.cantileversOrder as number[]) || [];
  const rawCantis = pole.cantilevers;
  const parsedParams = JSON.parse(pole.params);

  // 2) build an id→index map
  const orderMap = new Map<number, number>();
  order.forEach((id, idx) => orderMap.set(id, idx));

  // 3) parse & sort the cantilever params
  const cantisWithParams: CantileverParams[] = rawCantis
    .map(c => ({ ...c, params: JSON.parse(c.params) }))
    .sort((a, b) => {
      const pa = orderMap.get(a.id) ?? Infinity;
      const pb = orderMap.get(b.id) ?? Infinity;
      return pa - pb;
    });

  // 4) your domain logic
  const domainPole = Pole.deserialize(parsedParams, cantisWithParams, pov);

  const domainCantilevers = domainPole.getCantilevers();

  // 5) minimal list for the API
  const minimalCantis = order
    .map(id => rawCantis.find(c => c.id === id)!)
    .map(c => ({ id: c.id, external_id: c.external_id }));


  domainCantilevers.forEach((entry, idx) => {
    entry.cantilever = {
      id:          entry.cantilever.id,
      external_id: entry.cantilever.external_id,
      pole_id:     entry.cantilever.pole_id ?? null,
      pole:        pole.external_id,
      via:         pole.via?.external_id ?? null,
      via_id:      pole.via_id ?? null,
      location:    pole.via?.location.external_id ?? pole.location ?? null,
      location_id: pole.via?.location_id ?? pole.location_id ?? null,
      project:     pole.via?.project ?? pole.project ?? null,
      project_id:  pole.via?.project_id ?? pole.project_id ?? null,
      params:      entry.cantilever.params,
      created_by:  entry.cantilever.created_by,
      createdAt:   entry.cantilever.createdAt,
      updatedAt:   entry.cantilever.updatedAt
    };
  });


  const domainCantileversSorted = order
    .map(id => domainCantilevers.find(e => e.cantilever.id === id))
    .filter(Boolean as any);

  // 6) build the final shape
  return {
    pole: {
      id:            pole.id,
      external_id:   pole.external_id,
      via:           pole.via?.external_id ?? null,
      via_id:        pole.via_id ?? null,
      line_id:       pole.line_id,
      location:      pole.via?.location.external_id ?? pole.location ?? null,
      location_id:   pole.via?.location_id ?? pole.location_id ?? null,
      project:       pole.via?.project ?? pole.project ?? null,
      project_id:    pole.via?.project_id ?? pole.project_id ?? null,
      created_by:    pole.created_by,
      createdAt:     pole.createdAt,
      updatedAt:     pole.updatedAt,
      params:        parsedParams,
      cantilevers:   minimalCantis,
    },
    position:    domainPole.calculatedPosition,
    pv:          domainPole.calculatedPv,
    cantilevers: domainCantileversSorted,
    centers:     domainPole.getCenters(),
    dimensions:  domainPole.generateDimensions(),
  };
}

export async function getPoles(
  request: Request,
  projectId:number,
  page: number = 1,
  size: number = 5,
  pov:'local'|'global',
  filters: Record<string, string | null>
): Promise<{ poles: PoleDataContent[]; lastPage: number; currentPage: number } | null> {


  const user = await requireUser(request);

  await requirePermission(user,'view','Pole',projectId);

  // Construct dynamic filter
  const whereClause: Record<string, any> = {};

  whereClause.OR = [
    { project_id: projectId},
    {
      via: {
        location:{
          project_id: projectId
        } 
      }
    }
  ];

  if (filters.external_id) {
    whereClause.external_id = decodeURIComponent(filters.external_id);
  }

  if (filters.via_id) {
    whereClause.via_id = Number(filters.via_id);
  }

  if (filters.via) {
    whereClause.via = {
      external_id: decodeURIComponent(filters.via)
    };
  }

  if (filters.location) {
    whereClause.OR = [
      { location: decodeURIComponent(filters.location) },
      {
        via: {
          location: {
            external_id:decodeURIComponent(filters.location),
          }
        }
      }
    ];
  }

  if (filters.location_id) {
    whereClause.OR = [
      { location_id: Number(filters.location_id) },
      {
        via: {
          location_id: Number(filters.location_id)
        }
      }
    ];
  }

  if (filters.withCantilevers){
    whereClause.cantilevers = { some: {} }; // At least one cantilever
  }

  const totalPoles = await prisma.pole.count({ where: whereClause });

  if (totalPoles === 0) return null;

  const lastPage = Math.ceil(totalPoles / size);
  const currentPage = Math.max(page, 1);

  // Fetch poles with or without filters
  const poles = await prisma.pole.findMany({
    where: whereClause,
    skip: (currentPage - 1) * size,
    take: size,
    orderBy: { createdAt: 'desc' },
    include: { 
      via: { include: { location: true } },
      cantilevers: true,
    }, // fetch related cantilevers
  });

  const PoleClasses: PoleDataContent[] = await Promise.all(
    poles.map(async (pole) => {
      return parsePoleAndCantilever(pole,pov);
    })
  );

  return {
    poles: PoleClasses,
    lastPage,
    currentPage,
  };
}


// Get all poles for a specific user
export async function getPoleData(
  request: Request, 
  projectId: number,
  poleId: number,
  pov: 'local' | 'global',
  params?: PoleParams
): Promise<PoleDataContent | null> {

  const user = await requireUser(request);

  await requirePermission(user,'view','Pole',projectId);

  const pole = await prisma.pole.findUnique({
    where: { id: poleId, project_id: projectId },
    include: {
      via: { include: { location: true } },
      cantilevers: true ,
    },
  });

  if (!pole) return null;

  const parsedParams = JSON.parse(pole.params);

  const newOrder = params?.cantilevers
    ?.map(c => c.id)
    .filter((id): id is number => id != null) 
    ?? [];

  const poleModified = {
    ...pole,
    params: params
      ? JSON.stringify({ 
          // start with existing, but let `params` override
          ...parsedParams,      
          ...params.params          
        })
      : JSON.stringify(parsedParams),
    cantileversOrder: newOrder.length
      ? newOrder
      : pole.cantileversOrder,
  };

  return parsePoleAndCantilever(poleModified,pov);
}

// Get all poles by type and value
export async function getPolesByTypeAndValue(
  request: Request,
  projectId: number,
  type: "external_id" | "via_id" | "location_id" | "via" | "location",
  value: string,
  pov: 'local' | 'global',
): Promise<PoleDataContent[] | null> {

  const user = await requireUser(request);
  await requirePermission(user, 'view', 'Pole', projectId);

  // Construct dynamic filter
  let where: Record<string, any> = {};

  where.OR = [
    { project_id: projectId},
    {
      via: {
        location:{
          project_id: projectId
        } 
      }
    }
  ];

  if (type === "external_id") {
    where.external_id = value;
  } else if (type === "via_id") {
    where.via_id = Number(value);
  }else if(type === "via"){
    where.via = {
      external_id: value
    };
  }else if(type === "location"){
    where.OR = [
      { location: decodeURIComponent(value)},
      {
        via: {
          location:{
            external_id: decodeURIComponent(value)
          } 
        }
      }
    ];
  } else if (type === "location_id") {
    // instead of filtering on pole.location_id, filter on the related via.location_id
    where.OR = [
      { location_id: Number(value) },
      { via: { location_id: Number(value) } }
    ];
  } else {
    return null;
  }

  const poles = await prisma.pole.findMany({
    where,
    include: { 
      via: { include: { location: true } },
      cantilevers: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!poles.length) return null;

  return poles.map((pole) => {
    return parsePoleAndCantilever(pole,pov);
  });
}
