package com.ocs.api.ai;

import com.ocs.api.locations.LocationRepository;
import com.ocs.api.platform.PlatformSettingsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

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
    public Mono<ResponseEntity<ChatResponse>> chat(
            @PathVariable UUID id,
            @RequestBody ChatRequest req) {

        // Read AI settings from the platform (server-wide), not from the project
        AiSettings aiSettings = platformSettingsService.getAiSettings();

        if (aiSettings.apiKey() == null || aiSettings.apiKey().isBlank()) {
            return Mono.just(ResponseEntity.badRequest().body(
                    new ChatResponse(
                            "AI API key is not configured on this server. " +
                            "Please ask your administrator to set it in Platform Settings.",
                            null
                    )
            ));
        }

        return locationRepository.findById(id)
                .map(location ->
                        aiService.chat(id, req.message(), aiSettings)
                                .map(r -> ResponseEntity.ok(new ChatResponse(r.message(), r.updatedSceneData())))
                )
                .orElse(Mono.just(ResponseEntity.notFound().build()));
    }
}
