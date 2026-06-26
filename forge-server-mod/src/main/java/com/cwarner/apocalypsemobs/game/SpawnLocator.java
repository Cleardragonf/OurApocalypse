package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.EntityWeight;
import com.cwarner.apocalypsemobs.config.MobProperties;
import com.cwarner.apocalypsemobs.config.WaveProfile;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.level.LightLayer;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.levelgen.Heightmap;

import java.util.Set;

public final class SpawnLocator {
    private static final Set<String> FLYING_OR_LARGE = Set.of(
            "minecraft:ghast",
            "minecraft:phantom",
            "minecraft:blaze"
    );

    private SpawnLocator() {}

    public static BlockPos findSpawnPos(ServerLevel level, ServerPlayer player, EntityType<?> type, ApocalypseConfig config) {
        return findSpawnPos(level, player, type, config, null);
    }

    public static BlockPos findSpawnPos(ServerLevel level, ServerPlayer player, EntityType<?> type, ApocalypseConfig config, WaveProfile profile) {
        return findSpawnPos(level, player, type, config, profile, null);
    }

    public static BlockPos findSpawnPos(ServerLevel level, ServerPlayer player, EntityType<?> type, ApocalypseConfig config, WaveProfile profile, EntityWeight rule) {
        String entityId = EntityType.getKey(type).toString();
        boolean flying = FLYING_OR_LARGE.contains(entityId);
        int attempts = profile != null ? profile.maxSpawnAttemptsPerMob : config.waves.maxSpawnAttemptsPerMob;
        int radiusMin = profile != null ? profile.spawnRadiusMin : config.waves.spawnRadiusMin;
        int radiusMax = profile != null ? profile.spawnRadiusMax : config.waves.spawnRadiusMax;

        for (int attempt = 0; attempt < attempts; attempt++) {
            double angle = level.random.nextDouble() * Math.PI * 2.0D;
            int radius = randomBetween(level, radiusMin, radiusMax);
            int x = player.blockPosition().getX() + (int) Math.round(Math.cos(angle) * radius);
            int z = player.blockPosition().getZ() + (int) Math.round(Math.sin(angle) * radius);

            if (flying) {
                int y = Math.min(level.getMaxBuildHeight() - 8, player.blockPosition().getY() + randomBetween(level, 8, 22));
                BlockPos pos = new BlockPos(x, y, z);
                if (level.isLoaded(pos) && level.isEmptyBlock(pos) && level.isEmptyBlock(pos.above())) return pos;
                continue;
            }

            int y = level.getHeight(Heightmap.Types.MOTION_BLOCKING_NO_LEAVES, x, z);
            BlockPos pos = new BlockPos(x, y, z);
            BlockPos below = pos.below();
            if (!level.isLoaded(pos)) continue;
            if (!level.getWorldBorder().isWithinBounds(pos)) continue;
            if (!level.isEmptyBlock(pos) || !level.isEmptyBlock(pos.above())) continue;
            boolean allowAirBelow = rule != null && rule.properties != null && rule.properties.naturalSpawnEnabled && rule.properties.naturalSpawnAllowAir;
            if ((level.getBlockState(below).isAir() && !allowAirBelow) || level.getBlockState(below).is(Blocks.BEDROCK)) continue;
            if (!passesMonsterApocalypseSpawnFilter(level, below, pos, config)) continue;
            if (!passesNaturalSpawnFilter(level, below, pos, rule)) continue;
            return pos;
        }
        return null;
    }

    private static boolean passesNaturalSpawnFilter(ServerLevel level, BlockPos below, BlockPos spawnPos, EntityWeight rule) {
        MobProperties properties = rule == null ? null : rule.properties;
        if (properties == null || !properties.naturalSpawnEnabled) return true;

        int y = spawnPos.getY();
        if (y < properties.naturalSpawnYMin || y > properties.naturalSpawnYMax) return false;

        int light = level.getBrightness(LightLayer.BLOCK, spawnPos);
        if (light < properties.naturalSpawnMinLight || light > properties.naturalSpawnMaxLight) return false;

        if (!properties.naturalSpawnAllowWater && !level.getFluidState(spawnPos).isEmpty()) return false;
        if (properties.naturalSpawnRequireBlockBelow && level.getBlockState(below).isAir()) return false;
        if (!properties.naturalSpawnAllowAir && level.getBlockState(below).isAir()) return false;

        String mode = properties.naturalSpawnBlockMode == null ? "DISABLED" : properties.naturalSpawnBlockMode.trim().toUpperCase(java.util.Locale.ROOT);
        if (mode.equals("DISABLED") || properties.naturalSpawnBlocks == null || properties.naturalSpawnBlocks.isEmpty()) return true;
        String blockId = BuiltInRegistries.BLOCK.getKey(level.getBlockState(below).getBlock()).toString();
        boolean listed = properties.naturalSpawnBlocks.contains(blockId);
        return mode.equals("WHITELIST") ? listed : !listed;
    }

    private static boolean passesMonsterApocalypseSpawnFilter(ServerLevel level, BlockPos below, BlockPos spawnPos, ApocalypseConfig config) {
        if (config.monsterApocalypse == null || !config.monsterApocalypse.enabled) return true;
        var filter = config.monsterApocalypse.spawnBlockFilter;
        var bonus = config.monsterApocalypse.bonusSpawns;
        if (bonus != null) {
            int light = level.getBrightness(net.minecraft.world.level.LightLayer.BLOCK, spawnPos);
            if (light < bonus.minLight || light > bonus.maxLight) return false;
        }
        if (filter == null || !filter.enabled || filter.blocks == null || filter.blocks.isEmpty()) return true;
        String blockId = BuiltInRegistries.BLOCK.getKey(level.getBlockState(below).getBlock()).toString();
        boolean listed = filter.blocks.contains(blockId);
        return filter.invertToWhitelist ? listed : !listed;
    }

    private static int randomBetween(ServerLevel level, int min, int max) {
        if (max <= min) return min;
        return min + level.random.nextInt(max - min + 1);
    }
}
