package com.ocs.api.cantilevers;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface CantileverRepository extends JpaRepository<Cantilever, UUID> {
    List<Cantilever> findByPoleId(UUID poleId);
}
