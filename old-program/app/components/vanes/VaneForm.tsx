import React from "react";
import ChevronDown from "~/assets/svg/common/chevron-down.svg?react";
import ChevronUp from "~/assets/svg/common/chevron-up.svg?react";
import Save from "~/assets/svg/common/save.svg?react";
import Tag from "~/assets/svg/common/tag.svg?react";
import Calculator from "~/assets/svg/common/calculator.svg?react";
import {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";
import { getDefaultsVanes, getVanesOptions } from "~/db/vane/data";
import {  useOutletContext } from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import { toast } from "sonner";
import { validateParams } from "~/utils/helper";
import { runtimeVaneSchema, isVaneFieldValid, isVaneSubSectionValid, isVaneSectionValid, calculateDefaultValues } from "~/utils/vane";
import { InputForm } from "~/components/Inputs";
import { sections } from "~/components/vanes/VaneFields";
import { VaneTypeSelector } from "~/components/vanes/VaneSelector";


interface SectionProps {
  index:number;
  children:React.ReactNode;
  label:string;
  defaultOpen?:boolean
}

function SectionForm (props:SectionProps) {
  const { index, children, label, defaultOpen = false } = props;

  const [isOpen,setIsOpen] = useState<boolean>(defaultOpen);

  const toogleOpen = () => {
    setIsOpen(!isOpen);
  }

  return(
    <div key={"section_"+index} className="w-full h-auto flex flex-col">
      <span onClick={toogleOpen} className="flex flex-row justify-between items-center text-primary bg-secondary hover:bg-gray-100 px-4 py-2 cursor-pointer">
        <label className="capitalize font-bold">{label}</label>
        {isOpen ?
          <ChevronDown className="h-10 w-10"/>
        :
          <ChevronUp className="h-10 w-10"/>
        }
      </span>
      <div className={`${isOpen ? "h-[400px]" : "h-[0px]"} w-full no-scroll-bar overflow-y-scroll duration-300 transition-all`}>
        <div className={`w-full ${isOpen ? "" : "hidden"} duration-300 transition-all grid grid-cols-2 p-4 gap-4`}>
          {children}
        </div>
      </div>
    </div>
  )
};


interface VaneFormProps {
  catenaryType:string;
  selVane:VaneDataContent;
  onLabels:(vaneId:number,type:string)=>void;
  labelOn:boolean;
  handleUpdateVane:(vane:VaneDataContent) => void;
}

const VaneForm = (props:VaneFormProps) => {

  const context = useOutletContext<{selectedProject:ProjectParams}>();

  const {t} = useTranslation();
  const { showLoader, hideLoader } = useLoader();
  const {catenaryType,  selVane,  handleUpdateVane, onLabels, labelOn } = props;

  const [errors,setErrors] = useState<{path:string,message:string}[]>([]);

  const updatePole = async() => {
    if(!selVane) return;

    selVane.vane.params = calculateDefaultValues(selVane.vane.params,selVane.vane.params.calculation_type,[]);

    showLoader();
    try {
      const response = await fetch(`/api/vane?id=${selVane.vane.id}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selVane.vane),
      });

      if (response.ok) {
        toast.success(t('vane.update.success', { id: selVane.vane.id }));
      } else {
        toast.success(t('vane.update.error', {id : selVane.vane.id}));
        console.error("Failed to update vane:", response.statusText);
      }
    } catch (error) {
      toast.success(t('vane.update.failed',{ error: error }));
      console.error("Error update vane:", error);
    }
    hideLoader();

  };

  const calculateModel = useCallback(async () => {
      showLoader();
      if(!selVane) return;
      try {
      const { errors, validatedParams } = validateParams(selVane.vane,runtimeVaneSchema);

      setErrors(errors);

      if(errors.length > 0){
        hideLoader();
        return;
      } 

      if(!validatedParams){
        hideLoader();
        return;
      }


      const updatedPole = { ...selVane.vane, params: validatedParams as VaneGermanParams };
      updatedPole.params = calculateDefaultValues(updatedPole.params,updatedPole.params.calculation_type,[]);

      handleUpdateVane({...selVane, vane: updatedPole  });


        const response = await fetch(`/api/vane/calculate?projectId=${context.selectedProject.id?.toString()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedPole),
        });

        if (response.ok) {
          const vaneDdata = await response.json();
          handleUpdateVane(vaneDdata);
        } else {
          toast.success(t('vane.calcualte.error'));
          console.error("Failed to add vane:", response.statusText);
        }
      } catch (error) {
        toast.success(t('vane.calculate.failed',{ error: error }));
        console.error("Error adding vane:", error);
        }finally{
        hideLoader();
      }
    },[selVane]);

  const handleChangeType = useCallback((model:VaneModelInterface) => {

    const selectedVaneType = getDefaultsVanes(catenaryType).find((item)=> item.model.name === model.name);

    if (!selectedVaneType || !selectedVaneType.params || !selVane) {
      return;
    }

    const vaneUpdated:VaneParams = { ...selVane.vane, params: {...selectedVaneType.params} }


    handleUpdateVane({...selVane, vane: vaneUpdated});
    return;
  },[selVane]);

  const handleChange = useCallback((propertyPath: string, value: string) => {
    if (!selVane) {
      return;
    }
    // Clone the current pole
    const updatedVane = { ...selVane.vane };

    // Split the path by dots to access nested properties
    const properties = propertyPath.split('.');
    let current:any = updatedVane;

    // Traverse the object up to the second last property
    for (let i = 0; i < properties.length - 1; i++) {
      const key = properties[i];
      current[key] = { ...current[key] }; // Clone the object at each level
      current = current[key];
    }

    // Set the value on the last property in the path
    current[properties[properties.length - 1]] = value;


    handleUpdateVane({...selVane, vane: updatedVane});
  },[selVane]);

  const getValueByPath = (obj:any, path:any) => {
    return path.split('.').reduce((acc:any, key:any) => acc?.[key], obj);
  };

  const toogleLabel = useCallback(() => {
    if(!selVane.vane.id) return;
    onLabels(selVane.vane.id,'vane')
  },[onLabels])


  return(
    <div className="w-full h-full flex flex-col py-4 z-20">
      <div className="w-full h-auto flex flex-row justify-between pe-4">
        <h4 className="font-bold text-secondary-dark px-4 my-2 capitalize">{t("vane.name")+" "+selVane.vane.external_id}</h4>
        <span className="flex flex-row gap-x-2">
          <button onClick={()=>toogleLabel()} className={`${ labelOn ? 'bg-primary text-white': 'bg-secondary text-body' } h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white`}>
            <Tag className="w-full h-full"/>
          </button>
          <button onClick={()=>calculateModel()} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white bg-secondary text-body`}>
            <Calculator className="w-full h-full"/>
          </button>
          <button onClick={()=>updatePole()} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white bg-secondary text-body`}>
            <Save className="w-full h-full"/>
          </button>
        </span>
      </div>

      <label className="font-bold text-secondary-dark px-4 capitalize">{t("vane.vane_type")}</label>
      <VaneTypeSelector currentOption={{model:selVane.vane.params.model}} options={getVanesOptions(catenaryType)} onChangeType={handleChangeType}/>
      
      <div key="form_fields" className="w-full h-full flex flex-col justify-start items-start overflow-y-scroll">
      {sections.map((section,indexSection) => 
        selVane && isVaneSectionValid(section.name,selVane.vane) ? (
        <SectionForm
          key={"section_"+section.section}
          index={indexSection}
          label={t(section.section)}
          defaultOpen={section.defaultOpen}
        >
          {section.subSection.map((subSection,indexSubsection) => 
            selVane && isVaneSubSectionValid(section.name, subSection.name,selVane.vane) ? (
              <React.Fragment key={`subsection_${indexSection}_${indexSubsection}`}>
                {subSection.title && (
                  <div key={`vane_subsection_title_${indexSection}_${indexSubsection}`} className="col-span-2">
                    <label className="font-bold text-secondary-dark capitalize">
                      {t(subSection.title)}
                    </label>
                  </div>
                )}

                {subSection.fields.map((field, index) => 
                  selVane && isVaneFieldValid(field.value, selVane.vane) ? (
                    <InputForm
                      key={`${indexSection}_${indexSubsection}_${index}_${field.key}`}
                      classNameContainer={field.classNameContainer}
                      classNameLabel={field.classNameLabel}
                      classNameInput={field.classNameInput}
                      header={t(field.header ?? "")}
                      units={t(field.units ?? "")}
                      placeholder={t(field.placeholder ?? "")}
                      value={getValueByPath(selVane.vane, field.value)}
                      checked={getValueByPath(selVane.vane, field.value)}
                      handleChange={(e) => {
                        // Special handling for checkboxes
                        if (field.inputType === 'checkbox') {
                          handleChange(field.value, e.target.checked);
                        } else {
                          handleChange(field.value, e.target.value);
                        }
                      }}
                      help={
                        field.help
                          ? {
                              header: t(field.help.header),
                              description: t(field.help.description ?? ""),
                              ref: field.help.ref,
                              image: field.help.image,
                            }
                          : undefined
                      }
                      elementId={field.elementId}
                      inputType={field.inputType}
                      err_msg={
                        errors.find((item) => item.path === field.value)?.message ??
                        undefined
                      }
                      selectorOptions={(field.options && field.options.length > 1) ? 
                          field.options.map((item) => ({ ...item, label: t(item.label) })) 
                          : []
                      }
                    />
                  ) : null
                )}
              </React.Fragment>
          ): null
        )}
        </SectionForm>
      ): null
    )}
      </div>


    </div>
  )
}

export default VaneForm;
