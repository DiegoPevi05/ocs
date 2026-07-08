import type { LoaderFunction } from "@remix-run/node";
import { PuppeteerService } from '~/config/puppeteer.server';
import fs from "fs/promises";
import path from "path";
import { getVanesByTypeAndValue } from "~/db/vane/actions.server";
import i18nServer from "~/modules/i18next.server";
import { fileURLToPath } from 'url';
import {formatDate} from "~/utils/helper";
import {getTimezone} from "~/db/config/actions.server";

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
  const type = url.searchParams.get("type") as "external_id" | "location" | null;
  const value = url.searchParams.get("value") as string;

  // Validate type and value
  if (!type || !value ) {
    return Response.json({ error: "Invalid type or value" }, { status: 400 });
  }

  const vaneDataArray = await getVanesByTypeAndValue(request,projectId, type, value, "global");
  if (!vaneDataArray) {
    return Response.json({ error: "No vanes found" }, { status: 404 });
  }

  const timezoneDB = await getTimezone(projectId);
  const timezone = timezoneDB ? timezoneDB : "America/Buenos_Aires";

  const projectName = vaneDataArray[0].vane.project;

  if (!projectName) {
    return Response.json({ error: "Project not found" }, { status: 404 });
  }

  const language = request.headers.get("Accept-Language") || "en";
  const t = await i18nServer.getFixedT(language);


  let pathfile = process.env.NODE_ENV == "production" ? "./templates/vane_report_template.html" : "../config/templates/vane_report_template.html";
  const templatePath = path.resolve(__dirname, pathfile);
  let baseHtmlContent = await fs.readFile(templatePath, "utf8");

  // Replace the report-level placeholders
  const reportPlaceholders = {
    PROJECT_NAME_HEADER: t("vane.report.project_name"),
    PROJECT_NAME: projectName,
    REPORT_TITLE: t("vane.report.title"),
    CREATED_BY_HEADER: t("vane.report.created_by"),
    CREATED_BY: vaneDataArray[0].vane.created_by,  // Replace with actual created_by if applicable
    CREATION_DATE_HEADER: t("vane.report.creation_date"),
    CREATION_DATE: formatDate(new Date().toString(),timezone),
  };

  for (const [key, value] of Object.entries(reportPlaceholders)) {
    const placeholder = `{{${key}}}`;
    baseHtmlContent = baseHtmlContent.replace(new RegExp(placeholder, 'g'), value);
  }

  // Read and encode the image
  //
    let NormalVanePathFile = process.env.NODE_ENV == "production" ? "./templates/vanes_types/normal_vane.png" : "../config/templates/vanes_types/normal_vane.png";
    let DropperSchemaPathFile = process.env.NODE_ENV == "production" ? "./templates/vanes_types/dropper_schema.PNG" : "../config/templates/vanes_types/dropper_schema.PNG";
    const imagePath = path.resolve(__dirname, NormalVanePathFile);
    const dropperSchemaPath = path.resolve(__dirname, DropperSchemaPathFile);

    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString("base64");
    const imageDataUrl = `data:image/png;base64,${imageBase64}`;

    const dropperSchemaBuffer = await fs.readFile(dropperSchemaPath);
    const dropperSchemaBase64 = dropperSchemaBuffer.toString("base64");
    const dropperSchemaDataUrl = `data:image/png;base64,${dropperSchemaBase64}`;

    // Generate image HTML with styling
    const imageHtml = `
      <div style="break-before: page; margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px; overflow: hidden; margin: 10px 0px; display:flex; flex-wrap:no-wrap; flex-direction:row; position:relative; gap: 1%;">
        <img src="${imageDataUrl}" style="width: 79%; height: auto; object-fit: contain; border-right: 1px solid #ddd;" />
        <img src="${dropperSchemaDataUrl}" style="width: 20%; height: auto; object-fit: contain;" />
      </div>
    `;


  const titles:string[] = [
    "vane.report.droppers",
    "vane.report.installation_length",
    "vane.report.distance_eye_to_eye",
    "vane.report.distance_cw",
    "vane.report.distance_pole_dropper",
    "vane.report.distance_dropper_dropper",
    "vane.report.distance_cw_h",
    "vane.report.dropper_inclination",
  ]

  // Generate cantilever-specific HTML content
  //
  // Generate vane HTML function
  const generateVaneHtml = ({ vane, results }: typeof vaneDataArray[0]) => {
    const vanePlaceholders = {
      EXTERNAL_ID: vane.external_id,
      LOCATION_HEADER: t("vane.report.location"),
      LOCATION: vane.location,
      POLE_NAME_A_HEADER: t("vane.report.pole_name_a"),
      POLE_NAME_A: vane.params.default_properties.pole_name_a,
      POLE_NAME_B_HEADER: t("vane.report.pole_name_b"),
      POLE_NAME_B: vane.params.default_properties.pole_name_b,
      VANE_LENGTH_HEADER: t("vane.report.vane_length"),
      VANE_LENGTH: vane.params.default_properties.vane_length,
      CONTACT_WIRE_HEADER: t("vane.report.contact_wire"),
      CONTACT_WIRE: vane.params.contact_wire.tension_force,
      SUPPORT_WIRE_HEADER: t("vane.report.support_wire"),
      SUPPORT_WIRE_WIRE: vane.params.support_wire.tension_force,
      L1_HEADER: t("vane.report.l1"),
      L1: vane.params.initial_separation,
      NAME_HEADER: t("vane.report.name"),
      DIAMETER_HEADER: t("vane.report.diameter"),
      THICKNESS_HEADER: t("vane.report.thickness"),
      TUBE_LENGTH_HEADER: t("vane.report.tube_length"),
      CUT_LENGTH_HEADER: t("vane.report.cut_length"),
    };

    return `
      <div class="table-container" style="margin-bottom: 20px;">
        <table>
          <thead>
            <tr class="title">
              <th colspan="8">${vanePlaceholders.EXTERNAL_ID}</th>
            </tr>
            <tr class="headings">
              <th colspan="4">${vanePlaceholders.LOCATION_HEADER}</th>
              <th colspan="4">${vanePlaceholders.LOCATION}</th>
            </tr>
            <tr class="headings">
              <th colspan="3">${vanePlaceholders.POLE_NAME_A_HEADER}</th>
              <th>${vanePlaceholders.POLE_NAME_A}</th>
              <th colspan="3">${vanePlaceholders.POLE_NAME_B_HEADER}</th>
              <th>${vanePlaceholders.POLE_NAME_B}</th>
            </tr>
            <tr class="headings">
              <th colspan="3">${vanePlaceholders.VANE_LENGTH_HEADER}</th>
              <th>${vanePlaceholders.VANE_LENGTH}</th>
              <th colspan="3">${vanePlaceholders.L1_HEADER}</th>
              <th>${vanePlaceholders.L1}</th>
            </tr>
            <tr class="headings">
              <th colspan="3">${vanePlaceholders.CONTACT_WIRE_HEADER}</th>
              <th>${vanePlaceholders.CONTACT_WIRE}</th>
              <th colspan="3">${vanePlaceholders.SUPPORT_WIRE_HEADER}</th>
              <th>${vanePlaceholders.SUPPORT_WIRE_WIRE}</th>
            </tr>
          </thead>
        </table>
        <table>
          <thead>
            <tr>
              <th class="headers">${t(titles[0])}</th>
              ${Array.from({ length: results[0].length }).map((_, colIndex) => `
                <th key={colIndex} class="headers dropper-values">
                  ${colIndex === 0 
                    ? 'A' 
                    : colIndex === results[0].length - 1 
                      ? 'B' 
                      : colIndex}
                </th>
              `).join('')}
            </tr>
          </thead>
          <tbody>
            ${results.map((row, rowIndex) => `
              <tr>
                <td>${t(titles[rowIndex + 1])}</td>
                ${row.map((cell) => `
                  <td class="dropper-values">
                    ${cell.toFixed(2)}
                  </td>
                `).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  // Group vanes into sets of two with an imageHtml at the start of each set
  let allVanesHtml = '';
  for (let i = 0; i < vaneDataArray.length; i += 2) {
    const vane1 = vaneDataArray[i];
    const vane2 = vaneDataArray[i + 1]; // Might be undefined if odd number
    allVanesHtml += imageHtml; // Start each group with the image
    allVanesHtml += generateVaneHtml(vane1);
    if (vane2) {
      allVanesHtml += generateVaneHtml(vane2);
    }
  }

  // Remove the `break-before: page` from the first imageHtml to avoid an empty first page
  allVanesHtml = allVanesHtml.replace('break-before: page;', '');

  // Combine all cantilevers' HTML into a single document
  let fullHtmlContent = baseHtmlContent.replace("{{ALL_VANES}}", allVanesHtml);

// Add header and footer
  const footerTemplate = `
    <div style="font-size:10px; text-align:center; width:100%; margin:10px 0;">
      ${t("vane.report.page")} <span class="pageNumber"></span> ${t("vane.report.page_of")} <span class="totalPages"></span><br>
      <span style="margin-top:10px; display:block;">© Gelly Consulting ${t("vane.report.rights_reserved")}  ${new Date().getFullYear()}</span>
    </div>
  `;

  const headerTemplate = `
    <div style="font-size:10px; text-align:center; width:100%; margin:10px 0;">
      ${process.env.APP_NAME} ${process.env.APP_VERSION} - ${t("vane.report.generated")}:  ${formatDate(new Date().toString(),timezone)} 
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
      "Content-Disposition": `attachment; filename="vanes_report.pdf"`,
    },
  });
};
