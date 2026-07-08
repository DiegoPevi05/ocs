import {useFetcher} from "@remix-run/react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {toast} from "sonner";

const GlobalConfigPage = () => {
  // State to track the selected language
  const { t, i18n } = useTranslation();
  const fetcher = useFetcher();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

// Handle language change
  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setSelectedLanguage(newLanguage);
    localStorage.setItem("preference_language", newLanguage);
    i18n.changeLanguage(newLanguage, (err, t) => {
      if (!err) {
        toast.success(t("config.success")); // Show toast after client-side update
      }
    });
    // Notify the server by submitting to the root route's action
    fetcher.submit({ language: newLanguage }, { method: "post", action: "/" });
  };

  return(
    <div className="col-span-2 row-span-2 flex flex-col justify-start items-start">
      <div className="w-auto inline-flex gap-x-4">
	<h4 className="font-bold text-body capitalize">{t("config.plural")}</h4>
      </div>
      <div className="w-full h-auto flex flex-row justify-between items-center py-2 gap-y-2">
	<label className="font-bold text-sm capitalize">{t("config.language_preference")}</label>
	  <select
	    name="lng"
	    className="border border-gray-light rounded px-6 py-1 capitalize"
	    value={selectedLanguage}
	    onChange={handleLanguageChange}
	  >
	    <option value="en" className="capitalize">{t("language.english")}</option>
	    <option value="es" className="capitalize">{t("language.spanish")}</option>
	    <option value="pt" className="capitalize">{t("language.portugues")}</option>
	  </select>
      </div>
    </div>
  );
}

export default GlobalConfigPage;
