import { ActionFunction} from "@remix-run/node";
import { createVia, updateVia, deleteVia } from "~/db/via/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const viaData = await request.json();
      const newVia = await createVia(request, viaData);
      if (!newVia) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newVia, { status: 201 });
    }

    case "PUT": {
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const updatedData = await request.json();
      const updated = await updateVia(request,updatedData,projectId);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    case "DELETE": {
      const viaId        = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const deleted = await deleteVia(request,viaId,projectId);
      if (!deleted) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
