import { ActionFunction} from "@remix-run/node";
import {  addPoleToVia } from "~/db/via/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const viaId               = parseInt(url.searchParams.get("id") || "", 10);
      const projectId           = parseInt(url.searchParams.get("projectId") || "", 10);
      const payload             = await request.json();
      const newViaPoleResponse  = await addPoleToVia(request, viaId, projectId, payload.external_id, payload.line_id ,payload.params);
      if (!newViaPoleResponse) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newViaPoleResponse);
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
