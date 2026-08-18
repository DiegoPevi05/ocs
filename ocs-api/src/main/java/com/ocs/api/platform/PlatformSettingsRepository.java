package com.ocs.api.platform;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PlatformSettingsRepository extends JpaRepository<PlatformSettings, UUID> {}
