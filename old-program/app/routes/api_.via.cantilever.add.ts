import { ActionFunction} from "@remix-run/node";
import {  addCantileverToVia } from "~/db/via/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const viaId                       = parseInt(url.searchParams.get("id") || "", 10);
      const projectId                   = parseInt(url.searchParams.get("projectId") || "", 10);
      const payload                     = await request.json();
      const newViaCantileverResponse    = await addCantileverToVia(request, viaId, projectId, payload.pole_id, payload.external_id, payload.newCantilever );
      if (!newViaCantileverResponse) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newViaCantileverResponse);
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
