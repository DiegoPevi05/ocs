import {useRef, useEffect, useState, useCallback } from "react";
import Model3D from "~/assets/svg/common/3d.svg?react";
import Model2D from "~/assets/svg/common/2d.svg?react";
import Maximize from "~/assets/svg/common/maximize.svg?react";
import Minimize from "~/assets/svg/common/minimize.svg?react";
import Tag from "~/assets/svg/common/tag.svg?react";
import X from "~/assets/svg/common/x.svg?react";
import Pencil from "~/assets/svg/common/pencil.svg?react";
import {useLocation, useNavigate} from "react-router-dom";
import ChevronLeftIcon from '~/assets/svg/common/chevron-left.svg?react'
import PoleForm from "~/components/poles/PoleForm";
import PlusIcon from "~/assets/svg/common/plus.svg?react";
import {LoaderFunction} from "@remix-run/node";
import {getPoleData} from "~/db/pole/actions.server";
import {useLoaderData, useNavigation} from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import { getCatenaryType } from "~/db/config/actions.server";
import Pole from "~/components/poles/viewer";
import CantileverPoleCard from "./CantileverPoleCard";
import {useTranslation} from "react-i18next";
import {toast} from "sonner";
import Button from "~/components/Button";
import Modal from "~/components/Modal";
import SvgComponent from "~/components/SvgComponent";
import {CantileverSelector} from "~/components/cantilevers/CantileverSelector";
import {  useOutletContext } from "@remix-run/react";

export const loader: LoaderFunction = async ({ request, params }) => {

  const poleId = Number(params.poleId);

  if (isNaN(poleId)) {
    throw new Response("Invalid pole ID", { status: 400 });
  };

  const catenaryType =  await getCatenaryType(request,Number(params.projectId));

  const polesData = await getPoleData(request, Number(params.projectId), Number(params.poleId),'local');

  return Response.json({ polesData:polesData, catenaryType:catenaryType });
};

export default function PolePage() {

  const context = useOutletContext<{selectedProject:ProjectParams}>();
  const navigate = useNavigate();
  const {t} = useTranslation();
  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  const { polesData, catenaryType } = useLoaderData<{ polesData:PoleDataContent, catenaryType:string }>();

  if(!polesData){
    navigate("/404")
    return;
  };

  const [poleData, setPoleData] = useState<PoleDataContent>(polesData);

  const [ maximized, setMaximized ] = useState<boolean>(false);

  const initialLabels = polesData.pole.cantilevers.map((item: any) => ({
    id: item.id, // Extract `external_id` for the `name`
    type:'cantilever',
    state: false, // Default state to `false`
  }));

  initialLabels.push({id:poleData.pole.id, type:'pole', state:false});

  const [options, setOptions] = useState<PoleViewerOptions>({type:'2D', labels:initialLabels});

  const containerRef = useRef<HTMLDivElement>(null);
  const poleRef = useRef<Pole | null>(null);

  useEffect(() => {
    // Initialize Pole only once
    if (!poleRef.current && containerRef.current) {
      containerRef.current.innerHTML = "";
      poleRef.current = new Pole(poleData, options, containerRef.current);
      poleRef.current.addEventListeners();
    }

    // Cleanup on unmount
    return () => {
      if (poleRef.current) {
        poleRef.current.dispose(); // Assuming Pole has a dispose or cleanup method
        poleRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    // Update the Pole instance when poleData or options change
    if (poleRef.current) {
      poleRef.current.updatePoleData(poleData, options);
    }

  }, [poleData, options]);

  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver(() => {
      if (poleRef.current) {
        poleRef.current.updateRenderer();
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


  const handleOptionsChange = (optionKey: keyof PoleViewerOptions, value: PoleViewerOptions[typeof optionKey]) => {
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

  const handleDataChange = (newData: PoleDataContent) => {
    setPoleData(newData);
  };

  const handleNavigateToCantilever = (cantileverId: number) => {
    navigate(`/cantilever/${cantileverId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const handleMoveNextCantilevers = useCallback((cantileverId: number) => {

    const currentCantileverIndex = poleData.pole.cantilevers.findIndex(
      (ctlv) => ctlv.id === cantileverId
    );

    if (currentCantileverIndex !== -1) {
      // Calculate next index (cyclically)
      const nextIndex =
        (currentCantileverIndex + 1) % poleData.pole.cantilevers.length;

      // Swap current cantilever with the next one
      const updatedCantilevers = [...poleData.pole.cantilevers];

      [updatedCantilevers[currentCantileverIndex], updatedCantilevers[nextIndex]] =
        [updatedCantilevers[nextIndex], updatedCantilevers[currentCantileverIndex]];

      const updatedCantileversData = [...poleData.cantilevers];

      [updatedCantileversData[currentCantileverIndex], updatedCantileversData[nextIndex]] =
        [updatedCantileversData[nextIndex], updatedCantileversData[currentCantileverIndex]];

      // Update state
      setPoleData({
        ...poleData,
        pole: { ...poleData.pole, cantilevers: updatedCantilevers },
        cantilevers:updatedCantileversData
      });
    }
  }, [poleData]);

  const handleMoveBackCantilevers = useCallback((cantileverId: number) => {
    const currentCantileverIndex = poleData.pole.cantilevers.findIndex(
      (ctlv) => ctlv.id === cantileverId
    );

    if (currentCantileverIndex !== -1) {
      // Calculate previous index (cyclically)
      const prevIndex =
        (currentCantileverIndex - 1 + poleData.pole.cantilevers.length) %
        poleData.pole.cantilevers.length;

      // Swap current cantilever with the previous one
      const updatedCantilevers = [...poleData.pole.cantilevers];
      [updatedCantilevers[currentCantileverIndex], updatedCantilevers[prevIndex]] =
        [updatedCantilevers[prevIndex], updatedCantilevers[currentCantileverIndex]];

      const updatedCantileversData = [...poleData.cantilevers];

      [updatedCantileversData[currentCantileverIndex], updatedCantileversData[prevIndex]] =
        [updatedCantileversData[prevIndex], updatedCantileversData[currentCantileverIndex]];

      // Update state
      setPoleData({
        ...poleData,
        pole: { ...poleData.pole, cantilevers: updatedCantilevers },
        cantilevers:updatedCantileversData
      });
    }
  }, [poleData]);

  const handleUnlinkCantilever = async (cantileverId:number) => {
    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const response = await fetch(`/api/cantilever/unlink?id=${cantileverId}`, {
        method: "PUT",
      });

      if (response.ok) {
        window.location.reload();
        toast.success(t('cantilever.unlink.success', { id: cantileverId }));
      } else {
        toast.success(t('cantilever.unlink.error', { id: cantileverId }));
        console.error("Failed to unlink cantilever:", response.statusText);
      }
    } catch (error) {
      toast.success(t('cantilever.unlink.failed', { error: error }));
      console.error("Error unlinking cantilever:", error);
    }
    hideLoader();
  };

  const handleDeleteCantilever = async (cantileverId:number) => {
    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const response = await fetch(`/api/cantilever?id=${cantileverId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        window.location.reload();
        toast.success(t('cantilever.delete.success', { id: cantileverId }));
      } else {
        toast.success(t('cantilever.delete.error', { id: cantileverId }));
        console.error("Failed to delete cantilever:", response.statusText);
      }
    } catch (error) {
      toast.success(t('cantilever.delete.failed', { error: error }));
      console.error("Error deleting cantilever:", error);
    }
    hideLoader();
  };

  const handleDownloadCantilever = async(type:string,value:string) => {
    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const encodedValue = encodeURIComponent(value);
      const response = await fetch(`/api/cantilever/download?type=${type}&value=${encodedValue}`, {
        method: "GET",
      });

      if (response.ok) {
        // Convert the response into a blob
        const blob = await response.blob();
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create an <a> element and trigger the download
        const link = document.createElement("a");
        link.href = url;
        if(type=="external_id"){
          link.download = `cantilever_${value}_result.pdf`;
        }else{
          link.download = `cantilevers_${value}_results.pdf`;
        }
        document.body.appendChild(link);
        link.click();
        
        // Clean up by revoking the blob URL and removing the <a> element
        link.remove();
        window.URL.revokeObjectURL(url);
        // Update the state to remove the deleted cantilever
        toast.success(t('cantilever.report.success'));
      } else {
        toast.success(t('cantilever.report.error'));
        console.error("Failed to download cantilever:", response.statusText);
      }
    } catch (error) {
      toast.success(t('cantilever.report.failed', { error: error }));
      console.error("Error download cantilever:", error);
    }
    hideLoader();
  }

  const [newCantilevers,setNewCantilevers] = useState<{location:string,via:string, currentOption:CantileverParams|null }[]>([{ location: polesData.pole.location_id.toString() , via: polesData.pole.via_id.toString(), currentOption:null }]);

  const handleAddCantilevers = async () => {
    setNewCantilevers((prevNewCantilevers)=> [...prevNewCantilevers, { location: polesData.pole.location_id.toString() , via: polesData.pole.via_id.toString(), currentOption:null } ]);
  };

  const updateCurrentOption = (cantileverIndex: number, newOption: CantileverParams) => {
    setNewCantilevers((prevNewCantilevers) => 
      prevNewCantilevers.map((cantilever, index) => 
        index === cantileverIndex 
          ? { ...cantilever, currentOption: newOption }
          : cantilever
      )
    );
  };

  const removeCantilever = (cantileverIndex: number) => {
    setNewCantilevers((prevNewCantilevers) => 
      prevNewCantilevers.filter((_, index) => index !== cantileverIndex)
    );
  };

  const [openAddNewCantileversModal, setOpenAddNewCantileversModal] = useState<boolean>(false);

  const handleToggleAddNewCantileversModal = () => {
    setOpenAddNewCantileversModal(!openAddNewCantileversModal);
  }

  const AddNewCantileversToPole = useCallback( async() => {

    if(newCantilevers.some((item)=> item.currentOption == null) ){
      toast.error('all cantilever options must be selected')
      return;
    };

    if(newCantilevers.length == 0){
      toast.error('At least one cantilever must be selected')
      return;
    };

    const data: { id: number, external_id: string }[] = newCantilevers
      .map((cantilever: { location: string, via: string, currentOption: CantileverParams | null }) => 
        cantilever.currentOption ? { 
          id: cantilever.currentOption.id, 
          external_id: cantilever.currentOption.external_id 
        } : null
      )
      .filter(item => item !== null) as { id: number, external_id: string }[];

    // Send POST request to create a new pole
    try {

      showLoader();

      const response = await fetch("/api/cantilever/addpole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ poleId:polesData.pole.id, cantilevers:data}),
      });

      if (response.ok) {
        const createdPole = await response.json();
        toast.success(t('pole.add_cantilevers.success', { id: createdPole.id }));
        window.location.reload();
      } else {

        toast.success(t('pole.add_cantilevers.error'));
        console.error("Failed to add cantilever to pole:", response.statusText);
      }
    } catch (error) {
      toast.success(t('pole.add_cantilevers.failed',{ error: error }));
      console.error("Error adding cantilever to pole:", error);
    }finally{
      setOpenAddNewCantileversModal(false);
      hideLoader();
    }


  },[newCantilevers]);

  const [openPoleForm,setOpenPoleForm] = useState<boolean>(false);

  const handleOpenPoleForm = () => {
    setOpenPoleForm(!openPoleForm)
  };

  return(
    <>
      <div className="h-full w-full flex flex-col xl:grid xl:grid-cols-3 xl:grid-rows-2 gap-4 overflow-y-scroll">
        <div className="w-full h-full max-xl:min-h-[500px] xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl z-20">
          <div className={`${maximized ? "w-full xl:w-[70vw] h-screen fixed left-0 top-0  p-4" : "w-full h-full flex flex-col justify-start items-start p-4" } transition-all duration-300 z-[80] bg-white rounded-xl`}>
            <div className="w-full h-auto flex flex-col sm:flex-row justify-start items-start gap-y-4 sm:gap-x-4">
              {!maximized &&
                <div className="w-auto flex flex-row gap-x-4">
                  <button onClick={()=>goToRoute(previousRoute)} className="w-10 h-10 p-2 bg-secondary-dark text-white duration-300  rounded-full hover:bg-primary active:scale-95">
                    <ChevronLeftIcon className="h-full w-full"/>
                  </button>
                  <h4 className="font-bold text-secondary-dark">{t("pole.name")}</h4>
                </div>
              }
              <div className="w-full flex flex-row justify-end gap-x-2 pe-4">

                <button onClick={()=>handleMaximize(true)} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${maximized ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Maximize className="w-full h-full"/>
                </button>
                <button onClick={()=>handleMaximize(false)} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${!maximized ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Minimize className="w-full h-full"/>
                </button>
                <button onClick={()=>handleOptionsChange('type','2D')} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.type == "2D" ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Model2D className="w-full h-full"/>
                </button>
                <button onClick={()=>handleOptionsChange('type','3D')} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.type == "3D" ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Model3D className="w-full h-full"/>
                </button>
                <button onClick={()=>handleToggleLabels()} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.labels.some((label) => label.state)  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                  <Tag className="w-full h-full"/>
                </button>
                {maximized && (
                  <button onClick={()=>handleOpenPoleForm()} className={`xl:hidden h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${openPoleForm  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
                    <Pencil className="w-full h-full"/>
                  </button>
                )}
              </div>
            </div>
            <div id="pole-viewer" ref={containerRef} className="h-full w-full bg-white rounded-xl z-[80]">
            </div>
          </div>
        </div>
        <div className={`${maximized ?  `${!openPoleForm ? '-right-[100vw] sm:-right-[50vw] opacity-100' : 'right-0 opacity-100' } duration-300 h-screen fixed w-[100vw] sm:w-[50vw] xl:w-[30vw] xl:-right-0 top-0 bg-white z-[90]` : 'w-full h-auto xl:col-span-1 xl:row-span-2 border-2 border-gray-light rounded-xl'} flex flex-col justify-start items-start gap-y-4`}>
          {openPoleForm && (
            <button onClick={()=>handleOpenPoleForm()} className={`h-10 w-10 ml-auto mt-4 mr-4 shadow-md rounded-lg active:scale-95 border-2 p-2  ${openPoleForm  ? "bg-primary text-white" : "bg-secondary text-body"}`}>
              <X className="w-full h-full"/>
            </button>
          )}
          {poleData && poleData.pole && 
            <PoleForm 
              catenaryType={catenaryType} 
              handleUpdatePole={handleDataChange} 
              selPole={poleData}
              onLabels={handleToggleLabels}
              labelOn={options.labels.find((label) => label.id === poleData.pole.id && label.type === "pole")?.state || false}
            />
          }
        </div>
        <div className="w-full h-auto xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start gap-y-4 animation-group py-2">
          <div className="w-full h-auto flex flex-row items-center justify-between pe-4">
            <h4 className="font-bold text-secondary-dark px-4 my-2 capitalize">{t("cantilever.plural")}</h4>
            <Button onClick={()=>handleToggleAddNewCantileversModal()} type="button" rightIcon={<PlusIcon className="w-4 h-4"/>} className="h-10 font-bold text-nowrap">{t("cantilever.selector.add_cantilevers")}</Button>
          </div>
          {poleData && poleData.cantilevers && 
            poleData.cantilevers.map((cantilever,index)=>(
              <CantileverPoleCard 
                key={`cantilever_${index}`}
                index={index} 
                cantilever={cantilever.cantilever}
                labelOn={options.labels.find((label) => label.id === cantilever.cantilever.id && label.type === "cantilever")?.state || false}
                onLabelsOn={handleToggleLabels} 
                onMoveNext={handleMoveNextCantilevers}
                onMovePrevious={handleMoveBackCantilevers}
                onOpen={handleNavigateToCantilever} 
                onDownload={handleDownloadCantilever} 
                onDelete={handleDeleteCantilever} 
                onUnlink={handleUnlinkCantilever} 
              />
            ))
          }
        </div>
      </div>

      <Modal key={`modal-add-new-cantilevers`} isOpen={openAddNewCantileversModal} onClose={handleToggleAddNewCantileversModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-24 h-24 p-1 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="cantilever_gy_type_1"/>
          </div>
          <form id="new-cantilevers-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
            <div className="col-span-2 flex flex-row justify-end">
              <Button onClick={handleAddCantilevers} type="button" rightIcon={<PlusIcon className="w-4 h-4"/>} className="h-full font-bold text-nowrap">{t("cantilever.selector.add_cantilever")}</Button>
            </div>
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              {newCantilevers.map((item,index)=>{
                return(
                  <CantileverSelector
                    key={`cantilever_new_${index}`}
                    projectId={context.selectedProject.id || 0}
                    index={index}
                    location={item.location}
                    via={item.via}
                    currentOption={item.currentOption}
                    onChangeType={updateCurrentOption}
                    onDelete={removeCantilever}
                  />
                )
              })}
            </div>
          </form>
          <div className="w-full h-auto gap-x-4 flex items-center justify-around lg:justify-center mt-4">
            <Button onClick={handleToggleAddNewCantileversModal} type="button" className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={AddNewCantileversToPole} className="capitalize px-6">{t("cantilever.selector.add_cantilevers")}</Button>
          </div>
        </div>
      </Modal>
      </>
  );
}

