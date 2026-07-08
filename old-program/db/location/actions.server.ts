// actions.server.ts

import { prisma } from "~/db/db.server"; // Import Prisma client instance
import { parsePoleAndCantilever } from "../pole/actions.server";
import {parseVaneAndPoleAndCantilever} from "../vane/actions.server";
import {requireUser} from "../auth/session.server";
import {createHistory} from "../history/actions.server";
import {requirePermission} from "../permission/actions.server";
import { getUserProject} from "../project/actions.server";

// Create a new pole for a user
export async function  createLocation(request: Request, locationData:  LocationParams   ):Promise<LocationParams|null> {

  const user = await requireUser(request);

  await requirePermission(user,'store','Location',locationData.project_id)

  const locationDataMutated = {
    external_id:locationData.external_id,
    project:locationData.project,
    project_id:locationData.project_id,
    created_by:user.username,
  };

  const location = await prisma.location.create({
    data: locationDataMutated,
    include: {
      vias: {
        include: {
          poles: {
            include: {
              cantilevers: true,
            },
          },
        },
      },
    },
  });

  await createHistory(
    locationData.project_id,
    locationData.external_id,
    user.id,
    user.username,
    user.imageUrl,
    'CREATE',
    location.id,
    'Location',
    null,
    JSON.stringify(location)
  );

  return location;

}


// Update a pole by ID for a specific user

/*export async function  updateLocation(request: Request, locationId: number, projectId:number, updatedData: LocationParams):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Location',projectId)

  try{

    const locationDataMutated = {
      external_id:updatedData.external_id,
      project:updatedData.project,
      project_id:updatedData.project_id,
    }

    await prisma.location.update({
      where:{
        id:locationId
      },
      data:locationDataMutated
    });

    const vias = updatedData.vias.map((via) => ({
      ...via,
      location_id:locationId,
      params:JSON.stringify(via.params),
      cantilevers:JSON.stringify(via.cantilevers),
      vanes:JSON.stringify(via.vanes),
      poles:JSON.stringify(via.poles),
    }));

    await prisma.via.updateMany({
      where:{
        location_id:locationId
      },
      data:vias
    });

    await createHistory(
      projectId,
      updatedData.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'UPDATE',
      locationId,
      'Location',
      null,
      JSON.stringify(updatedData)
    );

    return true;


  }catch(error){

    console.error("Error updating location:", error);
    return false;

  }

}*/

// Delete a pole by ID for a specific user
export async function deleteLocation(request: Request, locationId: number, projectId:number):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'destroy','Location',projectId)

  try{

    const  location = await prisma.location.findUnique({
      where:{
        id:locationId,
      }
    })

    if(!location) return false;

    await prisma.location.deleteMany({
      where: {
        id: locationId,
      },
    });

    await createHistory(
      projectId,
      location.external_id,
      user.id,
      user.username,
      user.imageUrl,
      'DELETE',
      locationId,
      'Location',
      JSON.stringify(location),
      null
    );

    return true;

  }catch(error){

    console.error("Error deleting pole:", error);
    return false;

  }

}

export async function getAllLocations(request:Request, projectId:number): Promise<{ location_id:number, external_id: string }[] > {

  const user = await requireUser(request);

  await requirePermission(user,'view','Location',projectId)

  // Fetch poles with or without filters
  const locations = await prisma.location.findMany({
    where: { project_id:projectId },
    orderBy: {
      external_id: 'desc', // Orders by `createdAt` in descending order
    },
  });

  if (!locations || locations.length === 0) {
    return [];
  }

  return locations.map((location) => ({
    location_id: location.id,
    external_id: location.external_id,
  }));

}

export async function getPreviewLocations(
  request: Request,
  projectId: number| null
): Promise<LocationParams[] | null> {
  const user = await requireUser(request);

  if(!projectId){
    await requirePermission(user,'view','Project')
  }else{
    await requirePermission(user, 'view', 'Location', projectId);
  }


  let projectIds: number[];
  if (projectId == null) {
    const projects = await getUserProject(request);
    if (!projects || projects.length === 0) return null;
    projectIds = projects.map((p) => p.id);
  } else {
    // Check permission on the single project
    await requirePermission(user, 'view', 'Location', projectId);
    projectIds = [projectId];
  }

  const locations = await prisma.location.findMany({
    where: { project_id: { in: projectIds } },
    take: 3,
    orderBy: { createdAt: 'desc' },
    include: {
      vias: {
        include: {
          poles: {
            include: {
              via: { include: { location: true } },
              cantilevers: {
                include: {
                  pole: true,
                  vanes: {
                    include: {
                      cantilevers: {
                        include: {
                          pole: {
                            include: {
                              via: { include: { location: true } },
                              cantilevers: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!locations.length) return null;

  const locationsParsed: LocationParams[] = await Promise.all(
    locations.map(async (loc) => {
      const viasParsed = await Promise.all(
        loc.vias.map(async (via) => {
          const viaParams = JSON.parse(via.params);
          const vaneList = JSON.parse(via.vanes);

          const poleContents: PoleDataContent[] = await Promise.all(
            via.poles.map(async (pole) => {
              return parsePoleAndCantilever(pole, "global");
            })
          );

          return {
            ...via,
            params: viaParams,
            vanes: vaneList,
            poles: poleContents,
          };
        })
      );

      const topLevelVanes = loc.vias
        .flatMap((via) => via.poles)
        .flatMap((pole) => pole.cantilevers)
        .flatMap((cant) => cant.vanes)
        .filter((v): v is NonNullable<typeof v> => !!v);

      const uniqueVanes = Array.from(
        new Map(topLevelVanes.map((v) => [v.id, v])).values()
      );

      const VaneClasses: VaneDataContent[] = await Promise.all(
        uniqueVanes.map(async (vane) => {
          return parseVaneAndPoleAndCantilever(vane, "global");
        })
      );

      return {
        ...loc,
        vias: viasParsed,
        vanes: VaneClasses,
        created_by: user.username,
      };
    })
  );

  return locationsParsed;
}

export async function getLocations(
  request: Request,
  projectId: number,
  page: number = 1,
  size: number = 5,
  filters: Record<string, string | null>
): Promise<{ locations: LocationParams[]; lastPage: number; currentPage: number } | null> {

  const user = await requireUser(request);
  await requirePermission(user, 'view', 'Location', projectId);

  // Build filter
  let whereClause: any = { project_id: projectId };
  if (filters.external_id) {
    whereClause.external_id = decodeURIComponent(filters.external_id);
  }
  if (filters.project) {
    whereClause.project = decodeURIComponent(filters.project);
  }

  // Count + pagination math
  const totalLocations = await prisma.location.count({ where: whereClause });
  if (totalLocations === 0) return null;
  const lastPage = Math.ceil(totalLocations / size);
  page = Math.max(1, page);

  // Fetch everything
  const locations = await prisma.location.findMany({
    where: whereClause,
    skip: (page - 1) * size,
    take: size,
    orderBy: { createdAt: 'desc' },
    include: {
      vias: {
        include: {
          poles: {
            include: {
              via: { 
                include: { 
                  location: true 
                } 
              },
              cantilevers: {
                include: {
                  pole: true,
                  vanes: {
                    include: {
                      cantilevers: { 
                        include: { 
                          pole: { 
                            include: { 
                              via: { 
                                include: { location: true } 
                              },
                              cantilevers: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  // Transform into LocationParams + PoleDataContent
  const locationsParsed: LocationParams[] = await Promise.all(
    locations.map(async (loc) => {
      const viasParsed = await Promise.all(
        loc.vias.map(async (via) => {
          // parse via JSON
          const viaParams = JSON.parse(via.params);
          const vaneList = JSON.parse(via.vanes);

          // for each pole build a PoleDataContent
          const poleContents: PoleDataContent[] = await Promise.all(
            via.poles.map(async (pole) => {
              return parsePoleAndCantilever(pole,"global");
            })
          );

          return {
            ...via,
            params: viaParams,
            vanes: vaneList,
            poles: poleContents,
          };
        })
      );

      const topLevelVanes = loc.vias
        .flatMap((via) => via.poles)
        .flatMap(pole => pole.cantilevers)
        .flatMap(cant => cant.vanes)
        .filter((v): v is NonNullable<typeof v> => !!v);

      // 3️⃣ Deduplicate by `id`
      const uniqueVanes = Array.from(
        new Map(topLevelVanes.map((v) => [v.id, v])).values()
      );

      const VaneClasses: VaneDataContent[] = await Promise.all(
        uniqueVanes.map(async (vane) => {
            return parseVaneAndPoleAndCantilever(vane,"global");
        })
      );

      return {
        ...loc,
        vias: viasParsed,
        vanes:VaneClasses,
        created_by: user.username,
      };
    })
  );

  return {
    locations: locationsParsed,
    lastPage,
    currentPage: page,
  };
}


// Get all poles for a specific user
export async function getLocationData(
  request: Request, 
  projectId: number,
  locationId: number,
  params?: LocationParams
): Promise<LocationParams | null> {

  const user = await requireUser(request);
  await requirePermission(user, 'view', 'Location', projectId);

  // fetch location + deep relations
  const location = await prisma.location.findUnique({
    where: {
      id: locationId,
      project_id: projectId,
    },
    include: {
      vias: {
        include: {
          poles: {
            include: {
              via: { 
                include: { 
                  location: true 
                } 
              },
              cantilevers: {
                include: {
                  pole: true,
                  vanes: {
                    include: {
                      cantilevers: { 
                        include: { 
                          pole: { 
                            include: { 
                              via: { 
                                include: { location: true } 
                              },
                              cantilevers: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!location) return null;

  // transform into LocationParams + nested PoleDataContent
  const viasParsed: ViaParams[] = await Promise.all(
    location.vias.map(async (via) => {
      // parse via-level JSON
      const viaParams = JSON.parse(via.params);

      // build each pole
      const poleContents: PoleDataContent[] = await Promise.all(
        via.poles.map(async (pole) => {
          return parsePoleAndCantilever(pole,"global");
        })
      );

      return {
        ...via,
        params: viaParams,
        poles:  poleContents,
      };
    })
  );

  const topLevelVanes = location.vias
    .flatMap((via) => via.poles)
    .flatMap(pole => pole.cantilevers)
    .flatMap(cant => cant.vanes)
    .filter((v): v is NonNullable<typeof v> => !!v);

  // 3️⃣ Deduplicate by `id`
  const uniqueVanes = Array.from(
    new Map(topLevelVanes.map((v) => [v.id, v])).values()
  );

  const VaneClasses: VaneDataContent[] = await Promise.all(
    uniqueVanes.map(async (vane) => {
        return parseVaneAndPoleAndCantilever(vane,"global");
    })
  );

  const locationParsed: LocationParams = {
    ...location,
    vanes:VaneClasses,
    vias:viasParsed,
  };

  return locationParsed;
}

// Get all poles by type and value
export async function getPolesAndVanesByTypeAndValue(
  request: Request, 
  projectId: number,
  type: "id" | "via_id",
  value: string| number[]
): Promise<LocationParams[] | null> {

  const user = await requireUser(request);
  await requirePermission(user, 'view', 'Location', projectId);

  // Construct dynamic filter
  let where: Record<string, any> = {};

  where.project_id = projectId;

  if(type === "id"){
    where.id = {
      in: value, // ya es number[]
    };
  }

  if (type === "via_id") {
    where.vias = {
      some: {
        id: Number(value),
      },
    };
  }

  // fetch locations + deep includes
  const locations = await prisma.location.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      vias: {
        include: {
          poles: {
            include: {
              via: { 
                include: { 
                  location: true 
                } 
              },
              cantilevers: {
                include: {
                  pole: true,
                  vanes: {
                    include: {
                      cantilevers: { 
                        include: { 
                          pole: { 
                            include: { 
                              via: { 
                                include: { location: true } 
                              },
                              cantilevers: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (locations.length === 0) return null;

  // transform each location
  const locationsParsed: LocationParams[] = await Promise.all(
    locations.map(async (loc) => {
      const viasParsed: ViaParams[] = await Promise.all(
        loc.vias.map(async (via) => {
          const viaParams = JSON.parse(via.params);

          // map each pole
          const poleContents: PoleDataContent[] = await Promise.all(
            via.poles.map(async (pole) => {
              return parsePoleAndCantilever(pole,"global");
            })
          );

          return {
            ...via,
            params: viaParams,
            poles:  poleContents,
          };
        })
      );

      const topLevelVanes = loc.vias
        .flatMap((via) => via.poles)
        .flatMap(pole => pole.cantilevers)
        .flatMap(cant => cant.vanes)
        .filter((v): v is NonNullable<typeof v> => !!v);

      // 3️⃣ Deduplicate by `id`
      const uniqueVanes = Array.from(
        new Map(topLevelVanes.map((v) => [v.id, v])).values()
      );

      const VaneClasses: VaneDataContent[] = await Promise.all(
        uniqueVanes.map(async (vane) => {
            return parseVaneAndPoleAndCantilever(vane,"global");
        })
      );

      return {
        ...loc,
        vias:viasParsed,
        vanes:VaneClasses
      };
    })
  );

  return locationsParsed;
}

