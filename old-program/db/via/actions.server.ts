import { requireUser } from "../auth/session.server";
import { prisma } from "../db.server";
import { requirePermission } from "../permission/actions.server";
import { createVane, parseVaneAndPoleAndCantilever } from '../vane/actions.server.ts';
import { createPole, parsePoleAndCantilever } from '../pole/actions.server.ts';
import { createCantilever} from '../cantilever/actions.server';


export async function createVia(request:Request, viaData:ViaParams):Promise<ViaParams|null> {

  const user = await requireUser(request);

  await requirePermission(user,'store','Via',viaData.project_id)

  const via = await prisma.via.create({
    data:{
      external_id:viaData.external_id,
      project:viaData.project,
      project_id:viaData.project_id,
      location_id:viaData.location_id,
      params:JSON.stringify(viaData.params), 
      vanes:JSON.stringify(viaData.vanes), 
      created_by:user.username
    },
  })

  const viaParsed:ViaParams = {
    ...via,
    params:JSON.parse(via.params),
    vanes:JSON.parse(via.vanes),
    poles:[]
  }

  return viaParsed;

}

export async function addLineToVia(request:Request, viaId:number, projectId:number, newSegments:{id:number, start:{x:number, y:number, z:number}, end:{x:number, y:number, z:number} }[]):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Via',projectId)

  const viaDB = await prisma.via.findUnique({where:{id:viaId}})

  if(!viaDB) return false;

  const viaParsed:ViaParams = {
    ...viaDB,
    params:JSON.parse(viaDB.params),
    vanes:JSON.parse(viaDB.vanes),
  }

  const newLines = [...viaParsed.params.lines, ...newSegments]

  const updatedVia = await prisma.via.update({
    where:{id:viaId},
    data:{params:JSON.stringify({lines:newLines})}
  })

  return true;
  
}

export async function addPoleToVia(
  request:Request, 
  viaId:number,
  projectId:number,
  external_id:string,
  line_id:string,
  params:PolePropertiesParams
):Promise<PoleDataContent|null> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Via',projectId)

  const viaDB = await prisma.via.findUnique({
    where: { id: viaId },
    include: { location: true },
  });

  if(!viaDB) return null;

  const poleData = {
    external_id: external_id,
    via_id: viaDB.id, 
    location_id: viaDB.location_id,
    project_id: viaDB.project_id,
    created_by: user.username,
    params: JSON.stringify(params),
    line_id: line_id ?? null,
  };
  
  const pole = await prisma.pole.create({
    data: poleData,
    include: {
      via: { include: { location: true } },
      cantilevers: true,
    },
  });

  return parsePoleAndCantilever(pole,"global");
  
}

export async function addCantileverToVia(
    request:Request,
    viaId:number,
    projectId:number,
    poleId:number,
    external_id:string,
    newCantilever:CantileverGermanParams | CantileverBrazilianParams

  ):Promise<PoleDataContent|null> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Via',projectId)

  const poleDB = await prisma.pole.findUnique({
    where: { id: poleId },
    include: {
      via: { include: { location: true } },
      cantilevers: true,
    },
  });

  if (!poleDB || !poleDB.via || poleDB.via.id !== viaId) return null;

  const cantileverData:CantileverParams = {
    external_id: external_id,
    pole_id: poleDB.id,
    created_by: user.username,
    params: JSON.stringify(newCantilever),
  };
  
  const createdCantilever: CantileverParams = await prisma.cantilever.create({
    data: cantileverData,
  });

  const currentOrder: number[] = (poleDB.cantileversOrder as number[] | null) ?? [];
  const updatedOrder = [...currentOrder, createdCantilever.id];

  // Update cantileversOrder in the pole
  await prisma.pole.update({
    where: { id: poleDB.id },
    data: { cantileversOrder: updatedOrder },
  });

  const updatedPole = await prisma.pole.findUnique({
    where: { id: poleDB.id },
    include: {
      cantilevers: true,
      via: { include: { location: true } },
    },
  });

  if (!updatedPole) return null;

  return parsePoleAndCantilever(updatedPole,"global");

}

export async function addVaneToVia(
    request:Request,
    projectId:number,
    external_id:number,
    params:VaneParamsProps,
    cantilevers: Partial<Pick<CantileverParams, "id" | "external_id">>[]
  ):Promise<VaneDataContent|null> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Via',projectId)

  const vaneData:VaneParams = {
    external_id:external_id,
    params,
    cantilevers,
    project_id:projectId
  };

  const createdVane:VaneParams = await createVane(request,vaneData);

  const vane = await prisma.vane.findUnique({
    where: { id: createdVane.id },
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

  if (!vane) return null;

  return parseVaneAndPoleAndCantilever(vane,"global");
}



export async function deleteLineFromVia(request:Request, viaId:number, projectId:number, lineIds:number[]):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Via',projectId)

  const viaDB = await prisma.via.findUnique({
    where: { id: viaId },
  });

  if(!viaDB) return false;

  const viaParsed:ViaParams = {
    ...viaDB,
    params:JSON.parse(viaDB.params),
    vanes:JSON.parse(viaDB.vanes),
  }

  const updatedLines = viaParsed.params.lines.filter(line => !lineIds.includes(line.id))

  const updatedVia = await prisma.via.update({
    where:{id:viaId},
    data:{params:JSON.stringify(updatedLines)}
  })

  return true;
  
}


export async function updateVia(request:Request, viaData:ViaParams, projectId:number):Promise<ViaParams|null> {

  const user = await requireUser(request);

  await requirePermission(user,'update','Via',projectId)

  const via = await prisma.via.update({
    where:{id:viaData.id},
    data:{
      ...viaData, 
      params:JSON.stringify(viaData.params),
      vanes:JSON.stringify(viaData.vanes),
    }
  })

  const viaDB = await prisma.via.findUnique({
    where:{id:viaData.id},
    include: {
      poles: {
        include: {
          cantilevers: true,
          via: true,
        },
      },
    },
  })

  if(!viaDB) return null;

  const viaParsed:ViaParams = {
    ...viaDB,
    params:JSON.parse(viaDB.params),
    vanes:JSON.parse(viaDB.vanes),
    poles: viaDB.poles.map(pole =>
      parsePoleAndCantilever(pole,"global")
    ),
  }

  return viaParsed;

}

export async function deleteVia(request:Request, viaId:number, projectId:number):Promise<boolean> {

  const user = await requireUser(request);

  await requirePermission(user,'destroy','Via',projectId)

  await prisma.via.delete({where:{id:viaId}})

  return true;

}
