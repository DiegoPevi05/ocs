import Sidebar from './sidebar';
import {  Outlet, useLoaderData, useNavigation } from "@remix-run/react"; // Correct import
import { LoaderFunction } from "@remix-run/node";
import {requireUser} from "~/db/auth/session.server";
import {useLoader} from "~/components/loaders/LoaderContext";
import {useEffect} from 'react';

// Loader function to enforce authentication
export const loader: LoaderFunction = async ({ request }) => {
  const userSessionData = await requireUser(request);

  return Response.json({
    user: userSessionData,
    env: {
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
    },
  });
};



export default function LayoutDashboard(){

  const { user, env } = useLoaderData<typeof loader>();

  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  //https://www.gellyconsulting.com/pagina-inicial-es/
  return(
    <div className="w-screen h-screen flex flex-col xl:grid xl:grid-cols-5 xl:grid-rows-1 gap-6 p-6">
      <div className="w-full h-auto xl:col-span-1 border-gray-light border-2 rounded-xl py-4 shadow-sm">
        <Sidebar 
          user={user}
        />
      </div>
      <div className="grid grid-cols-2 grid-rows-2  w-full h-full xl:col-span-4 overflow-hidden gap-4 p-2">
	      <Outlet/>
      </div>
      <p className="absolute bottom-1 right-2 text-body">{env.APP_NAME} {env.APP_VERSION}</p>
    </div>
  );
}

