package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.reflect.TypeToken;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.core.registries.Registries;
import net.minecraft.resources.ResourceKey;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraftforge.fml.loading.FMLPaths;

import java.io.IOException;
import java.lang.reflect.Type;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public final class BlockPlacementLedger {
    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().create();
    private static final Type LIST_TYPE = new TypeToken<List<PlacedBlockRecord>>() {}.getType();
    private static final Path LEDGER_PATH = FMLPaths.CONFIGDIR.get().resolve("apocalypse-mobs-placed-blocks.json");
    private static final List<PlacedBlockRecord> RECORDS = new ArrayList<>();

    private BlockPlacementLedger() {}

    public static synchronized void loadOrCreate() {
        try {
            Files.createDirectories(LEDGER_PATH.getParent());
            if (!Files.exists(LEDGER_PATH)) {
                save();
                return;
            }
            String json = Files.readString(LEDGER_PATH, StandardCharsets.UTF_8);
            List<PlacedBlockRecord> loaded = GSON.fromJson(json, LIST_TYPE);
            RECORDS.clear();
            if (loaded != null) RECORDS.addAll(loaded);
            trimToLimit();
            save();
        } catch (Exception ex) {
            ApocalypseMobs.LOGGER.error("Unable to load placed block ledger. Starting with an empty ledger.", ex);
            RECORDS.clear();
            saveQuietly();
        }
    }

    public static synchronized void recordPlacement(ServerLevel level, BlockPos pos, BlockState previousState, BlockState placedState, String reason, Entity entity) {
        if (!ConfigManager.get().cleanup.enabled || !ConfigManager.get().cleanup.trackPlacedBlocks) return;
        PlacedBlockRecord record = new PlacedBlockRecord();
        record.id = UUID.randomUUID().toString();
        record.dimension = level.dimension().location().toString();
        record.x = pos.getX();
        record.y = pos.getY();
        record.z = pos.getZ();
        record.previousBlock = BuiltInRegistries.BLOCK.getKey(previousState.getBlock()).toString();
        record.placedBlock = BuiltInRegistries.BLOCK.getKey(placedState.getBlock()).toString();
        record.reason = reason;
        record.entityType = BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType()).toString();
        record.entityUuid = entity.getUUID().toString();
        record.gameTime = level.getGameTime();
        record.createdAt = Instant.now().toString();
        record.rolledBack = false;
        RECORDS.add(record);
        trimToLimit();
        saveQuietly();
    }

    public static synchronized List<PlacedBlockRecord> latest(int limit) {
        int safeLimit = Math.max(1, Math.min(limit, 5000));
        int from = Math.max(0, RECORDS.size() - safeLimit);
        List<PlacedBlockRecord> result = new ArrayList<>(RECORDS.subList(from, RECORDS.size()));
        Collections.reverse(result);
        return result;
    }

    public static synchronized RollbackSummary rollback(MinecraftServer server, int limit) {
        int safeLimit = Math.max(1, Math.min(limit, ConfigManager.get().cleanup.maxRollbackPerRequest));
        RollbackSummary summary = new RollbackSummary();
        summary.requested = safeLimit;

        for (int index = RECORDS.size() - 1; index >= 0 && summary.scanned < safeLimit; index--) {
            PlacedBlockRecord record = RECORDS.get(index);
            if (record.rolledBack) continue;
            summary.scanned++;
            if (rollbackOne(server, record)) {
                summary.rolledBack++;
            } else {
                summary.skipped++;
            }
        }
        saveQuietly();
        return summary;
    }

    public static synchronized RollbackSummary rollbackAll(MinecraftServer server) {
        RollbackSummary summary = new RollbackSummary();
        summary.requested = RECORDS.size();
        for (int index = RECORDS.size() - 1; index >= 0; index--) {
            PlacedBlockRecord record = RECORDS.get(index);
            if (record.rolledBack) continue;
            summary.scanned++;
            if (rollbackOne(server, record)) summary.rolledBack++; else summary.skipped++;
        }
        saveQuietly();
        return summary;
    }

    public static synchronized int countOpen() {
        int count = 0;
        for (PlacedBlockRecord record : RECORDS) if (!record.rolledBack) count++;
        return count;
    }

    public static synchronized int countTotal() {
        return RECORDS.size();
    }

    public static Path getLedgerPath() {
        return LEDGER_PATH;
    }

    private static boolean rollbackOne(MinecraftServer server, PlacedBlockRecord record) {
        try {
            ResourceKey<Level> key = ResourceKey.create(Registries.DIMENSION, new ResourceLocation(record.dimension));
            ServerLevel level = server.getLevel(key);
            if (level == null) return false;
            BlockPos pos = new BlockPos(record.x, record.y, record.z);
            if (!level.isLoaded(pos)) return false;
            BlockState current = level.getBlockState(pos);
            String currentBlock = BuiltInRegistries.BLOCK.getKey(current.getBlock()).toString();
            if (ConfigManager.get().cleanup.rollbackOnlyIfBlockStillMatches && !currentBlock.equals(record.placedBlock)) {
                record.notes = "Skipped because current block is " + currentBlock + ", not " + record.placedBlock;
                return false;
            }
            BlockState restore = blockState(record.previousBlock);
            level.setBlockAndUpdate(pos, restore);
            record.rolledBack = true;
            record.rolledBackAt = Instant.now().toString();
            return true;
        } catch (Exception ex) {
            record.notes = "Rollback failed: " + ex.getMessage();
            return false;
        }
    }

    private static BlockState blockState(String blockId) {
        if (blockId == null || blockId.isBlank() || "minecraft:air".equals(blockId)) return Blocks.AIR.defaultBlockState();
        Optional<Block> block = BuiltInRegistries.BLOCK.getOptional(new ResourceLocation(blockId));
        return block.map(Block::defaultBlockState).orElse(Blocks.AIR.defaultBlockState());
    }

    private static void trimToLimit() {
        int max = ConfigManager.get().cleanup.maxLedgerEntries;
        while (RECORDS.size() > max) {
            RECORDS.remove(0);
        }
    }

    public static synchronized void save() {
        try {
            Files.createDirectories(LEDGER_PATH.getParent());
            Files.writeString(LEDGER_PATH, GSON.toJson(RECORDS), StandardCharsets.UTF_8);
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to save placed block ledger to " + LEDGER_PATH, ex);
        }
    }

    public static synchronized void saveQuietly() {
        try {
            save();
        } catch (RuntimeException ex) {
            ApocalypseMobs.LOGGER.error("Unable to save Apocalypse Mobs placed block ledger.", ex);
        }
    }

    public static class PlacedBlockRecord {
        public String id;
        public String dimension;
        public int x;
        public int y;
        public int z;
        public String previousBlock;
        public String placedBlock;
        public String reason;
        public String entityType;
        public String entityUuid;
        public long gameTime;
        public String createdAt;
        public boolean rolledBack;
        public String rolledBackAt;
        public String notes;
    }

    public static class RollbackSummary {
        public int requested;
        public int scanned;
        public int rolledBack;
        public int skipped;
    }
}
