import { getLocations } from "~/db/location/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const size = parseInt(url.searchParams.get("size") || "5", 10);

  const filters = {
    external_id: url.searchParams.get("external_id"),
  };

  try {
    const locationsData:{ locations: LocationParams[], lastPage:number, currentPage:number }|null = await getLocations(request, projectId, page, size, filters );


    return Response.json({
      locations: locationsData?.locations || [],
      currentPage: locationsData?.currentPage || 1,
      lastPage: locationsData?.lastPage || 1,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch locations." }, { status: 500 });
  }
};
