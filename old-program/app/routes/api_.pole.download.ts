import type { LoaderFunction } from "@remix-run/node";
import { PuppeteerService } from '~/config/puppeteer.server';
import fs from "fs/promises";
import path from "path";
import { getPolesByTypeAndValue } from "~/db/pole/actions.server";
import i18nServer from "~/modules/i18next.server";
import { fileURLToPath } from 'url';
import { formatDate } from "~/utils/helper";
import { getTimezone } from "~/db/config/actions.server";
import { requireUser } from "~/db/auth/session.server";
import { requirePermission } from "~/db/permission/actions.server";
import { getLogoReport,generateCoverHTMLReport, generateHeaderSectionHtmlReport, generateCantileversHtmlReport , generateFooterHtmlReport, generateHeaderHtmlReport } from "~/db/config/report.server";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const loader: LoaderFunction = async ({ request }) => {
  // Ensure only GET requests are allowed
  if (request.method !== "GET") {
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }
  // Parse search params
  const url = new URL(request.url);

  const projectId    = parseInt(url.searchParams.get("projectId") || "", 10);
  const type = url.searchParams.get("type") as "external_id" | "via" | "location" | null;
  const value = url.searchParams.get("value") as string;
  const pov = url.searchParams.get("pov") || "local";

  const user = await requireUser(request);
  await requirePermission(user, 'view', 'Pole', projectId);

  // Validate type and value
  if (!type || !value ) {
    return Response.json({ error: "Invalid type or value" }, { status: 400 });
  }

  const poleDataArray = await getPolesByTypeAndValue(request, projectId, type, value, pov);
  if (!poleDataArray) {
    return Response.json({ error: "No poles found" }, { status: 404 });
  }

  const projectName = poleDataArray[0].pole.project;

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

  
  let pathfile = process.env.NODE_ENV == "production" ? "./templates/full_report_template.html" : "../config/templates/full_report_template.html";
  const templatePath = path.resolve(__dirname, pathfile);
  let baseHtmlContent = await fs.readFile(templatePath, "utf8");

  // Replace the report-level placeholders
  const reportPlaceholders = {
    COVER_PAGE_REPORT_TITLE: t("location.report.report_title"),
    COVER_PAGE_DESCRIPTION_TITLE: t("location.report.report_description_title"),
    PROJECT_NAME_HEADER: t("cantilever.report.project_name"),
    PROJECT_NAME: projectName,
    CREATED_BY_HEADER: t("cantilever.report.created_by"),
    CREATED_BY: user.username,  // Replace with actual created_by if applicable
    CREATION_DATE_HEADER: t("cantilever.report.creation_date"),
    CREATION_DATE: formatDate((new Date()).toString(), timezone),
    REVISION_HEADER: t("location.report.revision"),
    REVISION: "01",
    COVER_PAGE_CANTILEVER_REPORT_TITLE:t("location.report.cover_page_cantilever_title"),
    COVER_PAGE_CANTILEVER_DESCRIPTION_TITLE:t("location.report.cover_page_cantilever_description_title"),
    REPORT_CANTILEVER_TITLE: t("cantilever.report.title"),
  };

  for (const [key, value] of Object.entries(reportPlaceholders)) {
    const placeholder = `{{${key}}}`;
    baseHtmlContent = baseHtmlContent.replace(new RegExp(placeholder, 'g'), value);
  }

  let companyLogoHtml = await getLogoReport();

   baseHtmlContent = baseHtmlContent.replace(new RegExp("{{COVER_PAGE_LOGO_COMPANY}}", 'g'), companyLogoHtml);

  /********************************** CANTILEVER  REPORT PART ******************************************/

  let allCantileversHtml  = generateCoverHTMLReport(
    companyLogoHtml,
    reportPlaceholders.COVER_PAGE_CANTILEVER_REPORT_TITLE,
    reportPlaceholders.COVER_PAGE_CANTILEVER_DESCRIPTION_TITLE,
    false
  );

  let qtyCantilevers = 0;

  let cantileversContent = '';
  
  poleDataArray.forEach(pole => {

    cantileversContent += generateCantileversHtmlReport(
      t,
      pole.pole.location,
      pole.pole.via,
      pole.pole.external_id,
      pole.cantilevers
    );
    
    qtyCantilevers += pole.cantilevers.length;

  });

  let cantileversWithHeaderPageHtml  = generateHeaderSectionHtmlReport(
    reportPlaceholders.REPORT_CANTILEVER_TITLE,
    reportPlaceholders.PROJECT_NAME_HEADER,
    reportPlaceholders.PROJECT_NAME,
    reportPlaceholders.CREATED_BY_HEADER,
    reportPlaceholders.CREATED_BY,
    reportPlaceholders.CREATION_DATE_HEADER,
    reportPlaceholders.CREATION_DATE,
    cantileversContent
  );

  allCantileversHtml += cantileversWithHeaderPageHtml;

  // Combine all cantilevers' HTML into a single document
  if(qtyCantilevers > 0){

    baseHtmlContent = baseHtmlContent.replace("{{CANTILEVERS_SECTION}}", allCantileversHtml);

  }else{

    baseHtmlContent = baseHtmlContent.replace("{{CANTILEVERS_SECTION}}", "");
  }

  baseHtmlContent = baseHtmlContent.replace("{{VANES_SECTION}}", "");

  // Combine all cantilevers' HTML into a single document
  let fullHtmlContent = baseHtmlContent;

// Add header and footer
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
