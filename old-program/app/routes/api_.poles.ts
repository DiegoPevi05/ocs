import {getPoles} from "~/db/pole/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const size = parseInt(url.searchParams.get("size") || "5", 10);
  const pov = url.searchParams.get("pov") || "local";

  const filters = {
    external_id: url.searchParams.get("external_id"),
    via: url.searchParams.get("via"),
    via_id: url.searchParams.get("via_id"),
    location: url.searchParams.get("location"),
    location_id: url.searchParams.get("location_id"),
    withCantilevers: url.searchParams.get("withCantilevers")
  };

  try {
    const polesData:{ poles: PoleDataContent[], lastPage:number, currentPage:number }|null = await getPoles(request, projectId, page, size,pov, filters);


    return Response.json({
      poles: polesData?.poles || [],
      currentPage: polesData?.currentPage || 1,
      lastPage: polesData?.lastPage || 1,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch poles." }, { status: 500 });
  }
};
