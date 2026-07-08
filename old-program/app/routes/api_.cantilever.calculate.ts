import { ActionFunction} from "@remix-run/node";
import { url } from "inspector";
import { getCantileverData } from "~/db/cantilever/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);
  const pov = url.searchParams.get("pov") || "local";

  switch (request.method) {
    case "POST": {
      const cantileverData = await request.json();
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const data = await getCantileverData(request, projectId, cantileverData.id,pov,cantileverData);
      if (!data) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(data, { status: 200 });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
