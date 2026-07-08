import { ActionFunction} from "@remix-run/node";
import {  addVaneToVia } from "~/db/via/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const projectId           = parseInt(url.searchParams.get("projectId") || "", 10);
      const newVane             = await request.json();
      const newViaVaneResponse  = await addVaneToVia(request, projectId, newVane.external_id, newVane.params, newVane.cantilevers);
      if (!newViaVaneResponse) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newViaVaneResponse);
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
