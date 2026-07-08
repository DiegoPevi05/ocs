import React from "react";
import ChevronDown from "~/assets/svg/common/chevron-down.svg?react";
import ChevronUp from "~/assets/svg/common/chevron-up.svg?react";
import Save from "~/assets/svg/common/save.svg?react";
import Calculator from "~/assets/svg/common/calculator.svg?react";
import {useCallback, useState} from "react";
import {useTranslation} from "react-i18next";
import { getCantileversOptions, getDefaultsCantilevers, DefaultsBrazilianCantileverAditionals } from "~/db/cantilever/data";
import { CantileverTypeSelector } from "~/components/cantilevers/CantileverSelector";
import {InputForm} from "~/components/Inputs";
import {validateParams,subtractVectors,addVectors,normalizeVector,scaleVector, lengthVector } from "~/utils/helper";
import {isCantileverFieldValid, isCantileverSubSectionValid, isCantileverSectionValid, runtimeCantileverSchema} from "~/utils/cantilever";
import {useLoader} from "~/components/loaders/LoaderContext";
import {toast} from "sonner";
import { sections } from "./CantileverFields";
import {getDefaultsPoles, getPolesOptions} from "~/db/pole/data";
import {PoleTypeSelector} from "../poles/PoleSelector";
import {  useOutletContext } from "@remix-run/react";

interface SectionProps {
  index:number;
  children:React.ReactNode;
  label:string;
  defaultOpen?:boolean
}

function SectionForm(props:SectionProps){

  const { index,children, label, defaultOpen = false } = props;

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

interface CantileverFormProps {
  catenaryType:string;
  external_id:string;
  model:ModelInterface;
  selCantilever:CantileverDataContent;
  handleUpdateCantilever:(cantilever:CantileverDataContent) => void;
}

export default function CantileverForm(props:CantileverFormProps) {

  const context = useOutletContext<{selectedProject:ProjectParams}>();

  const {t} = useTranslation();
  const { showLoader, hideLoader } = useLoader();

  const {catenaryType, external_id, model,  selCantilever,  handleUpdateCantilever } = props;

  const [errors,setErrors] = useState<{path:string,message:string}[]>([]);

  const updateCantilever = async() => {
    if(!selCantilever) return;

    showLoader();
    try {
      const response = await fetch(`/api/cantilever?id=${selCantilever.cantilever.id}&projectId=${context.selectedProject.id?.toString()}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selCantilever.cantilever),
      });

      if (response.ok) {
        toast.success(t('cantilever.update.success', { id: selCantilever.cantilever.id }));
      } else {
        toast.success(t('cantilever.update.error', {id : selCantilever.cantilever.id}));
        console.error("Failed to update cantilever:", response.statusText);
      }
    } catch (error) {
      toast.success(t('cantilever.update.failed',{ error: error }));
      console.error("Error update cantilever:", error);
    }
    hideLoader();

  };

  const calculateModel = useCallback(async () => {
      showLoader();
      if(!selCantilever) return;
      const { errors, validatedParams } = validateParams(selCantilever.cantilever,runtimeCantileverSchema);

      setErrors(errors);

      if(errors.length > 0){
        hideLoader();
        return;
      } 

      if(!validatedParams){
        hideLoader();
        return;
      }

      const updatedCantilever = { ...selCantilever.cantilever, params: { ...validatedParams as CantileverGermanParams|CantileverBrazilianParams, poleModel: selPole.model } };

      handleUpdateCantilever({...selCantilever, cantilever: updatedCantilever });

      try {
        const response = await fetch(`/api/cantilever/calculate?projectId=${context.selectedProject.id?.toString()}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedCantilever),
        });

        if (response.ok) {
          const cantileverDdata = await response.json();
          handleUpdateCantilever(cantileverDdata);
        } else {
          toast.success(t('cantilever.calcualte.error'));
          console.error("Failed to add cantilever:", response.statusText);
        }
      } catch (error) {
        toast.success(t('cantilever.calculate.failed',{ error: error }));
        console.error("Error adding cantilever:", error);
        }finally{
        hideLoader();
      }
    },[selCantilever]);

  const handleChangeType = useCallback((model:ModelInterface) => {

    const selectedCantileverType = getDefaultsCantilevers(catenaryType).find((item)=> item.params?.model.type.configuration === model.type.configuration && item.params.model.type.contactWireConfiguration === model.type.contactWireConfiguration);

    if (!selectedCantileverType || !selectedCantileverType.params || !selCantilever) {
      return;
    }

    const cantileverUpdated:CantileverParams = { ...selCantilever.cantilever, params: {...selectedCantileverType.params} }


    handleUpdateCantilever({...selCantilever, cantilever: cantileverUpdated});
    return;
  },[selCantilever]);

  const [fallbackPvDirection,_] = useState(selCantilever.cantilever.params.pv);

  const handleChange = useCallback((propertyPath: string, value: string) => {
      if (!selCantilever) {
        return;
      }
      // Clone the current cantilever
      const updatedCantilever = { ...selCantilever.cantilever };

      // Split the path by dots to access nested properties
      const properties = propertyPath.split('.');
      let current:any = updatedCantilever;

      // Traverse the object up to the second last property
      for (let i = 0; i < properties.length - 1; i++) {
        const key = properties[i];
        current[key] = { ...current[key] }; // Clone the object at each level
        current = current[key];
      }

      let finalValue = value;


      // Somewhere in your update handler:
      if (propertyPath === "params.pv") {

        // 1) If the input is completely empty, let it stay empty
        if (value === "") {

          finalValue = "";

        }else {
          // 2) Try parsing the string to a number
          const parsedValue = Number(value);

          // 2a) If it's a valid number (including 0), recalc the endpoint
          if (!isNaN(parsedValue)) {
            // If the user typed 0, we want the endpoint to sit exactly at 'start'.
            // If they typed >0, we move along the existing direction.
            if (parsedValue === 0) {

              finalValue = updatedCantilever.params.pv ;

            } else {

              try {
                const dirPv = normalizeVector(subtractVectors(selCantilever.polePosition,fallbackPvDirection));
                finalValue  = addVectors(selCantilever.polePosition,scaleVector(dirPv,parsedValue));

              } catch (e) {

                // If start===end (no direction), you could decide to:
                //  • throw, or
                //  • simply keep the old endpoint so the user can’t choose a distance without a direction
                // Here we’ll just keep the old endpoint:
                finalValue = updatedCantilever.params.pv;
              }
            }

          }
          // 2b) If it’s not a number (e.g. "abc"), keep the old endpoint
          else {

            finalValue = updatedCantilever.params.pv;
          }
        }
      }

      // Set the value on the last property in the path
      current[properties[properties.length - 1]] = finalValue;


      handleUpdateCantilever({...selCantilever, cantilever: updatedCantilever});
  },[selCantilever]);


  const getValueByPath = (obj:any, path:any) => {

    if (path == "params.pv") {
      const pointA = path.split('.').reduce((acc:any, key:any) => acc?.[key], obj);
      const pointB = selCantilever.polePosition;
      if(pointA == "" || pointB == "") return "";
      return lengthVector(subtractVectors(pointB, pointA)).toFixed(0);
    }

    return path.split('.').reduce((acc:any, key:any) => acc?.[key], obj);
  };

const [selPole, setSelPole] = useState<PolePropertiesParams>(
  getDefaultsPoles(catenaryType).find(
    (item) => item.model.name === selCantilever.cantilever.params.poleModel.name
  ) as PolePropertiesParams
);

  const handleChangePoleType = useCallback((model:PoleModelInterface) => {

    const selectedPoleType = getDefaultsPoles(catenaryType).find((item)=> item.model.name === model.name);

    if (!selectedPoleType || !selPole) {
      return;
    }

    handleUpdateCantilever({...selCantilever, cantilever: { ...selCantilever.cantilever, params: { ...selCantilever.cantilever.params, poleModel: selectedPoleType.model  } } });
    setSelPole(selectedPoleType)

    return;
  },[selPole,selCantilever]);

  // State and handlers
  const [addReinforcement, setReinforcement] = useState<boolean>(
    'reinforcement' in selCantilever.cantilever.params && 
    selCantilever.cantilever.params.reinforcement 
      ? true 
      : false
  );

  const handleToggleReinforcement = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const reinforcement = DefaultsBrazilianCantileverAditionals[0]?.reinforcement;

      if (!reinforcement) {
        return;
      }

      if (event.target.checked) {
        handleUpdateCantilever({
          ...selCantilever,
          cantilever: {
            ...selCantilever.cantilever,
            params: {
              ...selCantilever.cantilever.params,
              reinforcement,
            },
          },
        });
      } else {
        handleUpdateCantilever({
          ...selCantilever,
          cantilever: {
            ...selCantilever.cantilever,
            params: {
              ...selCantilever.cantilever.params,
              reinforcement: null,
            },
          },
        });
      }

      // Update the local state for the checkbox
      setReinforcement(event.target.checked);
    },
    [selCantilever]
  );

  return(
    <div className="w-full h-full flex flex-col py-4 z-20">
      <div className="w-full h-auto flex flex-row justify-between pe-4">
        <h4 className="font-bold text-secondary-dark px-4 my-2 capitalize">{t("cantilever.name")+" "+external_id}</h4>
        <span className="flex flex-row gap-x-2">
          <button onClick={()=>calculateModel()} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white bg-secondary text-body`}>
            <Calculator className="w-full h-full"/>
          </button>
          <button onClick={()=>updateCantilever()} className={`h-10 w-10 shadow-md rounded-lg active:scale-95 border-2 p-2 hover:bg-primary hover:text-white bg-secondary text-body`}>
            <Save className="w-full h-full"/>
          </button>
        </span>
      </div>



      <label className="font-bold text-secondary-dark px-4 capitalize">{t("cantilever.cantilever_type")}</label>

      <CantileverTypeSelector currentOption={{model}} options={getCantileversOptions(catenaryType)} onChangeType={handleChangeType}/>

      <label className="font-bold text-secondary-dark px-4 capitalize">{t("pole.pole_type")}</label>
      <PoleTypeSelector currentOption={{model:selPole.model}} options={getPolesOptions(catenaryType)} onChangeType={handleChangePoleType}/>

      {catenaryType == "BR" &&
        <div className="w-full h-auto flex flex-row justify-between items-center px-4 my-2">
          <p className="text-md text-body font-bold">{t("cantilever.fields.add_reinforcement")}</p>
          <div className="checkbox-wrapper-2">
          <input
              type="checkbox"
              className="sc-gJwTLC ikxBAC"
              id="add_reinforcement"
              name="add_reinforcement"
              checked={addReinforcement}
              onChange={handleToggleReinforcement}
          />
          </div>
        </div>
      }

      <div key="form_fields" className="w-full h-full flex flex-col justify-start items-start overflow-y-scroll">
      {sections.map((section,indexSection) => 
        selCantilever && isCantileverSectionValid(section.name,selCantilever.cantilever) ? (
        <SectionForm
          key={"section_"+section.section}
          index={indexSection}
          label={t(section.section)}
          defaultOpen={section.defaultOpen}
        >
          {section.subSection.map((subSection,indexSubsection) => 
            selCantilever && isCantileverSubSectionValid(section.name, subSection.name,selCantilever.cantilever) ? (
              <React.Fragment key={`subsection_${indexSection}_${indexSubsection}`}>
                {subSection.title && (
                  <div key={`cantilever_subsection_title_${indexSection}_${indexSubsection}`} className="col-span-2">
                    <label className="font-bold text-secondary-dark capitalize">
                      {t(subSection.title)}
                    </label>
                  </div>
                )}

                {subSection.fields.map((field, index) => 
                  selCantilever && isCantileverFieldValid(field.value, selCantilever.cantilever) ? (
                    <InputForm
                      key={`${indexSection}_${indexSubsection}_${index}_${field.key}`}
                      classNameContainer={field.classNameContainer}
                      classNameLabel={field.classNameLabel}
                      classNameInput={field.classNameInput}
                      header={t(field.header ?? "")}
                      units={t(field.units ?? "")}
                      placeholder={t(field.placeholder ?? "")}
                      value={getValueByPath(selCantilever.cantilever, field.value)}
                      handleChange={(e) => handleChange(field.value, e.target.value)}
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
                      err_msg={
                        errors.find((item) => item.path === field.value)?.message ??
                        undefined
                      }
                      inputType={field.inputType ?? "text"}
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

