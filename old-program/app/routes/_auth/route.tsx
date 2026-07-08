import {LoaderFunction, json} from "@remix-run/node";
import {Outlet, useLoaderData} from "@remix-run/react";

// Loader function to enforce authentication
export const loader: LoaderFunction = async () => {
  return json({
    env: {
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
    },
  });
};

export default function AuthLayout() {

  const {  env } = useLoaderData<typeof loader>();

  return(
    <div className="w-full h-screen bg-cover bg-secodnary">
      <div className="w-full h-full flex flex-col justify-center items-center gap-y-6">
        <Outlet/>
      </div>
      <p className="absolute bottom-1 right-2 text-body">{env.APP_NAME} {env.APP_VERSION}</p>
    </div>
  )
}
