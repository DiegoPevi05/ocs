import { ActionFunction } from "@remix-run/node";
import { logout } from "~/db/auth/session.server";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
};
