import { getProjects } from "~/db/project/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const size = parseInt(url.searchParams.get("size") || "5", 10);

  const filters = {
    external_id: url.searchParams.get("external_id"),
    name:url.searchParams.get("name"),
    userId:url.searchParams.get("userId"),
  };

  try {
    const projectsData: { projects: ProjectParams[]; lastPage: number; currentPage: number } | null =
      await getProjects(request, page, size, filters);

    return Response.json({
      projects: projectsData?.projects || [],
      currentPage: projectsData?.currentPage || 1,
      lastPage: projectsData?.lastPage || 1,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch projects." }, { status: 500 });
  }
};
