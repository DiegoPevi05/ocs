import type { LoaderFunction } from "@remix-run/node";
import { PuppeteerService } from '~/config/puppeteer.server';
import fs from "fs/promises";
import path from "path";
import { getPolesByTypeAndValue } from "~/db/pole/actions.server";
import i18nServer from "~/modules/i18next.server";
import { fileURLToPath } from 'url';
import { formatDate } from "~/utils/helper";
import { getTimezone } from "~/db/config/actions.server";

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
  const type  = url.searchParams.get("type") as "location_id" | "via_id"  | null;
  const value = url.searchParams.get("value") as string;
  const type_report = url.searchParams.get("type_report") as string;

  // Validate type and value
  if (!type || !value ) {
    return Response.json({ error: "Invalid type or value" }, { status: 400 });
  }

  const poleDataArray = await getPolesByTypeAndValue(request, projectId, type, value, "global");
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

  
  let pathfile = process.env.NODE_ENV == "production" ? "./templates/cantilever_report_template.html" : "../config/templates/cantilever_report_template.html";
  const templatePath = path.resolve(__dirname, pathfile);
  let baseHtmlContent = await fs.readFile(templatePath, "utf8");

  // Replace the report-level placeholders
  const reportPlaceholders = {
    PROJECT_NAME_HEADER: t("cantilever.report.project_name"),
    PROJECT_NAME: projectName,
    REPORT_TITLE: t("cantilever.report.title"),
    CREATED_BY_HEADER: t("cantilever.report.created_by"),
    CREATED_BY: poleDataArray[0].pole.created_by,  // Replace with actual created_by if applicable
    CREATION_DATE_HEADER: t("cantilever.report.creation_date"),
    CREATION_DATE: formatDate((new Date()).toString(), timezone),
  };

  for (const [key, value] of Object.entries(reportPlaceholders)) {
    const placeholder = `{{${key}}}`;
    baseHtmlContent = baseHtmlContent.replace(new RegExp(placeholder, 'g'), value);
  }

  let allCantileversHtml = '';
  
  poleDataArray.forEach(pole => {
    // Generate cantilever-specific HTML content
    allCantileversHtml += pole.cantilevers.map((cant:CantileverDataContent) => {
      const cantileverPlaceholders = {
        EXTERNAL_ID: cant.cantilever.external_id,
        LOCATION_HEADER: t("cantilever.report.location"),
        LOCATION: cant.cantilever.location,
        VIA_HEADER: t("cantilever.report.via"),
        VIA: cant.cantilever.via,
        POLE_HEADER: t("cantilever.report.pole"),
        POLE: cant.cantilever.pole,
        NAME_HEADER: t("cantilever.report.name"),
        DIAMETER_HEADER: t("cantilever.report.diameter"),
        THICKNESS_HEADER: t("cantilever.report.thickness"),
        TUBE_LENGTH_HEADER: t("cantilever.report.tube_length"),
        CUT_LENGTH_HEADER: t("cantilever.report.cut_length"),
      };

      const cantileverHtml = `
        <div class="table-container">
          <table>
            <thead>
              <tr class="title">
                <th colspan="6">${cantileverPlaceholders.EXTERNAL_ID}</th>
              </tr>
              <tr class="headings">
                <th>${cantileverPlaceholders.LOCATION_HEADER}</th>
                <th>${cantileverPlaceholders.LOCATION}</th>
                <th>${cantileverPlaceholders.VIA_HEADER}</th>
                <th>${cantileverPlaceholders.VIA}</th>
                <th>${cantileverPlaceholders.POLE_HEADER}</th>
                <th>${cantileverPlaceholders.POLE}</th>
              </tr>
            </thead>
          </table>
          <table>
            <thead>
              <tr class="headers">
                <th>${cantileverPlaceholders.NAME_HEADER}</th>
                <th>${cantileverPlaceholders.DIAMETER_HEADER} (mm)</th>
                <th>${cantileverPlaceholders.THICKNESS_HEADER} (mm)</th>
                <th>${cantileverPlaceholders.TUBE_LENGTH_HEADER} (mm)</th>
                <th>${cantileverPlaceholders.CUT_LENGTH_HEADER} (mm)</th>
              </tr>
            </thead>
            <tbody>
              ${cant.results.map(result => `
                <tr>
                  <td>${t(`cantilever.fields.params.`+result.name+'.name')}</td>
                  <td>${result.diameter}</td>
                  <td>${result.thickness}</td>
                  <td>${result.length_tube}</td>
                  <td>${result.cut_length}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
      return cantileverHtml;
    }).join('');
    
  });
  // Combine all cantilevers' HTML into a single document
  let fullHtmlContent = baseHtmlContent.replace("{{ALL_CANTILEVERS}}", allCantileversHtml);

// Add header and footer
  const footerTemplate = `
    <div style="font-size:10px; text-align:center; width:100%; margin:10px 0;">
      ${t("cantilever.report.page")} <span class="pageNumber"></span> ${t("cantilever.report.page_of")} <span class="totalPages"></span><br>
      <span style="margin-top:10px; display:block;">© Gelly Consulting ${t("cantilever.report.rights_reserved")}  ${new Date().getFullYear()}</span>
    </div>
  `;

  const headerTemplate = `
    <div style="font-size:10px; text-align:center; width:100%; margin:10px 0;">
      ${process.env.APP_NAME} ${process.env.APP_VERSION} - ${t("cantilever.report.generated")}: ${formatDate((new Date()).toString(), timezone)}
    </div>
  `;

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
