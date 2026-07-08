import { useCallback, useEffect, useRef, useState } from "react";
import PlusIcon from "~/assets/svg/common/plus.svg?react";
import Pole from "~/components/poles/viewer/index";
import PoleCard from "./PoleCard";
import SearchBar from "~/components/SearchBar";
import {useLocation, useNavigate} from "react-router-dom";
import Button from "~/components/Button";
import Download from "~/assets/svg/common/download.svg?react";
import LoaderPole from "~/components/loaders/LoaderVane";
import X from "~/assets/svg/common/x.svg?react"
import {toast} from "sonner";
import {useTranslation} from "react-i18next";
import Modal from "~/components/Modal";
import SvgComponent from "~/components/SvgComponent";
import { useLoaderData, useNavigation } from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import {CantileverSelector} from "~/components/cantilevers/CantileverSelector";
import { LoaderFunction } from "@remix-run/node";
import { getCatenaryType } from "~/db/config/actions.server";
import {getDefaultsPoles, getPolesOptions} from "~/db/pole/data";
import {PoleTypeSelector} from "~/components/poles/PoleSelector";
import {  useOutletContext } from "@remix-run/react";
import {getAllLocations} from "~/db/location/actions.server";

export const loader: LoaderFunction = async ({ request, params }) => {

  const {projectId} = params;

  const catenaryType =  await getCatenaryType(request,Number(projectId));

  const locations = await getAllLocations(request, Number(projectId))

  return Response.json({catenaryType, locations});
};

export default function PolesPage(){

  const context = useOutletContext<{selectedProject:ProjectParams}>();

  const { catenaryType, locations } = useLoaderData<{ catenaryType:string, locations: { location_id:number, external_id:string }[] }>();

  const [currentLocation,setCurrentLocation] = useState<{location_id:number, external_id:string}>({location_id:0, external_id:""});

  const navigate = useNavigate();
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
    }

    setCurrentPage(page);
    navigate(`/projects/${context.selectedProject.id}/poles?${params.toString()}`,{ replace: true });
    fetchPoles(page,value,type);
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
    fetchPoles(currentPage);
    hideLoader();
  }, []);

  const fetchPoles = async (pageInput:number, value?:string, type?:string) => {
    const page = pageInput.toString();
    const size = "5";
    const projectId = context.selectedProject.id?.toString() || '';

    try {
      const queryParams = new URLSearchParams({ page, size, projectId });
      if(value && type){
        queryParams.set(type, value);
      }
      const response = await fetch(`/api/poles?${queryParams.toString()}`);
      if (response.ok) {
        const polesData = await response.json();
        setPoles(polesData.poles || []);
        setCurrentPage(polesData.currentPage || 1);
        setLastPage(polesData.lastPage || 1);
      } else {
        console.error("Failed to fetch poles");
      }
    } catch (error) {
      console.error("Error fetching poles:", error);
    }
  };


  const [poles, setPoles] = useState<PoleDataContent[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const [selectedPole, setSelectedPole] = useState<{ data:PoleDataContent | null  }>({data: null });

  const containerRef = useRef<HTMLDivElement>(null);
  const poleRef = useRef<Pole | null>(null);

  useEffect(() => {
    // Update the Cantilever instance when cantileverData or options change
    if(containerRef.current && !poleRef.current && selectedPole.data){

      let initialLabels:any[] = [] 
      initialLabels = selectedPole.data.pole.cantilevers.map((item: any) => ({
        id: item.id, // Extract `external_id` for the `name`
        type:'cantilever',
        state: false, // Default state to `false`
      }));

      initialLabels.push({id:selectedPole.data.pole.id, type:'pole', state:false});

      containerRef.current.innerHTML = "";
      poleRef.current = new Pole(selectedPole.data, { type:'preview',  labels:initialLabels }, containerRef.current);
      poleRef.current.addEventListeners();

    }

    // Cleanup on unmount
    return () => {
      if (poleRef.current) {
        poleRef.current.dispose(); // Assuming Cantilever has a dispose or cleanup method
        poleRef.current = null;
      }
    };

  }, [selectedPole.data]);

  const [openModalDetail,setOpenModalDetail] = useState<boolean>(false);

  const toggleOpenDetail = () => {
    setOpenModalDetail(!openModalDetail);
  }

  const handleSelectPole = (poleId:number) => {
    const searchedPole = poles.find(pole => pole.pole.id == poleId); 
    if(searchedPole){
      setSelectedPole(
        { data: searchedPole}
      )
    }
    toggleOpenDetail();
  };


  const handleDeletePole = async (poleId:number) => {
    showLoader();
    // Send DELETE request to remove the pole
    try {
      const response = await fetch(`/api/pole?id=${poleId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        handleNavigate(currentPage);
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

  const [openDownloadModal,setOpenDownloadModal] = useState<boolean>(false);

  const handleToggleDownloadPoleModal = () => {
    setOpenDownloadModal(!openDownloadModal)
  }

  const fetchFormDataAndDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); // Prevent form default behavior

    // Fetch form data
    const form = e.currentTarget;
    const type = form.download_criteria.value; // Get the selected criteria
    const value = form.download_value.value; // Get the entered value

    if (!type || !value) {
      toast.error(t("pole.validations.fill_download_fields"));
      return;
    }
    // Call the handleDownloadPole function
    showLoader();
    await handleDownloadPole(type, value);
    hideLoader();

    setOpenDownloadModal(!openDownloadModal);
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

  const handleSearchPoles = (value:string, filter:string) => {
    if(value){
      handleNavigate(1,value,filter);
    }else{
      handleNavigate(1);
    }
  } 

  const [openAddModal,setOpenAddModal] = useState<boolean>(false);

  const handleToggleAddPoleModal = () => {
    setOpenAddModal(!openAddModal)
  }

  const [selPole,setSelPole] =  useState<PolePropertiesParams>(getDefaultsPoles(catenaryType)[0] as PolePropertiesParams);

  const handleChangeType = useCallback((model:PoleModelInterface) => {

    const selectedPoleType = getDefaultsPoles(catenaryType).find((item)=> item.model.name === model.name);

    if (!selectedPoleType || !selPole) {
      return;
    }

    setSelPole(selectedPoleType)
    return;
  },[selPole]);


  const handleAddPole = async () => {
    const form = document.getElementById('new-pole-form') as HTMLFormElement;
    if(!form){
      return;
    }

    if(cantilevers.some((item) => item.currentOption == null)){
      toast.error('some cantilevers has not been selected');
      return;
    }

    if(currentLocation.location_id == 0){
      toast.error("Location must be selected.");
      return;
    }

    const newPole = {
      external_id: form.external_id.value,
      location_id: Number(currentLocation.location_id),
      location: currentLocation.external_id,
      project_id: Number(context.selectedProject.id),
      project: context.selectedProject.name,
      params:selPole,
      cantilevers: cantilevers.map(item => ({ 
        id: item.currentOption!.id, 
        external_id: item.currentOption!.external_id 
      }))
    };

    showLoader();
    // Send POST request to create a new pole
    try {
      const response = await fetch("/api/pole", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPole),
      });

      if (response.ok) {
        const createdPole = await response.json();
        handleNavigate(currentPage);
        setOpenAddModal(false);
        toast.success(t('pole.create.success', { id: createdPole.id }));
      } else {

        toast.success(t('pole.create.error'));
        console.error("Failed to add pole:", response.statusText);
      }
    } catch (error) {
      toast.success(t('pole.create.failed',{ error: error }));
      console.error("Error adding pole:", error);
    }

    hideLoader();
  };


  const handleClickPole = useCallback((poleId: number) => {
    const pole = poles.find(ctlv => ctlv.pole.id == poleId)
    if(!pole){
      toast.error(t("poles.not_found"))
    }
    navigate(`/projects/${context.selectedProject.id}/poles/${poleId}`, {
      state: { from: `${location.pathname}${location.search}` },
    });
  },[poles]);


  //const [cantilevers,setCantilevers] = useState<{ options:CantileverParams[], currentOption:CantileverParams, currentPage:number, lastPage:number }[]>([]);

  const [cantilevers,setCantilevers] = useState<{location:string,via:string, currentOption:CantileverParams|null }[]>([]);

  const handleAddCantilevers = async () => {


    if (currentLocation.location_id > 0) {

      setCantilevers((prevCantilevers)=> [...prevCantilevers, { location: currentLocation.location_id.toString(), currentOption:null } ])

    } else {
      toast.error("Location must be selected.");
    }
  };

  const updateCurrentOption = (cantileverIndex: number, newOption: CantileverParams) => {
    setCantilevers((prevCantilevers) => 
      prevCantilevers.map((cantilever, index) => 
        index === cantileverIndex 
          ? { ...cantilever, currentOption: newOption }
          : cantilever
      )
    );
  };

  const removeCantilever = (cantileverIndex: number) => {
    setCantilevers((prevCantilevers) => 
      prevCantilevers.filter((_, index) => index !== cantileverIndex)
    );
  };


  return(
    <>
        <div className="h-full w-full flex flex-col justify-start items-start xl:grid xl:grid-cols-3 gap-4">
          <div className="h-full overflow-y-scroll w-full h-full xl:col-span-2 xl:row-span-1 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start p-4 gap-y-4 shadow-sm">

            <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
              <div className="w-auto inline-flex gap-x-4">
                <h4 className="font-bold text-body capitalize">{t("pole.plural")}</h4>
                <span className="bg-body text-white rounded-full h-8 w-8 font-bold flex items-center justify-center">
                  {poles.length}
                </span>
              </div>
              <span onClick={handleToggleDownloadPoleModal} className="h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white cursor-pointer">
                <Download className="h-full w-full"/>
              </span>
            </div>
            <SearchBar 
              input_placeholder={t("pole.search_bar.search_placeholder")} 
              onSearch={handleSearchPoles}
              filters={[{ value:"external_id", label:"pole.search_bar.options.id" }, {value:"via",label:"pole.search_bar.options.via"}, { value:"location", label:"pole.search_bar.options.location"}]}
              btnLabel={t("pole.search_bar.btn_label")} 
              btnAction={handleToggleAddPoleModal}
            />
            <div className="flex-1 w-full gap-y-4 flex flex-col overflow-y-auto pe-2">
              {poles.map((pole,index)=>{
                return(
                  <PoleCard 
                    key={index} 
                    pole={pole.pole} 
                    index={index} 
                    onHandler={handleSelectPole}
                    openHandler={handleClickPole}
                    onDelete={handleDeletePole}
                    onDownload={handleDownloadPole}
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
            {selectedPole.data == null ?
              <div className="w-full h-full flex flex-col justify-center items-center text-primary">
                <LoaderPole noLabel={true} className="h-56 w-56"/>
                <p className="text-center text-body w-full px-24">{t("pole.empty_content")}</p>
              </div>
            :
            <>
              <span className="w-full inline-flex justify-end">
                <button onClick={toggleOpenDetail} className="xl:hidden bg-white text-primary hover:bg-primary hover:text-white duration-300 active:scale-95 rounded-xl ml-auto mr-4 p-1 border border-gray-light">
                  <X className="w-8 h-8"/>
                </button>
              </span>
              <h5 className="font-bold text-secondary-dark capitalize">{`${t("pole.name")} ${selectedPole.data.pole.external_id}`}</h5>
              <div id="pole-viewer" ref={containerRef} className="h-full w-full bg-gray-light rounded-xl">
              </div>
              {/*
              <div className="w-full h-auto flex flex-row justify-end mt-4">
                <Button onClick={()=>handleClickPole(selectedPole.data.id)} rightIcon={<Eye/>} className="h-full font-bold text-nowrap cursor-pointer">{"See Details"}</Button>
              </div>
              */}
            </>
            }
          </div>
        </div>
      <Modal key={`modal-add-pole`} isOpen={openAddModal} onClose={handleToggleAddPoleModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-24 h-24 p-6 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="pole"/>
          </div>
          <form id="new-pole-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">

            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("pole.fields.location")}</label>
              <select name="location" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary" 
                onChange={(e) => {
                  const selectedLocation = locations.find(loc => loc.location_id === Number(e.currentTarget.value)) 
                    || { location_id: 0, external_id: "" };

                  setCurrentLocation(selectedLocation); // ✅ Guarantees a re-render
                }}>
                <option value={0}>{t("pole.fields.no_location")}</option>
                {locations.map((location,index)=>{
                  return(
                    <option key={`location_${index}`} value={location.location_id}>{location.external_id}</option>
                  )
                })}
              </select>
            </div>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("pole.fields.external_id")}</label>
              <input
                type="text"
                name="external_id"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              <PoleTypeSelector currentOption={{model:selPole.model}} options={getPolesOptions(catenaryType)} onChangeType={handleChangeType}/>
            </div>
            <div className="col-span-2 flex flex-row justify-end">
              <Button onClick={handleAddCantilevers} type="button" rightIcon={<PlusIcon className="w-4 h-4"/>} className="h-full font-bold text-nowrap">{t("cantilever.search_bar.btn_label")}</Button>
            </div>
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              {cantilevers.map((item,index)=>{
                return(
                  <CantileverSelector
                    key={`cantilever_new_${index}`}
                    index={index}
                    projectId={context.selectedProject.id || 0}
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
            <Button onClick={handleToggleAddPoleModal} type="button" className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={handleAddPole} className="capitalize px-6">{t("common.create")}</Button>
          </div>
        </div>
      </Modal>

      <Modal key={`modal-download-poles`} isOpen={openDownloadModal} onClose={handleToggleDownloadPoleModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-16 h-16 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="pole"/>
          </div>
          <form id="download-pole-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto" onSubmit={fetchFormDataAndDownload}>
            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("pole.fields.criteria")}</label>
              <select name="download_criteria" className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary capitalize">
                <option value="external_id">{t("pole.fields.pole")}</option>
                <option value="via">{t("pole.fields.via")}</option>
                <option value="location">{t("pole.fields.location")}</option>
              </select>
            </div>

            <div className="col-span-1 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("pole.fields.value")}</label>
              <input
                type="text"
                name="download_value"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
            <div className="col-span-2 gap-x-4 flex items-center justify-around lg:justify-center mt-4">
              <Button type="button" onClick={handleToggleDownloadPoleModal} className="capitalize px-6">{t("common.cancel")}</Button>
              <Button type="submit" className="capitalize px-6">{t("common.download")}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
