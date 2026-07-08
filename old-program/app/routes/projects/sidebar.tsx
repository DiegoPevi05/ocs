import LOGO from "~/assets/logo.png";
import {useLocation, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import SvgComponent from "~/components/SvgComponent";
import Align from "~/assets/svg/common/align.svg?react"
import X from "~/assets/svg/common/x.svg?react"
import PlusIcon from "~/assets/svg/common/plus.svg?react";
import {useState} from "react";
import {useFetcher} from "@remix-run/react";
import Button from "~/components/Button";
import ChevronRight from "~/assets/svg/common/chevron-right.svg?react"
import ChevronLeft from "~/assets/svg/common/chevron-left.svg?react"
import FolderSearch from "~/assets/svg/common/folder-search.svg?react";
import Trash from "~/assets/svg/common/trash.svg?react";
import Folder from "~/assets/svg/common/folder.svg?react";
import {toast} from "sonner";
import {useLoader} from "~/components/loaders/LoaderContext";
import Modal from "~/components/Modal";
import {isPermissionValid} from "~/utils/permissions";

const routes:{label:string, icon:string,iconbig:boolean, route:string, subroutes:string[], resource:string|null}[] = [
  {
    label:"sidebar.dashboard",
    icon:"dashboard",
    iconbig:false,
    route:"/",
    subroutes:[],
    resource:null
  },
  {
    label:"sidebar.locations",
    icon:"location",
    iconbig:false,
    route:"/locations",
    subroutes:["/locations"],
    resource:"Location"
  },
  {
    label:"sidebar.poles",
    icon:"pole",
    iconbig:true,
    route:"/poles",
    subroutes:["/poles"],
    resource:"Pole"
  },
  {
    label:"sidebar.vanes",
    icon:"vane",
    iconbig:true,
    route:"/vanes",
    subroutes:["/vanes"],
    resource:"Vane"
  },
  {
    label:"sidebar.cantilevers",
    icon:"cantilever_gy_type_1",
    iconbig:true,
    route:"/cantilevers",
    subroutes:["/cantilevers"],
    resource:"Cantilever"
  },
  {
    label:"sidebar.config",
    icon:"gear",
    iconbig:false,
    route:"/config",
    subroutes:[],
    resource:null
  }
]

interface propProjectButton {
  project:ProjectParams
  onSelectProject:(projectId:number|undefined) => void;
}

const ProjectButton = (props:propProjectButton) => {

  const {t} = useTranslation();

  const {project, onSelectProject} = props;

  const onHandle = () => {
    onSelectProject(project.id);
  }

  return(
    <div onClick={()=>onHandle()} className={`
      w-full h-auto flex flex-row cursor-pointer
      hover:bg-gray-100 duration-300 group
      hover:text-secondary-dark p-2 text-body`}>
      <div className="w-auto px-2 flex justify-center items-center group-active:scale-95 duration-300">
        <SvgComponent icon="train" className="h-10 w-10" />
      </div>
      <div className="w-full flex flex-col justify-start items-start group-active:scale-95 duration-300">
        <p className="font-bold capitalize">{t("project.name")}</p>
        <p className="font-bold">{project.name}</p>
      </div>
      <div className="w-auto h-full flex items-center justify-center pr-2">
        <button
          className={`h-auto w-auto rounded-full flex items-center justify-center p-0 duration-300 border-primary group-active:scale-95 text-primary cursor-pointer transitiona-ll`}
        >
          <ChevronRight  className="h-6 w-6 group-hover:translate-x-2 duration-300"/>
        </button>
      </div>
    </div>
  )
}

interface propMenuButton {
  label:string;
  icon:string;
  iconbig:boolean,
  active:boolean;
  route:string;
  goToRoute:(route:string) => void;
}

const MenuButton = (props:propMenuButton) => {

  const {t} = useTranslation();

  const {label, active, icon, iconbig ,route, goToRoute} = props;

  return(
    <div onClick={()=>goToRoute(route)} className={`
      w-full h-auto flex flex-row cursor-pointer
      hover:bg-gray-100 duration-300 group
      hover:text-secondary-dark py-2
      ${active ? 'text-secondary-dark border-r-4 border-secondary-dark' : 'text-body' }`}>
      <div className="w-[40%] flex justify-center items-center group-active:scale-95 duration-300">
        {iconbig ?
          <SvgComponent icon={icon} className="h-10 xl:h-12 w-10 xl:w-12" />
        :
          <SvgComponent icon={icon} className="h-8 w-8" />
        }
      </div>
      <div className="w-[60%] flex justify-start items-center group-active:scale-95 duration-300">
        <p className="font-bold">{t(label)}</p>
      </div>
    </div>
  )
}

interface SidebarProps {
  user: UserSessionData;
  projects:ProjectParams[]| null;
  currentProject:ProjectParams | undefined;
  fetchUserProjects: () => void;
}


const Sidebar = ({ user, projects, currentProject, fetchUserProjects }: SidebarProps) => {

  const location = useLocation();
  const {t} = useTranslation();
  const { showLoader, hideLoader } = useLoader();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const goToRoute = (route: string) => {
    if (route === "/logout") {
      fetcher.submit(null, { method: "post", action: "/api/logout" });
    } else {

      if(currentProject && currentProject.id){
        navigate("/projects/"+currentProject.id.toString()+route); // Navigate to the route using React Router
      }else{
        navigate("/projects")

      }

    }
  };


  const [openNavbar,setOpenNavbar] = useState<boolean>(false);

  const toggleOpenNavbar = () => {
    setOpenNavbar(!openNavbar);
  }

  const [openAddModal,setOpenAddModal] = useState<boolean>(false);

  const handleToggleAddProjectModal = () => {
    setOpenAddModal(!openAddModal)
  }

  const handleAddProject = async () => {
    const form = document.getElementById('new-project-form') as HTMLFormElement;

    if(!form){
      return;
    }

    const newProject = {
      external_id: form.external_id.value,
      name: form.project_name.value,
      description: form.description.value.length > 0 ? form.description.value : null
    };

    showLoader();
    // Send POST request to create a new cantilever
    try {
      const response = await fetch("/api/project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProject),
      });

      if (response.ok) {
        const createdProject = await response.json();
        toast.success(t('project.create.success', { id: createdProject.id }));
        handleToggleAddProjectModal();
        fetchUserProjects();
      } else {

        toast.success(t('project.create.error'));
        console.error("Failed to add project:", response.statusText);
      }
    } catch (error) {
      toast.success(t('project.create.failed',{ error: error }));
      console.error("Error adding project:", error);
    }

    hideLoader();
  };

  const handleDeleteProject = async () => {

    const container = document.getElementById('modal-delete-project') as HTMLDivElement;
    const selectElement = container.querySelector('#projectId') as HTMLSelectElement;

    if(!selectElement){
      return;
    }

    const projectId = selectElement.value;

    if(Number(projectId) == 0){
      toast.success(t('project.delete_error_no_projectId'));
      return;
    };

    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const response = await fetch(`/api/project?id=${projectId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success(t('project.delete.success', { id: projectId }));
        toggleDeleteModal();
        fetchUserProjects();
        document.dispatchEvent(new Event("preview:refresh"));
      } else {
        toast.success(t('project.delete.error', { id: projectId }));
        console.error("Failed to delete cantilever:", response.statusText);
      }
    } catch (error) {
      toast.success(t('project.delete.failed', { error: error }));
      console.error("Error deleting cantilever:", error);
    }
    hideLoader();
  };

  const [openDeleteModal, setOpenDeleteModal] = useState<boolean>(false);

  const toggleDeleteModal = () => {
    setOpenDeleteModal(!openDeleteModal);
  }

  const handleonSelectProject = (prj:number|undefined) => {
    if(prj){
      navigate("/projects/"+prj.toString())
    }else{
      navigate("/projects")
    }
  }

  const isActiveMenuButton = (route:string, subroutes:string[]):boolean => {
      const elements = location.pathname.split("/");

      if(route == "/"){

        if(elements.length >= 4 && elements[3] == ''){
          return true;
        }

        return false;

      }else{

        return location.pathname.includes(route) || subroutes.some(subroute => location.pathname.includes(subroute));

      }

  }

  return(
    <>
      <div className="xl:hidden w-full flex flex-row items-center justify-start px-2">
        <button onClick={toggleOpenNavbar} className="bg-white text-primary hover:bg-primary hover:text-primary group duration-300 active:scale-95 rounded-xl shadow-sm p-2 border border-gray-light">
          <Align className="w-5 h-5 group-hover:text-white"/>
        </button>
        <div className='w-full flex flex-col justify-start items-start px-4'>
          <label className="font-bold text-secondary-dark inline-flex gap-x-2">
            {t('sidebar.greeting')}<label className='text-primary'>{user.username}</label>
          </label>
          <p>
            {t('sidebar.welcome')}
          </p>
        </div>
      </div>
      <aside className={`${ openNavbar ? "max-xl:left-0" : "max-xl:-left-[300px]"  } duration-300 transition-all max-xl:fixed  max-xl:top-0 max-xl:h-screen w-[300px] max-xl:py-6 xl:w-full h-full flex flex-col justify-start items-start gap-y-6 z-[120] bg-white`}>
        <button onClick={toggleOpenNavbar} className="xl:hidden bg-white text-primary hover:bg-primary hover:text-white duration-300 active:scale-95 rounded-xl ml-auto mr-4 p-1 border border-gray-light">
          <X className="w-8 h-8"/>
        </button>
        <span className="w-full h-auto bg-secondary-dark flex items-center justify-center py-3">
          <img src={LOGO} alt="logo" className="h-8 w-auto"/>
        </span>
        <div className='w-full hidden xl:flex flex-col justify-start items-start px-4'>
          <label className="font-bold text-secondary-dark inline-flex gap-x-2">
            {t('sidebar.greeting')}<label className='text-primary'>{user.username}</label>
          </label>
          <p>
            {t('sidebar.welcome')}
          </p>
        </div>

        <div className="w-full h-full flex flex-row overflow-hidden relative">
          <div className={` h-full flex flex-col ${ currentProject ? 'w-[0px] opacity-0 translate-x-[100%]' : 'w-full opacity-100 translate-x-[0%]'} duration-300 transition-all`}>
	      <div className="w-full h-auto flex flex-col justify-start items-start px-2">
		<span className="flex flex-row items-end justify-start gap-x-2 pb-2">
		  <button
		    onClick={()=>navigate("/")}
		    className={`h-auto w-auto rounded-full flex items-center justify-center p-1 duration-300 border-primary active:scale-95 text-primary cursor-pointer transitiona-ll group border-2 hover:bg-primary`}
		  >
		    <ChevronLeft  className="h-4 w-4 group-hover:text-white"/>
		  </button>
		  <p className="font-bold">{t("home.name")}</p>
		</span>
	      </div>
              <div className="w-full flex flex-row justify-between items-center px-2">

                <div className="flex flex-row gap-x-2">
                  <Folder className="h-5 w-5" strokeWidth={2}/>
                  <label className="font-bold capitalize">{t("project.plural")}</label>
                </div>

                <div className="w-full h-auto flex flex-row justify-end my-2">
                  {isPermissionValid(user.permissions,{action:'store',resource:'Project'}) && (
                    <div onClick={handleToggleAddProjectModal} className="w-auto h-auto rounded-xl flex items-center justify-center p-2 hover:bg-gray-100 duration-300  hover:text-secondary-dark text-body group cursor-pointer">
                      <PlusIcon className="h-6 w-6 group-active:scale-95"/>
                    </div>
                  )}

                  {isPermissionValid(user.permissions,{action:'destroy',resource:'Project'}) && (
                  <div onClick={toggleDeleteModal} className="w-auto h-auto rounded-xl flex items-center justify-center p-2 hover:bg-gray-100 duration-300  hover:text-secondary-dark text-body group cursor-pointer">
                    <Trash className="h-6 w-6 group-active:scale-95"/>
                  </div>
                  )}
                </div>
              </div>

              {projects == null || projects.length == 0 ? 
                <div className="w-full h-full flex flex-col items-center justify-center px-4 gap-y-2">
                  <p className="text-center text-md">{t("project.empty_content")}</p>
                  <FolderSearch className="h-12 w-12"/>
                </div>
              :
              <>
                {projects.map((project:ProjectParams,index)=>(
                    <ProjectButton
                      key={'btn_project_'+index}
                      project={project}
                      onSelectProject={handleonSelectProject}
                    />
                ))}
              </>
              }
            </div>

            <div className={`${ !currentProject ? 'opacity-0 translate-x-[100%] w-[0px]' : 'w-full opacity-100 translate-x-[0%]'} duration-300 transition-all  h-auto flex flex-col justify-start items-start gap-y-none relative`}>

              <div className="w-full h-auto flex flex-col justify-start items-start px-2 mb-4">
                <span className="flex flex-row items-end justify-start gap-x-2 pb-2">
                  <button
                    onClick={()=>handleonSelectProject(undefined)}
                    className={`h-auto w-auto rounded-full flex items-center justify-center p-1 duration-300 border-primary active:scale-95 text-primary cursor-pointer transitiona-ll group border-2 hover:bg-primary`}
                  >
                    <ChevronLeft  className="h-4 w-4 group-hover:text-white"/>
                  </button>
                  <p className="font-bold">{currentProject?.name}</p>
                </span>
              </div>
              {routes.map((item,index)=>{
                if(item.resource != null){
                  if(!isPermissionValid(user.permissions,{action:'view',resource:item.resource, projectId:currentProject?.id})){
                    return null;
                  }
                };

                return(
                  <MenuButton
                  key={`key-menu-button-${index}`}
                  label={item.label}
                  icon={item.icon}
                  iconbig={item.iconbig}
                  active={isActiveMenuButton(item.route,item.subroutes)}
                  route={item.route}
                  goToRoute={goToRoute}
                />
                )
              })}
            </div>
        </div>


        <div className="mt-auto w-full p-none m-none">
          <MenuButton
            key={`logout-btn`}
            label="sidebar.logout"
            icon={"door_open"}
            iconbig={false}
            active={false}
            route={"/logout"}
            goToRoute={goToRoute}
          />
        </div>
      </aside>
      <Modal key={`modal-add-project`} isOpen={openAddModal} onClose={handleToggleAddProjectModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-2">
          <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="train"/>
          </div>
          <form id="new-project-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("project.fields.external_id")}</label>
              <input
                type="text"
                name="external_id"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("project.fields.name")}</label>
              <input
                type="text"
                name="project_name"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("project.fields.description")}</label>
              <textarea
                name="description"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
          </form>
          <div className="w-full h-auto gap-x-4 flex items-center justify-around lg:justify-center mt-4">
            <Button onClick={handleToggleAddProjectModal} className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={handleAddProject} className="capitalize px-6">{t("common.create")}</Button>
          </div>
        </div>
      </Modal>
      <Modal key={`modal-delete-project`} isOpen={openDeleteModal} onClose={toggleDeleteModal}>
        <div id="modal-delete-project"  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 gap-y-4">
          <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="train"/>
          </div>
          <select id="projectId" name="projectId" className="text-body border-2 rounded-xl p-2">
            <option value={0}>{t("project.delete_no_options")}</option>
            {projects != null && projects.map((prjOpt,index)=>{
              return(
                <option key={'project_opt_'+index} value={prjOpt.id}>{prjOpt.name}</option>
              )
            })}
          </select>
          <p className="text-primary text-lg font-bold">{t("project.delete_message")}</p>
          <div className="w-full h-auto gap-x-4 flex items-center justify-center capitalize">
            <Button onClick={toggleDeleteModal} className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={()=>handleDeleteProject()} className="capitalize px-6">{t("common.delete")}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

export default Sidebar;
