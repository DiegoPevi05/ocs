package com.ocs.api.report;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.Border;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.AreaBreak;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.LineSeparator;
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

    // ── Palette ───────────────────────────────────────────────────────────────
    private static final DeviceRgb C_NAVY     = new DeviceRgb(15,  23,  42);
    private static final DeviceRgb C_BLUE     = new DeviceRgb(37,  99,  235);
    private static final DeviceRgb C_HEADER   = new DeviceRgb(30,  41,  59);
    private static final DeviceRgb C_ROW_ALT  = new DeviceRgb(248, 250, 252);
    private static final DeviceRgb C_BORDER   = new DeviceRgb(203, 213, 225);
    private static final DeviceRgb C_TH_BG    = new DeviceRgb(241, 245, 249);
    private static final DeviceRgb C_MUTED    = new DeviceRgb(100, 116, 139);
    private static final DeviceRgb C_PURPLE   = new DeviceRgb(147, 51,  234);
    private static final DeviceRgb C_WHITE    = new DeviceRgb(255, 255, 255);

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
                double cwH2 = c2.path("contactWireHeight").asDouble(5400), sH2 = c2.path("systemHeight").asDouble(1000);
                ObjectNode vp = mapper.createObjectNode();
                ArrayNode cwS = mapper.createArrayNode(); cwS.add(c1.path("x2").asDouble()).add(cwH1).add(-c1.path("z2").asDouble()); vp.set("cw_start", cwS);
                ArrayNode swS = mapper.createArrayNode(); swS.add(c1.path("x2").asDouble()).add(cwH1+sH1).add(-c1.path("z2").asDouble()); vp.set("sw_start", swS);
                ArrayNode cwE = mapper.createArrayNode(); cwE.add(c2.path("x2").asDouble()).add(cwH2).add(-c2.path("z2").asDouble()); vp.set("cw_end", cwE);
                ArrayNode swE = mapper.createArrayNode(); swE.add(c2.path("x2").asDouble()).add(cwH2+sH2).add(-c2.path("z2").asDouble()); vp.set("sw_end", swE);
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

            // ── Pre-build a map: cantilever output index → batchResult.poles[outputIdx]
            // Each input[i] produces cantQtyPerInput[i] poles in the output.
            // batchResultPoles[outputOffset + k] = catenary k of drawn cantilever i.
            JsonNode batchPoles = batchResult.path("poles");
            // outputOffset[i] = start index in batchPoles for drawn cantilever i
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
                    "Component dimensions for each pole and catenary wire", C_HEADER);
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

            if (polesNode.isArray() && cantiNode.isArray()) {
                int poleNumber = 1;
                for (JsonNode pole : polesNode) {
                    double px = pole.path("x").asDouble(), pz = pole.path("z").asDouble();
                    String poleLabel = pole.path("label").asText(null);
                    String poleTitle = "Pole " + poleNumber + (poleLabel != null ? " — " + poleLabel : "");

                    // Find drawn cantilevers at this pole
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
                doc.add(styledParagraph("No cantilever data available.", 9, C_MUTED).setMarginTop(8));
            }

            // ── Vane section title page ───────────────────────────────────────
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
            addSectionTitlePage(doc, "VANE RESULTS",
                    "Dropper lengths and distances for each inter-pole vane", C_PURPLE);
            doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));

            // Sort vane results by _vi index for consistent ordering
            Map<Integer, JsonNode> vaneMap = new LinkedHashMap<>();
            for (JsonNode vr : vaneResults) {
                int vIdx = vr.path("_vi").asInt(-1);
                if (vIdx >= 0 && "success".equals(vr.path("status").asText())) vaneMap.put(vIdx, vr);
            }

            if (vanesNode.isArray() && !vaneMap.isEmpty()) {
                JsonNode[] cArr = new JsonNode[cantiNode.size()];
                int ci2 = 0; for (JsonNode c : cantiNode) cArr[ci2++] = c;

                for (int vi = 0; vi < vanesNode.size(); vi++) {
                    JsonNode vNode = vanesNode.get(vi);
                    String vaneLabel = vNode.path("label").asText(null);
                    int c1i = vNode.path("cantileverIdx1").asInt(-1);
                    int c2i = vNode.path("cantileverIdx2").asInt(-1);
                    String fromLabel = (c1i >= 0 && c1i < cArr.length)
                            ? cArr[c1i].path("label").asText("Cantilever " + (c1i + 1)) : "?";
                    String toLabel   = (c2i >= 0 && c2i < cArr.length)
                            ? cArr[c2i].path("label").asText("Cantilever " + (c2i + 1)) : "?";

                    addVaneHeader(doc, "Vane " + (vi + 1), vaneLabel, fromLabel, toLabel);

                    JsonNode vr = vaneMap.get(vi);
                    JsonNode droppers = (vr != null) ? vr.path("vane").path("results") : null;
                    addVaneResultsTable(doc, droppers);

                    doc.add(new Paragraph("").setMarginBottom(12));
                }
            } else {
                doc.add(styledParagraph("No vane data available.", 9, C_MUTED).setMarginTop(8));
            }

            doc.close();
            return baos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException("PDF generation failed", e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Page elements
    // ─────────────────────────────────────────────────────────────────────────

    private void addCoverPage(Document doc, Location location) {
        doc.add(new Paragraph("").setMarginTop(120));

        // Blue accent bar
        Table bar = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        bar.addCell(new Cell()
            .add(new Paragraph("OCS TECHNICAL REPORT").setBold().setFontSize(20).setFontColor(C_WHITE))
            .setBackgroundColor(C_BLUE).setPadding(14).setBorder(Border.NO_BORDER));
        doc.add(bar);

        doc.add(new Paragraph(location.getName()).setBold().setFontSize(15).setFontColor(C_NAVY).setMarginTop(16));

        String date = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"));
        doc.add(styledParagraph("Generated: " + date, 9, C_MUTED));

        doc.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine()).setMarginTop(30));
        doc.add(new AreaBreak(AreaBreakType.NEXT_PAGE));
    }

    private void addSectionTitlePage(Document doc, String title, String subtitle, DeviceRgb bg) {
        doc.add(new Paragraph("").setMarginTop(120));

        Table bar = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        bar.addCell(new Cell()
            .add(new Paragraph(title).setBold().setFontSize(20).setFontColor(C_WHITE))
            .setBackgroundColor(bg).setPadding(14).setBorder(Border.NO_BORDER));
        doc.add(bar);

        doc.add(styledParagraph(subtitle, 11, C_MUTED).setMarginTop(14));
        doc.add(new LineSeparator(new com.itextpdf.kernel.pdf.canvas.draw.SolidLine()).setMarginTop(30));
    }

    private void addPoleHeader(Document doc, String title, double x, double z) {
        Table h = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        String pos = String.format("  ·  x: %.0f  z: %.0f", x, z);
        h.addCell(new Cell()
            .add(new Paragraph(title + pos).setBold().setFontSize(10).setFontColor(C_NAVY))
            .setBackgroundColor(C_TH_BG).setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10)
            .setBorder(Border.NO_BORDER)
            .setBorderLeft(new SolidBorder(C_BLUE, 3)));
        doc.add(h.setMarginTop(10).setMarginBottom(4));
    }

    private void addCantiSubHeader(Document doc, String title) {
        doc.add(styledParagraph(title, 9, C_MUTED).setItalic().setMarginLeft(10).setMarginBottom(3));
    }

    private void addVaneHeader(Document doc, String vaneNum, String label, String fromLabel, String toLabel) {
        String full = vaneNum + (label != null ? " — " + label : "")
                + "   ·   " + fromLabel + " → " + toLabel;
        Table h = new Table(UnitValue.createPercentArray(new float[]{1})).useAllAvailableWidth();
        h.addCell(new Cell()
            .add(new Paragraph(full).setBold().setFontSize(10).setFontColor(C_NAVY))
            .setBackgroundColor(C_TH_BG).setPaddingTop(6).setPaddingBottom(6).setPaddingLeft(10)
            .setBorder(Border.NO_BORDER)
            .setBorderLeft(new SolidBorder(C_PURPLE, 3)));
        doc.add(h.setMarginTop(10).setMarginBottom(4));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Tables
    // ─────────────────────────────────────────────────────────────────────────

    private void addCantileverResultsTable(Document doc, JsonNode results) {
        String[] headers = {"Component", "Length (mm)", "Cut Length (mm)", "Diameter (mm)", "Thickness (mm)"};
        float[]  widths  = {44, 14, 14, 14, 14};

        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth()
                .setMarginLeft(10).setMarginBottom(8);

        // Header row
        for (String h : headers) {
            table.addHeaderCell(thCell(h));
        }

        if (results != null && results.isArray() && results.size() > 0) {
            int row = 0;
            for (JsonNode r : results) {
                DeviceRgb bg = (row % 2 == 0) ? C_WHITE : C_ROW_ALT;
                table.addCell(tdCell(r.path("name").asText("-"), bg, false));
                table.addCell(tdCell(fmt1(r.path("length").asDouble()), bg, true));
                table.addCell(tdCell(fmt1(r.path("cut_length").asDouble()), bg, true));
                table.addCell(tdCell(fmt1(r.path("diameter").asDouble()), bg, true));
                table.addCell(tdCell(fmt1(r.path("thickness").asDouble()), bg, true));
                row++;
            }
        } else {
            table.addCell(new Cell(1, 5)
                .add(new Paragraph("No results").setFontSize(8).setFontColor(C_MUTED))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new SolidBorder(C_BORDER, 0.5f)).setPadding(6));
        }

        doc.add(table);
    }

    private void addVaneResultsTable(Document doc, JsonNode droppers) {
        String[] headers = {"#", "Dist. from A (m)", "Dropper–Dropper (m)",
                            "Eye-to-Eye (m)", "CW Dist. (m)", "CW Height (m)"};
        float[] widths = {7, 18, 18, 18, 18, 21};

        Table table = new Table(UnitValue.createPercentArray(widths)).useAllAvailableWidth()
                .setMarginLeft(10).setMarginBottom(8);

        for (String h : headers) {
            table.addHeaderCell(thCell(h));
        }

        if (droppers != null && droppers.isArray() && droppers.size() > 0) {
            int row = 0;
            for (JsonNode d : droppers) {
                DeviceRgb bg = (row % 2 == 0) ? C_WHITE : C_ROW_ALT;
                table.addCell(tdCell(String.valueOf(d.path("index").asInt(row) + 1), bg, true));
                table.addCell(tdCell(fmt3(d.path("distance_pole_dropper").asDouble()), bg, true));
                table.addCell(tdCell(fmt3(d.path("distance_dropper_dropper").asDouble()), bg, true));
                table.addCell(tdCell(fmt3(d.path("distance_eye_to_eye").asDouble()), bg, true));
                table.addCell(tdCell(fmt3(d.path("distance_cw").asDouble()), bg, true));
                table.addCell(tdCell(fmt3(d.path("distance_cw_h").asDouble()), bg, true));
                row++;
            }
        } else {
            table.addCell(new Cell(1, 6)
                .add(new Paragraph("No dropper results").setFontSize(8).setFontColor(C_MUTED))
                .setTextAlignment(TextAlignment.CENTER)
                .setBorder(new SolidBorder(C_BORDER, 0.5f)).setPadding(6));
        }

        doc.add(table);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Cell helpers
    // ─────────────────────────────────────────────────────────────────────────

    private Cell thCell(String text) {
        return new Cell()
                .add(new Paragraph(text).setBold().setFontSize(8).setFontColor(C_NAVY))
                .setBackgroundColor(C_TH_BG)
                .setBorder(new SolidBorder(C_BORDER, 0.5f))
                .setPaddingTop(5).setPaddingBottom(5).setPaddingLeft(5).setPaddingRight(5)
                .setTextAlignment(TextAlignment.CENTER);
    }

    private Cell tdCell(String text, DeviceRgb bg, boolean center) {
        return new Cell()
                .add(new Paragraph(text).setFontSize(8).setFontColor(C_NAVY))
                .setBackgroundColor(bg)
                .setBorder(new SolidBorder(C_BORDER, 0.3f))
                .setPaddingTop(4).setPaddingBottom(4).setPaddingLeft(5).setPaddingRight(5)
                .setTextAlignment(center ? TextAlignment.CENTER : TextAlignment.LEFT);
    }

    private Paragraph styledParagraph(String text, float size, DeviceRgb color) {
        return new Paragraph(text).setFontSize(size).setFontColor(color);
    }

    private String fmt1(double v) { return v == 0 ? "—" : String.format("%.1f", v); }
    private String fmt3(double v) { return v == 0 ? "—" : String.format("%.3f", v); }
}
