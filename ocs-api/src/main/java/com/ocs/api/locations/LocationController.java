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
