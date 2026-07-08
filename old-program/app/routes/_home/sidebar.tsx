import LOGO from "~/assets/logo.png";
import {useLocation, useNavigate} from 'react-router-dom';
import {useTranslation} from 'react-i18next';
import SvgComponent from "~/components/SvgComponent";
import Align from "~/assets/svg/common/align.svg?react"
import X from "~/assets/svg/common/x.svg?react"
import {useState} from "react";
import {useFetcher} from "@remix-run/react";

const routes:{label:string, icon:string,iconbig:boolean, route:string, subroutes:string[]}[] = [
  {
    label:"sidebar.projects",
    icon:"folder",
    iconbig:false,
    route:"/projects",
    subroutes:[],
  },
  {
    label:"sidebar.users",
    icon:"user",
    iconbig:false,
    route:"/users",
    subroutes:[],
  },
  {
    label:"sidebar.config",
    icon:"gear",
    iconbig:false,
    route:"/config",
    subroutes:[],
  },
]

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
}


const Sidebar = ({ user }: SidebarProps) => {

  const location = useLocation();
  const {t} = useTranslation();
  const navigate = useNavigate();
  const fetcher = useFetcher();

  const goToRoute = (route: string) => {
    if (route === "/logout") {
      fetcher.submit(null, { method: "post", action: "/api/logout" });
    } else {
      navigate(route); // Navigate to the route using React Router
    }
  };

  const [openNavbar,setOpenNavbar] = useState<boolean>(false);

  const toggleOpenNavbar = () => {
    setOpenNavbar(!openNavbar);
  }


  return(
    <>
      <div className="xl:hidden w-full flex flex-row items-center justify-start px-2">
        <button onClick={toggleOpenNavbar} className="bg-white text-primary hover:bg-primary hover:text-primary duration-300 active:scale-95 rounded-xl shadow-sm p-2 border border-gray-light group">
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
            <div className="w-full opacity-100 translate-x-[0%]'} duration-300 transition-all  h-auto flex flex-col justify-start items-start gap-y-none relative">
	    {routes.map((item,index)=>{

	      if((user.role != "ADMIN" && user.role != "SUPERVISOR") && item.route == "/users") return ;

	      return(
                <MenuButton
                  key={`key-menu-button-${index}`}
                  label={item.label}
                  icon={item.icon}
                  iconbig={item.iconbig}
                  active={location.pathname === item.route ||  item.subroutes.some(subroute => location.pathname.startsWith(subroute))}
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
    </>
  );
}

export default Sidebar;
