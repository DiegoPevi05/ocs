import Compas from "~/assets/svg/common/results.svg?react";
import Diameter from "~/assets/svg/common/diameter.svg?react";
import {useTranslation} from "react-i18next";
import { isCantileverBrazilianParams } from "~/utils/cantilever";

interface ResultsProps {
  cantilever:CantileverParams;
  results:{ name:string, diameter:number, thickness:number, length_tube:number, cut_length:number }[];
}
export default function CantileverResults(props:ResultsProps) {

  const {t} = useTranslation();

  const {cantilever, results} = props;

  return(
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-full flex flex-col justify-start items-start overflow-y-scroll">
        <div key="results" className="w-full duration-300 transition-all grid grid-cols-2 px-4 gap-4">
          <div className="col-span-1 text-secondary-dark flex flex-row gap-x-4">
            <Compas className="h-8 w-8"/>
            <h5 className="font-bold capitalize">{t("cantilever.results.name")}</h5>
          </div>
          <div className="col-span-2 gap-y-2 grid grid-cols-4 gap-4">
            <div className="col-span-4 w-full h-auto border-b-gray-light border-b-2 pb-2 mb-4">
              <p className="font-bold text-secondary-dark capitalize">{t("cantilever.results.stay_tube")}</p>
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary inline-flex gap-x-2"><Diameter className="w-5 h-5"/> {t("cantilever.results.tube_diameter")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={cantilever.params.stay_tube.tube.d}
                readOnly
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary ">{t("cantilever.results.thick_tube")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={cantilever.params.stay_tube.tube.s}
                readOnly
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary ">{t("cantilever.results.length_tube")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={results.find(item=> item.name == "stay_tube")?.length_tube}
                readOnly
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary ">{t("cantilever.results.cut_length")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={results.find(item=> item.name == "stay_tube")?.cut_length}
                readOnly
              />
            </div>
          </div>
          <div className="col-span-2 gap-y-2 grid grid-cols-4 gap-4">
            <div className="col-span-4 w-full h-auto border-b-gray-light border-b-2 pb-2 mb-4">
              <p className="font-bold text-secondary-dark capitalize">{t("cantilever.results.bracket_tube")}</p>
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary  inline-flex gap-x-2"><Diameter className="w-5 h-5"/> {t("cantilever.results.tube_diameter")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"

                value={cantilever.params.bracket_tube.tube.d}
                readOnly
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary ">{t("cantilever.results.thick_tube")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={cantilever.params.bracket_tube.tube.s}
                readOnly
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary ">{t("cantilever.results.length_tube")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={results.find(item=> item.name == "bracket_tube")?.length_tube}
                readOnly
              />
            </div>
            <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
              <p className="font-bold text-primary ">{t("cantilever.results.cut_length")} (mm)</p>
              <input
                className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                value={results.find(item=> item.name == "bracket_tube")?.cut_length}
                readOnly
              />
            </div>
          </div>


          {results.filter((item) => item.name == "steady_arm").map((std_arm,index)=>{
            return(
              <div key={`steady_arm_${index}`} className="col-span-2 gap-y-2 grid grid-cols-4 gap-4">
                <div className="col-span-4 w-full h-auto border-b-gray-light border-b-2 pb-2 mb-4">
                  <p className="font-bold text-secondary-dark capitalize">{t("cantilever.results.steady_arm")} {index + 1}</p>
                </div>
                <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-primary  inline-flex gap-x-2"><Diameter className="w-5 h-5"/> {t("cantilever.results.tube_diameter")} (mm)</p>
                  <input
                    className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                    value={cantilever.params.steady_arm.tube.d}
                    readOnly
                  />
                </div>
                <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-primary ">{t("cantilever.results.thick_tube")} (mm)</p>
                  <input
                    className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                    value={cantilever.params.steady_arm.tube.s}
                    readOnly
                  />
                </div>
                <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-primary ">{t("cantilever.results.length_tube")} (mm)</p>
                  <input
                    className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                    value={std_arm.length_tube}
                    readOnly
                  />
                </div>
                <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                  <p className="font-bold text-primary ">{t("cantilever.results.cut_length")} (mm)</p>
                  <input
                    className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                    value={std_arm.cut_length}
                    readOnly
                  />
                </div>
              </div>
            );
          })}

          {isCantileverBrazilianParams(cantilever.params) && cantilever.params.reinforcement && (
            <div className="col-span-2 gap-y-2 grid grid-cols-4 gap-4">
              <div className="col-span-4 w-full h-auto border-b-gray-light border-b-2 pb-2 mb-4">
                <p className="font-bold text-secondary-dark capitalize">{t("cantilever.results.reinforcement")}</p>
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary  inline-flex gap-x-2"><Diameter className="w-5 h-5"/> {t("cantilever.results.tube_diameter")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"

                  value={cantilever.params.reinforcement.tube.d}
                  readOnly
                />
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary ">{t("cantilever.results.thick_tube")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                  value={cantilever.params.reinforcement.tube.s}
                  readOnly
                />
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary ">{t("cantilever.results.length_tube")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                  value={results.find(item=> item.name == "reinforcement")?.length_tube}
                  readOnly
                />
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary ">{t("cantilever.results.cut_length")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                  value={results.find(item=> item.name == "reinforcement")?.cut_length}
                  readOnly
                />
              </div>
            </div>

          )}

          { ((cantilever.params.model.type.configuration == "CAI" && cantilever.params.register_arm != null) 
             || (cantilever.params.model.type.configuration == "TDP>2.2" && cantilever.params.register_arm != null && cantilever.params.register_arm
             )
            )
            && (
            <div className="col-span-2 gap-y-2 grid grid-cols-4 gap-4">
              <div className="col-span-4 w-full h-auto border-b-gray-light border-b-2 pb-2 mb-4">
                <p className="font-bold text-secondary-dark capitalize">{t("cantilever.results.register_arm")}</p>
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary  inline-flex gap-x-2"><Diameter className="w-5 h-5"/> {t("cantilever.results.tube_diameter")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"

                  value={cantilever.params.register_arm.tube.d}
                  readOnly
                />
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary ">{t("cantilever.results.thick_tube")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                  value={cantilever.params.register_arm.tube.s}
                  readOnly
                />
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary ">{t("cantilever.results.length_tube")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                  value={results.find(item=> item.name == "register_arm")?.length_tube}
                  readOnly
                />
              </div>
              <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                <p className="font-bold text-primary ">{t("cantilever.results.cut_length")} (mm)</p>
                <input
                  className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                  value={results.find(item=> item.name == "register_arm")?.cut_length}
                  readOnly
                />
              </div>
            </div>
          )}

          { ((cantilever.params.model.type.configuration == "CAI" && cantilever.params.register_arm != null && cantilever.params.register_arm.stainless_steel_wire_rope) || (cantilever.params.model.type.configuration == "SBA" && cantilever.params.steady_arm.stainless_steel_wire_rope) 
             || (cantilever.params.model.type.configuration == "TDP>2.2" && cantilever.params.register_arm != null && cantilever.params.register_arm.stainless_steel_wire_rope
             )
            )
            && (

            results.filter((item) => item.name == "steel_cable").map((st_cable,index)=>{
              return(
                <div key={`steel_cable`+index} className="col-span-2 gap-y-2 grid grid-cols-4 gap-4">
                  <div className="col-span-4 w-full h-auto border-b-gray-light border-b-2 pb-2 mb-4">
                    <p className="font-bold text-secondary-dark">{t("cantilever.results.stainless_steel_wire_rope")} {index + 1}</p>
                  </div>
                  <div className="col-span-4 sm:col-span-2 flex flex-col justify-start items-start gap-y-2">
                    <p className="font-bold text-primary  inline-flex gap-x-2"><Diameter className="w-5 h-5"/> {t("cantilever.results.stainless_steel_wire_rope_diameter")} (mm)</p>
                    <input
                      className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                      value={st_cable.diameter}
                      readOnly
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                    <p className="font-bold text-primary ">{t("cantilever.results.stainless_steel_wire_rope_length")} (mm)</p>
                    <input
                      className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"

                      value={st_cable.length_tube}
                      readOnly
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-1 flex flex-col justify-start items-start gap-y-2">
                    <p className="font-bold text-primary ">{t("cantilever.results.stainless_steel_wire_rope_cut_length")} (mm)</p>
                    <input
                      className="border-[3px] border-gray-lights text-body rounded-xl focus:outline-none focus:border-[3px] w-full px-2 py-2 text-center"
                      value={st_cable.cut_length}
                      readOnly
                    />
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}

