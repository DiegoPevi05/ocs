// app/routes/api/via/loader.ts
import {
  unstable_parseMultipartFormData,
  unstable_createMemoryUploadHandler,
  json,
} from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import DxfParser from "dxf-parser";

export const action: ActionFunction = async ({ request }) => {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  console.log("this is executed");

  const uploadHandler = unstable_createMemoryUploadHandler({
    maxPartSize: 10_000_000, // hasta 10MB por archivo
  });

  const formData = await unstable_parseMultipartFormData(request, uploadHandler);
  const file = formData.get("viaFile");

  if (!(file instanceof File)) {
    return json({ error: "No se recibió un archivo válido" }, { status: 400 });
  }

  const content = await file.text();

  console.log(content);

  try {
    const parser = new DxfParser();
    const dxf = parser.parseSync(content);

    const polylines = dxf.entities.filter(
      (e: any) => e.type === "LWPOLYLINE" || e.type === "POLYLINE"
    );

    console.log("📦 Polilíneas recibidas:");
    polylines.forEach((poly: any, i: number) => {
      console.log(`🌀 Polilínea ${i + 1} – Capa: ${poly.layer}`);
      const vertices = poly.vertices;

      for (let j = 0; j < vertices.length - 1; j++) {
        const v1 = vertices[j];
        const v2 = vertices[j + 1];
        const bulge = v1.bulge || 0;

        console.log(`  (${v1.x}, ${v1.y}) → (${v2.x}, ${v2.y}) | Bulge: ${bulge}`);

        if (bulge !== 0) {
          const dx = v2.x - v1.x;
          const dy = v2.y - v1.y;
          const chord = Math.hypot(dx, dy);
          const radius = (chord * (1 + bulge * bulge)) / (4 * Math.abs(bulge));
          const alpha = Math.atan2(dy, dx);
          const theta = 4 * Math.atan(bulge);
          const d = radius * Math.sin(theta / 2);
          const mx = (v1.x + v2.x) / 2;
          const my = (v1.y + v2.y) / 2;
          const offsetAngle = alpha + (bulge > 0 ? Math.PI / 2 : -Math.PI / 2);
          const cx = mx + d * Math.cos(offsetAngle);
          const cy = my + d * Math.sin(offsetAngle);

          console.log(`    → Arco detectado`);
          console.log(`      Radio: ${radius.toFixed(4)}`);
          console.log(`      Centro: (${cx.toFixed(4)}, ${cy.toFixed(4)})`);
          console.log(`      Sentido: ${bulge < 0 ? "Horario" : "Antihorario"}`);
        }
      }
    });

    return json({
      message: "Polilíneas parseadas correctamente",
      count: polylines.length,
    });
  } catch (err: any) {
    console.error("Error al parsear DXF:", err);
    return json({ error: "Fallo al parsear el DXF" }, { status: 500 });
  }
};
