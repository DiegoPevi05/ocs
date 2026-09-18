package com.ocs.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.ocs.api.locations.Location;
import com.ocs.api.locations.LocationRepository;
import com.ocs.api.platform.PlatformSettingsService;
import com.ocs.api.projects.Project;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

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
    private final PlatformSettingsService platformSettingsService;

    public record ChatResponse(String message, String updatedSceneData) {}

    /** Caps how many back-and-forth tool-calling rounds one chat/generate request can take. */
    private static final int MAX_TOOL_ROUNDS = 8;

    /**
     * Standing instruction prepended to every conversation to stop the model from narrating
     * changes it never actually made. Observed failure mode: the model describes elaborate
     * "verification" results (citing nominal values straight out of the design-criteria
     * document, e.g. its 6550mm/300mm reference numbers) as if they were real elements already
     * in the scene, and claims to have created things without emitting the matching tool call
     * — so nothing is actually persisted even though the reply says "Done!".
     */
    private static final String AGENT_DISCIPLINE_INSTRUCTION =
            "You can only change this scene by calling the provided tools (create_track, " +
            "create_foundation, create_pole, create_cantilever, create_vane). Writing about a " +
            "change in your text response does NOT apply it — never claim to have created, " +
            "added, fixed, or connected something unless you actually invoked that exact tool " +
            "in this same turn. The 'Current sceneData' JSON block below is the ONLY source of " +
            "truth for what currently exists — the design-criteria guidance above it contains " +
            "nominal/example values to apply (heights, tensions, spans, etc.), not real elements; " +
            "never treat a number from the guidance as evidence that something already exists. " +
            "If, after reading the actual sceneData, something required is missing, call the " +
            "tool for it now instead of describing it as already done.";

    /**
     * Fixed instruction used by the one-click "Generate" flow — asks the AI to fill in
     * whatever poles/cantilevers/vanes are missing for the scene's existing tracks and
     * foundations, instead of requiring the user to type a chat message.
     */
    private static final String GENERATE_INSTRUCTION =
            "Para cada via (track) y fundacion (foundation) de esta escena que aun no tenga un poste, " +
            "mensula (cantilever) y vano (vane) adecuados, genera los postes, mensulas y vanos necesarios " +
            "para completar el sistema de catenaria, siguiendo los criterios de diseno indicados arriba. " +
            "No dupliques elementos que ya existan y sean adecuados para una via o fundacion. " +
            "Postes, mensulas y vanos son TRES cosas distintas y las tres son obligatorias: un poste sin " +
            "su mensula, o dos mensulas de postes adyacentes sin el vano que las conecta, NO cuentan como " +
            "completos. Si ya creaste postes en un paso anterior de esta misma conversacion pero aun les " +
            "faltan mensulas y/o vanos, sigue llamando a las herramientas hasta terminar todo antes de responder.";

    /** One-click bulk generation: same pipeline as chat(), with a fixed instruction. */
    public Mono<ChatResponse> generate(UUID locationId, AiSettings aiSettings) {
        return chat(locationId, GENERATE_INSTRUCTION, aiSettings);
    }

    public Mono<ChatResponse> chat(UUID locationId, String userMessage, AiSettings aiSettings) {
        return Mono.fromCallable(() -> chatBlocking(locationId, userMessage, aiSettings))
                .onErrorResume(e -> {
                    log.error("AI API call failed", e);
                    return Mono.just(new ChatResponse("AI service error: " + describeError(e), null));
                });
    }

    /**
     * Runs the full tool-calling conversation synchronously (fine here — this is a servlet
     * app, not WebFlux; see AiController for why blocking WebClient calls are intentional).
     * Loops rounds of "model calls tools -> we execute them -> feed results back to the
     * model" until the model responds with plain text (no more tool calls) or MAX_TOOL_ROUNDS
     * is reached. Without this loop the model only ever gets ONE batch of tool calls, so a
     * request touching several entity types (e.g. poles AND cantilevers AND vanes) could stop
     * after creating just the first kind and still report "Done!".
     */
    private ChatResponse chatBlocking(UUID locationId, String userMessage, AiSettings aiSettings)
            throws com.fasterxml.jackson.core.JsonProcessingException {
        Location location = locationRepository.findById(locationId)
                .orElseThrow(() -> new RuntimeException("Location not found: " + locationId));

        JsonNode projectSettings = parseProjectSettings(location.getProject());
        String guidance = loadGuidance();
        String projectDefaultsText = buildProjectDefaultsBlock(projectSettings);
        if (!projectDefaultsText.isBlank()) {
            guidance = guidance + "\n\n" + projectDefaultsText;
        }

        ObjectNode sceneData;
        try {
            String raw = location.getSceneData();
            sceneData = (raw != null && !raw.isBlank())
                    ? (ObjectNode) mapper.readTree(raw)
                    : mapper.createObjectNode();
        } catch (Exception e) {
            sceneData = mapper.createObjectNode();
        }

        ArrayNode tools = buildToolDefinitions();
        ArrayNode messages = buildInitialMessages(guidance, userMessage, sceneData);

        WebClient client = WebClient.builder()
                .baseUrl(AiSettings.DEEPSEEK_BASE_URL)
                .defaultHeader("Authorization", "Bearer " + aiSettings.apiKey())
                .defaultHeader("Content-Type", "application/json")
                .build();

        boolean sceneChanged = false;
        String finalMessage;
        int round = 0;

        while (true) {
            JsonNode response = callModel(client, aiSettings.model(), tools, messages);
            JsonNode choice = response.path("choices").path(0);
            JsonNode message = choice.path("message");
            String finishReason = choice.path("finish_reason").asText("");

            if (!"tool_calls".equals(finishReason)) {
                finalMessage = message.path("content").asText("");
                break;
            }

            // The assistant's tool-call message must go back into the conversation as-is,
            // followed by one "tool" role message per call, or the provider will reject the
            // next request.
            messages.add(message);
            for (JsonNode toolCall : message.path("tool_calls")) {
                String toolCallId = toolCall.path("id").asText("");
                String toolName = toolCall.path("function").path("name").asText();
                String argsJson = toolCall.path("function").path("arguments").asText("{}");
                String resultSummary;
                try {
                    ObjectNode args = (ObjectNode) mapper.readTree(argsJson);
                    executeTool(toolName, sceneData, args, projectSettings);
                    sceneChanged = true;
                    resultSummary = "OK";
                } catch (Exception e) {
                    resultSummary = "Error: " + e.getMessage();
                }
                ObjectNode toolResultMsg = mapper.createObjectNode();
                toolResultMsg.put("role", "tool");
                toolResultMsg.put("tool_call_id", toolCallId);
                toolResultMsg.put("content", resultSummary);
                messages.add(toolResultMsg);
            }

            round++;
            if (round >= MAX_TOOL_ROUNDS) {
                finalMessage = "Done for now — reached the automatic step limit (" + MAX_TOOL_ROUNDS +
                        ") for this request. Click Generate again to continue if anything is still missing.";
                break;
            }

            // Refresh the system message's scene snapshot so the next round sees what was
            // just created (e.g. the new poles' indices) before deciding what to do next.
            ((ObjectNode) messages.get(0)).put("content", buildSystemContent(guidance, sceneData));
        }

        if (sceneChanged) {
            String updatedSceneData = mapper.writeValueAsString(sceneData);
            location.setSceneData(updatedSceneData);
            locationRepository.save(location);
            return new ChatResponse(finalMessage, updatedSceneData);
        }
        return new ChatResponse(finalMessage, null);
    }

    private JsonNode callModel(WebClient client, String model, ArrayNode tools, ArrayNode messages) {
        ObjectNode requestBody = mapper.createObjectNode();
        requestBody.put("model", model);
        requestBody.set("tools", tools);
        requestBody.put("tool_choice", "auto");
        requestBody.set("messages", messages);
        return client.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .block();
    }

    public record TestResult(boolean success, String message) {}

    /**
     * Sends a minimal chat completion request (no tools, no scene data) so the admin can
     * verify a provider/API key/model combination from Platform Settings before saving it
     * for real use, and see the exact upstream error if it fails.
     */
    public Mono<TestResult> testConnection(AiSettings aiSettings, String userMessage) {
        ObjectNode requestBody = mapper.createObjectNode();
        requestBody.put("model", aiSettings.model());
        ArrayNode messages = mapper.createArrayNode();
        ObjectNode userMsg = mapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);
        requestBody.set("messages", messages);

        WebClient client = WebClient.builder()
                .baseUrl(AiSettings.DEEPSEEK_BASE_URL)
                .defaultHeader("Authorization", "Bearer " + aiSettings.apiKey())
                .defaultHeader("Content-Type", "application/json")
                .build();

        return client.post()
                .uri("/chat/completions")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(JsonNode.class)
                .map(response -> {
                    String content = response.path("choices").path(0).path("message").path("content").asText("");
                    return new TestResult(true, content.isBlank()
                            ? "Connected, but the model returned an empty response."
                            : content);
                })
                .onErrorResume(e -> {
                    log.error("AI test connection failed", e);
                    return Mono.just(new TestResult(false, describeError(e)));
                });
    }

    /** Turns a WebClient failure into a message that shows the real upstream cause (status + body). */
    private String describeError(Throwable e) {
        if (e instanceof WebClientResponseException wcre) {
            String body = wcre.getResponseBodyAsString();
            String summary = (body == null || body.isBlank()) ? "(no response body)"
                    : (body.length() > 500 ? body.substring(0, 500) + "..." : body);
            return "HTTP " + wcre.getStatusCode().value() + " from AI provider: " + summary;
        }
        return e.getMessage();
    }

    /** Maps each tool name to the single wrapper-key name its schema historically advertised. */
    private static final java.util.Map<String, String> TOOL_PARAM_NAMES = java.util.Map.of(
            "create_track", "trackData",
            "create_foundation", "foundationData",
            "create_pole", "poleData",
            "create_cantilever", "cantileverData",
            "create_vane", "vaneData"
    );

    private void executeTool(String toolName, ObjectNode sceneData, ObjectNode args, JsonNode projectSettings) {
        ObjectNode payload = unwrapIfNested(args, TOOL_PARAM_NAMES.get(toolName));
        switch (toolName) {
            case "create_track"       -> ocsAiTools.createTrack(sceneData, payload);
            case "create_foundation"  -> ocsAiTools.createFoundation(sceneData, payload);
            case "create_pole"        -> ocsAiTools.createPole(sceneData, payload, projectSettings.path("pole"));
            case "create_cantilever"  -> ocsAiTools.createCantilever(sceneData, payload, projectSettings.path("cantilever"));
            case "create_vane"        -> ocsAiTools.createVane(sceneData, payload, projectSettings.path("vane"));
            default -> log.warn("Unknown tool called by AI: {}", toolName);
        }
    }

    /**
     * The tool schema's top-level arguments ARE the entity's fields (x, z, label, points, ...)
     * — there is no wrapper. But models inconsistently sometimes nest the whole payload one
     * level deeper under a key named after the parameter (e.g. { "poleData": { x, z, ... } })
     * instead of putting those fields at the top level, which silently produced garbage
     * entries (an object holding one "poleData"/"cantileverData"/"vaneData" field instead of
     * the real fields) that failed to render. Detect and unwrap that one specific shape.
     */
    private ObjectNode unwrapIfNested(ObjectNode args, String paramName) {
        if (paramName != null && args.size() == 1 && args.get(paramName) != null && args.get(paramName).isObject()) {
            return (ObjectNode) args.get(paramName);
        }
        return args;
    }

    private ArrayNode buildInitialMessages(String guidance, String userMessage, ObjectNode sceneData) {
        ArrayNode messages = mapper.createArrayNode();

        // System prompt: engineering guidance + current scene state
        ObjectNode systemMsg = mapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", buildSystemContent(guidance, sceneData));
        messages.add(systemMsg);

        // User message
        ObjectNode userMsg = mapper.createObjectNode();
        userMsg.put("role", "user");
        userMsg.put("content", userMessage);
        messages.add(userMsg);

        return messages;
    }

    private String buildSystemContent(String guidance, ObjectNode sceneData) {
        return AGENT_DISCIPLINE_INSTRUCTION + "\n\n" + guidance + "\n\nCurrent sceneData:\n" + sceneData.toPrettyString();
    }

    // ─── Tool definitions sent to the AI ──────────────────────────────────────

    /**
     * NOTE ON SHAPE: each tool's "parameters" schema below describes the function-call
     * arguments object directly — its fields (x, z, label, points, ...) belong at the TOP
     * LEVEL of the arguments, not nested one level deeper under a "trackData"/"poleData"/etc.
     * key. An earlier version of this schema wrapped everything under such a key, and models
     * inconsistently took that literally, producing garbage entries that silently failed to
     * render (see AiService.unwrapIfNested(), kept as a safety net for whichever model this
     * runs against).
     */
    private ArrayNode buildToolDefinitions() {
        ArrayNode tools = mapper.createArrayNode();
        tools.add(buildTool("create_track",
                "Creates a new track alignment in the location.",
                buildSchema("The arguments ARE the track object, with EXACTLY this shape: " +
                        "{ \"label\": string, \"points\": [ { \"x\": number, \"z\": number, \"y\"?: number, \"r\"?: number }, ... ] }. " +
                        "\"points\" is REQUIRED and must have at least 2 entries — this is the polyline the track follows, " +
                        "never a flat set of coordinate fields on the track object itself. " +
                        "\"r\" on a point (other than the first) curves the segment into that point with that radius " +
                        "(positive = curves one way, negative = the other); omit \"r\" for a straight segment.")));
        tools.add(buildTool("create_foundation",
                "Creates a new foundation at a position relative to a track. Give an approximate x/z near " +
                "where along the track (and which side) you want it — the exact perpendicular offset from " +
                "the track's actual centerline, including through curves, is snapped automatically; you do " +
                "not need to compute perpendicular geometry yourself.",
                buildSchema("The arguments ARE the foundation object: x, z (approximate position near the track), label, trackId, and structural specifications — put these fields directly at the top level.")));
        tools.add(buildTool("create_pole",
                "Creates a new pole mounted on a foundation. Give an approximate x/z matching the foundation " +
                "it mounts on — the exact perpendicular offset from the track is snapped automatically, same as create_foundation.",
                buildSchema("The arguments ARE the pole object: x, z coordinates (approximate, near the matching foundation), label, cantileversQuantity, catSeparation — put these fields directly at the top level.")));
        tools.add(buildTool("create_cantilever",
                "Creates a cantilever attached to a pole that positions the contact wire over a track. " +
                "Give an approximate x1/z1 near the pole it belongs to (it snaps to the nearest real pole " +
                "automatically) — the exact track-foot geometry (x2/z2, x2raw/z2raw, tx/tz) is computed " +
                "automatically from that pole and the actual track, do not try to compute or supply it. " +
                "contactWireHeight, systemHeight, and zigzag are also enforced to the project's configured " +
                "values regardless of what you provide, except zigzag's sign, which you control for " +
                "TDP/CAI alternation (positive vs negative).",
                buildSchema("The arguments ARE the cantilever object: x1/z1 (approximate pole position), " +
                        "zigzag (sign only matters), configuration, etc. — put these fields directly at the top level.")));
        tools.add(buildTool("create_vane",
                "Creates a vane (catenary wire span) connecting two cantilevers. You only need to provide " +
                "cantileverIdx1/cantileverIdx2 plus any overrides — the geometry (x1/z1/x2/z2) is computed " +
                "automatically from the two cantilevers, do not try to supply it.",
                buildSchema("The arguments ARE the vane object: cantileverIdx1, cantileverIdx2, qtyDroppers, " +
                        "cwTension, swTension, cwWeight, swWeight, initialSeparation — put these fields directly at the top level.")));
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

    private ObjectNode buildSchema(String description) {
        ObjectNode schema = mapper.createObjectNode();
        schema.put("type", "object");
        schema.put("description", description);
        return schema;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /** Design-criteria document — editable from Platform Settings in the UI; see
     *  PlatformSettingsService.getDesignCriteria() for the DB-value-or-bundled-default logic. */
    private String loadGuidance() {
        return platformSettingsService.getDesignCriteria();
    }

    /** Parses Project.settings once; returns an empty ObjectNode (never null) if missing/invalid. */
    private JsonNode parseProjectSettings(Project project) {
        try {
            String raw = project.getSettings();
            if (raw == null || raw.isBlank()) return mapper.createObjectNode();
            return mapper.readTree(raw);
        } catch (Exception e) {
            log.warn("Could not parse project settings", e);
            return mapper.createObjectNode();
        }
    }

    /**
     * The design-criteria document is platform-wide and can only state generic nominal values
     * (e.g. "6550mm nominal contact wire height"). Individual projects configure their own real
     * defaults (Project.settings, edited in the project's own settings panel) which can differ
     * — this project's actual cantilever default was 5400/1000 while the generic guidance said
     * 6550/1500, and the AI had no way to know that. Surface the project's real config so the
     * AI uses it instead of guessing from the generic document. Note: this alone isn't enough —
     * the model still sometimes writes 6.55 instead of 6550, or 0.2 instead of 250 (unit/scale
     * confusion), so createCantilever()/createVane() ALSO validate against these same values
     * and backfill anything implausible, rather than relying purely on the model reading this text.
     */
    private String buildProjectDefaultsBlock(JsonNode settings) {
        ObjectNode relevant = mapper.createObjectNode();
        for (String key : new String[]{"pole", "cantilever", "vane", "foundation", "anchorPoint", "catenarySystem"}) {
            if (settings.has(key)) relevant.set(key, settings.get(key));
        }
        if (relevant.isEmpty()) return "";
        return "## Project-specific configured defaults\n" +
                "Use these exact values for this project — they override the generic nominal " +
                "figures in the guidance above, which are fallbacks for projects with no configured settings:\n" +
                relevant.toPrettyString();
    }
}
