import { useCallback, useEffect, useState} from "react";
import {useTranslation} from "react-i18next";
import SvgComponent from "~/components/SvgComponent";
import X from "~/assets/svg/common/x.svg?react"
import ChevronRight from "~/assets/svg/common/chevron-right.svg?react"
import ChevronLeft from "~/assets/svg/common/chevron-left.svg?react"
import {InputForm} from "../Inputs";

interface PropsCantileverTypeSelector {
  options:{ id:number, model:ModelInterface }[];
  currentOption: { model:ModelInterface };
  onChangeType:(model:ModelInterface ) => void;
}

export function CantileverTypeSelector(props:PropsCantileverTypeSelector) {

  const {t} = useTranslation();
  const {options, currentOption, onChangeType} = props;

  const [showOptions,setShowOptions] = useState<boolean>(false);

  const toggleShow = () => {
    setShowOptions(!showOptions);
  }

  const handleSelectOption = (option:{ id:number, model:ModelInterface }) => {
    onChangeType(option.model);
    setShowOptions(false);
  }

  return(
    <div className="w-full h-auto relative my-4">
      <div onClick={toggleShow} className="w-[95%] h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto">
        <span className="h-full w-24">
          <SvgComponent icon={currentOption.model.icon ?? "cantilever_gy_type_1"}/>
        </span>
        <div className="w-full h-full flex flex-col items-end">
          <span className="h-auto w-auto flex flex-row gap-x-4">
            <p className="capitalize">{t("cantilever.fields.params.model.name")}:</p>
            <p className=" font-bold">{currentOption.model.name}</p>
          </span>
          <span className="h-auto w-auto flex flex-row gap-x-4">
            <p className="capitalize">{t("cantilever.fields.params.model.type.configuration")}:</p>
            <p className=" font-bold">{currentOption.model.type.configuration}</p>
          </span>
          <span className="h-auto w-auto flex flex-row gap-x-4">
            <p className="capitalize">{t("cantilever.fields.params.model.type.contact_wire_configuration")}:</p>
            <p className=" font-bold">{currentOption.model.type.contactWireConfiguration}</p>
          </span>
        </div>
      </div>
      {showOptions && 
        <div className="absolute top-[110%] w-[95%] left-[2.5%] max-h-[400px] h-auto py-4 shadow-sm rounded-xl border-2 border-gray-light bg-transparent flex flex-col gap-y-4 justify-start items-start overflow-y-scroll bg-white animation-element slide-in-up z-[40]">
          {options.map((option,index)=>{
            return(
              <div onClick={()=>handleSelectOption(option)} key={"key_option_cantilever_"+index} className="w-[95%] h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto">
                <span className="h-full w-24">
                  <SvgComponent icon={option.model.icon ?? "cantilever_gy_type_1"}/>
                </span>
                <div className="w-full h-full flex flex-col items-end">
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize">{t("cantilever.fields.params.model.name")}:</p>
                    <p className=" font-bold">{option.model.name}</p>
                  </span>
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize">{t("cantilever.fields.params.model.type.configuration")}:</p>
                    <p className=" font-bold">{option.model.type.configuration}</p>
                  </span>
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize">{t("cantilever.fields.params.model.type.contact_wire_configuration")}:</p>
                    <p className=" font-bold">{option.model.type.contactWireConfiguration}</p>
                  </span>
                </div>
              </div>
            )
          })}
        </div> 
      }
    </div>
  )
}

interface PropsCantileverSelector {
  index:number;
  projectId:number;
  location:string,
  via:string,
  currentOption: CantileverParams | null;
  onChangeType:(cantileverIndex: number, cantilever:CantileverParams ) => void;
  onDelete:(cantileverIndex: number)=>void;
}

export function CantileverSelector(props:PropsCantileverSelector) {

  const {t} = useTranslation();
  const {index,projectId, location, via, currentOption, onChangeType, onDelete} = props;

  const [showOptions,setShowOptions] = useState<boolean>(false);

  const toggleShow = () => {
    setShowOptions(!showOptions);
  }

  const handleSelectOption = useCallback((option:CantileverParams) => {
    onChangeType(index,option);
    setShowOptions(false);
  },[index]);

  const handleOnDelete = useCallback(() => {
    onDelete(index);
  },[index]);

  const [options,setOptions] = useState<{ cantilevers:CantileverParams[], searchedValue:string|null, currentPage:number, lastPage:number }>({cantilevers:[],searchedValue:null,currentPage:1, lastPage:1 });

  useEffect(() => {
    const fetchAndSetCantilevers = async () => {
      try {
        const dataCantilevers = await fetchCantilevers(location, via, '0', options.searchedValue, options.currentPage);
        setOptions({ ...dataCantilevers, searchedValue:options.searchedValue }); // Ensure the format matches the state
      } catch (error) {
        console.error("Error fetching cantilevers:", error);
      }
    };

    fetchAndSetCantilevers(); // Call the async function inside useEffect
  }, [options.currentPage, options.searchedValue]);

  const nextPageCantilevers = () => {
    setOptions(prev => {
      if (prev.currentPage < prev.lastPage) {
        return { ...prev, currentPage: prev.currentPage + 1 };
      }
      return prev; // No update if already at the last page
    });
  };

  const previousPageCantilevers = () => {
    setOptions(prev => {
      if (prev.currentPage > 1) {
        return { ...prev, currentPage: prev.currentPage - 1 };
      }
      return prev; // No update if already at the first page
    });
  };

  const updateSearchedValue = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;

    setOptions(prev => ({
      ...prev,
      searchedValue: newValue,
      currentPage: 1, // Reset to the first page when the search value changes
    }));
  };


  const fetchCantilevers = async (location: string, via: string, pole_id: string | null, external_id:string | null, page:number):Promise<{ cantilevers:CantileverParams[], currentPage:number, lastPage:number  }> => {
    const filters = {
      via_id: via,
      location_id: location,
      pole_id: pole_id,
      external_id:external_id
    };

    const size = 3;

    try {
      const queryParams = new URLSearchParams({ page:page.toString(), size: size.toString(), projectId:projectId.toString() });
      // Add filters dynamically
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          queryParams.append(key, value);
        }
      });

      const response = await fetch(`/api/cantilevers?${queryParams.toString()}`);

      if (response.ok) {
        const cantileversData = await response.json();
        return { cantilevers: cantileversData.cantilevers.map((item:CantileverDataContent) => item.cantilever), currentPage:cantileversData.currentPage, lastPage:cantileversData.lastPage };
      } else {
        console.error("Failed to fetch cantilevers");
        return { cantilevers:[], currentPage:0, lastPage:0 };
      }
    } catch (error) {
      console.error("Error fetching cantilevers:", error);
      return { cantilevers:[], currentPage:0,lastPage:0 };
    }
  };

  return(
    <div className="w-full h-auto relative bg-white">
      <div className="w-full flex flex-row justify-between py-1">
        <label className="text-primary-dark font-bold text-sm">Cantilever {index + 1}</label>
        <button type="button" onClick={handleOnDelete} className="h-6 w-6 text-primary bg-white rounded-full hover:border-primary hover:text-white hover:bg-primary active:scale-95 cursor-pointer duration-300 transition-all border-2 p-1">
          <X className="h-full w-full"/>
        </button>
      </div>
      {currentOption != null ? 
        <div onClick={toggleShow} className="w-full h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto gap-x-4">
          <span className="h-full w-24">
            <SvgComponent icon={currentOption.params.model.icon ?? "cantilever_gy_type_1"}/>
          </span>
          <div className="w-full h-full flex flex-col items-end">
            <span className="h-auto w-auto flex flex-row gap-x-4">
              <p className="capitalize text-xs">{t("cantilever.fields.external_id")}:</p>
              <p className=" font-bold text-xs">{currentOption.external_id}</p>
            </span>
            <span className="h-auto w-auto flex flex-row gap-x-4">
              <p className="capitalize text-xs">{t("cantilever.fields.params.model.type.configuration")}:</p>
              <p className=" font-bold text-xs">{currentOption.params.model.type.configuration}</p>
            </span>
            <span className="h-auto w-auto flex flex-row justify-end gap-x-4">
              <p className="capitalize text-xs">{t("cantilever.fields.params.model.type.contact_wire_configuration")}:</p>
              <p className=" font-bold text-xs">{currentOption.params.model.type.contactWireConfiguration}</p>
            </span>
          </div>
        </div>
      :
        <div onClick={toggleShow} className="w-full h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto gap-x-4">
          <span className="h-full w-24">
            <SvgComponent icon={"cantilever_gy_type_1"}/>
          </span>
          <div className="w-full h-full flex flex-col items-end">
            <span className="h-auto w-auto flex flex-row gap-x-4">
              <p className=" font-bold text-xs">{t("cantilever.selector.empty")}</p>
            </span>
          </div>
        </div>
      }
      {showOptions && 
        <div className="absolute top-[110%] w-full max-h-[400px] h-auto py-4 shadow-sm rounded-xl border-2 border-gray-light bg-transparent flex flex-col gap-y-4 justify-start items-start overflow-y-scroll bg-white animation-element slide-in-up bg-white no-scroll-bar !z-[1000]">
          <div className="w-full flex flex-row items-center justify-center px-6 gap-x-2">
            <InputForm 
              header={t("cantilever.selector.input_title")} 
              units={""} 
              placeholder={t("cantilever.selector.input_placeholder")} 
              value={options.searchedValue ?? ""}
              handleChange={(e)=>updateSearchedValue(e)}
            />
          </div>
          {options.cantilevers.map((option:CantileverParams,indexOption:number)=>{
            return(
              <div onClick={()=>handleSelectOption(option)} key={"key_option_cantilever_"+indexOption} className="w-[95%] h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto">
                <span className="h-full w-24">
                  <SvgComponent icon={option.params.model.icon ?? "cantilever_gy_type_1"}/>
                </span>
                <div className="w-full h-full flex flex-col items-end">
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize text-xs">{t("cantilever.fields.external_id")}:</p>
                    <p className=" font-bold text-xs">{option.external_id}</p>
                  </span>
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize text-xs">{t("cantilever.fields.params.model.type.configuration")}:</p>
                    <p className=" font-bold text-xs">{option.params.model.type.configuration}</p>
                  </span>
                  <span className="h-auto w-auto flex flex-row justify-end gap-x-2">
                    <p className="capitalize text-xs">{t("cantilever.fields.params.model.type.contact_wire_configuration")}:</p>
                    <p className=" font-bold text-xs">{option.params.model.type.contactWireConfiguration}</p>
                  </span>
                </div>
              </div>
            )
          })}
          <div className="w-full flex flex-row justify-between px-6">
            <span onClick={()=>previousPageCantilevers()} className={`${ options.currentPage <= 1 ? 'border-gray-300 bg-gray-100 text-gray-400 pointer-events-none' : 'pointer-events-auto border-primary hover:bg-primary hover:text-white text-primary active:scale-95 cursor-pointer' } w-auto h-auto  duration-300 p-2 rounded-full border-2 `}>
              <ChevronLeft className="w-5 h-5"/>
            </span>

            <span onClick={()=>nextPageCantilevers()} className={`${ options.lastPage == options.currentPage ? 'border-gray-300 bg-gray-100 text-gray-400 pointer-events-none' : 'pointer-events-auto border-primary hover:bg-primary hover:text-white text-primary active:scale-95 cursor-pointer' } w-auto h-auto  duration-300 p-2 rounded-full border-2 `}>
              <ChevronRight className="w-5 h-5"/>
            </span>
          </div>
        </div> 
      }
    </div>
  )
}
