import {getPoleList} from "~/db/pole/actions.server";
import {getPreviewLocations} from "~/db/location/actions.server";
import { getCatenaryType } from "~/db/config/actions.server";

export const loader = async ({ request }: { request: Request }) => {

  try {
    const locations = await getPreviewLocations(request,null);

    const projectIds = locations.map((loc) => loc.project_id);

    const catenaryTypes = await Promise.all(
      projectIds.map((pid) => getCatenaryType(request, pid))
    );

    return Response.json({ locations, catenaryTypes });

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch preview data." }, { status: 500 });
  }
};
