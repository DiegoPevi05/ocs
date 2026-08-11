package com.ocs.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ocs.api.locations.Location;
import com.ocs.api.locations.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

/**
 * Core AI service that communicates with the DeepSeek API (OpenAI-compatible).
 * Loads the OCS engineering guidance from classpath, builds tool definitions,
 * and orchestrates function calling against OcsAiTools.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final LocationRepository locationRepository;
    private final OcsAiTools ocsAiTools;
    private final ObjectMapper mapper;

    public record ChatResponse(String message, String updatedSceneData) {}

    public Mono<ChatResponse> chat(UUID locationId, String userMessage, AiSettings aiSettings) {
        // 1. Load location
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found: " + locationId));

        // 2. Load AI guidance from classpath
        String guidance = loadGuidance();

        // 3. Parse existing sceneData
        ObjectNode sceneData;
        try {
            String raw = location.getSceneData();
            sceneData = (raw != null && !raw.isBlank())
                    ? (ObjectNode) mapper.readTree(raw)
                    : mapper.createObjectNode();
        } catch (Exception e) {
            sceneData = mapper.createObjectNode();
        }

        // 4. Build DeepSeek request body
        ArrayNode tools = buildToolDefinitions();
        ObjectNode requestBody = buildChatRequest(aiSettings.model(), guidance, userMessage, sceneData, tools);

        // 5. Call DeepSeek API via WebClient
        WebClient client = WebClient.builder()
                .baseUrl(AiSettings.DEEPSEEK_BASE_URL)
                .defaultHeader("Authorization", "Bearer " + aiSettings.apiKey())
                .defaultHeader("Content-Type", "application/json")
                .build();

        final ObjectNode finalSceneData = sceneData;
        return client.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .flatMap(response -> handleResponse(response, finalSceneData, location))
                .onErrorResume(e -> {
                    log.error("AI API call failed", e);
                    return Mono.just(new ChatResponse("AI service error: " + e.getMessage(), location.getSceneData()));
                });
    }

    private Mono<ChatResponse> handleResponse(JsonNode response, ObjectNode sceneData, Location location) {
        try {
            JsonNode choice = response.path("choices").path(0);
            JsonNode message = choice.path("message");
            String finishReason = choice.path("finish_reason").asText("");

            if ("tool_calls".equals(finishReason)) {
                // Execute each tool call requested by the AI
                JsonNode toolCalls = message.path("tool_calls");
                for (JsonNode toolCall : toolCalls) {
                    String toolName = toolCall.path("function").path("name").asText();
                    String argsJson = toolCall.path("function").path("arguments").asText();
                    ObjectNode args = (ObjectNode) mapper.readTree(argsJson);
                    executeTool(toolName, sceneData, args);
                }
                // Persist the updated sceneData
                String updatedSceneData = mapper.writeValueAsString(sceneData);
                location.setSceneData(updatedSceneData);
                locationRepository.save(location);
                return Mono.just(new ChatResponse("Done! The location has been updated with the requested changes.", updatedSceneData));
            } else {
                // Plain text response — no tool was called
                String content = message.path("content").asText("");
                return Mono.just(new ChatResponse(content, location.getSceneData()));
            }
        } catch (Exception e) {
            log.error("Error handling AI response", e);
            return Mono.just(new ChatResponse("Error processing AI response: " + e.getMessage(), location.getSceneData()));
        }
    }

    private void executeTool(String toolName, ObjectNode sceneData, ObjectNode args) {
        switch (toolName) {
            case "create_track"       -> ocsAiTools.createTrack(sceneData, args);
            case "create_foundation"  -> ocsAiTools.createFoundation(sceneData, args);
            case "create_pole"        -> ocsAiTools.createPole(sceneData, args);
            case "create_cantilever"  -> ocsAiTools.createCantilever(sceneData, args);
            case "create_vane"        -> ocsAiTools.createVane(sceneData, args);
            default -> log.warn("Unknown tool called by AI: {}", toolName);
        }
    }

    private ObjectNode buildChatRequest(String model, String guidance, String userMessage,
                                        ObjectNode sceneData, ArrayNode tools) {
        ObjectNode body = mapper.createObjectNode();
        body.put("model", model);
        body.set("tools", tools);
        body.put("tool_choice", "auto");

        ArrayNode messages = mapper.createArrayNode();

        // System prompt: engineering guidance + current scene state
        ObjectNode systemMsg = mapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", guidance + "\n\nCurrent sceneData:\n" + sceneData.toPrettyString());
        messages.add(systemMsg);

        // User message
        ObjectNode userMsg = mapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);

        body.set("messages", messages);
        return body;
    }

    // ─── Tool definitions sent to the AI ──────────────────────────────────────

    private ArrayNode buildToolDefinitions() {
        ArrayNode tools = mapper.createArrayNode();
        tools.add(buildTool("create_track",
                "Creates a new track alignment in the location.",
                buildSchema("trackData", "Track object with alignment and coordinate properties.")));
        tools.add(buildTool("create_foundation",
                "Creates a new foundation at a position relative to a track.",
                buildSchema("foundationData", "Foundation object with position, trackId, and structural specifications.")));
        tools.add(buildTool("create_pole",
                "Creates a new pole mounted on a foundation.",
                buildSchema("poleData", "Pole object with x, z coordinates, label, cantileversQuantity, catSeparation.")));
        tools.add(buildTool("create_cantilever",
                "Creates a cantilever attached to a pole that positions the contact wire over a track.",
                buildSchema("cantileverData", "Cantilever with x1/z1 (pole position), x2/z2 (track stagger point), contactWireHeight, systemHeight, zigzag, configuration, etc.")));
        tools.add(buildTool("create_vane",
                "Creates a vane (catenary wire span) connecting two cantilevers.",
                buildSchema("vaneData", "Vane with cantileverIdx1, cantileverIdx2, qtyDroppers, cwTension, swTension, cwWeight, swWeight, initialSeparation.")));
        return tools;
    }

    private ObjectNode buildTool(String name, String description, ObjectNode parameters) {
        ObjectNode tool = mapper.createObjectNode();
        tool.put("type", "function");
        ObjectNode function = mapper.createObjectNode();
        function.put("name", name);
        function.put("description", description);
        function.set("parameters", parameters);
        tool.set("function", function);
        return tool;
    }

    private ObjectNode buildSchema(String paramName, String description) {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode properties = mapper.createObjectNode();
        ObjectNode param = mapper.createObjectNode();
        param.put("type", "object");
        param.put("description", description);
        properties.set(paramName, param);
        schema.set("properties", properties);
        ArrayNode required = mapper.createArrayNode();
        required.add(paramName);
        schema.set("required", required);
        return schema;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private String loadGuidance() {
        try {
            ClassPathResource resource = new ClassPathResource("ai/ai_guidance.md");
            return resource.getContentAsString(StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.warn("Could not load ai/ai_guidance.md from classpath, using default system prompt.");
            return "You are an OCS (Overhead Contact System) design assistant. " +
                   "Help the user design tracks, foundations, poles, cantilevers, and vanes " +
                   "following standard railway electrification engineering rules.";
        }
    }
}
