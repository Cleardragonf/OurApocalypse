package com.cwarner.apocalypsemobs.admin;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.game.BlockPlacementLedger;
import com.cwarner.apocalypsemobs.game.DifficultyCalculator;
import com.cwarner.apocalypsemobs.game.EconomyWalletLedger;
import com.cwarner.apocalypsemobs.game.WeightedEntityPicker;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.mojang.brigadier.suggestion.Suggestion;
import net.minecraft.commands.CommandSourceStack;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.registries.ForgeRegistries;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

public final class AdminHttpServer {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private volatile HttpServer httpServer;
    private volatile MinecraftServer minecraftServer;
    private volatile int latestRevision;

    public synchronized void start(MinecraftServer server) {
        this.minecraftServer = server;
        var api = ConfigManager.get().adminApi;
        if (!api.enabled) {
            ApocalypseMobs.LOGGER.info("Apocalypse Mobs admin REST API disabled.");
            return;
        }
        if (httpServer != null) return;
        try {
            InetAddress address = InetAddress.getByName(api.host);
            httpServer = HttpServer.create(new InetSocketAddress(address, api.port), 50);
            httpServer.setExecutor(Executors.newCachedThreadPool(task -> {
                Thread thread = new Thread(task, "ApocalypseMobs-AdminHttp");
                thread.setDaemon(true);
                return thread;
            }));
            httpServer.createContext("/api/status", this::handleStatus);
            httpServer.createContext("/api/config", this::handleConfig);
            httpServer.createContext("/api/reload-config", this::handleReloadConfig);
            httpServer.createContext("/api/placed-blocks", this::handlePlacedBlocks);
            httpServer.createContext("/api/rollback/placed-blocks", this::handleRollbackPlacedBlocks);
            httpServer.createContext("/api/registry/items", this::handleRegistryItems);
            httpServer.createContext("/api/registry/entities", this::handleRegistryEntities);
            httpServer.createContext("/api/registry/commands", this::handleRegistryCommands);
            httpServer.createContext("/api/registry/command-suggestions", this::handleCommandSuggestions);
            httpServer.createContext("/api/economy/balance", this::handleEconomyBalance);
            httpServer.createContext("/api/economy/add", exchange -> handleEconomyOperation(exchange, "add"));
            httpServer.createContext("/api/economy/remove", exchange -> handleEconomyOperation(exchange, "remove"));
            httpServer.createContext("/api/economy/set", exchange -> handleEconomyOperation(exchange, "set"));
            httpServer.start();
            ApocalypseMobs.LOGGER.info("Apocalypse Mobs admin REST API listening on http://{}:{}", api.host, api.port);
        } catch (Exception ex) {
            ApocalypseMobs.LOGGER.error("Unable to start Apocalypse Mobs admin REST API.", ex);
        }
    }

    public synchronized void stop() {
        if (httpServer != null) {
            httpServer.stop(0);
            httpServer = null;
        }
        ApocalypseMobs.LOGGER.info("Apocalypse Mobs admin REST API stopped.");
    }

    private void handleStatus(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        json(exchange, 200, buildStatus());
    }

    private void handleConfig(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!authorized(exchange)) return;
        if ("GET".equals(exchange.getRequestMethod())) {
            json(exchange, 200, Map.of("config", ConfigManager.get(), "revision", latestRevision));
            return;
        }
        if ("PUT".equals(exchange.getRequestMethod())) {
            try {
                String body = readBody(exchange);
                ConfigManager.replaceFromJson(body);
                latestRevision++;
                json(exchange, 200, Map.of("ok", true, "revision", latestRevision, "status", buildStatus()));
            } catch (Exception ex) {
                json(exchange, 400, Map.of("message", "Invalid config JSON: " + ex.getMessage()));
            }
            return;
        }
        methodNotAllowed(exchange);
    }

    private void handleReloadConfig(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "POST")) return;
        if (!authorized(exchange)) return;
        ConfigManager.loadOrCreate();
        latestRevision++;
        json(exchange, 200, Map.of("ok", true, "revision", latestRevision, "config", ConfigManager.get()));
    }

    private void handlePlacedBlocks(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        int limit = intQuery(exchange.getRequestURI(), "limit", 250);
        json(exchange, 200, Map.of(
                "ledgerPath", BlockPlacementLedger.getLedgerPath().toString(),
                "openCount", BlockPlacementLedger.countOpen(),
                "totalCount", BlockPlacementLedger.countTotal(),
                "records", BlockPlacementLedger.latest(limit)
        ));
    }

    private void handleRollbackPlacedBlocks(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "POST")) return;
        if (!authorized(exchange)) return;
        boolean all = booleanQuery(exchange.getRequestURI(), "all", false);
        int limit = intQuery(exchange.getRequestURI(), "limit", ConfigManager.get().cleanup.maxRollbackPerRequest);
        CompletableFuture<BlockPlacementLedger.RollbackSummary> future = new CompletableFuture<>();
        MinecraftServer server = minecraftServer;
        if (server == null) {
            json(exchange, 503, Map.of("message", "Minecraft server not available."));
            return;
        }
        server.execute(() -> {
            try {
                future.complete(all ? BlockPlacementLedger.rollbackAll(server) : BlockPlacementLedger.rollback(server, limit));
            } catch (Exception ex) {
                future.completeExceptionally(ex);
            }
        });
        try {
            BlockPlacementLedger.RollbackSummary summary = future.get(10, TimeUnit.SECONDS);
            json(exchange, 200, Map.of("ok", true, "summary", summary, "status", buildStatus()));
        } catch (Exception ex) {
            json(exchange, 500, Map.of("message", "Rollback failed: " + ex.getMessage()));
        }
    }


    private void handleRegistryItems(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        List<String> items = ForgeRegistries.ITEMS.getKeys().stream()
                .map(Object::toString)
                .sorted()
                .collect(Collectors.toList());
        json(exchange, 200, Map.of(
                "count", items.size(),
                "items", items
        ));
    }


    private void handleRegistryEntities(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        List<String> entities = ForgeRegistries.ENTITY_TYPES.getKeys().stream()
                .map(Object::toString)
                .sorted()
                .collect(Collectors.toList());
        json(exchange, 200, Map.of(
                "count", entities.size(),
                "entities", entities
        ));
    }


    private void handleRegistryCommands(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        MinecraftServer server = minecraftServer;
        if (server == null) {
            json(exchange, 503, Map.of("message", "Minecraft server not available."));
            return;
        }
        List<String> commands = server.getCommands().getDispatcher().getRoot().getChildren().stream()
                .map(node -> node.getName())
                .sorted()
                .collect(Collectors.toList());
        json(exchange, 200, Map.of(
                "count", commands.size(),
                "commands", commands
        ));
    }

    private void handleCommandSuggestions(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        MinecraftServer server = minecraftServer;
        if (server == null) {
            json(exchange, 503, Map.of("message", "Minecraft server not available."));
            return;
        }

        String rawInput = stringQuery(exchange.getRequestURI(), "input", "");
        String commandInput = rawInput.startsWith("/") ? rawInput.substring(1) : rawInput;
        CompletableFuture<List<String>> future = new CompletableFuture<>();

        server.execute(() -> {
            try {
                CommandSourceStack source = server.createCommandSourceStack().withPermission(4);
                var dispatcher = server.getCommands().getDispatcher();
                var parse = dispatcher.parse(commandInput, source);
                dispatcher.getCompletionSuggestions(parse).whenComplete((suggestions, error) -> {
                    if (error != null) {
                        future.completeExceptionally(error);
                        return;
                    }
                    List<String> result = suggestions.getList().stream()
                            .map(Suggestion::getText)
                            .distinct()
                            .sorted()
                            .collect(Collectors.toList());
                    future.complete(result);
                });
            } catch (Exception ex) {
                future.completeExceptionally(ex);
            }
        });

        try {
            List<String> suggestions = future.get(5, TimeUnit.SECONDS);
            json(exchange, 200, Map.of(
                    "input", rawInput,
                    "count", suggestions.size(),
                    "suggestions", suggestions
            ));
        } catch (Exception ex) {
            json(exchange, 500, Map.of("message", "Command suggestions failed: " + ex.getMessage()));
        }
    }

    private void handleEconomyBalance(HttpExchange exchange) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "GET")) return;
        if (!authorized(exchange)) return;
        String playerName = stringQuery(exchange.getRequestURI(), "player", "");
        if (playerName.isBlank()) {
            json(exchange, 400, Map.of("message", "Missing required player query parameter."));
            return;
        }
        withOnlinePlayer(exchange, playerName, player -> EconomyWalletLedger.balance(player));
    }

    private void handleEconomyOperation(HttpExchange exchange, String operation) throws IOException {
        if (preflight(exchange)) return;
        if (!requireMethod(exchange, "POST")) return;
        if (!authorized(exchange)) return;
        EconomyOperationRequest request;
        try {
            request = GSON.fromJson(readBody(exchange), EconomyOperationRequest.class);
        } catch (Exception ex) {
            json(exchange, 400, Map.of("message", "Invalid economy request JSON."));
            return;
        }
        if (request == null || request.player == null || request.player.isBlank()) {
            json(exchange, 400, Map.of("message", "Missing required player."));
            return;
        }
        if (Double.isNaN(request.value) || Double.isInfinite(request.value) || request.value < 0.0D) {
            json(exchange, 400, Map.of("message", "Value must be a non-negative number."));
            return;
        }
        withOnlinePlayer(exchange, request.player, player -> switch (operation) {
            case "add" -> EconomyWalletLedger.add(player, request.value, "api:add");
            case "remove" -> EconomyWalletLedger.remove(player, request.value, "api:remove");
            case "set" -> EconomyWalletLedger.set(player, request.value, "api:set");
            default -> EconomyWalletLedger.balance(player);
        });
    }

    private void withOnlinePlayer(HttpExchange exchange, String playerName, EconomyPlayerAction action) throws IOException {
        MinecraftServer server = minecraftServer;
        if (server == null) {
            json(exchange, 503, Map.of("message", "Minecraft server not available."));
            return;
        }

        CompletableFuture<EconomyWalletLedger.WalletRecord> future = new CompletableFuture<>();
        server.execute(() -> {
            try {
                var player = EconomyWalletLedger.findOnlinePlayer(server, playerName);
                if (player.isEmpty()) {
                    future.completeExceptionally(new IllegalArgumentException("Player is not online: " + playerName));
                    return;
                }
                future.complete(action.apply(player.get()));
            } catch (Exception ex) {
                future.completeExceptionally(ex);
            }
        });

        try {
            EconomyWalletLedger.WalletRecord wallet = future.get(5, TimeUnit.SECONDS);
            json(exchange, 200, Map.of(
                    "ok", true,
                    "player", wallet.name,
                    "uuid", wallet.uuid,
                    "balance", wallet.balance,
                    "currencyName", ConfigManager.get().economy.currencyName,
                    "updatedAt", wallet.updatedAt
            ));
        } catch (Exception ex) {
            Throwable cause = ex.getCause() == null ? ex : ex.getCause();
            int status = cause instanceof IllegalArgumentException ? 404 : 500;
            json(exchange, status, Map.of("message", cause.getMessage() == null ? "Economy command failed." : cause.getMessage()));
        }
    }

    private Map<String, Object> buildStatus() {
        MinecraftServer server = minecraftServer;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("modId", ApocalypseMobs.MOD_ID);
        result.put("modVersion", "1.7.0");
        result.put("connected", true);
        result.put("communication", "REST_POLLING");
        result.put("configPath", ConfigManager.getConfigPath().toString());
        result.put("ledgerPath", BlockPlacementLedger.getLedgerPath().toString());
        result.put("configRevision", latestRevision);
        result.put("placedBlockOpenCount", BlockPlacementLedger.countOpen());
        result.put("placedBlockTotalCount", BlockPlacementLedger.countTotal());
        result.put("lastMessageAt", Instant.now().toString());
        if (server != null) {
            result.put("players", server.getPlayerCount());
            result.put("maxPlayers", server.getMaxPlayers());
            result.put("serverTickCount", server.getTickCount());
            ServerLevel overworld = server.overworld();
            ApocalypseConfig config = ConfigManager.get();
            int difficultyDay = DifficultyCalculator.getDifficultyDay(overworld);
            result.put("difficultyDay", difficultyDay);
            result.put("activeWaveProfile", "LEGACY_RULES".equals(config.waves.activeMode) ? "Legacy Wave Rules" : "Night Profiles");
            result.put("activeEntityProfile", WeightedEntityPicker.getActiveProfileName(overworld, config, difficultyDay));
            result.put("dayTime", overworld.getDayTime());
            result.put("gameTime", overworld.getGameTime());
            result.put("dimension", overworld.dimension().location().toString());
        }
        return result;
    }

    private boolean authorized(HttpExchange exchange) throws IOException {
        var api = ConfigManager.get().adminApi;
        if (!api.requireToken || api.adminToken == null || api.adminToken.isBlank()) return true;
        List<String> values = exchange.getRequestHeaders().getOrDefault("x-apocalypse-token", List.of());
        if (!values.isEmpty() && api.adminToken.equals(values.get(0))) return true;
        json(exchange, 401, Map.of("message", "Unauthorized. Missing or invalid x-apocalypse-token."));
        return false;
    }

    private boolean preflight(HttpExchange exchange) throws IOException {
        addCors(exchange);
        if ("OPTIONS".equals(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return true;
        }
        return false;
    }

    private boolean requireMethod(HttpExchange exchange, String method) throws IOException {
        if (method.equals(exchange.getRequestMethod())) return true;
        methodNotAllowed(exchange);
        return false;
    }

    private void methodNotAllowed(HttpExchange exchange) throws IOException {
        json(exchange, 405, Map.of("message", "Method not allowed."));
    }

    private void json(HttpExchange exchange, int status, Object value) throws IOException {
        addCors(exchange);
        byte[] bytes = GSON.toJson(value).getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(bytes);
        }
    }

    private void addCors(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET,PUT,POST,OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type,x-apocalypse-token");
    }

    private String readBody(HttpExchange exchange) throws IOException {
        try (InputStream input = exchange.getRequestBody()) {
            return new String(input.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private int intQuery(URI uri, String name, int fallback) {
        String value = query(uri).get(name);
        if (value == null) return fallback;
        try { return Integer.parseInt(value); } catch (NumberFormatException ignored) { return fallback; }
    }

    private boolean booleanQuery(URI uri, String name, boolean fallback) {
        String value = query(uri).get(name);
        if (value == null) return fallback;
        return "true".equalsIgnoreCase(value) || "1".equals(value);
    }

    private String stringQuery(URI uri, String name, String fallback) {
        String value = query(uri).get(name);
        if (value == null) return fallback;
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }

    private Map<String, String> query(URI uri) {
        Map<String, String> result = new LinkedHashMap<>();
        String raw = uri.getRawQuery();
        if (raw == null || raw.isBlank()) return result;
        for (String part : raw.split("&")) {
            String[] pieces = part.split("=", 2);
            result.put(pieces[0], pieces.length > 1 ? pieces[1] : "");
        }
        return result;
    }

    private interface EconomyPlayerAction {
        EconomyWalletLedger.WalletRecord apply(ServerPlayer player);
    }

    private static class EconomyOperationRequest {
        String player = "";
        double value = 0.0D;
    }
}
