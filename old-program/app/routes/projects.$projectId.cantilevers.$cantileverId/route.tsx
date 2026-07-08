import {useRef, useEffect, useState } from "react";

import Square from "~/assets/svg/common/square.svg?react";
import Cube from "~/assets/svg/common/box.svg?react";
import Model3D from "~/assets/svg/common/3d.svg?react";
import Model2D from "~/assets/svg/common/2d.svg?react";
import Maximize from "~/assets/svg/common/maximize.svg?react";
import Minimize from "~/assets/svg/common/minimize.svg?react";
import Tag from "~/assets/svg/common/tag.svg?react";
import Ruler from "~/assets/svg/common/ruler.svg?react";
import X from "~/assets/svg/common/x.svg?react";
import Pencil from "~/assets/svg/common/pencil.svg?react";
import {useLocation, useNavigate} from "react-router-dom";
import ChevronLeftIcon from '~/assets/svg/common/chevron-left.svg?react'
import CantileverForm from "~/components/cantilevers/CantileverForm";
import CantileverResults from "./CantileverResults";
import {LoaderFunction, json} from "@remix-run/node";
import {getCantileverData} from "~/db/cantilever/actions.server";
import { getCatenaryType } from "~/db/config/actions.server";
import {useLoaderData, useNavigation} from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import Cantilever from "~/components/cantilevers/viewer";
import {useTranslation} from "react-i18next";

export const loader: LoaderFunction = async ({ request, params }) => {

  const cantileverId = Number(params.cantileverId);

  if (isNaN(cantileverId)) {
    throw new Response("Invalid cantilever ID", { status: 400 });
  };

  const catenaryType =  await getCatenaryType(request,Number(params.projectId));

  const cantileversData = await getCantileverData(request, Number(params.projectId), Number(params.cantileverId),'local');

  return Response.json( { cantileversData:cantileversData, catenaryType:catenaryType } );
};

export default function CantileverPage() {

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  const {  cantileversData, catenaryType } = useLoaderData<{ cantileversData:CantileverDataContent, catenaryType:string }>();


  if(!cantileversData){
    navigate("/404")
    return;
  };

  const [cantileverData, setCantileverData] = useState<CantileverDataContent>(cantileversData);

  const [ maximized, setMaximized ] = useState<boolean>(false);
  const [options, setOptions] = useState<CantileverViewerOptions>({camera:'orthographic', type:'2D', labels:true, ambient:false, measure: false});

  const containerRef = useRef<HTMLDivElement>(null);
  const cantileverRef = useRef<Cantilever | null>(null);

  useEffect(() => {
    // Initialize Cantilever only once
    if (!cantileverRef.current && containerRef.current) {
      containerRef.current.innerHTML = "";
      cantileverRef.current = new Cantilever(cantileverData, options, containerRef.current);
      cantileverRef.current.addEventListeners();
    }

    // Cleanup on unmount
    return () => {
      if (cantileverRef.current) {
        cantileverRef.current.dispose(); // Assuming Cantilever has a dispose or cleanup method
        cantileverRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update the Cantilever instance when cantileverData or options change
    if (cantileverRef.current) {
      cantileverRef.current.updateCantileverData(cantileverData, options);
    }

  }, [cantileverData, options]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (cantileverRef.current) {
        cantileverRef.current.updateRenderer();
      }
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  const handleMaximize = (state:boolean) => {
    setMaximized(state);
  }


  const location = useLocation(); 
  const previousRoute = location.state?.from || "/";


  const goToRoute = (route:string) => {
    navigate(route);
  };


  const handleOptionsChange = (optionKey: keyof CantileverViewerOptions, value: CantileverViewerOptions[typeof optionKey]) => {
    setOptions((prevOptions) => ({
      ...prevOptions,
      [optionKey]: value,
    }));
  };

  const handleDataChange = (newData: CantileverDataContent) => {
    setCantileverData(newData);
  };

  const [openCantileverForm,setOpenCantileverForm] = useState<boolean>(false);

  const handleOpenCantileverForm = () => {
    setOpenCantileverForm(!openCantileverForm)
  };

  return(
      <div className="h-full w-full flex flex-col xl:grid xl:grid-cols-3 xl:grid-rows-2 gap-4 overflow-y-scroll">
        <div className="w-full h-full max-xl:min-h-[500px] xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl z-20">
          <div className={`${maximized ? "w-full xl:w-[70vw] h-screen fixed left-0 top-0  p-4" : "w-full h-full flex flex-col justify-start items-start p-4" } transition-all duration-300 z-[80] bg-white rounded-xl`}>
            <div className="w-full h-auto flex flex-col sm:flex-row justify-start items-start gap-y-4 sm:gap-x-4">
              {!maximized &&
                <div className="w-auto flex flex-row gap-x-4">
                  <button onClick={()=>goToRoute(previousRoute)} className="w-10 h-10 p-2 bg-secondary-dark text-white duration-300  rounded-full hover:bg-primary active:scale-95">
                    <ChevronLeftIcon className="h-full w-full"/>
                  </button>
                  <h4 className="font-bold text-secondary-dark capitalize">{t("cantilever.name")}</h4>
                </div>
              }
              <div className="w-full flex flex-row justify-end gap-x-2 pe-4">

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
                <button onClick={()=>handleOptionsChange('labels',!options.labels)} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.labels  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Tag className="w-full h-full"/>
                </button>
                <button onClick={()=>handleOptionsChange('measure',!options.measure)} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.measure  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Ruler className="w-full h-full"/>
                </button>
                {maximized && (
                  <button onClick={()=>handleOpenCantileverForm()} className={`xl:hidden h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${openCantileverForm  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                    <Pencil className="w-full h-full"/>
                  </button>
                )}
              </div>
            </div>
            <div id="cantilever-viewer" ref={containerRef} className="h-full w-full bg-white rounded-xl z-[80]">
            </div>
          </div>
        </div>
        <div className={`${maximized ?  `${!openCantileverForm ? '-right-[100vw] sm:-right-[50vw] opacity-100' : 'right-0 opacity-100' } duration-300 h-screen fixed w-[100vw] sm:w-[50vw] xl:w-[30vw] xl:-right-0 top-0 bg-white z-[90]` : 'w-full h-auto xl:col-span-1 xl:row-span-2 border-2 border-gray-light rounded-xl'} flex flex-col justify-start items-start gap-y-4`}>
          {openCantileverForm && (
            <button onClick={()=>handleOpenCantileverForm()} className={`h-10 w-10 ml-auto mt-4 mr-4 shadow-md rounded-lg active:scale-95 border-2 p-2  ${openCantileverForm  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
              <X className="w-full h-full"/>
            </button>
          )}
          {cantileverData && cantileverData.cantilever && 
            <CantileverForm catenaryType={catenaryType} external_id={cantileverData.cantilever.external_id} model={cantileverData.cantilever.params.model} handleUpdateCantilever={handleDataChange} selCantilever={cantileverData}/>
          }
        </div>
        <div className="w-full h-auto xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start gap-y-4 animation-group py-4">

          {cantileverData && cantileverData.cantilever && 
            <CantileverResults cantilever={cantileverData.cantilever} results={cantileverData.results}/>
          }
        </div>
      </div>
  );
}

