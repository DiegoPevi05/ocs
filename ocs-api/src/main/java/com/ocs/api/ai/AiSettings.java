package com.ocs.api.ai;

public record AiSettings(String provider, String apiKey, String model) {
    public static final String DEFAULT_MODEL    = "deepseek-chat";
    public static final String DEFAULT_PROVIDER = "deepseek";
    public static final String DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";
}
