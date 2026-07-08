import { useState} from "react";
import {useTranslation} from "react-i18next";
import SvgComponent from "~/components/SvgComponent";

interface PropsVaneTypeSelector {
  options:{ id:number, model:VaneModelInterface }[];
  currentOption: { model:VaneModelInterface };
  onChangeType:(model:VaneModelInterface ) => void;
}

export function VaneTypeSelector(props:PropsVaneTypeSelector) {

  const {t} = useTranslation();
  const {options, currentOption, onChangeType} = props;

  const [showOptions,setShowOptions] = useState<boolean>(false);

  const toggleShow = () => {
    setShowOptions(!showOptions);
  }

  const handleSelectOption = (option:{ id:number, model:VaneModelInterface }) => {
    onChangeType(option.model);
    setShowOptions(false);
  }

  return(
    <div className="w-full h-auto relative my-4">
      <div onClick={toggleShow} className="w-[95%] h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto">
        <span className="h-full w-24">
          <SvgComponent icon={currentOption.model.icon ?? "vane"}/>
        </span>
        <div className="w-full h-full flex flex-col items-end">
          <span className="h-auto w-auto flex flex-row gap-x-4">
            <p className="capitalize">{t("vane.fields.params.model.name")}:</p>
            <p className=" font-bold">{currentOption.model.name}</p>
          </span>
          <span className="h-auto w-auto flex flex-row gap-x-4">
            <p className="capitalize">{t("vane.fields.params.model.type.configuration")}:</p>
            <p className=" font-bold capitalize">{t(`vane.fields.params.model.type.conf_configuration.${currentOption.model.type.configuration}`)}</p>
          </span>
          <span className="h-auto w-auto flex flex-row gap-x-4">
            <p className="capitalize">{t("vane.fields.params.model.type.contact_wire_configuration")}:</p>
            <p className=" font-bold capitalize">{t(`vane.fields.params.model.type.conf_contact_wire_configuration.${currentOption.model.type.contactWireConfiguration}`)}</p>
          </span>
        </div>
      </div>
      {showOptions && 
        <div className="absolute top-[110%] w-[95%] left-[2.5%] max-h-[400px] h-auto py-4 shadow-sm rounded-xl border-2 border-gray-light bg-transparent flex flex-col gap-y-4 justify-start items-start overflow-y-scroll bg-white animation-element slide-in-up z-[40]">
          {options.map((option,index)=>{
            return(
              <div onClick={()=>handleSelectOption(option)} key={"key_option_Vane_"+index} className="w-[95%] h-auto flex flex-row items-center text-body shadow-sm border border-gray-light rounded-xl px-6 py-4 hover:bg-primary hover:text-white cursor-pointer active:scale-95 duration-300 mx-auto">
                <span className="h-full w-24">
                  <SvgComponent icon={option.model.icon ?? "vane"}/>
                </span>
                <div className="w-full h-full flex flex-col items-end">
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize">{t("vane.fields.params.model.name")}:</p>
                    <p className=" font-bold">{option.model.name}</p>
                  </span>
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize">{t("vane.fields.params.model.type.configuration")}:</p>
                    <p className=" font-bold capitalize">{t(`vane.fields.params.model.type.conf_configuration.${option.model.type.configuration}`)}</p>
                  </span>
                  <span className="h-auto w-auto flex flex-row gap-x-4">
                    <p className="capitalize">{t("vane.fields.params.model.type.contact_wire_configuration")}:</p>
                    <p className=" font-bold capitalize">{t(`vane.fields.params.model.type.conf_contact_wire_configuration.${option.model.type.contactWireConfiguration}`)}</p>
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
