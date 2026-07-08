import { LoaderFunction } from "@remix-run/node";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigation, Form, useActionData, useLoaderData, Params } from "@remix-run/react";
import { useLoader } from "~/components/loaders/LoaderContext";
import { localeCookie } from "~/modules/i18next.server";
import Button from "~/components/Button";
import {toast} from "sonner";
import { PrismaClient } from "@prisma/client";
import {requireUser} from "~/db/auth/session.server";
import {requirePermission} from "~/db/permission/actions.server";
import {timezones} from "~/utils/timezones";
const prisma = new PrismaClient();

export const loader: LoaderFunction = async ({ request, params }) => {

  const { projectId } = params;

  const user = await requireUser(request);
  await requirePermission(user,'view','Config',Number(projectId))

  const config = await prisma.config.findMany();
  // Explicitly type `acc` as an object with string keys and string values
  const settings = config.reduce<Record<string, string>>((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {});
  
  return Response.json(settings);
}

// Action function to handle language updates
export async function action({ request, params }: { request: Request, params:Params }) {

  const { projectId } = params;



  const user = await requireUser(request);
  await requirePermission(user,'update','Config',Number(projectId))

  const formData = await request.formData();
  const lng = formData.get("lng") as string;
  const catenaryType = formData.get("catenaryType") as string;
  const timezone = formData.get("timezone") as string;

  const supportedCantileverTypes = ["BR", "GY", 'ALL'];

 if (!supportedCantileverTypes.includes(catenaryType)) {
    return Response.json({ error: "Unsupported catenary type" }, { status: 400 });
  }

  await prisma.config.update({
    data: { value: catenaryType },
    where: { key_projectId: { key: "catenaryType", projectId:Number(projectId) }  },
  });

  await prisma.config.update({

    data: { value: timezone },
    where: { key_projectId: { key: "timezone", projectId:Number(projectId) }  },
  });

  return Response.json(
    { success: true },
    { headers: { "Set-Cookie": await localeCookie.serialize(lng) } }
  );
}

export default function ConfigPage() {

  const config:Record<string, string> = useLoaderData();
  const { t, i18n } = useTranslation();
  const { showLoader, hideLoader } = useLoader();
  const navigation = useNavigation();
  const actionData = useActionData<{ success?: boolean; error?: string }>();

  const timezonesOrdered = timezones.sort((a, b) => a.gmt.localeCompare(b.gmt));

  //const [selectedLanguage, setSelectedLanguage] = useState(config.language);
  const [selectedCatenaryType, setSelectedCatenaryType] = useState(config.catenaryType);

  const [selectedTimezone, setSelectedTimezone] = useState(config.timezone);

  useEffect(() => {
    if (navigation.state === "loading") {
      showLoader();
    } else {
      hideLoader();
    }
  }, [navigation.state]);

  // Handle language change on the client-side
  const handleCatenaryTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCatenaryType(event.target.value);
  };

  useEffect(() => {
    if (actionData?.success) {
      toast.success(t("config.success"));
    }
    if(actionData?.error){
      toast.error(t("config.error"));
    }

  }, [actionData, i18n]);

  return (
    <div className="h-full w-full flex flex-col justify-start items-start p-4">
      <div className="h-full overflow-y-scroll w-full h-full border-2 border-gray-light rounded-xl flex flex-col justify-start items-start p-4 gap-y-4 shadow-sm">
        <div className="w-auto inline-flex gap-x-4">
          <h4 className="font-bold text-body capitalize">{t("config.plural")}</h4>
        </div>
        <Form method="post" className="w-full h-auto flex flex-col gap-y-2">
          <div className="w-full h-auto flex flex-row justify-between items-center py-2">
            <label className="font-bold text-sm capitalize">{t("config.catenary_type")}</label>
            <select
              name="catenaryType"
              className="border border-gray-light rounded px-6 py-1 capitalize"
              value={selectedCatenaryType}
              onChange={handleCatenaryTypeChange}
            >
              <option value="BR">{t("catenary.brazil")}</option>
              <option value="GY">{t("catenary.german")}</option>
              <option value="ALL">{t("catenary.all")}</option>
            </select>
          </div>
          <div className="w-full h-auto flex flex-row justify-between items-center py-2">
            <label className="font-bold text-sm capitalize">{t("config.timezone")}</label>
            <select
              name="timezone"
              className="border border-gray-light rounded px-6 py-1 capitalize"
              value={selectedTimezone}
              onChange={(e)=>setSelectedTimezone(e.target.value)}
            >
              {timezonesOrdered.map((tmz,index)=>{
                return(
                  <option key={"tmz_"+index} value={tmz.zone}>{tmz.gmt} {tmz.name}</option>
                )
              })}
            </select>
          </div>
          <Button
            type="submit"
            className="px-6 capitalize ml-auto"
          >
            {t("config.apply")}
          </Button>
        </Form>
      </div>
    </div>
  );
}
