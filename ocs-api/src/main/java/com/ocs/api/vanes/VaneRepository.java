package com.ocs.api.vanes;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface VaneRepository extends JpaRepository<Vane, UUID> {
    List<Vane> findByPoleAId(UUID poleAId);
    List<Vane> findByPoleBId(UUID poleBId);
}
