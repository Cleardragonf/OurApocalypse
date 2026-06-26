package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import net.minecraft.core.BlockPos;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.MobSpawnType;
import net.minecraft.world.level.LightLayer;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

public final class SpawnPointController {
    private final Map<String, Long> lastRunByPoint = new HashMap<>();

    @SubscribeEvent
    public void onServerTick(TickEvent.ServerTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;
        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || config.monsterApocalypse == null || !config.monsterApocalypse.enabled) return;
        if (config.monsterApocalypse.spawnPoints == null || config.monsterApocalypse.spawnPoints.isEmpty()) return;

        for (ServerLevel level : event.getServer().getAllLevels()) {
            String dimension = level.dimension().location().toString();
            for (ApocalypseConfig.MonsterApocalypseSpawnPoint point : config.monsterApocalypse.spawnPoints) {
                if (point == null || !point.enabled || !dimension.equals(point.dimension)) continue;
                tryRunPoint(level, point);
            }
        }
    }

    private void tryRunPoint(ServerLevel level, ApocalypseConfig.MonsterApocalypseSpawnPoint point) {
        long now = level.getGameTime();
        long lastRun = lastRunByPoint.getOrDefault(point.id, Long.MIN_VALUE / 2L);
        if (now - lastRun < point.periodTicks) return;
        lastRunByPoint.put(point.id, now);
        if (level.random.nextDouble() > point.chance) return;

        Optional<EntityType<?>> type = BuiltInRegistries.ENTITY_TYPE.getOptional(new ResourceLocation(point.entity));
        if (type.isEmpty()) return;
        for (int i = 0; i < point.count; i++) {
            BlockPos pos = new BlockPos(point.x, point.y, point.z).offset(level.random.nextInt(5) - 2, 0, level.random.nextInt(5) - 2);
            if (!level.isLoaded(pos) || !level.getWorldBorder().isWithinBounds(pos)) continue;
            int light = level.getBrightness(LightLayer.BLOCK, pos);
            if (light < point.minLight || light > point.maxLight) continue;
            if (!level.isEmptyBlock(pos) || !level.isEmptyBlock(pos.above())) continue;
            Entity entity = type.get().create(level);
            if (entity == null) continue;
            entity.moveTo(pos.getX() + 0.5D, pos.getY(), pos.getZ() + 0.5D, level.random.nextFloat() * 360.0F, 0.0F);
            if (entity instanceof Mob mob) {
                mob.finalizeSpawn(level, level.getCurrentDifficultyAt(pos), MobSpawnType.EVENT, null, null);
            }
            level.addFreshEntity(entity);
        }
    }
}
