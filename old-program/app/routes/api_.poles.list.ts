import {getPoleList} from "~/db/pole/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const locationId   = parseInt(url.searchParams.get("locationId") || "", 10);

  try {
    const polesData:{ id:number, external_id:string} [] = await getPoleList(request, projectId, locationId);

    return Response.json(polesData);

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch poles list." }, { status: 500 });
  }
};
