package com.ocs.api.locations;

import com.ocs.api.projects.ProjectRepository;
import com.ocs.api.report.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class LocationController {

    private final LocationRepository locationRepository;
    private final ProjectRepository projectRepository;
    private final com.ocs.api.calculator.CalculatorClient calculatorClient;
    private final com.fasterxml.jackson.databind.ObjectMapper mapper;
    private final ReportService reportService;

    record LocationRequest(String name, String sceneData) {}

    record LocationResponse(UUID id, UUID projectId, String name, String sceneData,
                            java.time.LocalDateTime createdAt) {
        static LocationResponse from(Location l) {
            return new LocationResponse(
                    l.getId(),
                    l.getProject().getId(),
                    l.getName(),
                    l.getSceneData(),
                    l.getCreatedAt()
            );
        }
    }

    @GetMapping("/api/projects/{projectId}/locations")
    public ResponseEntity<List<LocationResponse>> listLocations(@PathVariable UUID projectId) {
        if (!projectRepository.existsById(projectId)) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(
                locationRepository.findByProjectId(projectId).stream()
                        .map(LocationResponse::from)
                        .collect(Collectors.toList())
        );
    }

    @PostMapping("/api/projects/{projectId}/locations")
    public ResponseEntity<LocationResponse> createLocation(@PathVariable UUID projectId,
                                                           @RequestBody LocationRequest req) {
        return projectRepository.findById(projectId).map(project -> {
            Location loc = Location.builder()
                    .project(project)
                    .name(req.name())
                    .sceneData(req.sceneData())
                    .build();
            return ResponseEntity.ok(LocationResponse.from(locationRepository.save(loc)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/locations/{id}")
    public ResponseEntity<LocationResponse> getLocation(@PathVariable UUID id) {
        return locationRepository.findById(id)
                .map(l -> ResponseEntity.ok(LocationResponse.from(l)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/api/locations/{id}/calculated")
    public reactor.core.publisher.Mono<ResponseEntity<com.fasterxml.jackson.databind.JsonNode>> getCalculatedLocation(@PathVariable UUID id) {
        return locationRepository.findWithProjectById(id).map(loc -> {
            try {
                com.fasterxml.jackson.databind.JsonNode sceneData = mapper.readTree(loc.getSceneData());
                com.fasterxml.jackson.databind.JsonNode cantileversNode = sceneData.path("cantilevers");
                com.fasterxml.jackson.databind.JsonNode polesNode      = sceneData.path("poles");
                com.fasterxml.jackson.databind.JsonNode vanesNode      = sceneData.path("vanes");

                int numCantis = cantileversNode.isArray() ? cantileversNode.size() : 0;
                final int[] cantQtyArr    = new int[numCantis];   // cantileversQuantity per drawn cantilever
                final int[] outputOffsets = new int[numCantis];   // start index in batchResult.poles

                // ── Resolve contactWireConfiguration from project settings ────
                String contactWireConfig = "SINGLE";
                try {
                    String projSettings = loc.getProject().getSettings();
                    if (projSettings != null && !projSettings.isEmpty()) {
                        com.fasterxml.jackson.databind.JsonNode ps = mapper.readTree(projSettings);
                        String sys = ps.path("catenarySystem").asText("DOUBLE_WIRE");
                        if ("DOUBLE_WIRE".equals(sys)) contactWireConfig = "DOUBLE";
                    }
                } catch (Exception ignored) {}

                // ── Build cantilever batch payloads ───────────────────────────
                final String finalWireConfig = contactWireConfig;
                com.fasterxml.jackson.databind.node.ArrayNode cantPayloads = mapper.createArrayNode();
                for (int ci = 0; ci < numCantis; ci++) {
                    com.fasterxml.jackson.databind.JsonNode c = cantileversNode.get(ci);
                    double x1 = c.path("x1").asDouble(), z1 = c.path("z1").asDouble();
                    int cantQty = 1; double catSep = 720;
                    if (polesNode.isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode pole : polesNode) {
                            if (Math.hypot(pole.path("x").asDouble()-x1, pole.path("z").asDouble()-z1) < 500) {
                                cantQty = pole.path("cantileversQuantity").asInt(1);
                                catSep  = pole.path("catSeparation").asDouble(720);
                                break;
                            }
                        }
                    }
                    cantQtyArr[ci] = cantQty;

                    com.fasterxml.jackson.databind.node.ObjectNode p = mapper.createObjectNode();
                    p.put("configuration", c.path("configuration").asText("TDP>2.2"));
                    p.put("contactWireConfiguration", finalWireConfig);
                    com.fasterxml.jackson.databind.node.ArrayNode pp = mapper.createArrayNode(); pp.add(x1).add(0.0).add(-z1); p.set("polePosition", pp);
                    double fx = c.has("x2raw") ? c.path("x2raw").asDouble() : c.path("x2").asDouble();
                    double fz = c.has("z2raw") ? c.path("z2raw").asDouble() : c.path("z2").asDouble();
                    com.fasterxml.jackson.databind.node.ArrayNode pv = mapper.createArrayNode(); pv.add(fx).add(0.0).add(-fz); p.set("pv", pv);
                    p.put("contactWireHeight",         c.path("contactWireHeight").asDouble(5400));
                    p.put("systemHeight",              c.path("systemHeight").asDouble(1000));
                    p.put("contactWireVerticalOffset", c.path("contactWireVerticalOffset").asDouble(120));
                    p.put("zigzag",                    c.path("zigzag").asDouble(250));
                    p.put("supportOffset",             c.path("supportOffset").asDouble(1440));
                    p.put("fixingDistance",            c.path("fixingDistance").asDouble(1500));
                    p.put("bottomFixedHeight",         c.path("bottomFixedHeight").asDouble(5440));
                    p.put("u",                         c.path("u").asDouble(0));
                    p.put("curveRadiusDirection",      c.path("curveRadiusDirection").asText("inside"));
                    p.put("trackGauge",                c.path("trackGauge").asDouble(1435));
                    p.put("steadyArmAlpha",            c.path("steadyArmAlpha").asDouble(-2));
                    p.put("registerArmAlpha",          c.path("registerArmAlpha").asDouble(2));
                    p.put("steadyArmLength",           c.path("steadyArmLength").asDouble(1200));
                    p.put("cantileversQuantity", cantQty);
                    p.put("catSeparation", catSep);
                    cantPayloads.add(p);
                }

                // Compute cumulative output offsets
                int off = 0;
                for (int i = 0; i < numCantis; i++) { outputOffsets[i] = off; off += cantQtyArr[i]; }

                // ── Run cantilever batch first, then anchor vanes to its cwAxis/mwAxis ─
                // Vane endpoints MUST come from the C++ solver so that terrain elevation,
                // superelevation tilt, and zigzag offset are all correctly baked in.
                reactor.core.publisher.Mono<com.fasterxml.jackson.databind.JsonNode> cantMono =
                    cantPayloads.size() > 0 ? calculatorClient.calculateBatch(cantPayloads)
                                             : reactor.core.publisher.Mono.just(mapper.createObjectNode());

                return cantMono.flatMap(batchResult -> {
                    final com.fasterxml.jackson.databind.JsonNode batchPoles = batchResult.path("poles");

                    // ── Build vane payloads using real cwAxis / mwAxis ────────
                    java.util.List<reactor.core.publisher.Mono<com.fasterxml.jackson.databind.JsonNode>> vaneMonos = new java.util.ArrayList<>();
                    if (vanesNode.isArray() && cantileversNode.isArray()) {
                        for (int vi = 0; vi < vanesNode.size(); vi++) {
                            final int fvi = vi;
                            com.fasterxml.jackson.databind.JsonNode v = vanesNode.get(vi);
                            int c1i = v.path("cantileverIdx1").asInt(-1);
                            int c2i = v.path("cantileverIdx2").asInt(-1);
                            int p2i = v.path("poleIdx").asInt(-1);

                            if (c1i < 0 || c1i >= numCantis || (c2i < 0 && p2i < 0)) {
                                vaneMonos.add(reactor.core.publisher.Mono.just(mapper.createObjectNode().put("_vaneIdx", fvi).put("status", "skip")));
                                continue;
                            }

                            // ── Extract cwAxis / mwAxis for cantilever c1 from batch result ──
                            // batchPoles[ci] is the result for cantPayloads[ci] (one pole per input)
                            com.fasterxml.jackson.databind.JsonNode bp1 = (batchPoles.isArray() && c1i < batchPoles.size()) ? batchPoles.get(c1i) : null;
                            com.fasterxml.jackson.databind.JsonNode bc1 = (bp1 != null) ? bp1.path("cantilevers").path(0) : null;
                            com.fasterxml.jackson.databind.JsonNode cwAxis1 = (bc1 != null && !bc1.path("cwAxis").isMissingNode()) ? bc1.path("cwAxis") : null;
                            com.fasterxml.jackson.databind.JsonNode mwAxis1 = (bc1 != null && !bc1.path("mwAxis").isMissingNode()) ? bc1.path("mwAxis") : null;

                            com.fasterxml.jackson.databind.node.ObjectNode vp = mapper.createObjectNode();

                            // cw_start: real contact-wire attachment point from C++ solver
                            if (cwAxis1 != null && cwAxis1.isArray() && cwAxis1.size() == 3) {
                                com.fasterxml.jackson.databind.node.ArrayNode cwS = mapper.createArrayNode();
                                cwS.add(cwAxis1.get(0).asDouble()).add(cwAxis1.get(1).asDouble()).add(cwAxis1.get(2).asDouble());
                                vp.set("cw_start", cwS);
                            } else {
                                // Fallback (flat/no-elevation) — only reached if cantilever calc failed
                                com.fasterxml.jackson.databind.JsonNode c1fb = cantileversNode.get(c1i);
                                com.fasterxml.jackson.databind.node.ArrayNode cwS = mapper.createArrayNode();
                                cwS.add(c1fb.path("x2").asDouble())
                                   .add(c1fb.path("contactWireHeight").asDouble(5400) + c1fb.path("contactWireVerticalOffset").asDouble(120))
                                   .add(-c1fb.path("z2").asDouble());
                                vp.set("cw_start", cwS);
                            }

                            // sw_start: real messenger-wire attachment point from C++ solver
                            if (mwAxis1 != null && mwAxis1.isArray() && mwAxis1.size() == 3) {
                                com.fasterxml.jackson.databind.node.ArrayNode swS = mapper.createArrayNode();
                                swS.add(mwAxis1.get(0).asDouble()).add(mwAxis1.get(1).asDouble()).add(mwAxis1.get(2).asDouble());
                                vp.set("sw_start", swS);
                            } else {
                                com.fasterxml.jackson.databind.JsonNode c1fb = cantileversNode.get(c1i);
                                com.fasterxml.jackson.databind.node.ArrayNode swS = mapper.createArrayNode();
                                swS.add(c1fb.path("x2").asDouble())
                                   .add(c1fb.path("contactWireHeight").asDouble(5400) + c1fb.path("contactWireVerticalOffset").asDouble(120) + c1fb.path("systemHeight").asDouble(1000))
                                   .add(-c1fb.path("z2").asDouble());
                                vp.set("sw_start", swS);
                            }

                            // cw_end / sw_end: from cantilever c2 solver output, or dead-end pole fallback
                            if (c2i >= 0 && c2i < numCantis) {
                                com.fasterxml.jackson.databind.JsonNode bp2 = (batchPoles.isArray() && c2i < batchPoles.size()) ? batchPoles.get(c2i) : null;
                                com.fasterxml.jackson.databind.JsonNode bc2 = (bp2 != null) ? bp2.path("cantilevers").path(0) : null;
                                com.fasterxml.jackson.databind.JsonNode cwAxis2 = (bc2 != null && !bc2.path("cwAxis").isMissingNode()) ? bc2.path("cwAxis") : null;
                                com.fasterxml.jackson.databind.JsonNode mwAxis2 = (bc2 != null && !bc2.path("mwAxis").isMissingNode()) ? bc2.path("mwAxis") : null;

                                if (cwAxis2 != null && cwAxis2.isArray() && cwAxis2.size() == 3) {
                                    com.fasterxml.jackson.databind.node.ArrayNode cwE = mapper.createArrayNode();
                                    cwE.add(cwAxis2.get(0).asDouble()).add(cwAxis2.get(1).asDouble()).add(cwAxis2.get(2).asDouble());
                                    vp.set("cw_end", cwE);
                                } else {
                                    com.fasterxml.jackson.databind.JsonNode c2fb = cantileversNode.get(c2i);
                                    com.fasterxml.jackson.databind.node.ArrayNode cwE = mapper.createArrayNode();
                                    cwE.add(c2fb.path("x2").asDouble())
                                       .add(c2fb.path("contactWireHeight").asDouble(5400) + c2fb.path("contactWireVerticalOffset").asDouble(120))
                                       .add(-c2fb.path("z2").asDouble());
                                    vp.set("cw_end", cwE);
                                }

                                if (mwAxis2 != null && mwAxis2.isArray() && mwAxis2.size() == 3) {
                                    com.fasterxml.jackson.databind.node.ArrayNode swE = mapper.createArrayNode();
                                    swE.add(mwAxis2.get(0).asDouble()).add(mwAxis2.get(1).asDouble()).add(mwAxis2.get(2).asDouble());
                                    vp.set("sw_end", swE);
                                } else {
                                    com.fasterxml.jackson.databind.JsonNode c2fb = cantileversNode.get(c2i);
                                    com.fasterxml.jackson.databind.node.ArrayNode swE = mapper.createArrayNode();
                                    swE.add(c2fb.path("x2").asDouble())
                                       .add(c2fb.path("contactWireHeight").asDouble(5400) + c2fb.path("contactWireVerticalOffset").asDouble(120) + c2fb.path("systemHeight").asDouble(1000))
                                       .add(-c2fb.path("z2").asDouble());
                                    vp.set("sw_end", swE);
                                }
                            } else {
                                // Dead-end pole attachment — no calculator cwAxis available for the end
                                double cwH2 = v.path("poleContactWireHeight").asDouble(5400);
                                double sH2  = v.path("poleSystemHeight").asDouble(1000);
                                com.fasterxml.jackson.databind.node.ArrayNode cwE = mapper.createArrayNode();
                                cwE.add(v.path("x2").asDouble()).add(cwH2).add(-v.path("z2").asDouble());
                                vp.set("cw_end", cwE);
                                com.fasterxml.jackson.databind.node.ArrayNode swE = mapper.createArrayNode();
                                swE.add(v.path("x2").asDouble()).add(cwH2 + sH2).add(-v.path("z2").asDouble());
                                vp.set("sw_end", swE);
                            }

                            vp.put("qty_droppers",       v.path("qtyDroppers").asInt(0));
                            vp.put("initial_separation", v.path("initialSeparation").asDouble(5000));
                            vp.put("step_size",          500);
                            vp.put("cw_weight",          v.path("cwWeight").asDouble(0.0019));
                            vp.put("cw_tension",         v.path("cwTension").asDouble(1600));
                            vp.put("sw_weight",          v.path("swWeight").asDouble(0.0024));
                            vp.put("sw_tension",         v.path("swTension").asDouble(2000));
                            vp.put("dropper_weight",     v.path("dropperWeight").asDouble(0.0006));
                            if (v.has("liftingStartDistance") && !v.path("liftingStartDistance").isNull()) {
                                vp.put("lifting_start_distance", v.path("liftingStartDistance").asDouble());
                            }

                            vaneMonos.add(calculatorClient.calculateVane(vp)
                                .map(vr -> { com.fasterxml.jackson.databind.node.ObjectNode e = mapper.createObjectNode(); e.put("_vaneIdx", fvi); e.put("status","success"); e.set("vane", vr.get("vane")); return (com.fasterxml.jackson.databind.JsonNode)e; })
                                .onErrorResume(err -> reactor.core.publisher.Mono.just(mapper.createObjectNode().put("_vaneIdx", fvi).put("status","error"))));
                        }
                    }

                    // ── Fan-out vane calculations in parallel, then assemble response ──
                    reactor.core.publisher.Mono<java.util.List<com.fasterxml.jackson.databind.JsonNode>> allVanesMono =
                        vaneMonos.isEmpty() ? reactor.core.publisher.Mono.just(java.util.Collections.emptyList())
                                            : reactor.core.publisher.Flux.fromIterable(vaneMonos).flatMap(m -> m).collectList();

                    return allVanesMono.map(vaneResults -> {
                        // vaneIndex → vane result node
                        java.util.Map<Integer, com.fasterxml.jackson.databind.JsonNode> vaneMap = new java.util.HashMap<>();
                        for (com.fasterxml.jackson.databind.JsonNode vr : vaneResults) {
                            if ("success".equals(vr.path("status").asText()))
                                vaneMap.put(vr.path("_vaneIdx").asInt(-1), vr.path("vane"));
                        }

                        // ── Build nested poles → cantilevers → vanes ─────────────
                        com.fasterxml.jackson.databind.node.ArrayNode outPoles = mapper.createArrayNode();
                        if (polesNode.isArray()) {
                            for (int pi = 0; pi < polesNode.size(); pi++) {
                                com.fasterxml.jackson.databind.JsonNode pole = polesNode.get(pi);
                                double px = pole.path("x").asDouble(), pz = pole.path("z").asDouble();
                                com.fasterxml.jackson.databind.node.ObjectNode pObj = mapper.createObjectNode();
                                pObj.put("poleIndex", pi);
                                String pLabel = pole.path("label").asText(null);
                                if (pLabel != null) pObj.put("label", pLabel);
                                pObj.put("x", px); pObj.put("z", pz);

                                com.fasterxml.jackson.databind.node.ArrayNode cArr2 = mapper.createArrayNode();
                                for (int ci = 0; ci < numCantis; ci++) {
                                    com.fasterxml.jackson.databind.JsonNode c = cantileversNode.get(ci);
                                    if (Math.hypot(c.path("x1").asDouble()-px, c.path("z1").asDouble()-pz) >= 500) continue;

                                    for (int k = 0; k < cantQtyArr[ci]; k++) {
                                        int outIdx = outputOffsets[ci] + k;
                                        com.fasterxml.jackson.databind.JsonNode bp = (batchPoles.isArray() && outIdx < batchPoles.size()) ? batchPoles.get(outIdx) : null;
                                        com.fasterxml.jackson.databind.JsonNode bc = (bp != null) ? bp.path("cantilevers").path(0) : null;

                                        com.fasterxml.jackson.databind.node.ObjectNode cObj = mapper.createObjectNode();
                                        cObj.put("cantileverIndex", ci);
                                        cObj.put("wireIndex", k);
                                        String cLabel = c.path("label").asText(null);
                                        if (cLabel != null) cObj.put("label", cLabel);
                                        cObj.put("configuration", c.path("configuration").asText("TDP>2.2"));

                                        // Merge pole-level + cantilever-level lines
                                        com.fasterxml.jackson.databind.node.ArrayNode linesMerged = mapper.createArrayNode();
                                        if (bp != null && bp.path("lines").isArray()) linesMerged.addAll((com.fasterxml.jackson.databind.node.ArrayNode) bp.path("lines"));
                                        if (bc != null && bc.path("lines").isArray()) linesMerged.addAll((com.fasterxml.jackson.databind.node.ArrayNode) bc.path("lines"));
                                        cObj.set("lines", linesMerged);
                                        cObj.set("results", (bc != null && bc.path("results").isArray()) ? bc.path("results") : mapper.createArrayNode());

                                        // Pass cwAxis/mwAxis through so the frontend can populate
                                        // its STOMP cache and reuse them for live vane recalculations
                                        if (bc != null && !bc.path("cwAxis").isMissingNode()) cObj.set("cwAxis", bc.get("cwAxis"));
                                        if (bc != null && !bc.path("mwAxis").isMissingNode()) cObj.set("mwAxis", bc.get("mwAxis"));

                                        // Vanes referencing this cantilever
                                        com.fasterxml.jackson.databind.node.ArrayNode vanesArr = mapper.createArrayNode();
                                        if (vanesNode.isArray()) {
                                            for (int vi = 0; vi < vanesNode.size(); vi++) {
                                                com.fasterxml.jackson.databind.JsonNode v = vanesNode.get(vi);
                                                int c1i = v.path("cantileverIdx1").asInt(-1), c2i = v.path("cantileverIdx2").asInt(-1);
                                                if (c1i != ci && c2i != ci) continue;
                                                com.fasterxml.jackson.databind.node.ObjectNode vObj = mapper.createObjectNode();
                                                vObj.put("vaneIndex", vi);
                                                String vLabel = v.path("label").asText(null);
                                                if (vLabel != null) vObj.put("label", vLabel);
                                                com.fasterxml.jackson.databind.JsonNode vr = vaneMap.get(vi);
                                                vObj.set("lines",   (vr != null && vr.path("lines").isArray())   ? vr.path("lines")   : mapper.createArrayNode());
                                                vObj.set("results", (vr != null && vr.path("results").isArray()) ? vr.path("results") : mapper.createArrayNode());
                                                vanesArr.add(vObj);
                                            }
                                        }
                                        cObj.set("vanes", vanesArr);
                                        cArr2.add(cObj);
                                    }
                                }
                                pObj.set("cantilevers", cArr2);
                                outPoles.add(pObj);
                            }
                        }

                        com.fasterxml.jackson.databind.node.ObjectNode response = mapper.createObjectNode();
                        response.put("status", "success");
                        response.set("location", mapper.valueToTree(LocationResponse.from(loc)));
                        response.set("poles", outPoles);
                        return ResponseEntity.ok((com.fasterxml.jackson.databind.JsonNode) response);
                    });
                });

            } catch (Exception e) {
                return reactor.core.publisher.Mono.just(ResponseEntity.status(500).<com.fasterxml.jackson.databind.JsonNode>build());
            }
        }).orElseGet(() ->
            reactor.core.publisher.Mono.just(ResponseEntity.notFound().<com.fasterxml.jackson.databind.JsonNode>build())
        );
    }


    @GetMapping("/api/locations/{id}/report")
    public Mono<ResponseEntity<byte[]>> downloadReport(@PathVariable UUID id) {
        return locationRepository.findById(id)
                .map(loc -> reportService.generateLocationReport(loc)
                        .map(pdfBytes -> {
                            String filename = "ocs-report-" + loc.getName().replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf";
                            HttpHeaders headers = new HttpHeaders();
                            headers.setContentType(MediaType.APPLICATION_PDF);
                            headers.setContentDispositionFormData("attachment", filename);
                            return ResponseEntity.ok().headers(headers).body(pdfBytes);
                        })
                        .onErrorResume(e -> Mono.just(ResponseEntity.internalServerError().<byte[]>build()))
                )
                .orElseGet(() -> Mono.just(ResponseEntity.notFound().<byte[]>build()));
    }

    @PutMapping("/api/locations/{id}")
    public ResponseEntity<LocationResponse> updateLocation(@PathVariable UUID id,
                                                           @RequestBody LocationRequest req) {
        return locationRepository.findById(id).map(loc -> {
            loc.setName(req.name());
            loc.setSceneData(req.sceneData());
            return ResponseEntity.ok(LocationResponse.from(locationRepository.save(loc)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/api/locations/{id}")
    public ResponseEntity<Void> deleteLocation(@PathVariable UUID id) {
        if (!locationRepository.existsById(id)) return ResponseEntity.notFound().build();
        locationRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
