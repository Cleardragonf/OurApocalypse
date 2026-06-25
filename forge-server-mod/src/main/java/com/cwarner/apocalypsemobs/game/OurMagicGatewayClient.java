package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.google.gson.Gson;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

public final class OurMagicGatewayClient {
    private static final String GATEWAY_PATH = "/api/mod/our-magic/experience";
    private static final String TOKEN_HEADER = "x-mod-api-key";
    private static final int TIMEOUT_MILLIS = 3000;
    private static final Gson GSON = new Gson();
    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    private OurMagicGatewayClient() {}

    public static void grantExperience(ServerLevel level, ServerPlayer player, int amount, String reason, String source, String entityId, String targetMode) {
        ApocalypseConfig.OurMagicSettings settings = com.cwarner.apocalypsemobs.config.ConfigManager.get().integrations.ourMagic;
        if (settings == null || !settings.enabled || amount <= 0) return;

        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("type", "APOCALYPSE_EXPERIENCE_REWARD");
            payload.put("serverId", level.getServer().getServerModName());
            payload.put("worldName", level.getServer().getWorldData().getLevelName());
            payload.put("dimension", level.dimension().location().toString());
            payload.put("playerUuid", player.getUUID().toString());
            payload.put("playerName", player.getGameProfile().getName());
            payload.put("amount", amount);
            payload.put("reason", reason);
            payload.put("source", source);
            payload.put("entityId", entityId);
            payload.put("targetMode", targetMode);
            payload.put("timestamp", Instant.now().toString());

            HttpRequest.Builder request = HttpRequest.newBuilder()
                    .uri(URI.create(gatewayUrl(settings)))
                    .timeout(Duration.ofMillis(TIMEOUT_MILLIS))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(GSON.toJson(payload)));

            if (!settings.token.isBlank()) {
                request.header(TOKEN_HEADER, settings.token);
            }

            HTTP_CLIENT.sendAsync(request.build(), HttpResponse.BodyHandlers.ofString())
                    .thenAccept(response -> {
                        if (response.statusCode() < 200 || response.statusCode() >= 300) {
                            ApocalypseMobs.LOGGER.warn("Our Magic gateway rejected reward for {} with HTTP {}: {}", player.getGameProfile().getName(), response.statusCode(), response.body());
                        }
                    })
                    .exceptionally(error -> {
                        ApocalypseMobs.LOGGER.warn("Unable to send Our Magic reward for {} through gateway {}.", player.getGameProfile().getName(), gatewayUrl(settings), error);
                        return null;
                    });
        } catch (Exception ex) {
            ApocalypseMobs.LOGGER.warn("Unable to queue Our Magic reward for {}.", player.getGameProfile().getName(), ex);
        }
    }

    private static String gatewayUrl(ApocalypseConfig.OurMagicSettings settings) {
        return "http://" + settings.host + ":" + settings.port + GATEWAY_PATH;
    }
}
