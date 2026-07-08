
import swaggerSpec from "~/config/swagger";

export function loader() {
  return Response.json(swaggerSpec);
}
