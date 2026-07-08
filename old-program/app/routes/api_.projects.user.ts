import {getUserProject} from "~/db/project/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  try {
    const projects = await getUserProject(request);

    return projects;

  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
};
