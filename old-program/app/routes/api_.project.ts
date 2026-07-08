import { ActionFunction } from "@remix-run/node";
import { createProject, updateProject, deleteProject } from "~/db/project/actions.server";

// Action function to handle POST, PUT, DELETE methods
export const action: ActionFunction = async ({ request }) => {
  const url = new URL(request.url);

  switch (request.method) {
    case "POST": {
      const projectData = await request.json();
      const newProject = await createProject(request, projectData);
      if (!newProject) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json(newProject, { status: 201 });
    }

    case "PUT": {
      const projectId = parseInt(url.searchParams.get("id") || "", 10);
      const updatedData = await request.json();
      const updated = await updateProject(request, projectId, updatedData);
      if (!updated) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    case "DELETE": {
      const projectId = parseInt(url.searchParams.get("id") || "", 10);
      const deleted = await deleteProject(request, projectId);
      if (!deleted) return Response.json({ error: "Unauthorized or user not found" }, { status: 403 });
      return Response.json({ success: true });
    }

    default:
      return Response.json({ error: "Method Not Allowed" }, { status: 405 });
  }
};
