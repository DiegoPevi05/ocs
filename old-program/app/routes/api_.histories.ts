import { getHistories } from "~/db/history/actions.server";

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const size = parseInt(url.searchParams.get("size") || "5", 10);

  try {
    const historiesData: { histories: HistoryParams[]; lastPage: number; currentPage: number } | null =
      await getHistories(request, projectId, page, size);

    return Response.json({
      histories: historiesData?.histories || [],
      currentPage: historiesData?.currentPage || 1,
      lastPage: historiesData?.lastPage || 1,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch histories." }, { status: 500 });
  }
};
