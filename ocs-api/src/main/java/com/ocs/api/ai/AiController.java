package com.ocs.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ocs.api.locations.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.UUID;

/**
 * REST endpoint for the AI bubble chat.
 * Reads AI settings (provider, API key, model) from the parent project's settings JSON,
 * then delegates to AiService for orchestrating the DeepSeek call and tool execution.
 *
 * POST /api/locations/{id}/chat
 *   Body: { "message": "Place a cantilever on pole 1" }
 *   Returns: { "message": "...", "updatedSceneData": "..." }
 */
@RestController
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final LocationRepository locationRepository;
    private final ObjectMapper mapper;

    record ChatRequest(String message) {}
    record ChatResponse(String message, String updatedSceneData) {}

    @PostMapping("/api/locations/{id}/chat")
    public Mono<ResponseEntity<ChatResponse>> chat(
            @PathVariable UUID id,
            @RequestBody ChatRequest req) {

        return locationRepository.findById(id)
                .map(location -> {
                    AiSettings aiSettings = parseAiSettings(location.getProject().getSettings());

                    if (aiSettings.apiKey() == null || aiSettings.apiKey().isBlank()) {
                        return Mono.<ResponseEntity<ChatResponse>>just(
                                ResponseEntity.badRequest().body(
                                        new ChatResponse(
                                                "AI API key not configured. Please set it in Project Settings → AI Provider.",
                                                null
                                        )
                                )
                        );
                    }

                    return aiService.chat(id, req.message(), aiSettings)
                            .map(r -> ResponseEntity.ok(new ChatResponse(r.message(), r.updatedSceneData())));
                })
                .orElse(Mono.just(ResponseEntity.notFound().build()));
    }

    private AiSettings parseAiSettings(String settingsJson) {
        try {
            JsonNode settings = mapper.readTree(settingsJson != null ? settingsJson : "{}");
            String provider = settings.path("aiProvider").asText(AiSettings.DEFAULT_PROVIDER);
            String apiKey   = settings.path("aiApiKey").asText(null);
            String model    = settings.path("aiModel").asText(AiSettings.DEFAULT_MODEL);
            return new AiSettings(provider, apiKey, model);
        } catch (Exception e) {
            return new AiSettings(AiSettings.DEFAULT_PROVIDER, null, AiSettings.DEFAULT_MODEL);
        }
    }
}
