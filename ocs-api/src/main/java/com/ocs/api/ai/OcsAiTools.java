package com.ocs.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

/**
 * Contains all AI-callable tool methods for modifying OCS location sceneData.
 * These methods are invoked by AiService after the AI model requests a tool call.
 */
@Component
@RequiredArgsConstructor
public class OcsAiTools {

    private final ObjectMapper mapper;

    public ObjectNode createTrack(ObjectNode sceneData, ObjectNode trackData) {
        getOrCreateArray(sceneData, "tracks").add(trackData);
        return sceneData;
    }

    public ObjectNode createFoundation(ObjectNode sceneData, ObjectNode foundationData) {
        getOrCreateArray(sceneData, "foundations").add(foundationData);
        return sceneData;
    }

    public ObjectNode createPole(ObjectNode sceneData, ObjectNode poleData) {
        getOrCreateArray(sceneData, "poles").add(poleData);
        return sceneData;
    }

    public ObjectNode createCantilever(ObjectNode sceneData, ObjectNode cantileverData) {
        getOrCreateArray(sceneData, "cantilevers").add(cantileverData);
        return sceneData;
    }

    public ObjectNode createVane(ObjectNode sceneData, ObjectNode vaneData) {
        getOrCreateArray(sceneData, "vanes").add(vaneData);
        return sceneData;
    }

    private ArrayNode getOrCreateArray(ObjectNode node, String field) {
        if (!node.has(field) || !node.get(field).isArray()) {
            node.set(field, mapper.createArrayNode());
        }
        return (ArrayNode) node.get(field);
    }
}
