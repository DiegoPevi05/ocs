import { ActionFunction } from "@remix-run/node";
import { createCantilever, updateCantilever, deleteCantilever } from "~/db/cantilever/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const cantileverData = await request.json();
      const newCantilever = await createCantilever(request, cantileverData);
      if (!newCantilever) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newCantilever, { status: 201 });
    }

    case "PUT": {
      const cantileverId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const updatedData = await request.json();
      const updated = await updateCantilever(request, cantileverId, projectId, updatedData);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    case "DELETE": {
      const cantileverId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const deleted = await deleteCantilever(request, cantileverId, projectId);
      if (!deleted) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
