package com.ocs.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    // Batch cantilever/vane calculation payloads (and their results, now including
    // per-tube structural data and force vectors) can comfortably exceed Tomcat's
    // default 8KB per-message WebSocket buffer once a scene has more than a few
    // cantilevers. Raise both the raw Tomcat container buffer (used by the native
    // "/ws-raw" endpoint) and Spring's own STOMP message size limit (used by the
    // SockJS "/ws" endpoint) well past any realistic batch size.
    private static final int MAX_WS_MESSAGE_SIZE = 5 * 1024 * 1024; // 5MB

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(MAX_WS_MESSAGE_SIZE);
        container.setMaxBinaryMessageBufferSize(MAX_WS_MESSAGE_SIZE);
        return container;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
        // Native WebSocket endpoint (no SockJS) for browser WebSocket API
        registry.addEndpoint("/ws-raw")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        registration.setMessageSizeLimit(MAX_WS_MESSAGE_SIZE);
        registration.setSendBufferSizeLimit(MAX_WS_MESSAGE_SIZE);
    }

}
