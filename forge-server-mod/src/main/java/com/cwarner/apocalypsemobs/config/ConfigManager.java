package com.cwarner.apocalypsemobs.config;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.minecraftforge.fml.loading.FMLPaths;

import java.io.IOException;
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
}
