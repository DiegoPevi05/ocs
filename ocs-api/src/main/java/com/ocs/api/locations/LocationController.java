package com.ocs.api.locations;

import com.ocs.api.projects.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
        return locationRepository.findById(id).map(loc -> {
            try {
                com.fasterxml.jackson.databind.JsonNode sceneData = mapper.readTree(loc.getSceneData());
                com.fasterxml.jackson.databind.JsonNode cantilevers = sceneData.get("cantilevers");
                com.fasterxml.jackson.databind.JsonNode poles = sceneData.get("poles");
                
                if (cantilevers == null || !cantilevers.isArray() || cantilevers.size() == 0) {
                    com.fasterxml.jackson.databind.node.ObjectNode response = mapper.createObjectNode();
                    response.put("status", "success");
                    response.set("location", mapper.valueToTree(LocationResponse.from(loc)));
                    ResponseEntity<com.fasterxml.jackson.databind.JsonNode> okRes = ResponseEntity.ok(response);
                    return reactor.core.publisher.Mono.just(okRes);
                }
                
                com.fasterxml.jackson.databind.node.ArrayNode payloads = mapper.createArrayNode();
                for (com.fasterxml.jackson.databind.JsonNode c : cantilevers) {
                    com.fasterxml.jackson.databind.node.ObjectNode payload = mapper.createObjectNode();
                    
                    payload.put("configuration", c.path("configuration").asText("TDP>2.2"));
                    
                    double x1 = c.path("x1").asDouble();
                    double z1 = c.path("z1").asDouble();
                    com.fasterxml.jackson.databind.node.ArrayNode polePos = mapper.createArrayNode();
                    polePos.add(x1).add(0.0).add(z1);
                    payload.set("polePosition", polePos);
                    
                    double footX = c.has("x2raw") ? c.path("x2raw").asDouble() : c.path("x2").asDouble();
                    double footZ = c.has("z2raw") ? c.path("z2raw").asDouble() : c.path("z2").asDouble();
                    com.fasterxml.jackson.databind.node.ArrayNode pv = mapper.createArrayNode();
                    pv.add(footX).add(0.0).add(-footZ); // Negative Z to map to Calculator coords
                    payload.set("pv", pv);
                    
                    payload.put("contactWireHeight", c.path("contactWireHeight").asDouble(5400));
                    payload.put("systemHeight", c.path("systemHeight").asDouble(1000));
                    payload.put("contactWireVerticalOffset", c.path("contactWireVerticalOffset").asDouble(120));
                    payload.put("zigzag", c.path("zigzag").asDouble(250));
                    payload.put("supportOffset", c.path("supportOffset").asDouble(1440));
                    payload.put("fixingDistance", c.path("fixingDistance").asDouble(1500));
                    payload.put("bottomFixedHeight", c.path("bottomFixedHeight").asDouble(800));
                    payload.put("u", c.path("u").asDouble(0));
                    payload.put("curveRadiusDirection", c.path("curveRadiusDirection").asText("inside"));
                    payload.put("trackGauge", c.path("trackGauge").asDouble(1435));
                    
                    int cantileversQuantity = 1;
                    double catSeparation = 720;
                    if (poles != null && poles.isArray()) {
                        for (com.fasterxml.jackson.databind.JsonNode pole : poles) {
                            double px = pole.path("x").asDouble();
                            double pz = pole.path("z").asDouble();
                            if (Math.hypot(px - x1, pz - z1) < 500) {
                                cantileversQuantity = pole.path("cantileversQuantity").asInt(1);
                                catSeparation = pole.path("catSeparation").asDouble(720);
                                break;
                            }
                        }
                    }
                    payload.put("cantileversQuantity", cantileversQuantity);
                    payload.put("catSeparation", catSeparation);
                    
                    payloads.add(payload);
                }
                
                return calculatorClient.calculateBatch(payloads).map(calcResult -> {
                    com.fasterxml.jackson.databind.node.ObjectNode response = mapper.createObjectNode();
                    response.put("status", "success");
                    response.set("location", mapper.valueToTree(LocationResponse.from(loc)));
                    response.set("calculations", calcResult);
                    ResponseEntity<com.fasterxml.jackson.databind.JsonNode> calcRes = ResponseEntity.ok(response);
                    return calcRes;
                });
                
            } catch (Exception e) {
                ResponseEntity<com.fasterxml.jackson.databind.JsonNode> errRes = ResponseEntity.status(500).build();
                return reactor.core.publisher.Mono.just(errRes);
            }
        }).orElseGet(() -> {
            ResponseEntity<com.fasterxml.jackson.databind.JsonNode> notFoundRes = ResponseEntity.notFound().build();
            return reactor.core.publisher.Mono.just(notFoundRes);
        });
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
