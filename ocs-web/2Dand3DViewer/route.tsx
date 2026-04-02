import { useCallback, useEffect, useRef, useState } from "react";
import SearchBar from "~/components/SearchBar";
import {useLocation, useNavigate, useOutletContext} from "react-router-dom";
import Button from "~/components/Button";
import Download from "~/assets/svg/common/download.svg?react";
import LoaderLoocation from "~/components/loaders/LoaderVane";
import X from "~/assets/svg/common/x.svg?react"
import {toast} from "sonner";
import {useTranslation} from "react-i18next";
import Modal from "~/components/Modal";
import SvgComponent from "~/components/SvgComponent";
import { useLoaderData, useNavigation } from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import { LoaderFunction } from "@remix-run/node";
import { getCatenaryType } from "~/db/config/actions.server";
import Location from "~/components/locations/viewer";
import LocationCard from "./LocationCard";
import ButtonOptions from "~/components/locations/ButtonOptions";
import {getAllLocations} from "~/db/location/actions.server";
import {computeParam} from "~/utils/locations";

export const loader: LoaderFunction = async ({ request,params }) => {

  const catenaryType =  await getCatenaryType(request,Number(params.projectId));

  const locationOptions = await getAllLocations(request, Number(params.projectId))

  return Response.json({catenaryType, locationOptions});
};

export default function LocationsPage(){

  const { catenaryType, locationOptions } = useLoaderData<{ catenaryType:string, locationOptions:{ location_id:number, external_id:string }[]  }>();

  const context = useOutletContext<{selectedProject:ProjectParams}>();

  const navigate = useNavigate();
  const locationState = useLocation();
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
    navigate(`/projects/${context.selectedProject.id}/locations?${params.toString()}`,{ replace: true });
    fetchLocations(page,value,type);
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
    fetchLocations(currentPage);
    hideLoader();
  }, []);

  const fetchLocations = async (pageInput:number, value?:string, type?:string) => {
    const page = pageInput.toString();
    const size = "5";
    const projectId = context.selectedProject.id?.toString() || '';

    try {
      const queryParams = new URLSearchParams({ page, size, projectId });
      if(value && type){
        queryParams.set(type, value);
      }
      const response = await fetch(`/api/locations?${queryParams.toString()}`);
      if (response.ok) {
        const locationsData = await response.json();
        setLocations(locationsData.locations || []);
        setCurrentPage(locationsData.currentPage || 1);
        setLastPage(locationsData.lastPage || 1);
      } else {
        console.error("Failed to fetch locations");
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };


  const [locations, setLocations] = useState<LocationParams[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [selectedLocation, setSelectedLocation] = useState<{ data:LocationParams | null  }>({data: null });

  const handleDeleteLocation = async (locationId:number) => {
    showLoader();
    // Send DELETE request to remove the pole
    try {
      const response = await fetch(`/api/location?id=${locationId}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "DELETE",
      });

      if (response.ok) {
        handleNavigate(currentPage);
        toast.success(t('location.delete.success', { id: locationId }));
      } else {
        toast.success(t('location.delete.error', { id: locationId }));
        console.error("Failed to delete location:", response.statusText);
      }
    } catch (error) {
      toast.success(t('location.delete.failed', { error: error }));
      console.error("Error deleting location:", error);
    }
    hideLoader();
  };

  const handleSearchLocations = (value:string, filter:string) => {
    if(value){
      handleNavigate(1,value,filter);
    }else{
      handleNavigate(1);
    }
  } 

  const [openModalDetail,setOpenModalDetail] = useState<boolean>(false);

  const toggleOpenDetail = () => {
    setOpenModalDetail(!openModalDetail);
  }

  const handleSelectLocation = (locationId:number) => {
    const searchedLocation = locations.find(location => location.id == locationId); 
    if(searchedLocation){
      setSelectedLocation(
        { data: searchedLocation}
      )
    }
    toggleOpenDetail();
  };

  const [openAddModal,setOpenAddModal] = useState<boolean>(false);

  const handleToggleAddLocationModal = () => {
    setOpenAddModal(!openAddModal);
  }

  const handleAddLocation = async () => {
    const form = document.getElementById('new-location-form') as HTMLFormElement;
    if(!form){
      return;
    }

    const newLocation = {
      external_id: form.external_id.value,
      project_id: Number(context.selectedProject.id),
      project: context.selectedProject.name,
      vias: [],
      poles: [],
      vanes: [],
      cantilevers: [],
    };

    showLoader();
    // Send POST request to create a new pole
    try {
      const response = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newLocation),
      });

      if (response.ok) {
        const createdLocation = await response.json();
        handleNavigate(currentPage);
        setOpenAddModal(false);
        toast.success(t('location.create.success', { id: createdLocation.id }));
      } else {

        toast.success(t('location.create.error'));
        console.error("Failed to add location:", response.statusText);
      }
    } catch (error) {
      toast.success(t('pole.create. ',{ error: error }));
      console.error("Error adding pole:", error);
    }

    hideLoader();
  };

  const handleClickLocation = useCallback((locationId: number) => {
    const location = locations.find(ctlv => ctlv.id == locationId)
    if(!location){
      toast.error(t("locations.not_found"))
    }
    navigate(`/projects/${context.selectedProject.id}/locations/${locationId}`, {
      state: { from: `${ locationState.pathname}${locationState.search}` },
    });
  },[locations]);


  const [openDownloadModal,setOpenDownloadModal] = useState<boolean>(false);

  const handleToggleDownloadLocationModal = () => {
    setOpenDownloadModal(!openDownloadModal)
  }

  const fetchFormDataAndDownload = async(e:React.FormEvent<HTMLFormElement>) => {
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
    await handleDownloadLocation(type, value);

    setOpenDownloadModal(!openDownloadModal);
  };

  const [downloadLocationsIds, setDownloadLocationsIds] = useState<{ location_id:number, external_id:string}[]>([]);
  const [downloadCriteria, setDownloadCriteria] = useState<"project" | "locations">("project");



  const handleDownloadLocation = async (isTriggerFromCard:boolean) => {

    showLoader();

    let code = 7;
    let revision = "01";

    if(!isTriggerFromCard){

      const form = document.getElementById('download-location-form');

      const cantInput  = form.querySelector<HTMLInputElement>('input[name="cantilevers"]');
      const vanesInput = form.querySelector<HTMLInputElement>('input[name="vanes"]');
      const stressInput= form.querySelector<HTMLInputElement>('input[name="stress"]');

      const cantChecked   = cantInput?.checked   ?? false;
      const vanesChecked  = vanesInput?.checked  ?? false;
      const stressChecked = stressInput?.checked ?? false;

      code = computeParam(cantChecked, vanesChecked, stressChecked);

      if (code == 0) {
        toast.error(t("location.validations.fill_download_fields"));
        return;
      }
      
      revision = form.querySelector<HTMLInputElement>('input[name="revision"]')?.value || "01";
    }


    const projectId = context.selectedProject.id?.toString();

    let queryString = `projectId=${projectId}`;

    queryString+=`&type_report=${code}`;
    queryString+=`&revision=${revision}`;

    if (downloadCriteria === "locations") {

      if(downloadLocationsIds.length == 0){
        toast.error(t("location.validations.select_one_location"));
        hideLoader();
        return;
      };

      queryString += "&type=id&";

      const locationIds = downloadLocationsIds.map((loc) => loc.location_id);

      queryString += locationIds.map(id => `value=${id}`).join('&')

    }

    try {

      //const encodedValue = encodeURIComponent(value);
      const response = await fetch(`/api/location/download?${queryString}`, {
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
        if(downloadCriteria=="locations"){
          link.download = `locations_results.pdf`;
        }else{
          link.download = `project_results.pdf`;
        }
        document.body.appendChild(link);
        link.click();
        
        // Clean up by revoking the blob URL and removing the <a> element
        link.remove();
        window.URL.revokeObjectURL(url);
        // Update the state to remove the deleted pole
        toast.success(t('location.report.success'));
        setDownloadLocationsIds([]);
      } else {
        toast.success(t('location.report.error'));
        console.error("Failed to download location:", response.statusText);
      }
    } catch (error) {
      toast.success(t('location.report.failed', { error: error }));
      console.error("Error download location:", error);
    }
    hideLoader();
  }

  //Graphical Options
  const containerRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<Location | null>(null);
  const [options,_] = useState<LocationViewerOptions>({ camera: 'orthographic', selection: { pole: false, vane: false, via: false, cantilever:false }, pan: false, snap_grid: true, snap_object: true, move_object: false, draw: { pole:false, vane:false, via:false, cantilever:false}, type: '2D' });

  useEffect(() => {
    // Initialize Cantilever only once
    if (!locationRef.current && containerRef.current) {
      containerRef.current.innerHTML = "";
      locationRef.current = new Location(1,selectedLocation.data, options, containerRef.current);
    }

    // Cleanup on unmount
    return () => {
      if (locationRef.current) {
        locationRef.current.dispose(); // Assuming Cantilever has a dispose or cleanup method
        locationRef.current = null;
      }
    };
  }, [selectedLocation]);

  useEffect(() => {
    if(locationRef.current){
      locationRef.current.updateOptionsData(options);
    }
  }, [options]);

  const handleDownloadLocationCard = (loc:{location_id:number, external_id:string}) => {
    setDownloadCriteria("locations");
    setDownloadLocationsIds([loc]);
    handleDownloadLocation(true);
  };
  

  return(
    <>
        <div className="h-full w-full flex flex-col justify-start items-start xl:grid xl:grid-cols-2 xl:grid-rows-4 gap-4">
        <div className="overflow-y-scroll w-full h-full xl:col-span-2 xl:row-span-2 border-2 border-gray-light rounded-xl flex flex-col justify-start items-start p-4 gap-y-4 shadow-sm">
          <div className="w-full h-auto flex flex-row justify-between items-center gap-x-4">
            <div className="w-auto inline-flex gap-x-4">
              <h4 className="font-bold text-body capitalize">{t("location.plural")}</h4>
              <span className="bg-body text-white rounded-full h-8 w-8 font-bold flex items-center justify-center">
                {locations.length}
              </span>
            </div>
            <span onClick={handleToggleDownloadLocationModal} className="h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white cursor-pointer">
                <Download className="h-full w-full"/>
            </span>
          </div>
          <SearchBar 
            input_placeholder={t("location.search_bar.search_placeholder")} 
            onSearch={handleSearchLocations}
            filters={[{ value:"external_id", label:"location.search_bar.options.id" }]}
            btnLabel={t("location.search_bar.btn_label")} 
            btnAction={handleToggleAddLocationModal}
          />
          <div className="flex-1 w-full gap-y-4 flex flex-col overflow-y-auto pe-2">
            {locations.map((location,index)=>{
              return(
                <LocationCard 
                  key={index} 
                  location={location} 
                  index={index} 
                  onHandler={handleSelectLocation}
                  openHandler={handleClickLocation}
                  onDelete={handleDeleteLocation}
                  onDownload={handleDownloadLocationCard}
                />
              )
            })}
            {locations.length === 0 && (
              <div className="w-full h-full flex flex-col justify-center items-center text-primary">
                <SvgComponent icon="location" className="w-12 h-12"/>
                <p className="text-body text-lg font-bold">{t("location.empty_content")}</p>
              </div>
            )}
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
          <div className={`max-xl:fixed max-xl:bottom-0 ${openModalDetail ? "max-xl:right-0": "max-sm:-w-[100%] max-xl:-bottom-[600px]"}  relative overflow-hidden shadow-sm bg-transparent max-sm:w-full max-xl:h-[600px] h-full w-full xl:flex xl:row-span-2 xl:col-span-2 border-2 border-gray-light rounded-s-xl xl:rounded-xl flex-col justify-start items-start shadow-sm z-[100] transition-all duration-300`}>

            {selectedLocation.data ? 
              <>
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
                <div id="location-viewer" ref={containerRef} className="h-full w-full bg-white rounded-xl z-[80]">
                </div>
              </>
          :
            <div className="w-full h-full flex flex-col justify-center items-center text-primary">
              <SvgComponent icon="location" className="w-12 h-12"/>
              <p className="text-body text-lg font-bold">{t("location.selector.empty")}</p>
            </div>
          }
          </div>
        </div>

        <Modal key={`modal-add-location`} isOpen={openAddModal} onClose={handleToggleAddLocationModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-24 h-24 p-6 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="location"/>
          </div>
          <form id="new-location-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("location.fields.external_id")}</label>
              <input
                type="text"
                name="external_id"
                className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
              />
            </div>
          </form>
          <div className="w-full h-auto gap-x-4 flex items-center justify-around lg:justify-center mt-4">
            <Button onClick={handleToggleAddLocationModal} type="button" className="capitalize px-6">{t("common.cancel")}</Button>
            <Button onClick={handleAddLocation} className="capitalize px-6">{t("common.create")}</Button>
          </div>
        </div>
      </Modal>
      <Modal key={`modal-download-locations`} isOpen={openDownloadModal} onClose={handleToggleDownloadLocationModal}>
        <div  className="w-full h-auto flex flex-col items-center justify-center text-secondary p-12 lg:p-4 gap-y-4">
          <div className="w-12 h-12 p-2 flex justify-center items-center active:scale-95 duration-300 text-body">
            <SvgComponent icon="pole"/>
          </div>
          <form id="download-location-form" className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
            <div className="col-span-2 flex flex-col justify-start items-start gap-y-2">
              <label className="font-bold text-primary capitalize">{t("location.fields.criteria")}</label>
              <select 
                name="download_criteria" 
                className="capitalize border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary" 
                value={downloadCriteria}
                onChange={e => setDownloadCriteria(e.target.value as "project" | "locations")}
              >
                <option value="project">{t("location.fields.project")}</option>
                <option value="locations">{t("location.fields.locations")}</option>
              </select>
            </div>
            {downloadCriteria === "locations" && (
              <div className="col-span-2 flex flex-col justify-start items-start gap-y-2 animation-element slide-in-up">
                <MarkSelectorOptions
                  t={t}
                  locationOptions={locationOptions}
                  downloadLocationsIds={downloadLocationsIds}
                  setDownloadLocationsIds={setDownloadLocationsIds}
                />;
              </div>
            )}
            <div className="col-span-2 gap-x-4 flex items-center justify-around lg:justify-center mt-4">
              <Button type="button" onClick={handleToggleDownloadLocationModal} className="capitalize px-6">{t("common.cancel")}</Button>
              <Button type="button" onClick={()=>handleDownloadLocation(false)} className="capitalize px-6">{t("common.download")}</Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}


interface MarkSelectorOptionsProps {
  t:any,
  locationOptions: {
    location_id: number;
    external_id: string;
  }[];
  downloadLocationsIds: LocationOption[];
  setDownloadLocationsIds: React.Dispatch<React.SetStateAction<{ location_id: number; external_id: string; }[]>>;
}

export const MarkSelectorOptions: React.FC<MarkSelectorOptionsProps> = ({
  t,
  locationOptions,
  downloadLocationsIds,
  setDownloadLocationsIds,
}) => {

  const [selectedId, setSelectedId] = useState<number | null>(locationOptions?.[0]?.location_id ?? null);

  const toggleLocation = (option: {location_id: number; external_id: string;}) => {
    setDownloadLocationsIds(prev => {
      const exists = prev.some(item => item.location_id === option.location_id);
      return exists
        ? prev.filter(item => item.location_id !== option.location_id)
        : [...prev, option];
    });
  };

  const handleAdd = () => {
    if (selectedId == null) return;
    const selectedOption = locationOptions.find(opt => opt.location_id === selectedId);
    if (selectedOption) {
      toggleLocation(selectedOption);
    }
  };

  return (
    <div className="space-y-4 w-full h-auto flex flex-col">
      <div className="flex gap-2 items-center mb-4">
        <select
          className="border-b-[2px] border-b-primary focus:outline-none focus:border-b-[3px] w-full px-2 py-2 text-primary"
          value={selectedId ?? ''}
          onChange={e => setSelectedId(Number(e.target.value))}
        >
          {locationOptions.map(option => (
            <option key={option.location_id} value={option.location_id}>
              {option.external_id}
            </option>
          ))}
        </select>
        <Button
          type="button"
          onClick={handleAdd}
        >
          {t("location.fields.add")}
        </Button>
      </div>
      <label className="font-bold text-primary capitalize text-sm">{t("location.fields.selected_locations")}</label>
      {downloadLocationsIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {downloadLocationsIds.map(option => (
            <span
              key={option.location_id}
              className="bg-primary-dark text-white rounded-full px-3 py-2 flex items-center gap-1 text-sm"
            >
              {option.external_id}
              <button
                onClick={() => toggleLocation(option)}
                className="ml-1 bg-white rounded-full text-primary-dark hover:bg-red-500 hover:text-white active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {downloadLocationsIds.length == 0 && (
        <label className="col-span-1 lg:col-span-2 font-bold text-xs text-gray-light capitalize">{t("location.download.empty_locations_selected")}</label>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full h-auto">
        <label className="col-span-1 lg:col-span-2 font-bold text-sm text-primary capitalize">{t("location.download.message")}</label>
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
      </div>
    </div>
  );
};
