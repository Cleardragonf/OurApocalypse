package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.WaveProfile;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.EntityType;
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
            if (level.getBlockState(below).isAir() || level.getBlockState(below).is(Blocks.BEDROCK)) continue;
            return pos;
        }
        return null;
    }

    private static int randomBetween(ServerLevel level, int min, int max) {
        if (max <= min) return min;
        return min + level.random.nextInt(max - min + 1);
    }
}
