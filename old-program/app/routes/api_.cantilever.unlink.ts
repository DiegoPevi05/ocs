import { ActionFunction } from "@remix-run/node";
import { unlinkCantilever } from "~/db/cantilever/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "PUT": {
      const cantileverId = parseInt(url.searchParams.get("id") || "", 10);
      const updated = await unlinkCantilever(request, cantileverId);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
