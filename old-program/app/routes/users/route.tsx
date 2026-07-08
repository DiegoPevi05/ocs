import { Outlet, useLoaderData } from "@remix-run/react"; // Correct import
import { LoaderFunction, redirect } from "@remix-run/node";
import {requireUser} from "~/db/auth/session.server";
import Sidebar from "./sidebar";
import {getUsers} from "~/db/auth/auth.server";
import {isPermissionValid} from "~/utils/permissions";

// Loader function to enforce authentication
export const loader: LoaderFunction = async ({ request, params }) => {
  const userSessionData = await requireUser(request);

  if(!isPermissionValid(userSessionData.permissions,{action:"view",resource:"User"}) || (userSessionData.role === "USER")){
    return redirect("/");
  };

  const users = await getUsers(request);

  const { userId } = params;

  const currentUser = (users  && users.length > 0 && userId) ? users.find((item:UserSessionData)=> item.id == Number(userId)) : undefined ;

  return Response.json({
    user: userSessionData,
    users:users,
    currentUser:currentUser,
    env: {
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
    },
  });
};

export default function LayoutDashboard(){

  const { user, env, users, currentUser } = useLoaderData<typeof loader>();

  return(
    <div className="w-screen h-screen flex flex-col xl:grid xl:grid-cols-5 xl:grid-rows-1 gap-6 p-6">
      <div className="w-full h-auto xl:col-span-1 border-gray-light border-2 rounded-xl py-4 shadow-sm">
	<Sidebar user={user} users={users} currentUser={currentUser}/>
      </div>
      <div className="items-start justify-start flex flex-col  w-full h-full xl:col-span-4 overflow-hidden">
          <Outlet context={{ requestUser:user }} />
      </div>
      <p className="absolute bottom-1 right-2 text-body">{env.APP_NAME} {env.APP_VERSION}</p>
    </div>
  );
}

