import { ActionFunction } from "@remix-run/node";
import { createLocation, deleteLocation } from "~/db/location/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const locationData = await request.json();
      const newLocation = await createLocation(request, locationData);
      if (!newLocation) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newLocation, { status: 201 });
    }

    /*case "PUT": {
      const locationId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const updatedData = await request.json();
      const updated = await updateLocation(request, locationId, projectId, updatedData);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }*/

    case "DELETE": {
      const locationId = parseInt(url.searchParams.get("id") || "", 10);
      const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
      const deleted = await deleteLocation(request, locationId, projectId);
      if (!deleted) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
