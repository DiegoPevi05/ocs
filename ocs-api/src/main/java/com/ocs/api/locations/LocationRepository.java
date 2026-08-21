package com.ocs.api.locations;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface LocationRepository extends JpaRepository<Location, UUID> {
    List<Location> findByProjectId(UUID projectId);
    
    @org.springframework.data.jpa.repository.EntityGraph(attributePaths = {"project"})
    java.util.Optional<Location> findWithProjectById(UUID id);
}
