import type { LoaderFunction } from "@remix-run/node";
import { PuppeteerService } from '~/config/puppeteer.server';
import fs from "fs/promises";
import path from "path";
import { getPolesAndVanesByTypeAndValue } from "~/db/location/actions.server";
import i18nServer from "~/modules/i18next.server";
import { fileURLToPath } from 'url';
import { formatDate } from "~/utils/helper";
import { getTimezone } from "~/db/config/actions.server";
import { requireUser } from "~/db/auth/session.server";
import { requirePermission } from "~/db/permission/actions.server";
import { getLogoReport,generateCoverHTMLReport, generateLocationSectionHtmlReport, generateCantileversHtmlReport, generateVanesHtmlReport, getVanesReferenceImagesHtml, generateFooterHtmlReport, generateHeaderHtmlReport } from "~/db/config/report.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loader: LoaderFunction = async ({ request }) => {
  // Ensure only GET requests are allowed
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  // Parse search params
  const url = new URL(request.url);

  const type        = url.searchParams.get("type") as "id" | "via_id"  | null;

  let value = null;

  if(type == "id"){
    value       = url.searchParams.getAll("value").map(Number);
  }else{
    value       = url.searchParams.get("value") as string;
  };

  const type_report = parseInt(url.searchParams.get("type_report") || "", 10);
  const projectId   = parseInt(url.searchParams.get("projectId") || "", 10);
  const revision    = url.searchParams.get("revision") as string || "01";

  const user = await requireUser(request);
  await requirePermission(user, 'view', 'Location', projectId);


  // Validate type and value
  if (!type || !value ) {
    return Response.json({ error: "Invalid type or value" }, { status: 400 });
  }

  const locationsDataArray = await getPolesAndVanesByTypeAndValue(request, projectId, type, value, "global");
  if (!locationsDataArray) {
    return Response.json({ error: "No poles found" }, { status: 404 });
  }

  const projectName = locationsDataArray[0].project;

  if (!projectName) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  // Get translations
  const language = request.headers.get("Accept-Language") || "en";
  const t = await i18nServer.getFixedT(language);
  const timezone = await getTimezone(projectId);
  if (!timezone) {
    return Response.json({ error: "Timezone not found" }, { status: 404 });
  }

  /********************************** TITLE PAGE  REPORT PART ******************************************/
  let pathfile = process.env.NODE_ENV == "production" ? "./templates/full_report_template.html" : "../config/templates/full_report_template.html";
  const templatePath = path.resolve(__dirname, pathfile);
  let baseHtmlContent = await fs.readFile(templatePath, 'utf8');

  const reportPlaceholders = {
    COVER_PAGE_REPORT_TITLE: t("location.report.report_title"),
    COVER_PAGE_DESCRIPTION_TITLE: t("location.report.report_description_title"),
    PROJECT_NAME_HEADER: t("location.report.project_name"),
    PROJECT_NAME: projectName,
    CREATED_BY_HEADER: t("location.report.created_by"),
    CREATED_BY: user.username,  // Replace with actual created_by if applicable
    CREATION_DATE_HEADER: t("location.report.creation_date"),
    CREATION_DATE: formatDate((new Date()).toString(), timezone),
    REVISION_HEADER: t("location.report.revision"),
    REVISION: revision,
    LOCATION:t("location.report.location"),
    COVER_PAGE_CANTILEVER_REPORT_TITLE:t("location.report.cover_page_cantilever_title"),
    COVER_PAGE_CANTILEVER_DESCRIPTION_TITLE:t("location.report.cover_page_cantilever_description_title"),
    REPORT_CANTILEVER_TITLE: t("location.report.cantilever_title"),
    COVER_PAGE_VANE_REPORT_TITLE:t("location.report.cover_page_vane_title"),
    COVER_PAGE_VANE_DESCRIPTION_TITLE:t("location.report.cover_page_cantilever_vane_title"),
    REPORT_VANE_TITLE: t("location.report.vane_title"),
  };

  for (const [key, value] of Object.entries(reportPlaceholders)) {
    const placeholder = `{{${key}}}`;
    baseHtmlContent = baseHtmlContent.replace(new RegExp(placeholder, 'g'), value);
  }

  let companyLogoHtml = await getLogoReport();

   baseHtmlContent = baseHtmlContent.replace(new RegExp("{{COVER_PAGE_LOGO_COMPANY}}", 'g'), companyLogoHtml);


  /********************************** CANTILEVER  REPORT PART ******************************************/

  if ([1, 4, 5, 7].includes(type_report)) {

    let allCantileversHtml  = generateCoverHTMLReport(
      companyLogoHtml,
      reportPlaceholders.COVER_PAGE_CANTILEVER_REPORT_TITLE,
      reportPlaceholders.COVER_PAGE_CANTILEVER_DESCRIPTION_TITLE,
      false
    );

    let qtyCantilevers = 0;

    locationsDataArray.forEach((loc,locIndx) => {

      let cantileversContent = '';

      loc.vias.forEach((via) => {
        via.poles.forEach((pole => {
          // Generate cantilever-specific HTML content
          cantileversContent += generateCantileversHtmlReport(
            t,
            loc.external_id,
            via.external_id,
            pole.pole.external_id,
            pole.cantilevers
          );

          qtyCantilevers += pole.cantilevers.length;

        }))
      })


      let locationCoverPageHtml  = generateLocationSectionHtmlReport(
        reportPlaceholders.LOCATION,
        loc.external_id,
        reportPlaceholders.REPORT_CANTILEVER_TITLE,
        reportPlaceholders.PROJECT_NAME_HEADER,
        reportPlaceholders.PROJECT_NAME,
        reportPlaceholders.CREATED_BY_HEADER,
        reportPlaceholders.CREATED_BY,
        reportPlaceholders.CREATION_DATE_HEADER,
        reportPlaceholders.CREATION_DATE,
        cantileversContent
      );

      if(locIndx == 0){

        locationCoverPageHtml = locationCoverPageHtml.replace('page-break-before: always;', '');

      };

      allCantileversHtml += locationCoverPageHtml;

    })

    // Combine all cantilevers' HTML into a single document
    if(qtyCantilevers > 0){

      baseHtmlContent = baseHtmlContent.replace("{{CANTILEVERS_SECTION}}", allCantileversHtml);

    }else{

      baseHtmlContent = baseHtmlContent.replace("{{CANTILEVERS_SECTION}}", "");
    }

  } else {

    baseHtmlContent = baseHtmlContent.replace("{{CANTILEVERS_SECTION}}", "");

  }


  /********************************** VANE REPORT PART ******************************************/


  if ([2, 4, 6, 7].includes(type_report)) {

    let allVanesHtml  = generateCoverHTMLReport(
      companyLogoHtml,
      reportPlaceholders.COVER_PAGE_VANE_REPORT_TITLE,
      reportPlaceholders.COVER_PAGE_VANE_DESCRIPTION_TITLE,
      [4, 7].includes(type_report)
    );

    const imageHtml = await getVanesReferenceImagesHtml();

    let qtyVanes = 0;

    locationsDataArray.forEach((loc,locIndx) => {

      let vanesContent = '';

      vanesContent = generateVanesHtmlReport(t,imageHtml,loc.vanes);

      let locationCoverPageHtml  = generateLocationSectionHtmlReport(
        reportPlaceholders.LOCATION,
        loc.external_id,
        reportPlaceholders.REPORT_VANE_TITLE,
        reportPlaceholders.PROJECT_NAME_HEADER,
        reportPlaceholders.PROJECT_NAME,
        reportPlaceholders.CREATED_BY_HEADER,
        reportPlaceholders.CREATED_BY,
        reportPlaceholders.CREATION_DATE_HEADER,
        reportPlaceholders.CREATION_DATE,
        vanesContent
      );

      if(locIndx == 0){

        locationCoverPageHtml = locationCoverPageHtml.replace('page-break-before: always;', '');
      }

      allVanesHtml += locationCoverPageHtml;

      qtyVanes += loc.vanes.length;

    })

    if(qtyVanes > 0){
      // Combine all cantilevers' HTML into a single document
      baseHtmlContent = baseHtmlContent.replace("{{VANES_SECTION}}", allVanesHtml);

    }else{

      baseHtmlContent = baseHtmlContent.replace("{{VANES_SECTION}}", "");
    }

  }else{

    baseHtmlContent = baseHtmlContent.replace("{{VANES_SECTION}}", "");

  }



  let fullHtmlContent = baseHtmlContent;


  /********************************** GENERATION OF REPORT WITH FOOTER AND HEADER ******************************************/

  const footerTemplate = generateFooterHtmlReport(t);

  const headerTemplate = generateHeaderHtmlReport(t,process.env.APP_NAME,process.env.APP_VERSION,timezone);

  const marginTop = '60px';
  const marginBottom = '60px';

  const pdfBuffer = await PuppeteerService.generatePdf(
      fullHtmlContent,
      headerTemplate,
      footerTemplate,
      marginTop,
      marginBottom
  );

  // Return PDF as response
  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cantilevers_report.pdf"`,
    },
  });
};
