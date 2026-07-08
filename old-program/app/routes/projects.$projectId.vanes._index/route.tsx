import { useCallback, useEffect, useState } from "react";
//import VaneViewer from "~/components/vanes/VaneViewer";
import VaneCard from "./VaneCard";
import SearchBar from "~/components/SearchBar";
import {useLocation, useNavigate} from "react-router-dom";
import Button from "~/components/Button";
import PlusIcon from "~/assets/svg/common/plus.svg?react";
import Download from "~/assets/svg/common/download.svg?react";
import LoaderVane from "~/components/loaders/LoaderVane";
import {toast} from "sonner";
import {useTranslation} from "react-i18next";
import Modal from "~/components/Modal";
import SvgComponent from "~/components/SvgComponent";
import { useLoaderData, useNavigation } from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import {  useOutletContext } from "@remix-run/react";
import { getCatenaryType } from "~/db/config/actions.server";
import { LoaderFunction } from "@remix-run/node";
import { getVanesOptions, getDefaultsVanes } from "~/db/vane/data";
import { VaneTypeSelector } from "~/components/vanes/VaneSelector";
import {PoleSelector} from "~/components/poles/PoleSelector";
import {getAllLocations} from "~/db/location/actions.server";
import {calculateDefaultValues} from "~/utils/vane";

export const loader: LoaderFunction = async ({ request,params }) => {
  const {projectId} = params;

  const catenaryType =  await getCatenaryType(request,Number(projectId));

  const locations = await getAllLocations(request, Number(projectId))

  return Response.json({catenaryType, locations});
};

export default function VanesPage(){

  const context = useOutletContext<{selectedProject:ProjectParams}>();

  const navigate = useNavigate();

  const { catenaryType, locations } = useLoaderData<{ catenaryType:string, locations: { location_id:number, external_id:string }[] }>();

  const [currentLocation,setCurrentLocation] = useState<{location_id:number, external_id:string}>({location_id:0, external_id:""});
  const [currentVia,setCurrentVia] = useState<{via_id:number, external_id:string}>({via_id:0, external_id:""});
  const [currentVias,setCurrentVias] = useState<{via_id:number, external_id:string}[]>([]);

  useEffect(() => {
    const locationData = locations.find((loc) => loc.location_id === currentLocation.location_id);
    setCurrentVias(locationData?.vias || []);  // ✅ Guarantees an update with a new array reference
  }, [currentLocation, locations]);


  const location = useLocation();
  const {t, i18n} = useTranslation();
  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  const handleNavigate = (page:number,value?:string,type?:string) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());

    if(value && type){
      const encodedValue = encodeURIComponent(value);
      params.set(type, encodedValue);
    };
    setCurrentPage(page);
    navigate(`/projects/${context.selectedProject.id}/vanes?${params.toString()}`,{ replace: true });
    fetchVanes(page,value,type);
  };

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  useEffect(() => {
    showLoader();
    fetchVanes(currentPage);
    hideLoader();
  }, []);

  const fetchVanes = async (pageInput:number, value?:string, type?:string) => {
    const page = pageInput.toString();
    const size = "5";
    const projectId = context.selectedProject.id?.toString() || '';

    try {
      const queryParams = new URLSearchParams({ page, size, projectId });
      if(value && type){
        queryParams.set(type, value);
      }
      const response = await fetch(`/api/vanes?${queryParams.toString()}`);
      if (response.ok) {
        const vanesData = await response.json();
        setVanes(vanesData.vanes || []);
        setCurrentPage(vanesData.currentPage || 1);
        setLastPage(vanesData.lastPage || 1);
      } else {
        console.error("Failed to fetch vanes");
      }
    } catch (error) {
      console.error("Error fetching vanes:", error);
    }
  };


  const [vanes, setVanes] = useState<VaneDataContent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [selectedVane, setSelectedVane] = useState<{ data:VaneParams | null  }>({data: null });

  const [openModalDetail,setOpenModalDetail] = useState<boolean>(false);

  const toggleOpenDetail = () => {
    setOpenModalDetail(!openModalDetail);
  }

  const handleSelectVane = (vaneId:number) => {
    const searchedVane = vanes.find(vane => vane.vane.id == vaneId); 
    if(searchedVane){
      setSelectedVane(
        { data: searchedVane.vane}
      )
    }
    toggleOpenDetail();
  };

  const handleDeleteVane = async (vaneId:number) => {
    showLoader();
    // Send DELETE request to remove the vane
    try {
      const response = await fetch(`/api/vane?id=${vaneId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        handleNavigate(currentPage);
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

  const [openDownloadModal,setOpenDownloadModal] = useState<boolean>(false);

  const handleToggleDownloadVaneModal = () => {
    setOpenDownloadModal(!openDownloadModal)
  }

  const fetchFormDataAndDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form default behavior

    // Fetch form data
    const form = e.currentTarget;
    const type = form.download_criteria.value; // Get the selected criteria
    const value = form.download_value.value; // Get the entered value

    if (!type || !value) {
      toast.error(t("vane.validations.fill_download_fields"));
      return;
    }
    // Call the handleDownloadVane function
    await handleDownloadVane(type, value);

    setOpenDownloadModal(!openDownloadModal);
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

  const handleSearchVanes = (value:string, filter:string) => {
    if(value){
      handleNavigate(1,value,filter);
    }else{
      handleNavigate(1);
    }
  } 

  const [openAddModal,setOpenAddModal] = useState<boolean>(false);

  const handleToggleAddVaneModal = () => {
    setOpenAddModal(!openAddModal)
  }

  const handleAddVane = async () => {
    const form = document.getElementById('new-vane-form') as HTMLFormElement;
    if(!form){
      return;
    }

    const newVane = {
      external_id: form.external_id.value,
      location_id: Number(currentLocation.location_id),
      location: currentLocation.external_id,
      project_id: Number(context.selectedProject.id),
      project: context.selectedProject.name,
      params: calculateDefaultValues(selVane,calculationType, poles)
    };

    showLoader();
    // Send POST request to create a new vane
    try {
      const response = await fetch("/api/vane", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newVane),
      });

      if (response.ok) {
        const createdVane = await response.json();
        handleNavigate(currentPage);
        setOpenAddModal(false);
        toast.success(t('vane.create.success', { id: createdVane.id }));
      } else {

        toast.success(t('vane.create.error'));
        console.error("Failed to add vane:", response.statusText);
      }
    } catch (error) {
      toast.success(t('vane.create.failed',{ error: error }));
      console.error("Error adding vane:", error);
    }

    hideLoader();
  };


  const handleClickVane = useCallback((vaneId: number) => {
    const vane = vanes.find(ctlv => ctlv.vane.id == vaneId)
    if(!vane){
      toast.error(t("vane.not_found"))
    }
    navigate(`/projects/${context.selectedProject.id}/vanes/${vaneId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  },[vanes]);

  const [selVane,setSelVane] = useState<VaneParamsProps>(getDefaultsVanes(catenaryType)[0].params as VaneParamsProps);

  const handleChangeType = useCallback((model:VaneModelInterface) => {

    const selectedVaneType = getDefaultsVanes(catenaryType).find((item)=> item.params?.model.type.configuration === model.type.configuration && item.params.model.type.contactWireConfiguration === model.type.contactWireConfiguration);

    if (!selectedVaneType || !selectedVaneType.params || !selVane) {
      return;
    }

    setSelVane({...selectedVaneType.params})
    return;
  },[selVane]);



  const [poles,setPoles] = useState<{location:string,via:string, currentOption:{ pole: PoleParams, cantilever: { id:number, external_id:string }}|null }[]>([]);

  const handleAddPoles = async () => {

    if(poles.length == 2){
      toast.error(t("vane.validations.two_poles_max"));
      return;
    }

    if (currentLocation.location_id > 0 && currentVia.via_id > 0) {

      setPoles((prevPoles)=> [...prevPoles, { location:currentLocation.location_id.toString() , via: currentVia.via_id.toString(), currentOption:null } ])

    } else {
      toast.error(t("vane.validations.select_location_via"));
    }
  };

  const updateCurrentOption = (poleIndex: number, newOption: PoleParams, cantilever:{ id:number, external_id:string }) => {


    if(poles.length == 2 && (poles[0].currentOption != null || poles[1].currentOption != null)){

      if(poles[0].currentOption != null){

        if(newOption.params.position.x == poles[0].currentOption.pole.params.position.x && newOption.params.position.y == poles[0].currentOption.pole.params.position.y && newOption.params.position.z == poles[0].currentOption.pole.params.position.z){
          toast.error(t("vane.validations.poles_same_position"));
          return;
        }
      }

      if(poles[1].currentOption != null){

        if(newOption.params.position.x == poles[1].currentOption.pole.params.position.x && newOption.params.position.y == poles[1].currentOption.pole.params.position.y && newOption.params.position.z == poles[1].currentOption.pole.params.position.z){
          toast.error(t("vane.validations.poles_same_position"));
          return;
        }
      }

    }

    setPoles((prevPoles) => 
      prevPoles.map((pole, index) => 
        index === poleIndex 
          ? { ...pole, currentOption: {pole:newOption, cantilever:cantilever} }
          : pole
      )
    );
  };


  const removePole = (poleIndex: number) => {
    setPoles((prevPoles) => 
      prevPoles.filter((_, index) => index !== poleIndex)
    );
  };

  const [calculationType, setCalculationType] = useState<"manual"|"automatic">("manual");


  return(
    <>
        <div className="h-full w-full flex flex-col justify-start items-start xl:grid xl:grid-cols-3 gap-4">
          <div className="h-full overflow-y-scroll w-full h-full xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start p-4 gap-y-4 shadow-sm">

            <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
              <div className="w-auto inline-flex gap-x-4">
                <h4 className="font-bold text-body capitalize">{t("vane.plural")}</h4>
                <span className="bg-body text-white rounded-full h-8 w-8 font-bold flex items-center justify-center">
                  {vanes.length}
                </span>
              </div>
              <span onClick={handleToggleDownloadVaneModal} className="h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white cursor-pointer">
                <Download className="h-full w-full"/>
              </span>
            </div>
            <SearchBar 
              input_placeholder={t("vane.search_bar.search_placeholder")} 
              onSearch={handleSearchVanes}
              filters={[{ value:"external_id", label:"vane.search_bar.options.id" },{value:"model",label:"vane.search_bar.options.model"}, {value:"type",label:"vane.search_bar.options.type"}, {value:"via",label:"vane.search_bar.options.via"}, { value:"location", label:"vane.search_bar.options.location"} , { value:"pole", label:"vane.search_bar.options.pole" }]}
              btnLabel={t("vane.search_bar.btn_label")} 
              btnAction={handleToggleAddVaneModal}
            />
            <div className="flex-1 w-full gap-y-4 flex flex-col overflow-y-auto pe-2">
              {vanes.map((vane,index)=>{
                return(
                  <VaneCard 
                    key={index} 
                    vane={vane.vane} 
                    index={index} 
                    onHandler={handleSelectVane}
                    openHandler={handleClickVane}
                    onDelete={handleDeleteVane}
                    onDownload={handleDownloadVane}
                  />
                )
              })}
            </div>
            <div className="w-full h-auto flex flex-row justify-between mt-auto">
              {/* Previous Buttons */}
              <div className="w-auto flex flex-row gap-x-1">
                {/* First Page */}
                <button
                  onClick={() => handleNavigate(1)}
                  disabled={currentPage === 1}
                  className={`h-10 w-10 border-2 rounded-xl flex items-center justify-center p-1 duration-300 ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-300 pointer-events-none"
                      : "hover:bg-primary hover:text-white border-primary active:scale-95 text-primary cursor-pointer"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <path d="m11 17-5-5 5-5" />
                    <path d="m18 17-5-5 5-5" />
                  </svg>
                </button>

                {/* Previous Page */}
                <button
                  onClick={() => handleNavigate(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`h-10 w-10 border-2 rounded-xl flex items-center justify-center p-1 duration-300 ${
                    currentPage === 1
                      ? "bg-gray-100 text-gray-300 pointer-events-none"
                      : "hover:bg-primary hover:text-white border-primary active:scale-95 text-primary cursor-pointer"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                </button>
              </div>

              {/* Next Buttons */}
              <div className="w-auto flex flex-row gap-x-1">
                {/* Next Page */}
                <button
                  onClick={() => handleNavigate(currentPage + 1)}
                  disabled={currentPage === lastPage}
                  className={`h-10 w-10 border-2 rounded-xl flex items-center justify-center p-1 duration-300 ${
                    currentPage === lastPage
                      ? "bg-gray-100 text-gray-300 pointer-events-none"
                      : "hover:bg-primary hover:text-white border-primary active:scale-95 text-primary cursor-pointer"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-full w-full"
                  >
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </button>

                {/* Last Page */}
                <button
                  onClick={() => handleNavigate(lastPage)}
                  disabled={currentPage === lastPage}
                  className={`h-10 w-10 border-2 rounded-xl flex items-center justify-center p-1 duration-300 ${
                    currentPage === lastPage
                      ? "bg-gray-100 text-gray-300 pointer-events-none"
                      : "hover:bg-primary hover:text-white border-primary active:scale-95 text-primary cursor-pointer"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-full h-full"
                  >
                    <path d="m6 17 5-5-5-5" />
                    <path d="m13 17 5-5-5-5" />
                  </svg>
                </button>
              </div>
          </div>
          </div>
          <div className={`max-xl:fixed max-xl:top-0 ${openModalDetail ? "max-xl:right-0": "max-sm:-w-[100%] max-xl:-right-[600px]"}  bg-white max-sm:w-full max-xl:w-[600px] h-full xl:flex xl:col-span-1 border-2 border-gray-light rounded-s-xl xl:rounded-xl flex-col justify-start items-start py-6 px-4 xl:p-4 gap-y-4 shadow-sm z-[100] transition-all duration-300`}>
            {selectedVane.data == null ?
              <div className="w-full h-full flex flex-col justify-center items-center text-primary">
                <LoaderVane noLabel={true} className="h-56 w-56"/>
                <p className="text-center text-body w-full px-24">{t("vane.empty_content")}</p>
              </div>
            :
            <>

              {/*
              <span className="w-full inline-flex justify-end">
                <button onClick={toggleOpenDetail} className="xl:hidden bg-white text-primary hover:bg-primary hover:text-white duration-300 active:scale-95 rounded-xl ml-auto mr-4 p-1 border border-gray-light">
                  <X className="w-8 h-8"/>
                </button>
              </span>
              <h5 className="font-bold text-secondary-dark">{`Vane: ${selectedVane.data?.external_id}`}</h5>
              <div className="w-full h-[300px] flex flex-col justify-start items-start p-4">
                  <VaneViewer vane={selectedVane.vane} type={"2D"} labels={false} ambient={false}/>
              </div>

              <div className="col-span-2">
                <label className="font-bold text-secondary-dark">Vane Data</label>
              </div>

              <div className="w-full h-auto grid grid-cols-2 gap-4">
                <div className="col-span-1 flex flex-col justify-start items-start gap-y-4">
                  <p className="font-bold text-xs text-primary">External ID</p>
                  <span className="border-b-2 border-b-primary focus:outline-none w-full px-2 text-sm text-body">
                    {selectedVane.data.external_id}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-xs text-primary">Location</p>
                  <span className="border-b-2 border-b-primary focus:outline-none w-full px-2 text-body text-sm">
                    {selectedVane.data.location}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-xs text-primary">Via</p>
                  <span className="border-b-2 border-b-primary focus:outline-none w-full px-2 text-sm text-body">
                    {selectedVane.data.via}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-xs text-primary">Pole</p>
                  <span className="border-b-2 border-b-primary focus:outline-none w-full px-2 text-sm text-body">
                    {selectedVane.data.pole}
                  </span>
                </div>

                <div className="col-span-2">
                  <label className="font-bold text-secondary-dark">Technical data</label>
                </div>

                <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-xs text-primary">Contact Wire</p>
                  <span className="border-b-2 border-b-primary focus:outline-none w-full px-2 text-sm text-body">
                    {selectedVane.vane?.contact_wire_height}
                  </span>
                </div>

                <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-xs text-primary">System Height</p>
                  <span className="border-b-2 border-b-primary focus:outline-none w-full px-2 text-sm text-body">
                    {selectedVane.vane?.system_height}
                  </span>
                </div>

              </div>

              <div className="w-full h-auto flex flex-row justify-end mt-4">
                <Button onClick={()=>handleClickVane(selectedVane.data.id)} rightIcon={<Eye/>} className="h-full font-bold text-nowrap cursor-pointer">{"See Details"}</Button>
              </div>
              */}
            </>
            }
          </div>
        </div>
      <Modal key={`modal-add-vane`} isOpen={openAddModal} onClose={handleToggleAddVaneModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="vane"/>
          </div>
          <form id="new-vane-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("vane.fields.external_id")}</label>
              <input
                type="text"
                name="external_id"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("vane.fields.location")}</label>
              <select name="location" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary" 
                onChange={(e) => {
                  const selectedLocation = locations.find(loc => loc.location_id === Number(e.currentTarget.value)) 
                    || { location_id: 0, external_id: "" };

                  setCurrentLocation(selectedLocation); // ✅ Guarantees a re-render
                }}>
                <option value={0}>{t("vane.fields.no_location")}</option>
                {locations.map((location,index)=>{
                  return(
                    <option key={`location_${index}`} value={location.location_id}>{location.external_id}</option>
                  )
                })}
              </select>
            </div>
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-0">
              <label className="font-bold text-secondary-dark px-4 capitalize">{t("cantilever.cantilever_type")}</label>
              <VaneTypeSelector currentOption={{model:selVane.model}} options={getVanesOptions(catenaryType)} onChangeType={handleChangeType}/>
            </div>

            <div className="col-span-2 w-auto inline-flex justify-between items-center gap-y-2">
              <label className="w-full font-bold text-secondary-dark px-4 capitalize text-wrap text-xs">{ calculationType == "manual" ? t("pole.fields.calculation_type_auto") : t("pole.fields.calculation_type_manual")}</label>
              <div className="w-auto h-auto checkbox-wrapper-2 inline-flex items-center">
                  <input
                    type="checkbox"
                    className="sc-gJwTLC ikxBAC"
                    id="add_reinforcement"
                    name="add_reinforcement"
                    onChange={(e) => setCalculationType(e.target.checked ? "automatic" : "manual")}
                    checked={calculationType === "automatic"}
                  />
              </div>
            </div>
            {calculationType === "automatic" &&
              <>
                <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
                  <label className="font-bold text-primary capitalize">Via</label>
                  <select name="via" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
                    onChange={(e) => {
                      const selectedVia = currentVias.find(via => via.via_id === Number(e.currentTarget.value)) 
                        || { via_id: 0, external_id: "" };

                      setCurrentVia(selectedVia); // ✅ Guarantees a re-render
                    }}
                  >
                    <option value={0}>{t("vane.fields.no_via")}</option>
                    {currentVias.map((via,index)=>{
                      return(
                        <option key={`via_${index}`} value={via.via_id}>{via.external_id}</option>
                      )
                    })}
                  </select>
                </div>
                <div className="col-span-2 flex flex-row justify-end">
                  <Button onClick={handleAddPoles} type="button" rightIcon={<PlusIcon className="w-4 h-4"/>} className="h-full font-bold text-nowrap">{t("pole.search_bar.btn_label")}</Button>
                </div>
                <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
                  {poles.map((item,index)=>{
                    return(
                      <PoleSelector
                        key={`pole_new_${index}`}
                        index={index}
                        projectId={context.selectedProject.id || 0}
                        location={item.location}
                        via={item.via}
                        currentOption={item.currentOption}
                        onChangeSelection={updateCurrentOption}
                        onDelete={removePole}
                      />
                    )
                  })}
                </div>
              </>
            }
          </form>
          <div className="w-full h-auto gap-x-4 flex items-center justify-around lg:justify-center mt-4">
            <Button onClick={handleToggleAddVaneModal} className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={handleAddVane} className="capitalize px-6">{t("common.create")}</Button>
          </div>
        </div>
      </Modal>

      <Modal key={`modal-download-vanes`} isOpen={openDownloadModal} onClose={handleToggleDownloadVaneModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-36 h-36 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="vane"/>
          </div>
          <form id="download-vane-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto" onSubmit={fetchFormDataAndDownload}>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("vane.fields.criteria")}</label>
              <select name="download_criteria" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary">
                <option value="external_id">{t("vane.fields.external_id")}</option>
                <option value="via">{t("vane.fields.via")}</option>
                <option value="location">{t("vane.fields.location")}</option>
                <option value="pole">{t("vane.fields.pole")}</option>
              </select>
            </div>

            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("vane.fields.value")}</label>
              <input
                type="text"
                name="download_value"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-2 gap-x-4 flex items-center justify-around lg:justify-center mt-4">
              <Button type="button" onClick={handleToggleDownloadVaneModal} className="capitalize px-6">{t("common.cancel")}</Button>
              <Button type="submit" className="capitalize px-6">{t("common.download")}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

