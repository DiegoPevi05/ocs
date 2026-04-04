package com.ocs.api.calculator;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

@Service
public class CalculatorClient {

    private final WebClient webClient;

    public CalculatorClient(@Value("${app.calculator.url}") String calculatorUrl, WebClient.Builder webClientBuilder) {
        this.webClient = webClientBuilder.baseUrl(calculatorUrl).build();
    }

    public Mono<JsonNode> calculateCantilever(Object dto) {
        return webClient.post()
                .uri("/cantilever")
                .bodyValue(dto)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    public Mono<JsonNode> calculateBatch(Object dto) {
        return webClient.post()
                .uri("/batch")
                .bodyValue(dto)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    public Mono<JsonNode> calculateVane(Object dto) {
        return webClient.post()
                .uri("/vane")
                .bodyValue(dto)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }

    public Mono<JsonNode> combine(Object dto) {
        return webClient.post()
                .uri("/combine")
                .bodyValue(dto)
                .retrieve()
                .bodyToMono(JsonNode.class);
    }
}
