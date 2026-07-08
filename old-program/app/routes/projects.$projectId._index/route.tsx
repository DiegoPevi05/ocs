import { useCallback, useEffect, useState } from "react";
import {  useLoaderData, useNavigation} from "@remix-run/react";
import {useLoader} from "~/components/loaders/LoaderContext";
import {useTranslation} from "react-i18next";
import HistoryCard from "~/components/histories/HistoryCard";
import MessageCircleWarning from "~/assets/svg/common/message-circle-warning.svg?react";
import { PrismaClient } from "@prisma/client";
import {LoaderFunction} from "@remix-run/node";
import {getPreviewLocations} from "~/db/location/actions.server";
import { getCatenaryType } from "~/db/config/actions.server";
import LocationPreviewViewer from "~/components/locations/LocationPreview";
import LoaderVane from "~/components/loaders/LoaderVane";

const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request,  params }) => {

  const { projectId } = params;

  const locations = await getPreviewLocations(request,Number(projectId));

  const catenaryType =  await getCatenaryType(request,Number(params.projectId));

  const config = await prisma.config.findFirst({
    where: { key: "timezone" , projectId:Number(projectId) },
    select: { value: true },
  });

  const timezone = config ? config.value : "America/Buenos_Aires";

  return Response.json({ timezone, projectId, locations, catenaryType });
}

export default function DashboardIndex(){

  const { timezone, projectId, locations, catenaryType } = useLoaderData<typeof loader>();

  const {t} = useTranslation();

  const { showLoader, hideLoader } = useLoader();

  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  useEffect(() => {
    fetchHistories(1);
  }, []); // Add `user` as a dependency

  const [histories,setHistories] = useState<{ histories: HistoryParams[]; lastPage: number; currentPage: number } | null>({ histories:[], lastPage:0, currentPage:0 })

  const fetchHistories = async (pageInput:number) => {

    const page = pageInput.toString();
    const size = "8";

    try {
      const queryParams = new URLSearchParams({ page, size, projectId });

      const response = await fetch(`/api/histories?${queryParams.toString()}`);

      if (response.ok) {
        const historiesData = await response.json();
        setHistories(historiesData);
      } else {
        console.error("Failed to fetch history");
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  // Next page function
  const nextPageHistories = useCallback(async () => {
    if(!histories) return;

    if (histories.currentPage < histories.lastPage) {
      await fetchHistories(histories.currentPage + 1);
    }
  }, [histories?.currentPage, histories?.lastPage]); // Add dependencies

  // Previous page function
  const previousPageHistories = useCallback(async () => {
    if(!histories) return;

    if (histories.currentPage > 1) {
      await fetchHistories(histories.currentPage - 1);
    }
  }, [histories?.currentPage]);

  return(
    <div className="h-full w-full flex flex-col justify-start items-start overflow-y-scroll xl:grid xl:grid-cols-4 gap-4">
      <div className="col-span-2 h-full flex flex-col">
        <div className="w-full h-full flex flex-col gap-y-4">
          {locations && locations.map((loc,index) => {
            return (
              <LocationPreviewViewer
                key={loc.id}
                index={index}
                extraClasses="w-full h-full"
                location={loc}
                catenaryType={catenaryType}
              />
            );
          })}
          {!locations && (
            <div className="w-full h-full rounded-xl flex flex-col items-center justify-center px-12">
              <h2 className="text-center text-lg">{t("location.empty_locations_dashboard")}</h2>
              <LoaderVane noLabel={true} className="h-56 w-56"/>
            </div>
          )}
        </div>
      </div>
      <div className="col-span-2 border-2 border-gray-light rounded-xl p-4 w-full h-full flex flex-col gap-y-2">
        <h5 className="text-primary-dark font-bold capitalize">{t("history.last_updates")}</h5>
        {histories?.histories == null || histories?.histories.length == 0 ? 
          <div className="w-full h-full flex flex-col items-center justify-center px-4 gap-y-2">
            <p className="text-center text-lg">{t("history.empty_content")}</p>
            <MessageCircleWarning className="h-12 w-12"/>
          </div>
        :
        <>
          {histories?.histories.map((hist,index)=>{
            return(
              <HistoryCard key={`history-`+index} history={hist} index={index} timezone={timezone} projectId={projectId }/>
            )
          })}
          <div className="w-full h-auto mt-auto flex flex-row justify-between px-2">
              {/* Previous Page */}
              <button
                onClick={() => previousPageHistories()}
                disabled={histories.currentPage === 1}
                className={`h-8 w-8 border-2 rounded-full flex items-center justify-center p-1 duration-300 ${
                  histories.currentPage === 1
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
              {/* Next Page */}
              <button
                onClick={() => nextPageHistories()}
                disabled={histories.currentPage === histories.lastPage}
                className={`h-8 w-8 border-2 rounded-full flex items-center justify-center p-1 duration-300 ${
                  histories.currentPage === histories.lastPage
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
          </div>
        </>
        }

      </div>
    </div>
  );
}

