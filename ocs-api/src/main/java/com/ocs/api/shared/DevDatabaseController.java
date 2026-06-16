package com.ocs.api.shared;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dev/db")
@RequiredArgsConstructor
public class DevDatabaseController {

    @PersistenceContext
    private final EntityManager entityManager;

    @PostMapping("/clean")
    @Transactional
    public String cleanDatabase() {
        // Order matters due to FK constraints if CASCADE is not used
        entityManager.createNativeQuery("TRUNCATE vanes CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE cantilevers CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE poles CASCADE").executeUpdate();
        entityManager.createNativeQuery("TRUNCATE tracks CASCADE").executeUpdate();
        
        // Clear scene_data from locations but keep the locations themselves
        entityManager.createNativeQuery("UPDATE locations SET scene_data = NULL").executeUpdate();
        
        return "Database cleaned (vanes, cantilevers, poles, tracks, and scene_data cleared).";
    }

    @PostMapping("/seed")
    @Transactional
    public String seedDatabase() {
        // Logic to create a default project and user if needed
        // For now, let's just make sure the clean command works as requested.
        // If the user wants specific seeds, they can specify later.
        return "Database seeded (currently no-op, just ensured endpoint exists).";
    }
}
