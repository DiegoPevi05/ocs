package com.ocs.api.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocs.api.ai.AiSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Service that reads and writes the singleton platform_settings row.
 * Provides helper methods for accessing strongly-typed sub-sections (e.g. AI config).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class PlatformSettingsService {

    private final PlatformSettingsRepository repository;
    private final ObjectMapper mapper;

    /** Returns the raw JSON settings string, or "{}" if the row doesn't exist yet. */
    public String getRawSettings() {
        return repository.findAll().stream()
                .findFirst()
                .map(PlatformSettings::getSettings)
                .orElse("{}");
    }

    /** Persists the new settings JSON, overwriting the existing singleton row. */
    public String saveRawSettings(String settingsJson) {
        PlatformSettings row = repository.findAll().stream()
                .findFirst()
                .orElseGet(PlatformSettings::new);
        row.setSettings(settingsJson != null ? settingsJson : "{}");
        return repository.save(row).getSettings();
    }

    /**
     * Reads AI provider configuration from platform settings.
     * Expected JSON shape inside settings:
     * { "ai": { "provider": "deepseek", "apiKey": "sk-...", "model": "deepseek-chat", "enabled": true } }
     */
    public AiSettings getAiSettings() {
        try {
            JsonNode root = mapper.readTree(getRawSettings());
            JsonNode ai = root.path("ai");
            String provider = ai.path("provider").asText(AiSettings.DEFAULT_PROVIDER);
            String apiKey   = ai.path("apiKey").asText(null);
            String model    = ai.path("model").asText(AiSettings.DEFAULT_MODEL);
            return new AiSettings(provider, apiKey, model);
        } catch (Exception e) {
            log.warn("Could not parse platform AI settings", e);
            return new AiSettings(AiSettings.DEFAULT_PROVIDER, null, AiSettings.DEFAULT_MODEL);
        }
    }
}
