package com.ocs.api.poles;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PoleRepository extends JpaRepository<Pole, UUID> {
    List<Pole> findByTrackId(UUID trackId);
}
