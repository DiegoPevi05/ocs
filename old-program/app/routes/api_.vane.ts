import { ActionFunction, json} from "@remix-run/node";
import { createVane, updateVane, deleteVane } from "~/db/vane/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const vaneData = await request.json();
      const newVane = await createVane(request, vaneData);
      if (!newVane) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newVane, { status: 201 });
    }

    case "PUT": {
      const vaneId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const updatedData = await request.json();
      const updated = await updateVane(request,vaneId,projectId, updatedData);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    case "DELETE": {
      const vaneId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const deleted = await deleteVane(request,vaneId,projectId);
      if (!deleted) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
