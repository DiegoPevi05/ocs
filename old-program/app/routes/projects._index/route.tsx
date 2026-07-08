import {  useNavigation, useLoaderData } from "@remix-run/react"; // Correct import
import {useTranslation} from "react-i18next";
import {useLoader} from "~/components/loaders/LoaderContext";
import {useEffect, useState, useCallback} from 'react';
import LocationPreviewViewer from "~/components/locations/LocationPreview";
import LoaderVane from "~/components/loaders/LoaderVane";
import {LoaderFunction} from "@remix-run/node";

interface PreviewResponse {
  locations: LocationParams[];
  catenaryTypes: string[]; // or whatever type getCatenaryType returns
}


const ProjectIndex = () => {

  const { showLoader, hideLoader } = useLoader();

  const {t} = useTranslation();
  const navigation = useNavigation();

  const [locations, setLocations] = useState<LocationParams[] | null>(null);
  const [catenaryTypes, setCatenaryTypes] = useState<string[] | null>(null);

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  // 1️⃣ Define the fetch function
  const fetchPreviewProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects/preview");
      if (!res.ok) throw new Error(res.statusText);
      const data: PreviewResponse = await res.json();
      setLocations(data.locations);
      setCatenaryTypes(data.catenaryTypes);
    } catch (err) {
      console.error("Failed to load preview locations:", err);
      setLocations(null);
      setCatenaryTypes(null);
    }
  }, []);

  // 2️⃣ Call on mount
  useEffect(() => {
    fetchPreviewProjects();
  }, [fetchPreviewProjects]);

  // 3️⃣ Listen for a custom event to re‑fetch
  useEffect(() => {
    const handler = () => fetchPreviewProjects();
    document.addEventListener("preview:refresh", handler);
    return () => {
      document.removeEventListener("preview:refresh", handler);
    };
  }, [fetchPreviewProjects]);

  return(
    <div className="w-full h-full">
      {locations && catenaryTypes && locations.length > 0 ? (
        (() => {
          // Compute your grid classes now that `locations` is guaranteed non‑null
          const count = locations.length;
          let containerClasses = "w-full h-full gap-4 grid ";
          if (count === 1) containerClasses += "grid-cols-1 grid-rows-1";
          else if (count === 2) containerClasses += "grid-cols-1 grid-rows-2";
          else /* count === 3 */ containerClasses += "grid-cols-2 grid-rows-2";

          return (
            <div className={containerClasses}>
              {locations.map((loc, idx) => {
                // compute extraClasses
                let extra = "w-full h-full";
                if (count === 3 && idx === 0) extra += " col-span-2";
                return (
                  <LocationPreviewViewer
                    key={loc.id}
                    index={idx}
                    extraClasses={extra}
                    location={loc}
                    catenaryType={catenaryTypes[idx]}
                  />
                );
              })}
            </div>
          );
        })()
      ) : (
        <div className="w-full h-full rounded-xl flex flex-col items-center justify-center px-12">
          <h2 className="text-center text-lg">
            {t("location.empty_locations_projects")}
          </h2>
          <LoaderVane noLabel={true} className="h-56 w-56" />
        </div>
      )}
    </div>
  );
}

export default ProjectIndex;
