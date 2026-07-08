import {useRef, useEffect, useState, useMemo, useCallback } from "react";
import Download from "~/assets/svg/common/download.svg?react";
import Upload from "~/assets/svg/common/upload.svg?react";
import Search from "~/assets/svg/common/search.svg?react";
import Square from "~/assets/svg/common/square.svg?react";
import Cube from "~/assets/svg/common/box.svg?react";
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
import {useTranslation} from "react-i18next";
import {toast} from "sonner";
import Button from "~/components/Button";
import Modal from "~/components/Modal";
import SvgComponent from "~/components/SvgComponent";
import {CantileverSelector} from "~/components/cantilevers/CantileverSelector";
import {  useOutletContext } from "@remix-run/react";
import { getLocationData } from "~/db/location/actions.server";
import Location from "~/components/locations/viewer";
import ViaCard from "./ViaCard";
import ButtonOptions from "~/components/locations/ButtonOptions";
import PoleCard from "../projects.$projectId.poles._index/PoleCard";
import CantileverCard from "../projects.$projectId.cantilevers._index/CantileverCard";
import VaneCard from "../projects.$projectId.vanes._index/VaneCard";
import {computeParam} from "~/utils/locations";

export const loader: LoaderFunction = async ({ request, params }) => {

  const locationId = Number(params.locationId);

  if (isNaN(locationId)) {
    throw new Response("Invalid location ID", { status: 400 });
  };

  const catenaryType =  await getCatenaryType(request,Number(params.projectId));

  const locationsData = await getLocationData(request, Number(params.projectId), Number(params.locationId));

  return Response.json({ locationsData:locationsData, catenaryType:catenaryType });
};

export default function LocationPage() {

  const context = useOutletContext<{selectedProject:ProjectParams}>();
  const navigate = useNavigate();
  const location = useLocation(); 
  const previousRoute = location.state?.from || "/";
  const {t,i18n} = useTranslation();
  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  const { locationsData, catenaryType } = useLoaderData<{ locationsData:LocationParams, catenaryType:string }>();

  if(!locationsData){
    navigate("/404")
    return;
  };

  const [locationData, setLocationData] = useState<LocationParams>(locationsData);

  const [ maximized, setMaximized ] = useState<boolean>(false);
    //Graphical Options
    const containerRef = useRef<HTMLDivElement>(null);
    const locationRef = useRef<Location | null>(null);
    const [options,setOptions] = useState<LocationViewerOptions>({ camera: 'orthographic', selection: { pole: false, vane: false, via: false, cantilever:false }, pan: false, snap_grid: true, snap_object: true, move_object: false, draw: { pole:false, vane:false, via:false, cantilever:false}, type: '2D' });

    useEffect(() => {
      // Initialize Cantilever only once
      if (!locationRef.current && containerRef.current) {
          containerRef.current.innerHTML = "";
          locationRef.current = new Location(1,locationData, options, containerRef.current, catenaryType);
      }

      // Cleanup on unmount
      return () => {
          if (locationRef.current) {
          locationRef.current.dispose(); // Assuming Cantilever has a dispose or cleanup method
          locationRef.current = null;
          }
      };
    }, []);

    useEffect(() => {
      if(locationRef.current && options){
        locationRef.current.updateOptionsData(options);
      }
    }, [options]);

    useEffect(() => {
        if (!containerRef.current) return;
    
        const observer = new ResizeObserver(() => {
          if (locationRef.current) {
            locationRef.current.updateRenderer();
          }
        });
    
        observer.observe(containerRef.current);
    
        return () => observer.disconnect();
    }, []);

    const closeAllSubOptions = () => {
      setOpenSelectionOptions(false);
      setOpenDrawOptions(false);
    }

    const handleGlobalOptions = (key: string) => {
    setOptions(prev => ({
        ...prev,
        [key]: !prev[key as keyof LocationViewerOptions]
    }));
    }

    const baseOptions = {
        pan: false,
        move_object: false,
        selection: {
            pole: false,
            vane: false,
            via: false,
            cantilever: false,
        },
        draw: {
            pole: false,
            vane: false,
            via: false,
            cantilever: false,
        }
    };

    const handleChangeOptions = (key: string, subKey: string|null) => {
      setOptions(prev => ({
          ...prev,
          ...baseOptions,
          [key]: subKey ? prev[key as keyof LocationViewerOptions] : true,
          ...(subKey && { [key]: { ...baseOptions[key as 'selection' | 'draw'], [subKey]: true } })
      }));
      
      closeAllSubOptions();
    };

    const handleSwitchPerspective = (perspective:string) => {
      setOptions(prev => ({
          ...prev,
          ...baseOptions,
          camera: perspective,
          type: perspective === "orthographic" ?  "2D" : "3D"
      }));
    }

    const [openDrawOptions,setOpenDrawOptions] = useState<boolean>(false);
    const [openSelectionOptions,setOpenSelectionOptions] = useState<boolean>(false);

    const handleMaximize = (state:boolean) => {
        setMaximized(state);
    }

    const goToRoute = (route:string) => {
        navigate(route);
    };



    const handleSelectVia = (viaId:number) => {
        //triggers event called "selectVia" with the viaId as the payload
        const event = new CustomEvent("selectVia", { detail: { viaId } });
        document.dispatchEvent(event);
    }


    useEffect(() => {

      const handleNewElement = (e: any) => {
        const { elementType, elementData } = e.detail;
        setLocationData(prev => {
          console.log("this is prev: "+prev);
          let newVias;
          switch (elementType) {
            case 'via':
              // upsert via
              const via: ViaParams = elementData;
              const idx = prev.vias.findIndex(v => v.id === via.id);
              newVias = idx >= 0
                ? prev.vias.map(v => v.id === via.id ? via : v)
                : [...prev.vias, via];
              break;
            case 'pole':
              // add pole under its via
              const pole: PoleDataContent = elementData;
              newVias = prev.vias.map(v =>
                v.id === pole.pole.via_id
                  ? { ...v, poles: [...v.poles, pole] }
                  : v
              );
              break;
            case 'cantilever':
              // replace entire pole with updated pole data
              const updatedPole: PoleDataContent = elementData;
              newVias = prev.vias.map(v =>
                v.id === updatedPole.pole.via_id
                  ? {
                      ...v,
                      poles: v.poles.map(p =>
                        p.pole.id === updatedPole.pole.id ? updatedPole : p
                      )
                    }
                  : v
              );
              break;
            default:
              newVias = prev.vias;
          }
          const newLocation = { ...prev, vias: newVias };
          // sync ref
          return prev;
        });
      };
      window.addEventListener('newLocationElement', handleNewElement);
      return () => window.removeEventListener('newLocationElement', handleNewElement);
    }, []);

    const onHandlerDeleteElement = (
        element: 'via' | 'pole' | 'cantilever' | 'vane',
        elementId: number
      ) => {
        setLocationData(prev => {
          let newVias = prev.vias;
          let newVanes = prev.vanes;

          if (element === 'via') {
            // Remove the via by id
            newVias = prev.vias.filter(v => v.id !== elementId);
          } else if (element === 'pole') {

            /* Remove pole from whichever via contains it
            newVias = prev.vias.map(via => ({
              ...via,
              poles: via.poles.filter(p => p.pole.id !== elementId)
            }));*/

            // Step 1: Find all cantilever IDs linked to the pole
            const cantileverIdsToDelete: number[] = [];

            newVias = prev.vias.map(via => ({
              ...via,
              poles: via.poles.filter(poleWrapper => {
                if (poleWrapper.pole.id === elementId) {
                  cantileverIdsToDelete.push(
                    ...poleWrapper.cantilevers.map(c => c.cantilever.id)
                  );
                  return false; // Remove this pole
                }
                return true;
              })
            }));

            // Step 2: Remove vanes linked to those cantilevers
            newVanes = prev.vanes.filter(v => {
              const isLinked = v.vane.cantilevers.some(c =>
                c.id && cantileverIdsToDelete.includes(c.id)
              );
              return !isLinked;
            });

          } else if(element === 'cantilever') {
            // element === 'cantilever'
            newVias = prev.vias.map(via => ({
              ...via,
              poles: via.poles.map(p => ({
                ...p,
                cantilevers: p.cantilevers.filter(c => c.cantilever.id !== elementId)
              }))
            }));

          } else if (element === 'vane') {
            newVanes = prev.vanes.filter(v => v.vane.id !== elementId);
          }

          const newLocationData = {
            ...prev,
            vias: newVias,
            vanes: newVanes
          };
          // Sync to ref
          locationRef.current.updateLocationData(newLocationData);
          return newLocationData;
        });
      };

    const handleDeleteVia = async (viaId:number) => {
      showLoader();
      // Send DELETE request to remove the pole
      try {
        const response = await fetch(`/api/via?id=${viaId}&projectId=${context.selectedProject.id?.toString()}`, {
          method: "DELETE",
        });

        if (response.ok) {
          onHandlerDeleteElement('via',viaId);
          toast.success(t('via.delete.success', { id: viaId }));

        } else {
          toast.success(t('via.delete.error', { id: viaId }));
          console.error("Failed to delete via:", response.statusText);
        }
      } catch (error) {
        toast.success(t('via.delete.failed', { error: error }));
        console.error("Error deleting via:", error);
      }
      hideLoader();
    };

    const [currentDetails,setCurrentDetails] = useState<'vias'|'poles'|'vanes'|'cantilevers'>('vias');
    const [searchTerm, setSearchTerm] = useState('')

    // Compute a flattened, typed list for the currentDetails view
      const items = useMemo(() => {
      if (!locationData) return []

        switch (currentDetails) {
          case 'vias':
            return locationData.vias.map(via => ({
              id: via.id,
              external_id: via.external_id,
              raw: via,
            }))

          case 'poles':
            return locationData.vias
              .flatMap(via => via.poles)
              .map(({ pole }) => ({
                id: pole.id,
                external_id: pole.external_id,
                raw: pole,
              }))

          case 'cantilevers':
            return locationData.vias
              .flatMap(via => via.poles.flatMap(p => p.cantilevers.map(c => c.cantilever)))
              .map(cant => ({
                id: cant.id,
                external_id: cant.external_id,
                raw: cant
            }))

          case 'vanes':
            return locationData.vanes
              .map(vane => ({
                id: vane.vane.id,
                external_id: vane.vane.external_id,
                raw: vane.vane
            }))

          default:
            return []
        }
      }, [locationData, currentDetails])

      // Filter by external_id
      const filtered = useMemo(() => {
        if (!searchTerm) return items
        const term = searchTerm.trim().toLowerCase()
        return items.filter(item => item.external_id.toLowerCase().includes(term))
      }, [items, searchTerm])

  const [openDownloadModal,setOpenDownloadModal] = useState<boolean>(false);

  const handleToggleDownloadLocationModal = () => {
    setOpenDownloadModal(!openDownloadModal)
  }

  const fetchFormDataAndDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form default behavior

    // Fetch form data
    const form = e.currentTarget;

    const cantInput  = form.querySelector<HTMLInputElement>('input[name="cantilevers"]');
    const vanesInput = form.querySelector<HTMLInputElement>('input[name="vanes"]');
    const stressInput= form.querySelector<HTMLInputElement>('input[name="stress"]');

    const cantChecked   = cantInput?.checked   ?? false;
    const vanesChecked  = vanesInput?.checked  ?? false;
    const stressChecked = stressInput?.checked ?? false;

    const code = computeParam(cantChecked, vanesChecked, stressChecked);

    if (code == 0) {
      toast.error(t("location.validations.fill_download_fields"));
      return;
    }

    const revision = form.querySelector<HTMLInputElement>('input[name="revision"]')?.value || "01";

    // Call the handleDownloadPole function
    await handleDownloadLocation("id",locationsData.id.toString(), code.toString(), revision);

    setOpenDownloadModal(false);
  };


  const handleDownloadLocation = async(type:string,value:string,type_report:string,revision:string) => {
    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const encodedValue = encodeURIComponent(value);
      const response = await fetch(`/api/location/download?type=${type}&value=${encodedValue}&projectId=${context.selectedProject.id?.toString()}&type_report=${type_report}&revision=${revision}`, {
        method: "GET",
        headers: {
          "Accept-Language": i18n.language,
        }
      });

      if (response.ok) {
        // Convert the response into a blob
        const blob = await response.blob();
        
        // Create a URL for the blob
        const url = window.URL.createObjectURL(blob);
        
        // Create an <a> element and trigger the download
        const link = document.createElement("a");
        link.href = url;
        if(type=="via_id"){
          link.download = `via_${value}_result.pdf`;
        }else{
          link.download = `location_${value}_results.pdf`;
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


  const handleClickCantilever = (cantileverId: number) => {
    navigate(`/projects/${context.selectedProject?.id?.toString()}/cantilevers/${cantileverId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const handleDeleteCantilever = async (cantileverId:number) => {
    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const response = await fetch(`/api/cantilever?id=${cantileverId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {

        onHandlerDeleteElement('cantilever',cantileverId);
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
      const response = await fetch(`/api/cantilever/download?type=${type}&value=${encodedValue}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "GET",
        headers: {
          "Accept-Language": i18n.language,
        }
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

  const handleClickPole = (poleId: number) => {
    navigate(`/projects/${context.selectedProject.id}/poles/${poleId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const handleDeletePole = async (poleId:number) => {
    showLoader();
    // Send DELETE request to remove the pole
    try {
      const response = await fetch(`/api/pole?id=${poleId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onHandlerDeleteElement('pole',poleId);
        toast.success(t('pole.delete.success', { id: poleId }));
      } else {
        toast.success(t('pole.delete.error', { id: poleId }));
        console.error("Failed to delete pole:", response.statusText);
      }
    } catch (error) {
      toast.success(t('pole.delete.failed', { error: error }));
      console.error("Error deleting pole:", error);
    }
    hideLoader();
  };

  const handleDownloadPole = async(type:string,value:string) => {
    showLoader();
    // Send DELETE request to remove the pole
    try {
      const encodedValue = encodeURIComponent(value);
      const response = await fetch(`/api/pole/download?type=${type}&value=${encodedValue}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "GET",
        headers: {
          "Accept-Language": i18n.language,
        }
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
          link.download = `pole_${value}_result.pdf`;
        }else{
          link.download = `poles_${value}_results.pdf`;
        }
        document.body.appendChild(link);
        link.click();
        
        // Clean up by revoking the blob URL and removing the <a> element
        link.remove();
        window.URL.revokeObjectURL(url);
        // Update the state to remove the deleted pole
        toast.success(t('pole.report.success'));
      } else {
        toast.success(t('pole.report.error'));
        console.error("Failed to download pole:", response.statusText);
      }
    } catch (error) {
      toast.success(t('pole.report.failed', { error: error }));
      console.error("Error download pole:", error);
    }
    hideLoader();
  }

  const handleClickVane = (vaneId: number) => {
    navigate(`/projects/${context.selectedProject?.id?.toString()}/vanes/${vaneId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  };

  const handleDeleteVane = async (vaneId:number) => {
    showLoader();
    // Send DELETE request to remove the vane
    try {
      const response = await fetch(`/api/vane?id=${vaneId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onHandlerDeleteElement('vane',vaneId);
        toast.success(t('vane.delete.success', { id: vaneId }));
      } else {
        toast.success(t('vane.delete.error', { id: vaneId }));
        console.error("Failed to delete vane:", response.statusText);
      }
    } catch (error) {
      toast.success(t('vane.delete.failed', { error: error }));
      console.error("Error deleting vane:", error);
    }
    hideLoader();
  };

  const handleDownloadVane = async(type:string,value:string) => {
    showLoader();
    // Send DELETE request to remove the vane
    try {
      const encodedValue = encodeURIComponent(value);
      const response = await fetch(`/api/vane/download?type=${type}&value=${encodedValue}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "GET",
        headers: {
          "Accept-Language": i18n.language,
        }
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
          link.download = `vane_${value}_result.pdf`;
        }else{
          link.download = `vanes_${value}_results.pdf`;
        }
        document.body.appendChild(link);
        link.click();
        
        // Clean up by revoking the blob URL and removing the <a> element
        link.remove();
        window.URL.revokeObjectURL(url);
        // Update the state to remove the deleted vane
        toast.success(t('vane.report.success'));
      } else {
        toast.success(t('vane.report.error'));
        console.error("Failed to download vane:", response.statusText);
      }
    } catch (error) {
      toast.success(t('vane.report.failed', { error: error }));
      console.error("Error download vane:", error);
    }
    hideLoader();
  }

  const [openLoaderViasModal, setOpenLoaderViasModal] = useState(false);

  const handleToggleLoadViasModal = () => {
    setOpenLoaderViasModal(prev => !prev);
  };

  const loadViasFromFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const file = formData.get("viaFile") as File;

    if (!file) {
      toast.success(t('via.loader.no_file_selected'));
      return;
    }

    try {

      showLoader();

      const uploadData = new FormData();
      uploadData.append("viaFile", file);

      const response = await fetch("/api/via/loader", {
        method: "POST",
        body: uploadData,
      });

      if (response.ok) {

        toast.success(t('via.loader.success'));

        handleToggleLoadViasModal(); // close modal after upload

      } else {

        toast.success(t('via.loader.error'));

        console.error("Failed to load vias:", response.statusText);

      }

    } catch (error) {

      toast.success(t('via.loader.failed', { error: error }));

      console.error("Error during load of vias:", error);

    }

    hideLoader();
  };


    return(
    <>
        <div className="h-full w-full flex flex-col xl:grid xl:grid-cols-3 xl:grid-rows-10 gap-4 overflow-y-scroll">
            <div className="w-full h-auto xl:col-span-3 xl:row-span-1 flex flex-col sm:flex-row justify-start items-start gap-y-4 sm:gap-x-4">
              {!maximized &&
                <div className="w-full flex flex-row justify-between">
                  <div className="w-auto flex flex-row justify-start items-center gap-x-4">
                    <button onClick={()=>goToRoute(previousRoute)} className="w-10 h-10 p-2 bg-secondary-dark text-white duration-300  rounded-full hover:bg-primary active:scale-95">
                      <ChevronLeftIcon className="h-full w-full"/>
                    </button>
                    <h4 className="font-bold text-secondary-dark capitalize">{t("location.name")}</h4>
                  </div>
                  <div className="w-auto flex flex-row justify-end items-center gap-x-4">
                    <button onClick={handleToggleLoadViasModal} className="h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white bg-secondary text-body cursor-pointer">
                      <Upload className="h-full w-full"/>
                    </button>
                    <button onClick={handleToggleDownloadLocationModal} className="h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white bg-secondary text-body cursor-pointer">
                      <Download className="h-full w-full"/>
                    </button>
                    <button className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.camera === "orthographic" ? "bg-primary text-white" : "bg-secondary text-body"}`} onClick={()=> handleSwitchPerspective("orthographic")}>
                      <Square className="w-full h-full"/>
                    </button>
                    <button className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2  ${options.camera === "perspective" ? "bg-primary text-white" : "bg-secondary text-body"}`} onClick={() => handleSwitchPerspective("perspective")}>
                      <Cube className="w-full h-full"/>
                    </button>
                  </div>
                </div>
              }
            </div>
            <div className="relative w-full h-full max-xl:min-h-[500px] xl:col-span-3 xl:row-span-6 border-2 border-gray-light z-20 overflow-hidden">
                <div className={`${maximized ? "w-full h-screen fixed left-0 top-0" : "w-full h-full flex flex-col justify-start items-start" } transition-all duration-300 z-[80] bg-white`}>
                <div className="absolute top-1/2 -translate-y-1/2 right-5 w-auto h-auto flex flex-col justify-start items-start z-[90] bg-black gap-y-2 p-2 rounded-xl">
                    <ButtonOptions icon={maximized ? "minimize" : "maximize"} iconBig={false} isActive={maximized} onClick={() => handleMaximize(!maximized)}/>
                    <ButtonOptions icon="hand" iconBig={false} isActive={options.pan} onClick={() => handleChangeOptions('pan',null)}/> 
                    <ButtonOptions icon="move" iconBig={false} isActive={options.move_object} onClick={() => handleChangeOptions('move_object',null)}/>
                    <span className="relative w-auto h-auto">
                    <ButtonOptions icon="mouse_pointer" iconBig={false} isActive={options.selection.pole || options.selection.vane || options.selection.via || options.selection.cantilever} onClick={() => {setOpenSelectionOptions(!openSelectionOptions); setOpenDrawOptions(false);}}/> 
                    {openSelectionOptions && (
                        <div className="absolute -top-16 -left-[calc(100%+1.5rem)] w-auto h-auto bg-black rounded-lg px-2 py-2 gap-y-2 flex flex-col justify-start items-start">
                        <ButtonOptions icon="pole" iconBig={true} isActive={options.selection.pole} onClick={() => handleChangeOptions('selection','pole')}/>
                        <ButtonOptions icon="vane" iconBig={true} isActive={options.selection.vane} onClick={() => handleChangeOptions('selection','vane')}/>
                        <ButtonOptions icon="via" iconBig={true} isActive={options.selection.via} onClick={() => handleChangeOptions('selection','via')}/>
                        <ButtonOptions icon="cantilever_gy_type_1" iconBig={true} isActive={options.selection.cantilever} onClick={() => handleChangeOptions('selection','cantilever')}/>
                        </div>
                    )}
                    </span>
                    <span className="relative w-auto h-auto">
                    <ButtonOptions icon="plus" iconBig={false} isActive={options.draw.pole || options.draw.vane || options.draw.via || options.draw.cantilever} onClick={() => {setOpenDrawOptions(!openDrawOptions); setOpenSelectionOptions(false);}}/>
                    {openDrawOptions && (
                        <div className="absolute -top-16 -left-[calc(100%+1.5rem)] w-auto h-auto bg-black rounded-lg px-2 py-2 gap-y-2 flex flex-col justify-start items-start">
                        <ButtonOptions icon="pole" iconBig={true} isActive={options.draw.pole} onClick={() => handleChangeOptions('draw','pole')}/>
                        <ButtonOptions icon="vane" iconBig={true} isActive={options.draw.vane} onClick={() => handleChangeOptions('draw','vane')}/>
                        <ButtonOptions icon="via" iconBig={true} isActive={options.draw.via} onClick={() => handleChangeOptions('draw','via')}/>
                        <ButtonOptions icon="cantilever_gy_type_1" iconBig={true} isActive={options.draw.cantilever} onClick={() => handleChangeOptions('draw','cantilever')}/>
                        </div>
                    )}
                    </span>

                </div>

                <div className="loader-locations loader-locations-1">
                  <div className="sk-chase">
                    <div className="sk-chase-dot"></div>
                    <div className="sk-chase-dot"></div>
                    <div className="sk-chase-dot"></div>
                    <div className="sk-chase-dot"></div>
                    <div className="sk-chase-dot"></div>
                    <div className="sk-chase-dot"></div>
                  </div>
                  <div>{t("common.loading")}.</div>
                </div>

                <div className="absolute bottom-0 right-0 w-auto h-auto flex flex-row justify-start items-center bg-black/50 z-[90]  gap-x-4 p-2 px-4 rounded-tl-lg">
                    <div className="inline-flex flex-row justify-start items-center gap-x-2">
                        <label htmlFor="snap_object" className="text-white text-xs">Snap Object</label>
                        <input type="checkbox" id="snap_object" className="w-4 h-4" checked={options.snap_object} onChange={() => handleGlobalOptions('snap_object')}/>
                    </div>
                    <div className="inline-flex flex-row justify-start items-center gap-x-2">
                        <label htmlFor="snap_grid" className="text-white text-xs">Snap Grid</label>
                        <input type="checkbox" id="snap_grid" className="w-4 h-4" checked={options.snap_grid} onChange={() => handleGlobalOptions('snap_grid')}/>
                    </div>
                </div>
                <div id="location-viewer" ref={containerRef} className="h-full w-full bg-white rounded-xl z-[80]">
                </div>
                </div>
            </div>
            <div className="w-full h-auto xl:col-span-3 xl:row-span-3 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start gap-y-4 animation-group py-2 px-4">
              <div className="w-full h-auto flex flex-col-reverse 2xl:flex-row justify-between items-center max-2xl:gap-y-4">
                <div className="w-full h-auto flex flex-row justify-start items-center gap-x-4">
                  {[
                      {
                        value:'vias', 
                        icon:'via', 
                        qty:locationData.vias.length 
                      },
                      { 
                        value:'poles',
                        icon:'pole',
                        qty:locationData.vias.reduce((sum, via) => sum + via.poles.length,0)
                      },
                      {
                        value:'cantilevers',
                        icon:'cantilever_gy_type_1',
                        qty:locationData.vias.reduce((sum, via) => sum + (via.poles.reduce((sum, pole) => sum + pole.cantilevers.length,0)),0)
                      },
                      {
                        value:'vanes',
                        icon:'vane',
                        qty:locationData.vanes.length
                      }
                  ].map(option => (
                    <SelectorOptionViewerElement
                      key={option.value}
                      icon={option.icon}
                      items_qty={option.qty}
                      label={`location.fields.${option.value}`}
                      active={currentDetails === option.value}
                      handleSelectOption={() => setCurrentDetails(option.value as any)}
                    />
                  ))}
                </div>

                <div className="w-full h-auto flex flex-row justify-end items-center gap-x-4  text-body px-4 border-b-2 border-gray-light">
                    <input name="value_search" className="w-full focus:outline-none py-3 " placeholder={"Buscar por Nombre"} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <span className="px-3 py-3 duration-300">
                      <Search className="w-4 h-4"/>
                    </span>
                </div>
              </div>

              <h4 className="font-bold text-secondary-dark capitalize">
                { t(`location.fields.${currentDetails}`) }
              </h4>

              <div className="w-full flex flex-col gap-y-2 overflow-y-auto pe-2">
                {filtered.map((item, idx) => {
                  switch (currentDetails) {
                    case 'vias':
                      return (
                        <ViaCard
                          key={item.id}
                          index={idx}
                          via={item.raw}
                          onHandler={handleSelectVia}
                          onDelete={handleDeleteVia}
                          onDownload={handleDownloadLocation}
                        />
                      )
                    case 'poles':
                      return (
                        <PoleCard
                          key={item.id}
                          index={idx}
                          pole={item.raw}
                          onHandler={id => console.log('select', id)}
                          openHandler={handleClickPole}
                          onDelete={handleDeletePole}
                          onDownload={handleDownloadPole}
                        />
                      )
                    case 'cantilevers':
                      return (
                        <CantileverCard
                          key={item.id}
                          index={idx}
                          cantilever={item.raw}
                          onHandler={id => console.log('select', id)}
                          openHandler={handleClickCantilever}
                          onDelete={handleDeleteCantilever}
                          onDownload={handleDownloadCantilever}
                        />
                      )
                    case 'vanes':
                      return (
                        <VaneCard
                          key={item.id}
                          index={idx}
                          vane={item.raw}
                          onHandler={id => console.log('select', id)}
                          openHandler={handleClickVane}
                          onDelete={handleDeleteVane}
                          onDownload={handleDownloadVane}
                        />
                      )
                    default:
                      return null
                  }
                })}
              </div>
            </div>
        </div>
        <Modal key={`modal-download-vias`} isOpen={openDownloadModal} onClose={handleToggleDownloadLocationModal}>
          <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
            <div className="w-20 h-20 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
              <SvgComponent icon="location"/>
            </div>
            <form id="download-cantilever-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto" onSubmit={fetchFormDataAndDownload}>
              <label className="col-span-1 lg:col-span-2 font-bold text-primary capitalize">{t("location.download.message")}</label>
              <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                <label className="font-bold text-xs text-primary capitalize">{t("location.download.cantilevers")}</label>
                <div className="checkbox-wrapper-2">
                  <input type="checkbox" className="sc-gJwTLC ikxBAC" id="cantilevers" name="cantilevers" defaultChecked/>
                </div>
              </div>

              <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                <label className="font-bold text-xs text-primary capitalize">{t("location.download.vanes")}</label>
                <div className="checkbox-wrapper-2">
                  <input type="checkbox" className="sc-gJwTLC ikxBAC" id="vanes" name="vanes" defaultChecked/>
                </div>
              </div>
              <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                <label className="font-bold text-xs text-gray-400 capitalize">{t("location.download.stress")}</label>
                <div className="checkbox-wrapper-2">
                  <input type="checkbox" className="sc-gJwTLC ikxBAC" id="stress" name="stress" disabled/>
                </div>
              </div>

              <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
                <label className="font-bold text-xs text-gray-400 capitalize">{t("location.download.revision")}</label>
                <input
                  type="text"
                  name="revision"
                  placeholder={t("location.download.revision")}
                  className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
                />
              </div>
              <div className="col-span-2 gap-x-4 flex items-center justify-around lg:justify-center mt-4">
                <Button type="button" onClick={handleToggleDownloadLocationModal} className="capitalize px-6">{t("common.cancel")}</Button>
                <Button type="submit" className="capitalize px-6">{t("common.download")}</Button>
              </div>
            </form>
          </div>
        </Modal>
        <Modal key="modal-load-vias" isOpen={openLoaderViasModal} onClose={handleToggleLoadViasModal}>
          <div className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
            <div className="w-20 h-20 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
              <SvgComponent icon="location" />
            </div>
            <form
              id="loader-vias-form"
              className="grid grid-cols-1 gap-4 w-full h-auto"
              onSubmit={loadViasFromFile}
              encType="multipart/form-data"
            >
              <label className="font-bold text-primary capitalize col-span-1">
                {t("location.load_vias")}
              </label>

              <input
                type="file"
                name="viaFile"
                accept=".dxf"
                required
                className="border-b-[2px] border-b-primary focus:outline-none px-2 py-2 text-primary"
              />

              <div className="gap-x-4 flex items-center justify-around lg:justify-center mt-4">
                <Button type="button" onClick={handleToggleLoadViasModal} className="capitalize px-6">
                  {t("common.cancel")}
                </Button>
                <Button type="submit" className="capitalize px-6">
                  {t("common.upload")}
                </Button>
              </div>
            </form>
          </div>
        </Modal>
      </>
    );
}

interface SelectorOptionViewerElementProps {
  icon: string;
  items_qty:number;
  label: string;
  active:boolean;
  handleSelectOption: () => void;
}

const SelectorOptionViewerElement = (props: SelectorOptionViewerElementProps) => {
  const { icon, label,active,items_qty, handleSelectOption } = props;

  const {t} = useTranslation();

  return (
    <div
      onClick={handleSelectOption}
      className={`w-auto h-auto rounded-xl flex flex-row items-center justify-center border-2 border-gray-light py-0 px-2 gap-x-2 ${ active ? 'bg-primary-dark border-primary-dark' : ''} hover:bg-primary-dark group active:scale-95 duration-300 active:border-primary-dark hover:border-primary-dark cursor-pointer`}
    >
      <span className={`w-auto h-auto group-hover:text-white p-1 mt-2 ${active ? 'text-white': ''}`}>
        <SvgComponent icon={icon} className="h-5 w-auto" />
      </span>
      <span className={`text-sm font-bold group-hover:text-white capitalize ${active ? 'text-white': ''}`}>{t(label)} </span>
      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-sm font-bold group-hover:text-primary-dark group-hover:bg-white capitalize ${active ? 'bg-white text-primary-dark': 'bg-primary-dark text-white'}`}>{items_qty}</span>
    </div>
  );
};

