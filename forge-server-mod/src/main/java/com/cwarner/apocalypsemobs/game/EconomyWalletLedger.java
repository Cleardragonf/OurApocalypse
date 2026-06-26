package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.fml.loading.FMLPaths;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public final class EconomyWalletLedger {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Path LEDGER_PATH = FMLPaths.CONFIGDIR.get().resolve("apocalypse-mobs-wallets.json");
    private static WalletState state = new WalletState();

    private EconomyWalletLedger() {}

    public static synchronized void loadOrCreate() {
        try {
            Files.createDirectories(LEDGER_PATH.getParent());
            if (!Files.exists(LEDGER_PATH)) {
                state = new WalletState();
                save();
                return;
            }
            WalletState loaded = GSON.fromJson(Files.readString(LEDGER_PATH, StandardCharsets.UTF_8), WalletState.class);
            state = loaded == null ? new WalletState() : loaded;
            if (state.wallets == null) state.wallets = new LinkedHashMap<>();
            save();
        } catch (Exception ex) {
            ApocalypseMobs.LOGGER.error("Unable to load Apocalypse Mobs economy wallets. Starting with an empty ledger.", ex);
            state = new WalletState();
            saveQuietly();
        }
    }

    public static synchronized WalletRecord balance(ServerPlayer player) {
        WalletRecord record = getOrCreate(player);
        saveQuietly();
        return copy(record);
    }

    public static synchronized WalletRecord set(ServerPlayer player, double value, String reason) {
        WalletRecord record = getOrCreate(player);
        record.balance = sanitizeAmount(value);
        touch(record, reason);
        saveQuietly();
        return copy(record);
    }

    public static synchronized WalletRecord add(ServerPlayer player, double value, String reason) {
        WalletRecord record = getOrCreate(player);
        record.balance = sanitizeAmount(record.balance + Math.max(0.0D, value));
        touch(record, reason);
        saveQuietly();
        return copy(record);
    }

    public static synchronized WalletRecord remove(ServerPlayer player, double value, String reason) {
        WalletRecord record = getOrCreate(player);
        record.balance = sanitizeAmount(Math.max(0.0D, record.balance - Math.max(0.0D, value)));
        touch(record, reason);
        saveQuietly();
        return copy(record);
    }

    public static Optional<ServerPlayer> findOnlinePlayer(MinecraftServer server, String playerName) {
        if (server == null || playerName == null || playerName.isBlank()) return Optional.empty();
        return server.getPlayerList().getPlayers().stream()
                .filter(player -> player.getGameProfile().getName().equalsIgnoreCase(playerName.trim()))
                .findFirst();
    }

    public static Path getLedgerPath() {
        return LEDGER_PATH;
    }

    public static synchronized void saveQuietly() {
        try {
            save();
        } catch (RuntimeException ex) {
            ApocalypseMobs.LOGGER.error("Unable to save Apocalypse Mobs economy wallets.", ex);
        }
    }

    private static WalletRecord getOrCreate(ServerPlayer player) {
        if (state.wallets == null) state.wallets = new LinkedHashMap<>();
        String uuid = player.getUUID().toString();
        WalletRecord record = state.wallets.get(uuid);
        if (record == null) {
            record = new WalletRecord();
            record.uuid = uuid;
            record.balance = sanitizeAmount(ConfigManager.get().economy.startingBalance);
            state.wallets.put(uuid, record);
        }
        record.name = player.getGameProfile().getName();
        if (record.createdAt == null || record.createdAt.isBlank()) record.createdAt = Instant.now().toString();
        if (record.updatedAt == null || record.updatedAt.isBlank()) record.updatedAt = record.createdAt;
        if (record.lastReason == null) record.lastReason = "";
        return record;
    }

    private static void touch(WalletRecord record, String reason) {
        record.updatedAt = Instant.now().toString();
        record.lastReason = reason == null ? "" : reason;
    }

    private static double sanitizeAmount(double value) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return 0.0D;
        return Math.max(0.0D, Math.round(value * 100.0D) / 100.0D);
    }

    private static WalletRecord copy(WalletRecord source) {
        WalletRecord copy = new WalletRecord();
        copy.uuid = source.uuid;
        copy.name = source.name;
        copy.balance = source.balance;
        copy.createdAt = source.createdAt;
        copy.updatedAt = source.updatedAt;
        copy.lastReason = source.lastReason;
        return copy;
    }

    private static void save() {
        try {
            Files.createDirectories(LEDGER_PATH.getParent());
            Files.writeString(LEDGER_PATH, GSON.toJson(state), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to save economy wallets to " + LEDGER_PATH, ex);
        }
    }

    private static class WalletState {
        Map<String, WalletRecord> wallets = new LinkedHashMap<>();
    }

    public static class WalletRecord {
        public String uuid = "";
        public String name = "";
        public double balance = 0.0D;
        public String createdAt = "";
        public String updatedAt = "";
        public String lastReason = "";
    }
}
