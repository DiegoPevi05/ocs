import { ActionFunction } from "@remix-run/node";
import { addCantileverToPole } from "~/db/cantilever/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {

  switch (request.method) {
    case "POST": {
      const payload = await request.json();
      const data = await addCantileverToPole(request,payload);
      if (!data) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(data, { status: 200 });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
