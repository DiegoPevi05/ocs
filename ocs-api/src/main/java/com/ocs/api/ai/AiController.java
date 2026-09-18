package com.ocs.api.ai;

import com.ocs.api.locations.LocationRepository;
import com.ocs.api.platform.PlatformSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST endpoint for the AI bubble chat.
 * Reads AI settings (provider, API key, model) from the platform-level settings
 * (GET /api/platform/settings), then delegates to AiService.
 *
 * POST /api/locations/{id}/chat
 *   Body:    { "message": "Place a cantilever on pole 1" }
 *   Returns: { "message": "...", "updatedSceneData": "..." }
 */
@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final LocationRepository locationRepository;
    private final PlatformSettingsService platformSettingsService;

    record ChatRequest(String message) {}
    record ChatResponse(String message, String updatedSceneData) {}

    @PostMapping("/api/locations/{id}/chat")
    public ResponseEntity<ChatResponse> chat(
            @PathVariable UUID id,
            @RequestBody ChatRequest req) {

        AiSettings aiSettings = platformSettingsService.getAiSettings();
        if (aiSettings.apiKey() == null || aiSettings.apiKey().isBlank()) {
            return missingKeyResponse();
        }
        if (locationRepository.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        // Blocking on purpose: this is a servlet (Spring MVC) app, not WebFlux. Returning
        // Mono here would make Spring dispatch the response asynchronously on a different
        // thread, which drops the ThreadLocal SecurityContext set by JwtAuthenticationFilter
        // and gets the request rejected with 403 even with a valid token.
        AiService.ChatResponse result = aiService.chat(id, req.message(), aiSettings).block();
        return ResponseEntity.ok(new ChatResponse(result.message(), result.updatedSceneData()));
    }

    /**
     * One-click bulk generation: fills in poles/cantilevers/vanes for the location's
     * existing tracks and foundations, following the design-criteria document, without
     * requiring the user to type a chat message.
     *
     * POST /api/locations/{id}/generate
     *   Returns: { "message": "...", "updatedSceneData": "..." }
     */
    @PostMapping("/api/locations/{id}/generate")
    public ResponseEntity<ChatResponse> generate(@PathVariable UUID id) {
        AiSettings aiSettings = platformSettingsService.getAiSettings();
        if (aiSettings.apiKey() == null || aiSettings.apiKey().isBlank()) {
            return missingKeyResponse();
        }
        if (locationRepository.findById(id).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AiService.ChatResponse result = aiService.generate(id, aiSettings).block();
        return ResponseEntity.ok(new ChatResponse(result.message(), result.updatedSceneData()));
    }

    private ResponseEntity<ChatResponse> missingKeyResponse() {
        return ResponseEntity.badRequest().body(new ChatResponse(
                "AI API key is not configured on this server. " +
                "Please ask your administrator to set it in Platform Settings.",
                null
        ));
    }
}
