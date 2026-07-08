import { useEffect, useRef, useState } from "react";

import Square from "~/assets/svg/common/square.svg?react";
import Cube from "~/assets/svg/common/box.svg?react";
import Model3D from "~/assets/svg/common/3d.svg?react";
import Model2D from "~/assets/svg/common/2d.svg?react";
import Tag from "~/assets/svg/common/tag.svg?react";
import X from "~/assets/svg/common/x.svg?react";
import Maximize from "~/assets/svg/common/maximize.svg?react";
import Minimize from "~/assets/svg/common/minimize.svg?react";
import Pencil from "~/assets/svg/common/pencil.svg?react";
import {useLocation, useNavigate} from "react-router-dom";
import ChevronLeftIcon from '~/assets/svg/common/chevron-left.svg?react';
import VaneForm from "~/components/vanes/VaneForm";
import VaneResults from "./VaneResults";
import {LoaderFunction} from "@remix-run/node";
import {getVaneData} from "~/db/vane/actions.server";
import {useLoaderData, useNavigation} from "@remix-run/react";
import {useTranslation} from "react-i18next";
import {useLoader} from "~/components/loaders/LoaderContext";
import Vane from "~/components/vanes/viewer";
import {getCatenaryType} from "~/db/config/actions.server";

export const loader: LoaderFunction = async ({ request, params }) => {

  const vaneId = Number(params.vaneId);


  if (isNaN(vaneId)) {
    throw new Response("Invalid vane ID", { status: 400 });
  };

  const catenaryType =  await getCatenaryType(request,Number(params.projectId));

  const vanesData = await getVaneData(request,Number(params.projectId), Number(params.vaneId),"local");

  return Response.json({ vanesData: vanesData, catenaryType:catenaryType });
};


export default function VanePage() {

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

  const { vanesData, catenaryType } = useLoaderData<{ vanesData:VaneDataContent, catenaryType:string }>();

  if(!vanesData){
    navigate("/404")
    return;
  };

  const [vaneData, setVaneData] = useState<VaneDataContent>(vanesData);
  const [ maximized, setMaximized ] = useState<boolean>(false);
  const [options, setOptions] = useState<VaneViewerOptions>({ camera:'orthographic', type:'2D', labels:[{id:vaneData.vane.id || 0, type:'vane', state:true }]});


  const containerRef = useRef<HTMLDivElement>(null);
  const vaneRef = useRef<Vane | null>(null);

  useEffect(() => {
    // Initialize Cantilever only once
    if (!vaneRef.current && containerRef.current) {
      containerRef.current.innerHTML = "";
      vaneRef.current = new Vane(vaneData, options, containerRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (vaneRef.current) {
        vaneRef.current.dispose(); // Assuming Cantilever has a dispose or cleanup method
        vaneRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update the Cantilever instance when cantileverData or options change
    if (vaneRef.current) {
      vaneRef.current.updateVaneData(vaneData, options);
    }

  }, [vaneData, options]);


  const location = useLocation(); 
  const previousRoute = location.state?.from || "/";

  const handleMaximize = (state:boolean) => {
    setMaximized(state);
  }

  const goToRoute = (route:string) => {
    navigate(route);
  };


  const handleOptionsChange = (optionKey: keyof VaneViewerOptions, value: VaneViewerOptions[typeof optionKey]) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [optionKey]: value,
    }));
  };

  const handleToggleLabels = (id?: number, type?:string) => {
    setOptions((prevOptions) => {
      const updatedLabels = prevOptions.labels.map((label) => {
        if (id && type) {
          // Toggle the state of the matching label
          return (label.id === id && label.type === type) ? { ...label, state: !label.state } : label;
        } else {
          // If no name is provided, check the current states
          const hasTrue = prevOptions.labels.some((label) => label.state);
          const setAllTo = !hasTrue; // If at least one is true, set all to false, otherwise set all to true
          return { ...label, state: setAllTo };
        }
      });

      return {
        ...prevOptions,
        labels: updatedLabels,
      };
    });
  };

  const handleDataChange = (newData: VaneDataContent) => {
    setVaneData(newData);
  };

  const [openVaneForm,setOpenVaneForm] = useState<boolean>(false);

  const handleOpenCantileverForm = () => {
    setOpenVaneForm(!openVaneForm)
  };


  return(
      <div className="h-full w-full flex flex-col xl:grid xl:grid-cols-3 xl:grid-rows-2 gap-4 overflow-y-scroll">
        <div className="w-full h-full max-xl:min-h-[500px] xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl z-50">
          <div className={`${maximized ? "w-full xl:w-[70vw] h-screen fixed left-0 top-0  p-4" : "w-full h-full flex flex-col justify-start items-start p-4" } transition-all duration-300 z-[80] bg-white rounded-xl`}>
            <div className="w-full h-auto flex flex-row justify-start items-start gap-x-4">
              {!maximized &&
                <div className="w-auto flex flex-row gap-x-4">
                  <button onClick={()=>goToRoute(previousRoute)} className="w-10 h-10 p-2 bg-secondary-dark text-white duration-300  rounded-full hover:bg-primary active:scale-95">
                    <ChevronLeftIcon className="h-full w-full"/>
                  </button>
                  <h4 className="font-bold text-secondary-dark capitalize">{t("vane.name")}</h4>
                </div>
              }
              <div className="w-full flex flex-row justify-end gap-x-2">
                <button onClick={()=>handleMaximize(true)} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${maximized ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Maximize className="w-full h-full"/>
                </button>
                <button onClick={()=>handleMaximize(false)} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${!maximized ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Minimize className="w-full h-full"/>
                </button>
                <button onClick={()=>handleOptionsChange('camera','orthographic')} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.camera == "orthographic" ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Square className="w-full h-full"/>
                </button>
                <button onClick={()=>handleOptionsChange('camera','perspective')} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.camera == "perspective" ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Cube className="w-full h-full"/>
                </button>
                {options.camera == "perspective" && (
                  <>
                    <button onClick={()=>handleOptionsChange('type','2D')} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.type == "2D" ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                      <Model2D className="w-full h-full"/>
                    </button>
                    <button onClick={()=>handleOptionsChange('type','3D')} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.type == "3D" ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                      <Model3D className="w-full h-full"/>
                    </button>
                  </>
                )}
                <button onClick={()=>handleToggleLabels()} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.labels.some((label) => label.state)  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Tag className="w-full h-full"/>
                </button>
                {maximized && (
                  <button onClick={()=>handleOpenCantileverForm()} className={`xl:hidden h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${openVaneForm  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                    <Pencil className="w-full h-full"/>
                  </button>
                )}
              </div>
            </div>
            <div id="vane-viewer" ref={containerRef} className="h-full w-full bg-white rounded-xl z-[80]">
            </div>
          </div>
        </div>
        <div className={`${maximized ?  `${!openVaneForm ? '-right-[100vw] sm:-right-[50vw] opacity-100' : 'right-0 opacity-100' } duration-300 h-screen fixed w-[100vw] sm:w-[50vw] xl:w-[30vw] xl:-right-0 top-0 bg-white ` : 'w-full h-auto xl:col-span-1 xl:row-span-2 border-2 border-gray-light rounded-xl'} z-[90] flex flex-col justify-start items-start gap-y-4`}>
          {openVaneForm && (
            <button onClick={()=>handleOpenCantileverForm()} className={`h-10 w-10 ml-auto mt-4 mr-4 shadow-md rounded-lg active:scale-95 border-2 p-2  ${openVaneForm  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
              <X className="w-full h-full"/>
            </button>
          )}
          {vaneData && vaneData.vane && 
            <VaneForm 
                catenaryType={catenaryType} 
                handleUpdateVane={handleDataChange} 
                selVane={vaneData}
                onLabels={handleToggleLabels}
                labelOn={options.labels.find((label) => label.id === vaneData.vane.id && label.type === "vane")?.state || false}
              />
          }
        </div>
        <div className="w-full h-auto xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start gap-y-4 animation-group py-4">
          {vaneData && vaneData.vane && 
            <VaneResults vane={vaneData.vane} results={vaneData.results}/>
          }
        </div>
      </div>
  );
}

