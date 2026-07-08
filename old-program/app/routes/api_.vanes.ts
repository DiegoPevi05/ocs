import {getVanes} from "~/db/vane/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const size = parseInt(url.searchParams.get("size") || "5", 10);
  const pov = url.searchParams.get("pov") || "local";

  const filters = {
    external_id: url.searchParams.get("external_id"),
    location: url.searchParams.get("location"),
    location_id: url.searchParams.get("location_id"),
  };

  try {
    const vanesData:{ vanes: VaneDataContent[], lastPage:number, currentPage:number }|null = await getVanes(request,projectId, page, size, pov, filters );

    return Response.json({
      vanes: vanesData?.vanes || [],
      currentPage: vanesData?.currentPage || 1,
      lastPage: vanesData?.lastPage || 1,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch vanes." }, { status: 500 });
  }
};
