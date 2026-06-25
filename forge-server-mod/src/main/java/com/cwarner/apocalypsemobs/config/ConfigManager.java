package com.cwarner.apocalypsemobs.config;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import net.minecraftforge.fml.loading.FMLPaths;

import java.io.IOException;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

public final class ConfigManager {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path CONFIG_PATH = FMLPaths.CONFIGDIR.get().resolve("apocalypse-mobs.json");
    private static ApocalypseConfig config = new ApocalypseConfig();

    private ConfigManager() {}

    public static synchronized void loadOrCreate() {
        try {
            Files.createDirectories(CONFIG_PATH.getParent());
            if (!Files.exists(CONFIG_PATH)) {
                config = new ApocalypseConfig();
                save();
                return;
            }
            String json = Files.readString(CONFIG_PATH, StandardCharsets.UTF_8);
            ApocalypseConfig loaded = GSON.fromJson(json, ApocalypseConfig.class);
            if (loaded == null) loaded = new ApocalypseConfig();
            if (!json.contains("\"entitySpawning\"") && loaded.entityWeights != null && !loaded.entityWeights.isEmpty()) {
                loaded.entitySpawning.legacyWeights = loaded.entityWeights;
            }
            migrateOurMagicSettings(json, loaded);
            loaded.sanitize();
            config = loaded;
            save();
        } catch (Exception ex) {
            ApocalypseMobs.LOGGER.error("Unable to load Apocalypse Mobs config. Falling back to defaults.", ex);
            config = new ApocalypseConfig();
            saveQuietly();
        }
    }

    public static synchronized ApocalypseConfig get() {
        config.sanitize();
        return config;
    }

    public static synchronized String toJson() {
        return GSON.toJson(get());
    }

    public static synchronized void replaceFromJson(String body) {
        ApocalypseConfig replacement = GSON.fromJson(body, ApocalypseConfig.class);
        if (replacement == null) throw new IllegalArgumentException("Config body was empty or invalid JSON.");
        if (!body.contains("\"entitySpawning\"") && replacement.entityWeights != null && !replacement.entityWeights.isEmpty()) {
            replacement.entitySpawning.legacyWeights = replacement.entityWeights;
        }
        migrateOurMagicSettings(body, replacement);
        replacement.sanitize();
        config = replacement;
        save();
    }

    public static synchronized void save() {
        try {
            Files.createDirectories(CONFIG_PATH.getParent());
            Files.writeString(CONFIG_PATH, GSON.toJson(config), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to save config to " + CONFIG_PATH, ex);
        }
    }

    public static synchronized void saveQuietly() {
        try {
            save();
        } catch (RuntimeException ex) {
            ApocalypseMobs.LOGGER.error("Unable to save Apocalypse Mobs config.", ex);
        }
    }

    public static Path getConfigPath() {
        return CONFIG_PATH;
    }

    private static void migrateOurMagicSettings(String json, ApocalypseConfig config) {
        try {
            JsonObject root = JsonParser.parseString(json).getAsJsonObject();
            JsonObject integrations = object(root, "integrations");
            JsonObject ourMagic = object(integrations, "ourMagic");
            if (ourMagic == null || config.integrations == null || config.integrations.ourMagic == null) return;

            String url = string(ourMagic, "gatewayUrl");
            if (url == null || url.isBlank()) {
                String baseUrl = string(ourMagic, "baseUrl");
                String path = string(ourMagic, "giveExperiencePath");
                if (baseUrl != null && !baseUrl.isBlank()) {
                    if (path == null || path.isBlank()) path = "/api/mod/our-magic/experience";
                    if (!path.startsWith("/")) path = "/" + path;
                    url = baseUrl.replaceAll("/+$", "") + path;
                }
            }
            if (url == null || url.isBlank()) return;

            URI uri = URI.create(url);
            if (uri.getHost() != null && !ourMagic.has("host")) {
                config.integrations.ourMagic.host = uri.getHost();
            }
            if (uri.getPort() > 0 && !ourMagic.has("port")) {
                config.integrations.ourMagic.port = uri.getPort();
            }
        } catch (Exception ignored) {
            // Invalid legacy URL fields should not prevent the rest of the config from loading.
        }
    }

    private static JsonObject object(JsonObject parent, String key) {
        if (parent == null || !parent.has(key) || !parent.get(key).isJsonObject()) return null;
        return parent.getAsJsonObject(key);
    }

    private static String string(JsonObject parent, String key) {
        if (parent == null || !parent.has(key) || parent.get(key).isJsonNull()) return null;
        return parent.get(key).getAsString();
    }
}
