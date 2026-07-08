import {useTranslation} from "react-i18next";
import Compas from "~/assets/svg/common/results.svg?react";

const titles:string[] = [
  "vane.results.droppers",
  "vane.results.installation_length",
  "vane.results.distance_eye_to_eye",
  "vane.results.distance_cw",
  "vane.results.distance_pole_dropper",
  "vane.results.distance_dropper_dropper",
  "vane.results.distance_cw_h",
  "vane.results.dropper_inclination",
]

interface ResultsProps {
  vane:VaneParams;
  results:number[][]
}
const VaneResults = (props:ResultsProps) => {

  const {t} = useTranslation();

  const {vane, results} = props;

  return(
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-full flex flex-col justify-start items-start overflow-y-scroll">
        <div className="w-full duration-300 transition-all grid grid-cols-2 px-4 gap-4">
          <div className="col-span-1 text-secondary-dark flex flex-row gap-x-4">
            <Compas className="h-8 w-8"/>
            <h5 className="font-bold capitalize">{t("vane.results.name")}</h5>
          </div>
          <div className="col-span-2 py-4 overflow-scroll">
            {results.length > 0 &&(
              <table className="min-w-full border-collapse border border-gray-300 text-body rounded-lg">
                      <thead>
                        <tr className="">
                          <th key="title-row-0" className="border border-gray-300 p-2">{t(titles[0])}</th>
                          {Array.from({length:results[0].length}).map((_, colIndex) => {
                            if(colIndex == 0){
                              return(
                                <th key={colIndex} className="border border-gray-300 p-2">A</th>
                              )
                            }else if(colIndex == results[0].length - 1){
                              return(
                                <th key={colIndex} className="border border-gray-300 p-2">B</th>
                              )
                            }else{
                              return(
                                <th key={colIndex} className="border border-gray-300 p-2">{colIndex}</th>
                              )
                            }
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {/* Map through each row in results */}
                        {results.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            <td key="title-row-0" className="border border-gray-300 p-2 min-w-64">{t(titles[rowIndex + 1])}</td>
                            {/* Map through each column in the row */}
                            {row.map((cell, colIndex) => (
                              <td key={colIndex} className="border border-gray-300 p-2 text-center">
                                {cell == undefined || cell == null ? "0.00" : cell.toFixed(2)} {/* Format each cell value */}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default VaneResults;
