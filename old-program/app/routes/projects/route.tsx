import Sidebar from "./sidebar";
import {useEffect,useState } from "react";
import {useTranslation} from "react-i18next";
import { Outlet, useLoaderData } from "@remix-run/react"; // Correct import
import { LoaderFunction, redirect } from "@remix-run/node";
import {requireUser} from "~/db/auth/session.server";
import {isPermissionValid} from "~/utils/permissions";
import {toast} from "sonner";

// Loader function to enforce authentication
export const loader: LoaderFunction = async ({ request, params }) => {
  const userSessionData = await requireUser(request);

  if(!isPermissionValid(userSessionData.permissions,{action:"view",resource:"Project"})){
    return redirect("/")
  }

  const { projectId } = params;

  return Response.json({
    user: userSessionData,
    projectId:projectId,
    env: {
      APP_NAME: process.env.APP_NAME,
      APP_VERSION: process.env.APP_VERSION,
    },
  });
};

export default function LayoutDashboard(){

  const { user, env, projectId } = useLoaderData<typeof loader>();

  const {t} = useTranslation();

  const [currentProject,setCurrentProject] = useState<ProjectParams>(undefined)

  const [projects,setProjects] = useState<ProjectParams[]>(null);

  useEffect(()=> {
    fetchUserProjects();
  },[])

  const fetchUserProjects = async ():Promise<ProjectParams[]> => {

    try {
      const response = await fetch(`/api/projects/user`);

      if (response.ok) {
        const projects = await response.json();
        setProjects(projects)
      } else {
        console.error("Failed to fetch projects");
        toast.error("Failed to fetch projects");
        return { cantilevers:[], currentPage:0, lastPage:0 };
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Error to fetch projects");
      return { cantilevers:[], currentPage:0,lastPage:0 };
    }
  };

  useEffect(() => {

    const currentProject = (projects && projects.length > 0 && projectId) ? projects.find((item)=> item.id == Number(projectId)) : undefined ;

    setCurrentProject(currentProject);

  },[projects,projectId])

  useEffect(() => {
    type ToastEventDetail = {
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      params?: Record<string, unknown>;
    };

    const handler = (e: CustomEvent<ToastEventDetail>) => {
      const { type, message, params } = e.detail;
      const translated = t(message, {
        ...(params ?? {}),
        interpolation: { escapeValue: false }
      });

      switch (type) {
        case 'success':
          toast.success(translated);
          break;
        case 'error':
          toast.error(translated);
          break;
        case 'warning':
          // sonner uses .warning() instead of .warn()
          if (toast.warning) {
            toast.warning(translated);
          } else {
            toast(translated);
          }
          break;
        case 'info':
        default:
          toast(translated);
      }
    };

    window.addEventListener(
      'projectTypeMessage',
      handler as EventListener
    );

    return () => {
      window.removeEventListener(
        'projectTypeMessage',
        handler as EventListener
      );
    };
  }, [t]);

  return(
    <div className="w-screen h-screen flex flex-col xl:grid xl:grid-cols-5 xl:grid-rows-1 gap-6 p-6">
      <div className="w-full h-auto xl:col-span-1 border-gray-light border-2 rounded-xl py-4 shadow-sm">
        <Sidebar 
          user={user}
          projects={projects} 
          currentProject={currentProject as ProjectParams|undefined}
          fetchUserProjects={fetchUserProjects}
        />
      </div>
      <div className={`${ !currentProject ? 'items-center justify-center text-primary': 'items-start justify-start ' } flex flex-col  w-full h-full xl:col-span-4 overflow-hidden`}>
          <Outlet context={{selectedProject:currentProject }}/>
      </div>
      <p className="absolute bottom-1 right-2 text-body">{env.APP_NAME} {env.APP_VERSION}</p>
    </div>
  );
}

