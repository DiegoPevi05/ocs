import { ActionFunction } from "@remix-run/node";
import { createPole, updatePole, deletePole } from "~/db/pole/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const poleData = await request.json();
      const newPole = await createPole(request, poleData);
      if (!newPole) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newPole, { status: 201 });
    }

    case "PUT": {
      const poleId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const updatedData = await request.json();
      const updated = await updatePole(request, poleId, projectId, updatedData);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    case "DELETE": {
      const poleId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const deleted = await deletePole(request, poleId, projectId);
      if (!deleted) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
