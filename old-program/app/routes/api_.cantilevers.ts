import { getCantilevers } from "~/db/cantilever/actions.server";

/**
 * @swagger
 * /api/cantilevers:
 *   get:
 *     summary: Get Cantilevers
 *     description: Returns a JSON response containing cantilever information.
 *     parameters:
 *       - in: query
 *         name: projectId
 *         schema:
 *           type: integer
 *         description: The project ID to filter cantilevers.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: The page number for pagination.
 *       - in: query
 *         name: size
 *         schema:
 *           type: integer
 *           default: 5
 *         description: The number of items per page.
 *       - in: query
 *         name: external_id
 *         schema:
 *           type: string
 *         description: Filter by external ID.
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Filter by model type.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type.
 *       - in: query
 *         name: via
 *         schema:
 *           type: string
 *         description: Filter by via.
 *       - in: query
 *         name: via_id
 *         schema:
 *           type: string
 *         description: Filter by via ID.
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filter by location.
 *       - in: query
 *         name: location_id
 *         schema:
 *           type: string
 *         description: Filter by location ID.
 *       - in: query
 *         name: pole
 *         schema:
 *           type: string
 *         description: Filter by pole.
 *       - in: query
 *         name: pole_id
 *         schema:
 *           type: string
 *         description: Filter by pole ID.
 *     responses:
 *       200:
 *         description: Successfully retrieved cantilevers.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cantilevers:
 *                   type: array
 *                   items:
 *                     $ref: '/app/components/swagger/schemas.yaml#/components/schemas/CantileverDataContent'
 *                 currentPage:
 *                   type: integer
 *                 lastPage:
 *                   type: integer
 *       500:
 *         description: Server error, failed to fetch cantilevers.
 */

export const loader = async ({ request }: { request: Request }) => {
  const url = new URL(request.url);

  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const size = parseInt(url.searchParams.get("size") || "5", 10);
  const pov = url.searchParams.get("pov") || "local";

  const filters = {
    external_id: url.searchParams.get("external_id"),
    model: url.searchParams.get("model"),
    type: url.searchParams.get("type"),
    via: url.searchParams.get("via"),
    via_id: url.searchParams.get("via_id"),
    location: url.searchParams.get("location"),
    location_id: url.searchParams.get("location_id"),
    pole: url.searchParams.get("pole"),
    pole_id: url.searchParams.get("pole_id"),
  };

  try {
    const cantileversData: { cantilevers: CantileverDataContent[]; lastPage: number; currentPage: number } | null =
      await getCantilevers(request, projectId, page, size,pov, filters);

    return Response.json({
      cantilevers: cantileversData?.cantilevers || [],
      currentPage: cantileversData?.currentPage || 1,
      lastPage: cantileversData?.lastPage || 1,
    });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Failed to fetch cantilevers." }, { status: 500 });
  }
};
