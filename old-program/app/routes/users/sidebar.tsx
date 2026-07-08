import LOGO from "~/assets/logo.png";
import {useNavigate, useNavigation} from 'react-router-dom';
import {useFetcher} from "@remix-run/react";
import {useTranslation} from 'react-i18next';
import SvgComponent from "~/components/SvgComponent";
import Align from "~/assets/svg/common/align.svg?react"
import X from "~/assets/svg/common/x.svg?react"
import PlusIcon from "~/assets/svg/common/plus.svg?react";
import {useEffect, useState} from "react";
import ChevronRight from "~/assets/svg/common/chevron-right.svg?react"
import ChevronLeft from "~/assets/svg/common/chevron-left.svg?react"
import User from "~/assets/svg/common/user.svg?react";
import Folder from "~/assets/svg/common/folder.svg?react";
import {isPermissionValid} from "~/utils/permissions";
import {useLoader} from "~/components/loaders/LoaderContext";

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

interface propUserButton {
  user:UserSessionData
  onSelectUser:(userId:number|undefined) => void;
  active:boolean;
}

const UserButton = (props:propUserButton) => {

  const {t} = useTranslation();


  const {user, onSelectUser, active} = props;

  const onHandle = () => {
    onSelectUser(user.id);
  }

  return(
    <div onClick={()=>onHandle()} className={`
      w-full h-auto flex flex-row items-center cursor-pointer
      hover:bg-gray-100 duration-300 group
      hover:text-secondary-dark py-2 
      ${active ? 'text-secondary-dark border-r-4 border-secondary-dark' : 'text-body'}`}>
      <div className="w-24 px-2 flex justify-center items-center group-active:scale-95 duration-300">
      {user.imageUrl != null ? 
        <img src={user.imageUrl} className="h-10 w-10 rounded-full border-2 border-gray-300"/>
      :
	<SvgComponent icon="user" className="h-8 w-8"/>
      }
      </div>
      <div className="w-full flex flex-col justify-start items-start group-active:scale-95 duration-300">
        <p className="font-bold capitalize">{t("user.role")}: {t(`user.${user.role}`)}</p>
        <p className="font-bold capitalize">{t("user.name")}: {user.username}</p>
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

interface SidebarProps {
  user: UserSessionData;
  users:UserSessionData[]| null;
  currentUser:UserSessionData | undefined;
}


const Sidebar = ({ user, users, currentUser }: SidebarProps) => {

  const {t} = useTranslation();
  const navigate = useNavigate();

  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  const fetcher = useFetcher();

  const goToRoute = (route: string) => {
    if(route === "/logout") fetcher.submit(null, { method: "post", action: "/api/logout" });
  };

  const [openNavbar,setOpenNavbar] = useState<boolean>(false);

  const toggleOpenNavbar = () => {
    setOpenNavbar(!openNavbar);
  }

  const handleonSelectUser = (prj:number|undefined) => {
    if(prj){
      navigate("/users/"+prj.toString())
    }else{
      navigate("/users")
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
          <div className="h-full flex flex-col w-full opacity-100 translate-x-[0%] duration-300 transition-all">
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

              <div className="w-full flex flex-row justify-between items-center px-2 my-2">

                <div className="flex flex-row gap-x-2">
                  <Folder className="h-5 w-5" strokeWidth={2}/>
                  <label className="font-bold capitalize">{t("user.plural")}</label>
                </div>

                <div className="w-full h-auto flex flex-row justify-end">
                  {isPermissionValid(user.permissions,{action:'store',resource:'User'}) && (
                    <div onClick={()=>navigate('/users/create')} className="w-auto h-auto rounded-xl flex items-center justify-center p-2 hover:bg-gray-100 duration-300  hover:text-secondary-dark text-body group cursor-pointer">
                      <PlusIcon className="h-6 w-6 group-active:scale-95"/>
                    </div>
                  )}
                </div>
              </div>

              {users == null || users.length == 0 ? 
                <div className="w-full h-full flex flex-col items-center justify-center px-4 gap-y-2">
                  <p className="text-center text-md">{t("user.empty_content")}</p>
                  <User className="h-12 w-12"/>
                </div>
              :
              <>
                {users.map((user:UserSessionData,index)=>(
                    <UserButton
                      key={'btn_user_'+index}
                      user={user}
                      onSelectUser={handleonSelectUser}
		      active={currentUser?.id == user.id}
                    />
                ))}
              </>
              }
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
