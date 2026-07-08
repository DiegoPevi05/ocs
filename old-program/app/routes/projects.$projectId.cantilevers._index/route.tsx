import { useCallback, useEffect, useRef, useState } from "react";
import CantileverCard from "./CantileverCard";
import SearchBar from "~/components/SearchBar";
import {useLocation, useNavigate} from "react-router-dom";
import Button from "~/components/Button";
import Download from "~/assets/svg/common/download.svg?react";
import LoaderCantilever from "~/components/loaders/LoaderCantilever";
import X from "~/assets/svg/common/x.svg?react"
import {toast} from "sonner";
import {useTranslation} from "react-i18next";
import Modal from "~/components/Modal";
import SvgComponent from "~/components/SvgComponent";
import { useLoaderData, useNavigation } from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import {CantileverTypeSelector} from "~/components/cantilevers/CantileverSelector";
import { getCantileversOptions, getDefaultsCantilevers, DefaultsBrazilianCantileverAditionals } from "~/db/cantilever/data";
import {getDefaultsPoles, getPolesOptions} from "~/db/pole/data";
import {PoleTypeSelector} from "~/components/poles/PoleSelector";
import {LoaderFunction} from "@remix-run/node";
import { getCatenaryType } from "~/db/config/actions.server";
import Cantilever from "~/components/cantilevers/viewer";
import {  useOutletContext } from "@remix-run/react";
import {getAllLocations} from "~/db/location/actions.server";

export const loader: LoaderFunction = async ({ request,params }) => {
  const {projectId} = params;

  const catenaryType =  await getCatenaryType(request,Number(projectId));

  const locations = await getAllLocations(request, Number(projectId))

  return Response.json({catenaryType, locations});
};

export default function CantileversPage(){
  const context = useOutletContext<{selectedProject:ProjectParams}>();

  const navigate = useNavigate();

  const { catenaryType, locations } = useLoaderData<{ catenaryType:string, locations: { location_id:number, external_id:string }[] }>();

  const [currentLocation,setCurrentLocation] = useState<{location_id:number, external_id:string}>({location_id:0, external_id:""});
  const [currentPoleOptions,setCurrentPoleOptions] = useState<{id:number, external_id:string}[]>([{id:0, external_id:"No Selection"}]);

  const location = useLocation();
  const {t,i18n} = useTranslation();
  const { showLoader, hideLoader } = useLoader();


  const navigation = useNavigation();

  const handleNavigate = (page:number,value?:string,type?:string) => {
    const params = new URLSearchParams();
    params.set("page", page.toString());

    if(value && type){
      const encodedValue = encodeURIComponent(value);
      params.set(type, encodedValue);
    }else{

      const filters = [
        "external_id",
        "via",
        "location",
        "pole",
      ];

      filters.forEach((key) => {
        if (params.has(key)) {
          params.delete(key);
        }
      });

    }

    setCurrentPage(page);
    navigate(`/projects/${context.selectedProject.id}/cantilevers?${params.toString()}`,{ replace: true });
    fetchCantilevers(page,value,type );
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
    fetchCantilevers(currentPage);
    hideLoader();
  }, []);

  const fetchCantilevers = async (pageInput:number, value?:string, type?:string) => {

    const page = pageInput.toString();
    const size = "5";
    const projectId = context.selectedProject.id?.toString() || '';

    try {
      const queryParams = new URLSearchParams({ page, size, projectId });
      // Add filters dynamically
      if(value && type){
        queryParams.set(type, value);
      };

      const response = await fetch(`/api/cantilevers?${queryParams.toString()}`);

      if (response.ok) {
        const cantileversData = await response.json();
        setCantilevers(cantileversData.cantilevers || []);
        setCurrentPage(cantileversData.currentPage || 1);
        setLastPage(cantileversData.lastPage || 1);
      } else {
        console.error("Failed to fetch cantilevers");
      }
    } catch (error) {
      console.error("Error fetching cantilevers:", error);
    }
  };


  const [cantilevers, setCantilevers] = useState<CantileverDataContent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [selectedCantilever, setSelectedCantilever] = useState<{ data:CantileverDataContent | null  }>({data: null });

  const containerRef = useRef<HTMLDivElement>(null);
  const cantileverRef = useRef<Cantilever | null>(null);

  useEffect(() => {
    if(containerRef.current && !cantileverRef.current){
      containerRef.current.innerHTML = "";
      cantileverRef.current = new Cantilever(selectedCantilever.data, { camera:"perspective", type:'preview', labels:false, ambient:false, measure:false }, containerRef.current);
      cantileverRef.current.addEventListeners();
    }

    // Cleanup on unmount
    return () => {
      if (cantileverRef.current) {
        cantileverRef.current.dispose(); // Assuming Cantilever has a dispose or cleanup method
        cantileverRef.current = null;
      }
    };

  }, [selectedCantilever.data]);




  const [openModalDetail,setOpenModalDetail] = useState<boolean>(false);

  const toggleOpenDetail = () => {
    setOpenModalDetail(!openModalDetail);
  }

  const handleSelectCantilever = (cantileverId:number) => {
    const searchedCantilever = cantilevers.find(cantilever => cantilever.cantilever.id == cantileverId); 
    if(searchedCantilever){
      setSelectedCantilever(
        { data: searchedCantilever}
      )
    }
    toggleOpenDetail();
  };

  const handleDeleteCantilever = async (cantileverId:number) => {
    showLoader();
    // Send DELETE request to remove the cantilever
    try {
      const response = await fetch(`/api/cantilever?id=${cantileverId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        handleNavigate(currentPage);
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

  const [openDownloadModal,setOpenDownloadModal] = useState<boolean>(false);

  const handleToggleDownloadCantileverModal = () => {
    setOpenDownloadModal(!openDownloadModal)
  }

  const fetchFormDataAndDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form default behavior

    // Fetch form data
    const form = e.currentTarget;
    const type = form.download_criteria.value; // Get the selected criteria
    const value = form.download_value.value; // Get the entered value

    if (!type || !value) {
      toast.error(t("cantilever.validations.fill_download_fields"));
      return;
    }
    // Call the handleDownloadCantilever function
    await handleDownloadCantilever(type, value);

    setOpenDownloadModal(!openDownloadModal);
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

  const handleSearchCantilevers = (value:string, filter:string) => {
    if(value){
      handleNavigate(1,value,filter);
    }else{
      handleNavigate(1);
    }
  } 

  const [openAddModal,setOpenAddModal] = useState<boolean>(false);

  const handleToggleAddCantileverModal = () => {
    setOpenAddModal(!openAddModal)
  }

  useEffect(() => {
    fetchPolesOptions();
  }, [currentLocation]);

  const fetchPolesOptions = async() => {

    const projectId = context.selectedProject.id?.toString() || '';

    try {
      const queryParams = new URLSearchParams({ locationId:currentLocation.location_id, projectId:projectId });

      const response = await fetch(`/api/poles/list?${queryParams.toString()}`);

      if (response.ok) {
        const cantileversData = await response.json();
        setCurrentPoleOptions(cantileversData);
      } else {

        console.error("Failed to fetch poles options");

      }
    } catch (error) {
      console.error("Error fetching poles options:", error);
    }

  }

  const handleAddCantilever = async () => {
    const form = document.getElementById('new-cantilever-form') as HTMLFormElement;

    let reinforcement = null;

    if(catenaryType == "BR"){
      reinforcement = form.add_reinforcement.checked ? DefaultsBrazilianCantileverAditionals[0].reinforcement : null; 
    }

    if(currentLocation.location_id == 0){
      toast.error("Location must be selected.");
      return;
    }
      

    if(!form){
      return;
    }
    const newCantilever = {
      external_id: form.external_id.value,
      location_id: Number(currentLocation.location_id),
      location: currentLocation.external_id,
      project_id: Number(context.selectedProject.id),
      project: context.selectedProject.name,
      pole_id: Number(form.pole.value),
      params: { ...selCantilever, poleModel: selPole.model, reinforcement }
    };

    showLoader();
    // Send POST request to create a new cantilever
    try {
      const response = await fetch("/api/cantilever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCantilever),
      });

      if (response.ok) {
        const createdCantilever = await response.json();
        handleNavigate(currentPage);
        setOpenAddModal(false);
        toast.success(t('cantilever.create.success', { id: createdCantilever.id }));
      } else {

        toast.success(t('cantilever.create.error'));
        console.error("Failed to add cantilever:", response.statusText);
      }
    } catch (error) {
      toast.success(t('cantilever.create.failed',{ error: error }));
      console.error("Error adding cantilever:", error);
    }

    hideLoader();
  };


  const handleClickCantilever = useCallback((cantileverId: number) => {
    const cantilever = cantilevers.find(ctlv => ctlv.cantilever.id == cantileverId)
    if(!cantilever){
      toast.error(t("cantilevers.not_found"))
    }
    navigate(`/projects/${context.selectedProject?.id?.toString()}/cantilevers/${cantileverId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  },[cantilevers]);

  const [selCantilever,setSelCantilever] =  useState<CantileverGermanParams | CantileverBrazilianParams>(getDefaultsCantilevers(catenaryType)[0].params as CantileverGermanParams | CantileverBrazilianParams);

  const handleChangeType = useCallback((model:ModelInterface) => {

    const selectedCantileverType = getDefaultsCantilevers(catenaryType).find((item)=> item.params?.model.type.configuration === model.type.configuration && item.params.model.type.contactWireConfiguration === model.type.contactWireConfiguration);

    if (!selectedCantileverType || !selectedCantileverType.params || !selCantilever) {
      return;
    }

    setSelCantilever({...selectedCantileverType.params})
    return;
  },[selCantilever]);



  const [selPole,setSelPole] =  useState<PolePropertiesParams>(getDefaultsPoles(catenaryType)[0] as PolePropertiesParams);

  const handleChangePoleType = useCallback((model:PoleModelInterface) => {

    const selectedPoleType = getDefaultsPoles(catenaryType).find((item)=> item.model.name === model.name);

    if (!selectedPoleType || !selPole) {
      return;
    }

    setSelPole(selectedPoleType)
    return;
  },[selPole]);


  return(
    <>
        <div className="h-full w-full flex flex-col justify-start items-start xl:grid xl:grid-cols-3 gap-4">
          <div className="h-full overflow-y-scroll w-full h-full xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start p-4 gap-y-4 shadow-sm">

            <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
              <div className="w-auto inline-flex gap-x-4">
                <h4 className="font-bold text-body capitalize">{t("cantilever.plural")}</h4>
                <span className="bg-body text-white rounded-full h-8 w-8 font-bold flex items-center justify-center">
                  {cantilevers.length}
                </span>
              </div>
              <span onClick={handleToggleDownloadCantileverModal} className="h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white cursor-pointer">
                <Download className="h-full w-full"/>
              </span>
            </div>
            <SearchBar 
              input_placeholder={t("cantilever.search_bar.search_placeholder")} 
              onSearch={handleSearchCantilevers}
              filters={[{ value:"external_id", label:"cantilever.search_bar.options.id" }, {value:"via",label:"cantilever.search_bar.options.via"}, { value:"location", label:"cantilever.search_bar.options.location"} , { value:"pole", label:"cantilever.search_bar.options.pole" }]}
              btnLabel={t("cantilever.search_bar.btn_label")} 
              btnAction={handleToggleAddCantileverModal}
            />
            <div className="flex-1 w-full gap-y-4 flex flex-col overflow-y-auto pe-2">
              {cantilevers.map((cantilever,index)=>{
                return(
                  <CantileverCard 
                    key={index} 
                    cantilever={cantilever.cantilever} 
                    index={index} 
                    onHandler={handleSelectCantilever}
                    openHandler={handleClickCantilever}
                    onDelete={handleDeleteCantilever}
                    onDownload={handleDownloadCantilever}
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
            {selectedCantilever.data == null ?
              <div className="w-full h-full flex flex-col justify-center items-center text-primary">
                <LoaderCantilever noLabel={true} className="h-56 w-56"/>
                <p className="text-center text-body w-full px-24">{t("cantilever.empty_content")}</p>
              </div>
            :
            <>
              <span className="w-full inline-flex justify-end">
                <button onClick={toggleOpenDetail} className="xl:hidden bg-white text-primary hover:bg-primary hover:text-white duration-300 active:scale-95 rounded-xl ml-auto mr-4 p-1 border border-gray-light">
                  <X className="w-8 h-8"/>
                </button>
              </span>
              <h5 className="font-bold text-secondary-dark capitalize">{`${t('cantilever.name')} ${selectedCantilever.data?.cantilever.external_id}`}</h5>
              <div id="cantilever-viewer" ref={containerRef} className="h-full w-full bg-white rounded-xl z-[80]">
            </div>
            </>
            }
          </div>
        </div>
      <Modal key={`modal-add-cantilever`} isOpen={openAddModal} onClose={handleToggleAddCantileverModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-2">
          <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="cantilever_gy_type_1"/>
          </div>
          <form id="new-cantilever-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("cantilever.fields.external_id")}</label>
              <input
                type="text"
                name="external_id"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("cantilever.fields.location")}</label>
              <select name="location" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary" 
                onChange={(e) => {
                  const selectedLocation = locations.find(loc => loc.location_id === Number(e.currentTarget.value)) 
                    || { location_id: 0, external_id: "" };

                  setCurrentLocation(selectedLocation); // ✅ Guarantees a re-render
                }}>
                <option value={0}>{t("cantilever.fields.no_location")}</option>
                {locations.map((location,index)=>{
                  return(
                    <option key={`location_${index}`} value={location.location_id}>{location.external_id}</option>
                  )
                })}
              </select>
            </div>

            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("cantilever.fields.pole")}</label>
              <select name="pole" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary">
                {currentPoleOptions.map((pole, index) => {
                  return (
                    <option key={`pole_option_${index}`} value={pole.id}>
                      {pole.external_id}
                    </option>
                  )
                })}
              </select>
            </div>

            {catenaryType == "BR" &&
              <div className="col-span-2 flex flex-row justify-around items-center py-2 mt-2 border-2 rounded-xl">
                <p className="text-md text-body font-bold">{t("cantilever.fields.add_reinforcement")}</p>
                <div className="checkbox-wrapper-2">
                  <input type="checkbox" className="sc-gJwTLC ikxBAC" id="add_reinforcement" name="add_reinforcement"/>
                </div>
              </div>
            }

            <div className="col-span-2 flex flex-col justify-start items-start gap-y-0 mt-2">
              <label className="font-bold text-secondary-dark px-4 capitalize">{t("pole.pole_type")}</label>
              <PoleTypeSelector currentOption={{model:selPole.model}} options={getPolesOptions(catenaryType)} onChangeType={handleChangePoleType}/>
            </div>
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-0">
              <label className="font-bold text-secondary-dark px-4 capitalize">{t("cantilever.cantilever_type")}</label>
              <CantileverTypeSelector currentOption={{model:selCantilever.model}} options={getCantileversOptions(catenaryType)} onChangeType={handleChangeType}/>
            </div>
          </form>
          <div className="w-full h-auto gap-x-4 flex items-center justify-around lg:justify-center mt-4">
            <Button onClick={handleToggleAddCantileverModal} className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={handleAddCantilever} className="capitalize px-6">{t("common.create")}</Button>
          </div>
        </div>
      </Modal>

      <Modal key={`modal-download-cantilevers`} isOpen={openDownloadModal} onClose={handleToggleDownloadCantileverModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-24 h-24 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="cantilever_gy_type_1"/>
          </div>
          <form id="download-cantilever-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto" onSubmit={fetchFormDataAndDownload}>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("cantilever.fields.criteria")}</label>
              <select name="download_criteria" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary capitalize">
                <option value="external_id">{t("cantilever.name")}</option>
                <option value="via">{t("cantilever.fields.via")}</option>
                <option value="location">{t("cantilever.fields.location")}</option>
                <option value="pole">{t("cantilever.fields.pole")}</option>
              </select>
            </div>

            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("cantilever.fields.value")}</label>
              <input
                type="text"
                name="download_value"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-2 gap-x-4 flex items-center justify-around lg:justify-center mt-4">
              <Button type="button" onClick={handleToggleDownloadCantileverModal} className="capitalize px-6">{t("common.cancel")}</Button>
              <Button type="submit" className="capitalize px-6">{t("common.download")}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}

