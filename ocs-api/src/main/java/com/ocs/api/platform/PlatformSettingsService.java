package com.ocs.api.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocs.api.ai.AiSettings;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

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

    private static final String DEFAULT_GUIDANCE_RESOURCE = "ai/ai_guidance.md";

    /**
     * Reads the AI "design criteria" document — free-form guidance injected into every
     * AI chat/generate call's system prompt. Editable from the UI (Platform Settings);
     * falls back to the bundled classpath default until an admin saves a custom version.
     */
    public String getDesignCriteria() {
        try {
            JsonNode root = mapper.readTree(getRawSettings());
            String criteria = root.path("designCriteria").asText("");
            if (!criteria.isBlank()) {
                return criteria;
            }
        } catch (Exception e) {
            log.warn("Could not parse designCriteria from platform settings", e);
        }
        return loadDefaultGuidance();
    }

    /** The bundled fallback guidance document, used until an admin customizes it. */
    public String loadDefaultGuidance() {
        try {
            ClassPathResource resource = new ClassPathResource(DEFAULT_GUIDANCE_RESOURCE);
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Could not load {} from classpath, using minimal default prompt.", DEFAULT_GUIDANCE_RESOURCE);
            return "You are an OCS (Overhead Contact System) design assistant. " +
                   "Help the user design tracks, foundations, poles, cantilevers, and vanes " +
                   "following standard railway electrification engineering rules.";
        }
    }
}
