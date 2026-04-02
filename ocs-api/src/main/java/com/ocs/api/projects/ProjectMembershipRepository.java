package com.ocs.api.projects;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ProjectMembershipRepository extends JpaRepository<ProjectMembership, UUID> {
    List<ProjectMembership> findByUserId(UUID userId);
    List<ProjectMembership> findByProjectId(UUID projectId);
    Optional<ProjectMembership> findByProjectIdAndUserId(UUID projectId, UUID userId);
}
