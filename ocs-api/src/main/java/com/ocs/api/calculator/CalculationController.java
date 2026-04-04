package com.ocs.api.calculator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class CalculationController {

    private final CalculatorClient calculatorClient;
    private final SimpMessagingTemplate messaging;
    private final ObjectMapper mapper = new ObjectMapper();

    public CalculationController(CalculatorClient calculatorClient, SimpMessagingTemplate messaging) {
        this.calculatorClient = calculatorClient;
        this.messaging = messaging;
    }

    private ObjectNode errorNode(String message) {
        ObjectNode n = mapper.createObjectNode();
        n.put("status", "error");
        n.put("message", message);
        return n;
    }

    /**
     * Receives cantilever params from frontend via STOMP (/app/calculate/cantilever),
     * calls ocs-calculator, and broadcasts result to /topic/calculation.
     */
    @MessageMapping("/calculate/cantilever")
    public void calculateCantilever(@Payload Map<String, Object> request) {
        calculatorClient.calculateCantilever(request)
                .subscribe(
                        result -> messaging.convertAndSend("/topic/calculation", result),
                        error -> messaging.convertAndSend("/topic/calculation", errorNode(error.getMessage()))
                );
    }

    /**
     * Receives batch array from frontend via STOMP (/app/calculate/batch),
     * calls ocs-calculator, and broadcasts result to /topic/calculation.
     */
    @MessageMapping("/calculate/batch")
    public void calculateBatch(@Payload com.fasterxml.jackson.databind.JsonNode request) {
        calculatorClient.calculateBatch(request)
                .subscribe(
                        result -> messaging.convertAndSend("/topic/calculation", result),
                        error -> messaging.convertAndSend("/topic/calculation", errorNode(error.getMessage()))
                );
    }

    /**
     * Receives vane params from frontend via STOMP (/app/calculate/vane),
     * calls ocs-calculator, and broadcasts result to /topic/vane-result.
     */
    @MessageMapping("/calculate/vane")
    public void calculateVane(@Payload Map<String, Object> request) {
        calculatorClient.calculateVane(request)
                .subscribe(
                        result -> messaging.convertAndSend("/topic/vane-result", result),
                        error -> messaging.convertAndSend("/topic/vane-result", errorNode(error.getMessage()))
                );
    }
}
