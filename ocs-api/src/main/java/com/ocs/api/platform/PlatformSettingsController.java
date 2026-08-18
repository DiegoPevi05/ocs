package com.ocs.api.platform;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for server-wide platform settings.
 *
 * GET  /api/platform/settings          → returns current settings JSON (api key is masked)
 * PUT  /api/platform/settings          → saves new settings JSON
 * GET  /api/platform/settings/ai-status → returns whether AI is enabled (without exposing the key)
 */
@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
public class PlatformSettingsController {

    private final PlatformSettingsService service;
    private final ObjectMapper mapper;

    record SettingsRequest(String settings) {}

    /**
     * Returns the platform settings. The API key is masked for security
     * so it is never sent to the browser in plain text after being saved.
     */
    @GetMapping("/settings")
    public ResponseEntity<JsonNode> getSettings() {
        try {
            JsonNode root = mapper.readTree(service.getRawSettings());
            // Mask the API key before returning to the frontend
            if (root instanceof ObjectNode obj && obj.path("ai").isObject()) {
                ObjectNode ai = (ObjectNode) obj.path("ai");
                if (ai.has("apiKey") && !ai.path("apiKey").asText("").isBlank()) {
                    ai.put("apiKey", "••••••••••••••••");
                    ai.put("hasApiKey", true);
                } else {
                    ai.put("hasApiKey", false);
                }
            }
            return ResponseEntity.ok(root);
        } catch (Exception e) {
            return ResponseEntity.ok(mapper.createObjectNode());
        }
    }

    /** Saves new platform settings. If the API key payload is the mask, the existing key is preserved. */
    @PutMapping("/settings")
    public ResponseEntity<Void> saveSettings(@RequestBody SettingsRequest req) {
        try {
            String incoming = req.settings();
            JsonNode newSettings = mapper.readTree(incoming);

            // If the caller sent back the masked value, preserve the real key from DB
            if (newSettings instanceof ObjectNode obj && obj.path("ai").isObject()) {
                ObjectNode aiNew = (ObjectNode) obj.path("ai");
                String sentKey = aiNew.path("apiKey").asText("");
                if (sentKey.startsWith("••")) {
                    // Restore the real stored key
                    JsonNode existing = mapper.readTree(service.getRawSettings());
                    String realKey = existing.path("ai").path("apiKey").asText("");
                    aiNew.put("apiKey", realKey);
                }
                // Remove the helper field before saving
                aiNew.remove("hasApiKey");
            }

            service.saveRawSettings(mapper.writeValueAsString(newSettings));
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /** Lightweight status endpoint — used by the frontend to know if AI is configured. */
    @GetMapping("/settings/ai-status")
    public ResponseEntity<ObjectNode> getAiStatus() {
        try {
            JsonNode root = mapper.readTree(service.getRawSettings());
            JsonNode ai = root.path("ai");
            boolean hasKey = !ai.path("apiKey").asText("").isBlank();
            boolean enabled = ai.path("enabled").asBoolean(false);

            ObjectNode status = mapper.createObjectNode();
            status.put("enabled", enabled);
            status.put("hasApiKey", hasKey);
            status.put("provider", ai.path("provider").asText("deepseek"));
            status.put("model", ai.path("model").asText("deepseek-chat"));
            return ResponseEntity.ok(status);
        } catch (Exception e) {
            ObjectNode status = mapper.createObjectNode();
            status.put("enabled", false);
            status.put("hasApiKey", false);
            return ResponseEntity.ok(status);
        }
    }
}
