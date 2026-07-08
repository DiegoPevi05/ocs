import { ActionFunction } from "@remix-run/node";
import { getPoleData } from "~/db/pole/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {

  const url = new URL(request.url);
  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const pov = url.searchParams.get("pov") || "local";

  switch (request.method) {
    case "POST": {
      const poleData = await request.json();
      const data = await getPoleData(request, projectId ,poleData.id, pov, poleData);
      if (!data) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(data, { status: 200 });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
