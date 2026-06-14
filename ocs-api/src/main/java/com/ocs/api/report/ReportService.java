package com.ocs.api.report;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.*;
import com.ocs.api.calculator.CalculatorClient;
import com.ocs.api.locations.Location;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.ByteArrayOutputStream;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class ReportService {

    private final CalculatorClient calculatorClient;
    private final ObjectMapper mapper;

    public ReportService(CalculatorClient calculatorClient, ObjectMapper mapper) {
        this.calculatorClient = calculatorClient;
        this.mapper = mapper;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public entry point
    // ─────────────────────────────────────────────────────────────────────────

    public Mono<byte[]> generateLocationReport(Location location) {
        JsonNode sceneData;
        try {
            String raw = location.getSceneData();
            if (raw == null || raw.isBlank()) return Mono.error(new RuntimeException("Location has no scene data"));
            sceneData = mapper.readTree(raw);
        } catch (Exception e) {
            return Mono.error(new RuntimeException("Failed to parse scene data", e));
        }

        JsonNode polesNode      = sceneData.path("poles");
        JsonNode cantiNode      = sceneData.path("cantilevers");
        JsonNode vanesNode      = sceneData.path("vanes");

        // ── Build cantilever batch payload ────────────────────────────────────
        ArrayNode cantPayloads = mapper.createArrayNode();
        List<Integer> cantQtyPerInput = new ArrayList<>();

        if (cantiNode.isArray()) {
            for (JsonNode c : cantiNode) {
                double x1 = c.path("x1").asDouble(), z1 = c.path("z1").asDouble();
                int cantQty = 1; double catSep = 720;
                if (polesNode.isArray()) {
                    for (JsonNode pole : polesNode) {
                        if (Math.hypot(pole.path("x").asDouble() - x1,
                                       pole.path("z").asDouble() - z1) < 500) {
                            cantQty = pole.path("cantileversQuantity").asInt(1);
                            catSep  = pole.path("catSeparation").asDouble(720);
                            break;
                        }
                    }
                }
                ObjectNode p = mapper.createObjectNode();
                p.put("configuration", c.path("configuration").asText("TDP>2.2"));
                ArrayNode pp = mapper.createArrayNode(); pp.add(x1).add(0.0).add(z1); p.set("polePosition", pp);
                double fx = c.has("x2raw") ? c.path("x2raw").asDouble() : c.path("x2").asDouble();
                double fz = c.has("z2raw") ? c.path("z2raw").asDouble() : c.path("z2").asDouble();
                ArrayNode pv = mapper.createArrayNode(); pv.add(fx).add(0.0).add(-fz); p.set("pv", pv);
                p.put("contactWireHeight",        c.path("contactWireHeight").asDouble(5400));
                p.put("systemHeight",             c.path("systemHeight").asDouble(1000));
                p.put("contactWireVerticalOffset",c.path("contactWireVerticalOffset").asDouble(120));
                p.put("zigzag",                   c.path("zigzag").asDouble(250));
                p.put("supportOffset",            c.path("supportOffset").asDouble(1440));
                p.put("fixingDistance",           c.path("fixingDistance").asDouble(1500));
                p.put("bottomFixedHeight",        c.path("bottomFixedHeight").asDouble(5440));
                p.put("u",                        c.path("u").asDouble(0));
                p.put("curveRadiusDirection",     c.path("curveRadiusDirection").asText("inside"));
                p.put("trackGauge",               c.path("trackGauge").asDouble(1435));
                p.put("steadyArmAlpha",           c.path("steadyArmAlpha").asDouble(-2));
                p.put("registerArmAlpha",         c.path("registerArmAlpha").asDouble(2));
                p.put("steadyArmLength",          c.path("steadyArmLength").asDouble(1200));
                p.put("cantileversQuantity", cantQty);
                p.put("catSeparation", catSep);
                cantPayloads.add(p);
                cantQtyPerInput.add(cantQty);
            }
        }

        // ── Build vane payloads ───────────────────────────────────────────────
        List<Mono<JsonNode>> vaneMonos = new ArrayList<>();
        if (vanesNode.isArray() && cantiNode.isArray()) {
            JsonNode[] cArr = new JsonNode[cantiNode.size()];
            int ci = 0; for (JsonNode c : cantiNode) cArr[ci++] = c;

            for (int vi = 0; vi < vanesNode.size(); vi++) {
                JsonNode v   = vanesNode.get(vi);
                int c1i = v.path("cantileverIdx1").asInt(-1);
                int c2i = v.path("cantileverIdx2").asInt(-1);
                if (c1i < 0 || c2i < 0 || c1i >= cArr.length || c2i >= cArr.length) {
                    final int fVi = vi;
                    vaneMonos.add(Mono.just(mapper.createObjectNode().put("_vi", fVi).put("status","skip")));
                    continue;
                }
                JsonNode c1 = cArr[c1i], c2 = cArr[c2i];
                double cwH1 = c1.path("contactWireHeight").asDouble(5400), sH1 = c1.path("systemHeight").asDouble(1000);
                double cwo1 = c1.path("contactWireVerticalOffset").asDouble(120);
                double cwH2 = c2.path("contactWireHeight").asDouble(5400), sH2 = c2.path("systemHeight").asDouble(1000);
                double cwo2 = c2.path("contactWireVerticalOffset").asDouble(120);

                ObjectNode vp = mapper.createObjectNode();
                ArrayNode cwS = mapper.createArrayNode(); cwS.add(c1.path("x2").asDouble()).add(cwH1 + cwo1).add(-c1.path("z2").asDouble()); vp.set("cw_start", cwS);
                ArrayNode swS = mapper.createArrayNode(); swS.add(c1.path("x2").asDouble()).add(cwH1 + cwo1 + sH1).add(-c1.path("z2").asDouble()); vp.set("sw_start", swS);
                ArrayNode cwE = mapper.createArrayNode(); cwE.add(c2.path("x2").asDouble()).add(cwH2 + cwo2).add(-c2.path("z2").asDouble()); vp.set("cw_end", cwE);
                ArrayNode swE = mapper.createArrayNode(); swE.add(c2.path("x2").asDouble()).add(cwH2 + cwo2 + sH2).add(-c2.path("z2").asDouble()); vp.set("sw_end", swE);
                vp.put("qty_droppers",      v.path("qtyDroppers").asInt(0));
                vp.put("initial_separation",v.path("initialSeparation").asDouble(5000));
                vp.put("step_size",         500);
                vp.put("cw_weight",         v.path("cwWeight").asDouble(0.0019));
                vp.put("cw_tension",        v.path("cwTension").asDouble(1600));
                vp.put("sw_weight",         v.path("swWeight").asDouble(0.0024));
                vp.put("sw_tension",        v.path("swTension").asDouble(2000));
                vp.put("dropper_weight",    v.path("dropperWeight").asDouble(0.0006));
                final int fVi = vi;
                vaneMonos.add(calculatorClient.calculateVane(vp)
                    .map(vr -> { ObjectNode e = mapper.createObjectNode(); e.put("_vi", fVi); e.put("status","success"); e.set("vane", vr.get("vane")); return (JsonNode) e; })
                    .onErrorResume(err -> Mono.just(mapper.createObjectNode().put("_vi", fVi).put("status","error"))));
            }
        }

        // ── Fan-out calculation then build PDF ────────────────────────────────
        Mono<JsonNode> batchMono = cantPayloads.size() > 0
                ? calculatorClient.calculateBatch(cantPayloads)
                : Mono.just(mapper.createObjectNode());

        Mono<List<JsonNode>> allVanesMono = vaneMonos.isEmpty()
                ? Mono.just(Collections.emptyList())
                : Flux.fromIterable(vaneMonos).flatMap(m -> m).collectList();

        return Mono.zip(batchMono, allVanesMono)
                .map(t -> buildPdf(location, sceneData, cantQtyPerInput, t.getT1(), t.getT2()));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // PDF assembly
    // ─────────────────────────────────────────────────────────────────────────

    private byte[] buildPdf(Location location, JsonNode sceneData,
                            List<Integer> cantQtyPerInput, JsonNode batchResult,
                            List<JsonNode> vaneResults) {
        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            PdfWriter  writer = new PdfWriter(baos);
            PdfDocument pdf   = new PdfDocument(writer);
            Document   doc    = new Document(pdf, PageSize.A4);
            doc.setMargins(40, 40, 40, 40);

            JsonNode polesNode = sceneData.path("poles");
            JsonNode cantiNode = sceneData.path("cantilevers");
            JsonNode vanesNode = sceneData.path("vanes");

            JsonNode batchPoles = batchResult.path("poles");
            int[] outputOffset = new int[cantQtyPerInput.size()];
            int off = 0;
            for (int i = 0; i < cantQtyPerInput.size(); i++) {
                outputOffset[i] = off;
                off += cantQtyPerInput.get(i);
            }

            // ── Cover page ────────────────────────────────────────────────────
            addCoverPage(doc, location);

            // ── Cantilever section title page ─────────────────────────────────
            addSectionTitlePage(doc, "CANTILEVER RESULTS",
                    "Component dimensions for each pole and catenary wire");
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

            if (polesNode.isArray() && cantiNode.isArray()) {
                int poleNumber = 1;
                for (JsonNode pole : polesNode) {
                    double px = pole.path("x").asDouble(), pz = pole.path("z").asDouble();
                    String poleLabel = pole.path("label").asText(null);
                    String poleTitle = "Pole " + poleNumber + (poleLabel != null ? " — " + poleLabel : "");

                    List<Integer> myCantiIdxs = new ArrayList<>();
                    int ci = 0;
                    for (JsonNode c : cantiNode) {
                        if (Math.hypot(c.path("x1").asDouble() - px, c.path("z1").asDouble() - pz) < 500)
                            myCantiIdxs.add(ci);
                        ci++;
                    }
                    if (myCantiIdxs.isEmpty()) { poleNumber++; continue; }

                    addPoleHeader(doc, poleTitle, px, pz);

                    for (int cantiIdx : myCantiIdxs) {
                        JsonNode cNode = cantiNode.get(cantiIdx);
                        String cantiLabel = cNode.path("label").asText(null);
                        String cfg = cNode.path("configuration").asText("TDP>2.2");
                        int cantQty = cantiIdx < cantQtyPerInput.size() ? cantQtyPerInput.get(cantiIdx) : 1;

                        for (int k = 0; k < cantQty; k++) {
                            String subTitle = "Cantilever " + (cantiIdx + 1)
                                    + (cantQty > 1 ? " · Wire " + (k + 1) : "")
                                    + " · " + cfg
                                    + (cantiLabel != null ? " · " + cantiLabel : "");
                            addCantiSubHeader(doc, subTitle);

                            int outIdx = (cantiIdx < outputOffset.length ? outputOffset[cantiIdx] : -1) + k;
                            JsonNode poleOut = (batchPoles.isArray() && outIdx >= 0 && outIdx < batchPoles.size())
                                    ? batchPoles.get(outIdx) : null;
                            JsonNode cResults = poleOut != null
                                    ? poleOut.path("cantilevers").path(0).path("results")
                                    : null;
                            addCantileverResultsTable(doc, cResults);
                        }
                    }

                    doc.add(new Paragraph("").setMarginBottom(10));
                    poleNumber++;
                }
            } else {
                doc.add(new Paragraph("No cantilever data available.").setFontSize(9).setMarginTop(8));
            }

            // ── Vane section title page ───────────────────────────────────────
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            addSectionTitlePage(doc, "VANE RESULTS",
                    "Dropper lengths and distances for each inter-pole vane");
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

            Map<Integer, JsonNode> vaneMap = new LinkedHashMap<>();
            for (JsonNode vr : vaneResults) {
                int vIdx = vr.path("_vi").asInt(-1);
                if (vIdx >= 0 && "success".equals(vr.path("status").asText())) vaneMap.put(vIdx, vr);
            }

            if (vanesNode.isArray() && !vaneMap.isEmpty()) {
                JsonNode[] cArr = new JsonNode[cantiNode.size()];
                int ci2 = 0; for (JsonNode c : cantiNode) cArr[ci2++] = c;

                int configuredMaxDroppers = 11;
                try {
                    String pSettingsRaw = location.getProject() != null ? location.getProject().getSettings() : null;
                    if (pSettingsRaw != null && !pSettingsRaw.isBlank()) {
                        JsonNode pSettings = mapper.readTree(pSettingsRaw);
                        if (pSettings.has("vane") && pSettings.get("vane").has("reportMaxDroppers")) {
                            configuredMaxDroppers = pSettings.get("vane").get("reportMaxDroppers").asInt(11);
                        }
                    }
                } catch (Exception ignored) { }

                addAllVanesTable(doc, vanesNode, vaneMap, cArr, configuredMaxDroppers);
            } else {
                doc.add(new Paragraph("No vane data available.").setFontSize(9).setMarginTop(8));
            }

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Page elements - Black & White Styling
    // ─────────────────────────────────────────────────────────────────────────

    private void addCoverPage(Document doc, Location location) {
        doc.add(new Paragraph("").setMarginTop(120));

        doc.add(new Paragraph("OCS TECHNICAL REPORT")
            .setBold().setFontSize(22)
            .setBorderBottom(new SolidBorder(2f))
            .setPaddingBottom(10));

        doc.add(new Paragraph(location.getName()).setBold().setFontSize(14).setMarginTop(16));

        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        doc.add(new Paragraph("Generated: " + date).setFontSize(10));

        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
    }

    private void addSectionTitlePage(Document doc, String title, String subtitle) {
        doc.add(new Paragraph("").setMarginTop(120));
        
        doc.add(new Paragraph(title)
            .setBold().setFontSize(20)
            .setBorderBottom(new SolidBorder(2f))
            .setPaddingBottom(10));

        doc.add(new Paragraph(subtitle).setFontSize(11).setMarginTop(14));
    }

    private void addPoleHeader(Document doc, String title, double x, double z) {
        String pos = String.format("  -  x: %.0f  z: %.0f", x, z);
        doc.add(new Paragraph(title + pos)
            .setBold().setFontSize(11)
            .setMarginTop(15).setMarginBottom(4));
    }

    private void addCantiSubHeader(Document doc, String title) {
        doc.add(new Paragraph(title)
            .setFontSize(10).setItalic()
            .setMarginLeft(10).setMarginBottom(4));
    }

    private void addCantileverResultsTable(Document doc, JsonNode results) {
        String[] headers = {"Component", "Length (mm)", "Cut Length (mm)", "Diameter (mm)", "Thickness (mm)"};
        float[]  widths  = {44, 14, 14, 14, 14};

        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth()
                .setMarginLeft(10).setMarginBottom(10);

        for (int i = 0; i < headers.length; i++) {
            table.addHeaderCell(thCell(headers[i], i == 0 ? TextAlignment.LEFT : TextAlignment.RIGHT));
        }

        if (results != null && results.isArray() && results.size() > 0) {
            int n = results.size();
            for (int i = 0; i < n; i++) {
                JsonNode r = results.get(i);
                boolean isLast = (i == n - 1);
                String rawName = r.path("name").asText("-");
                String translatedName = translateComponentName(rawName);
                table.addCell(tdCell(translatedName, TextAlignment.LEFT, isLast));
                table.addCell(tdCell(fmt1(r.path("length").asDouble()), TextAlignment.RIGHT, isLast));
                table.addCell(tdCell(fmt1(r.path("cut_length").asDouble()), TextAlignment.RIGHT, isLast));
                table.addCell(tdCell(fmt1(r.path("diameter").asDouble()), TextAlignment.RIGHT, isLast));
                table.addCell(tdCell(fmt1(r.path("thickness").asDouble()), TextAlignment.RIGHT, isLast));
            }
        } else {
            table.addCell(emptyCell(5));
        }

        doc.add(table);
    }

    private String translateComponentName(String name) {
        if (name == null) return "-";
        switch (name.toLowerCase()) {
            case "stay_tube": return "Stay Tube";
            case "bracket_tube": return "Bracket Tube";
            case "steady_arm": return "Steady Arm";
            case "register_arm": return "Register Arm";
            case "steel_cable": return "Steel Cable";
            case "reinforcement": return "Reinforcement";
            default:
                String[] words = name.split("_");
                StringBuilder sb = new StringBuilder();
                for (String w : words) {
                    if (w.length() > 0) {
                        sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1)).append(" ");
                    }
                }
                return sb.toString().trim();
        }
    }

    private void addAllVanesTable(Document doc, JsonNode vanesNode, Map<Integer, JsonNode> vaneMap, JsonNode[] cArr, int configuredMaxDroppers) {
        int actualMaxDroppers = 0;
        for (JsonNode vr : vaneMap.values()) {
            JsonNode droppers = vr.path("vane").path("results");
            if (droppers.isArray() && droppers.size() > actualMaxDroppers) {
                actualMaxDroppers = droppers.size();
            }
        }
        int maxDroppers = Math.max(configuredMaxDroppers, actualMaxDroppers);
        
        // Layout: Metric | Start Pole | 1 | 2 | ... | maxDroppers | End Pole
        int totalColumns = maxDroppers + 3;
        float[] widths = new float[totalColumns];
        widths[0] = 20f; // Metric
        widths[1] = 12f; // Start Pole
        for (int i = 2; i < totalColumns - 1; i++) widths[i] = 56f / maxDroppers; // Droppers
        widths[totalColumns - 1] = 12f; // End Pole

        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth()
                .setMarginLeft(0).setMarginBottom(10);

        // --- GLOBAL HEADER ---
        table.addHeaderCell(thCell("Metric", TextAlignment.LEFT));
        table.addHeaderCell(thCell("Start", TextAlignment.CENTER));
        for (int i = 1; i <= maxDroppers; i++) {
            table.addHeaderCell(thCell(String.valueOf(i), TextAlignment.CENTER));
        }
        table.addHeaderCell(thCell("End", TextAlignment.CENTER));

        for (int vi = 0; vi < vanesNode.size(); vi++) {
            JsonNode vNode = vanesNode.get(vi);
            String vaneLabel = vNode.path("label").asText("");
            if (vaneLabel.isBlank()) vaneLabel = "V" + (vi + 1);
            
            int c1i = vNode.path("cantileverIdx1").asInt(-1);
            int c2i = vNode.path("cantileverIdx2").asInt(-1);
            int p2i = vNode.path("poleIdx").asInt(-1);
            
            String fromLabel = (c1i >= 0 && c1i < cArr.length) ? cArr[c1i].path("label").asText("C" + (c1i + 1)) : "?";
            String toLabel;
            if (c2i >= 0 && c2i < cArr.length) {
                toLabel = cArr[c2i].path("label").asText("C" + (c2i + 1));
            } else if (p2i >= 0) {
                toLabel = "Pole " + (p2i + 1);
            } else {
                toLabel = "?";
            }
            
            JsonNode vr = vaneMap.get(vi);
            JsonNode droppers = (vr != null) ? vr.path("vane").path("results") : null;
            int numDroppers = (droppers != null && droppers.isArray()) ? Math.min(droppers.size(), maxDroppers) : 0;
            
            // --- VANE SUB-HEADER ROW ---
            table.addCell(new Cell()
                .add(new Paragraph(vaneLabel).setBold().setFontSize(9))
                .setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(1f)).setBorderBottom(new SolidBorder(1f))
                .setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(4).setTextAlignment(TextAlignment.LEFT));
                
            table.addCell(new Cell()
                .add(new Paragraph(fromLabel).setBold().setFontSize(9))
                .setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(1f)).setBorderBottom(new SolidBorder(1f))
                .setPaddingTop(4).setPaddingBottom(4).setTextAlignment(TextAlignment.CENTER));
                
            for (int i = 1; i <= maxDroppers; i++) {
                table.addCell(new Cell()
                    .add(new Paragraph("")).setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(1f)).setBorderBottom(new SolidBorder(1f)));
            }

            table.addCell(new Cell()
                .add(new Paragraph(toLabel).setBold().setFontSize(9))
                .setBorder(Border.NO_BORDER).setBorderTop(new SolidBorder(1f)).setBorderBottom(new SolidBorder(1f))
                .setPaddingTop(4).setPaddingBottom(4).setTextAlignment(TextAlignment.CENTER));
            
            if (numDroppers == 0) {
                table.addCell(new Cell(1, totalColumns)
                    .add(new Paragraph("No dropper results").setFontSize(8).setItalic())
                    .setBorder(Border.NO_BORDER).setBorderBottom(new SolidBorder(1f))
                    .setPadding(4).setTextAlignment(TextAlignment.CENTER));
                continue;
            }

            String[] metricLabels = {
                "Dropper Length (m)", "Eye-to-Eye (m)", "CW Dist (m)", "Dist from A (m)", "Tilt (°)"
            };
            String[] metricKeys = {
                "dropper_length", "distance_eye_to_eye", "distance_cw", "distance_pole_dropper", "dropper_inclination"
            };

            for (int m = 0; m < metricLabels.length; m++) {
                boolean isLastMetric = (m == metricLabels.length - 1);
                table.addCell(tdCell(metricLabels[m], TextAlignment.LEFT, isLastMetric));
                
                table.addCell(tdCell("-", TextAlignment.CENTER, isLastMetric)); // Pole A column
                
                for (int d = 0; d < maxDroppers; d++) {
                    if (d < numDroppers) {
                        JsonNode dropNode = droppers.get(d);
                        String val = fmt3(dropNode.path(metricKeys[m]).asDouble(0));
                        table.addCell(tdCell(val, TextAlignment.CENTER, isLastMetric));
                    } else {
                        table.addCell(tdCell("-", TextAlignment.CENTER, isLastMetric));
                    }
                }

                table.addCell(tdCell("-", TextAlignment.CENTER, isLastMetric)); // Pole B column
            }
        }
        
        doc.add(table);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cell helpers - Borders removed, simple lines added
    // ─────────────────────────────────────────────────────────────────────────

    private Cell thCell(String text, TextAlignment alignment) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(9))
                .setBorder(Border.NO_BORDER)
                .setBorderTop(new SolidBorder(1f))
                .setBorderBottom(new SolidBorder(1f))
                .setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(4).setPaddingRight(4)
                .setTextAlignment(alignment);
    }

    private Cell tdCell(String text, TextAlignment alignment, boolean isLastRow) {
        Cell cell = new Cell()
                .add(new Paragraph(text).setFontSize(9))
                .setBorder(Border.NO_BORDER)
                .setPaddingTop(3).setPaddingBottom(3).setPaddingLeft(4).setPaddingRight(4)
                .setTextAlignment(alignment);
        
        if (isLastRow) {
            cell.setBorderBottom(new SolidBorder(1f));
        }
        return cell;
    }

    private Cell emptyCell(int colspan) {
        return new Cell(1, colspan)
                .add(new Paragraph("No results").setFontSize(9))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(Border.NO_BORDER)
                .setBorderBottom(new SolidBorder(1f))
                .setPadding(6);
    }

    private String fmt1(double v) { return v == 0 ? "—" : String.format(Locale.US, "%.1f", v); }
    private String fmt3(double v) { return v == 0 ? "—" : String.format(Locale.US, "%.3f", v); }
}
