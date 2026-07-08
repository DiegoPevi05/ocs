import {LoaderFunction} from "@remix-run/node";
import {useLoaderData} from "@remix-run/react";
import { useEffect, useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";
import {requireUser} from "~/db/auth/session.server";

// Loader function to enforce authentication
export const loader: LoaderFunction = async ({ request }) => {
  const userSessionData = await requireUser(request);

  return Response.json({
    user: userSessionData,
  });
};

export default function DocumentationPage() {

  const { user } = useLoaderData<typeof loader>();

  const [spec, setSpec] = useState(null);

  useEffect(() => {
    fetch("/api/swagger")
      .then((res) => res.json())
      .then((data) => setSpec(data));
  }, []);

  if (!spec) return <p>Loading Documentation...</p>;

  return <SwaggerUI spec={spec} />;
}
