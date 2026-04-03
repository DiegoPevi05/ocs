package com.ocs.api.projects;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectRepository projectRepository;

    record ProjectRequest(String name, String description) {}

    record ProjectResponse(UUID id, String name, String description, LocalDateTime createdAt) {
        static ProjectResponse from(Project p) {
            return new ProjectResponse(p.getId(), p.getName(), p.getDescription(), p.getCreatedAt());
        }
    }

    @GetMapping
    public List<ProjectResponse> listProjects() {
        return projectRepository.findAll().stream()
                .map(ProjectResponse::from)
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable UUID id) {
        return projectRepository.findById(id)
                .map(p -> ResponseEntity.ok(ProjectResponse.from(p)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ProjectResponse createProject(@RequestBody ProjectRequest req) {
        Project p = Project.builder()
                .name(req.name())
                .description(req.description())
                .build();
        return ProjectResponse.from(projectRepository.save(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable UUID id, @RequestBody ProjectRequest req) {
        return projectRepository.findById(id).map(p -> {
            p.setName(req.name());
            p.setDescription(req.description());
            return ResponseEntity.ok(ProjectResponse.from(projectRepository.save(p)));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable UUID id) {
        if (!projectRepository.existsById(id)) return ResponseEntity.notFound().build();
        projectRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
