package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.monster.Creeper;
import net.minecraft.world.entity.monster.EnderMan;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.monster.Spider;
import net.minecraft.world.entity.projectile.AbstractArrow;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.HitResult;
import net.minecraft.world.phys.Vec3;
import net.minecraftforge.event.entity.ProjectileImpactEvent;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.Comparator;
import java.util.Optional;

/**
 * Handles profile-specific special mob goals. These are driven by the MobProperties stored on the
 * EntityWeight row that spawned the mob, so the same vanilla entity can behave differently per profile.
 */
public final class SpecialMobGoalController {
    private static final String LAST_CREEPER_WALL_EXPLOSION_TICK = "ApocalypseMobsLastCreeperWallExplosionTick";
    private static final String LAST_ENDERMAN_TELEPORT_TICK = "ApocalypseMobsLastEndermanTeleportTick";
    private static final String LAST_SPIDER_WEB_TICK = "ApocalypseMobsLastSpiderWebTick";

    @SubscribeEvent
    public void onProjectileImpact(ProjectileImpactEvent event) {
        if (!(event.getProjectile() instanceof AbstractArrow arrow)) return;
        if (!(arrow.level() instanceof ServerLevel level)) return;

        Entity owner = arrow.getOwner();
        if (!(owner instanceof LivingEntity shooter)) return;

        CompoundTag data = shooter.getPersistentData();
        if (!data.getBoolean(MobPropertyApplier.EXPLODING_ARROWS_TAG)) return;

        double chance = getDouble(data, MobPropertyApplier.EXPLODING_ARROW_CHANCE_TAG, 0.0D);
        if (chance <= 0.0D || level.random.nextDouble() > chance) return;

        HitResult hitResult = event.getRayTraceResult();
        Vec3 location = hitResult.getLocation();
        float power = (float) getDouble(data, MobPropertyApplier.EXPLODING_ARROW_POWER_TAG, 2.0D);
        Level.ExplosionInteraction interaction = data.getBoolean(MobPropertyApplier.EXPLODING_ARROW_BREAK_BLOCKS_TAG)
                ? Level.ExplosionInteraction.MOB
                : Level.ExplosionInteraction.NONE;

        level.explode(arrow, location.x, location.y, location.z, power, interaction);
        arrow.discard();
    }

    @SubscribeEvent
    public void onLivingTick(LivingEvent.LivingTickEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;

        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || !config.behavior.enabled) return;
        if (monster.tickCount % Math.max(10, config.behavior.mobTickInterval) != 0) return;
        if (!allowsBehavior(monster, MobPropertyApplier.TARGET_PLAYERS_TAG)) return;

        if (monster instanceof Creeper creeper) {
            tryCreeperWallExplosion(level, creeper, config);
        }
        if (monster instanceof EnderMan enderman) {
            tryEndermanTeleport(level, enderman, config);
        }
        if (monster instanceof Spider spider) {
            trySpiderWeb(level, spider, config);
        }
    }

    private void tryCreeperWallExplosion(ServerLevel level, Creeper creeper, ApocalypseConfig config) {
        CompoundTag data = creeper.getPersistentData();
        if (!data.getBoolean(MobPropertyApplier.CREEPER_WALL_EXPLOSIONS_TAG)) return;
        if (!cooldownReady(level, data, LAST_CREEPER_WALL_EXPLOSION_TICK, data.getInt(MobPropertyApplier.CREEPER_WALL_EXPLOSION_COOLDOWN_TAG))) return;

        ServerPlayer target = targetFor(level, creeper, 24.0D);
        if (target == null) return;

        BlockPos wall = blockingWallPosition(level, creeper.blockPosition(), target.blockPosition(), config);
        if (wall == null) return;

        double chance = getDouble(data, MobPropertyApplier.CREEPER_WALL_EXPLOSION_CHANCE_TAG, 0.0D);
        if (chance <= 0.0D || level.random.nextDouble() > chance) return;

        Vec3 center = Vec3.atCenterOf(wall);
        float power = (float) getDouble(data, MobPropertyApplier.CREEPER_WALL_EXPLOSION_POWER_TAG, 2.8D);
        data.putLong(LAST_CREEPER_WALL_EXPLOSION_TICK, level.getGameTime());
        level.explode(creeper, center.x, center.y, center.z, power, Level.ExplosionInteraction.MOB);
    }

    private void tryEndermanTeleport(ServerLevel level, EnderMan enderman, ApocalypseConfig config) {
        CompoundTag data = enderman.getPersistentData();
        if (!data.getBoolean(MobPropertyApplier.ENDERMAN_TELEPORT_PLAYERS_TAG)) return;
        if (!cooldownReady(level, data, LAST_ENDERMAN_TELEPORT_TICK, data.getInt(MobPropertyApplier.ENDERMAN_TELEPORT_COOLDOWN_TAG))) return;

        ServerPlayer target = targetFor(level, enderman, 32.0D);
        if (target == null) return;

        double chance = getDouble(data, MobPropertyApplier.ENDERMAN_TELEPORT_CHANCE_TAG, 0.0D);
        if (chance <= 0.0D || level.random.nextDouble() > chance) return;

        int radius = Math.max(4, data.getInt(MobPropertyApplier.ENDERMAN_TELEPORT_RADIUS_TAG));
        Optional<BlockPos> safe = findSafeTeleportPosition(level, target.blockPosition(), radius, config);
        if (safe.isEmpty()) return;

        BlockPos pos = safe.get();
        data.putLong(LAST_ENDERMAN_TELEPORT_TICK, level.getGameTime());
        target.teleportTo(pos.getX() + 0.5D, pos.getY(), pos.getZ() + 0.5D);
        target.fallDistance = 0.0F;
    }

    private void trySpiderWeb(ServerLevel level, Spider spider, ApocalypseConfig config) {
        CompoundTag data = spider.getPersistentData();
        if (!data.getBoolean(MobPropertyApplier.SPIDER_WEB_PLAYERS_TAG)) return;
        if (!cooldownReady(level, data, LAST_SPIDER_WEB_TICK, data.getInt(MobPropertyApplier.SPIDER_WEB_COOLDOWN_TAG))) return;

        ServerPlayer target = targetFor(level, spider, 9.0D);
        if (target == null) return;

        double chance = getDouble(data, MobPropertyApplier.SPIDER_WEB_CHANCE_TAG, 0.0D);
        if (chance <= 0.0D || level.random.nextDouble() > chance) return;

        BlockPos feet = target.blockPosition();
        BlockPos placement = level.isEmptyBlock(feet) ? feet : (level.isEmptyBlock(feet.above()) ? feet.above() : null);
        if (placement == null || isProtectedPosition(level, placement, config)) return;

        data.putLong(LAST_SPIDER_WEB_TICK, level.getGameTime());
        BlockState previousState = level.getBlockState(placement);
        BlockState web = Blocks.COBWEB.defaultBlockState();
        if (level.setBlockAndUpdate(placement, web)) {
            BlockPlacementLedger.recordPlacement(level, placement, previousState, web, "SPIDER_WEB_PLAYER", spider);
        }
    }

    private boolean cooldownReady(ServerLevel level, CompoundTag data, String lastTickKey, int cooldownTicks) {
        long lastTick = data.getLong(lastTickKey);
        return lastTick <= 0L || level.getGameTime() - lastTick >= Math.max(20, cooldownTicks);
    }

    private ServerPlayer targetFor(ServerLevel level, Monster monster, double fallbackRange) {
        if (monster.getTarget() instanceof ServerPlayer player && player.isAlive() && !player.isCreative() && !player.isSpectator()) {
            return player;
        }
        double rangeSqr = fallbackRange * fallbackRange;
        BlockPos source = monster.blockPosition();
        return level.players().stream()
                .filter(player -> !player.isCreative() && !player.isSpectator() && player.isAlive())
                .filter(player -> player.distanceToSqr(source.getX(), source.getY(), source.getZ()) <= rangeSqr)
                .min(Comparator.comparingDouble(player -> player.distanceToSqr(source.getX(), source.getY(), source.getZ())))
                .orElse(null);
    }

    private BlockPos blockingWallPosition(ServerLevel level, BlockPos source, BlockPos target, ApocalypseConfig config) {
        Direction direction = horizontalDirectionToward(source, target);
        BlockPos front = source.relative(direction);
        BlockPos head = front.above();
        if (isBreakableWall(level, front, config)) return front;
        if (isBreakableWall(level, head, config)) return head;
        return null;
    }

    private boolean isBreakableWall(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
        if (!level.isLoaded(pos) || isProtectedPosition(level, pos, config)) return false;
        BlockState state = level.getBlockState(pos);
        if (state.isAir()) return false;
        String blockId = BuiltInRegistries.BLOCK.getKey(state.getBlock()).toString();
        if (config.behavior.protectedBlocks.contains(blockId)) return false;
        float hardness = state.getDestroySpeed(level, pos);
        if (hardness < 0) return false;
        float maxHardness = DifficultyCalculator.lerpFloat(config.behavior.maxBreakHardnessDay1, config.behavior.maxBreakHardnessDay30, level);
        return hardness <= maxHardness;
    }

    private Optional<BlockPos> findSafeTeleportPosition(ServerLevel level, BlockPos origin, int radius, ApocalypseConfig config) {
        for (int attempt = 0; attempt < 32; attempt++) {
            int x = origin.getX() + level.random.nextInt(radius * 2 + 1) - radius;
            int z = origin.getZ() + level.random.nextInt(radius * 2 + 1) - radius;
            int y = origin.getY() + level.random.nextInt(9) - 4;
            BlockPos candidate = new BlockPos(x, y, z);
            Optional<BlockPos> safe = adjustToSafe(level, candidate, config);
            if (safe.isPresent()) return safe;
        }
        return Optional.empty();
    }

    private Optional<BlockPos> adjustToSafe(ServerLevel level, BlockPos candidate, ApocalypseConfig config) {
        for (int dy = -4; dy <= 6; dy++) {
            BlockPos feet = candidate.offset(0, dy, 0);
            if (!level.isLoaded(feet) || isProtectedPosition(level, feet, config)) continue;
            if (!level.getWorldBorder().isWithinBounds(feet)) continue;
            BlockPos head = feet.above();
            BlockPos ground = feet.below();
            if (!level.isEmptyBlock(feet) || !level.isEmptyBlock(head)) continue;
            if (level.getBlockState(ground).isAir()) continue;
            return Optional.of(feet);
        }
        return Optional.empty();
    }

    private boolean isProtectedPosition(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
        if (config.behavior.protectSpawnRadius <= 0) return false;
        BlockPos spawn = level.getSharedSpawnPos();
        return spawn.distSqr(pos) <= (double) config.behavior.protectSpawnRadius * config.behavior.protectSpawnRadius;
    }

    private boolean allowsBehavior(Monster monster, String tag) {
        return !monster.getPersistentData().contains(tag) || monster.getPersistentData().getBoolean(tag);
    }

    private Direction horizontalDirectionToward(BlockPos source, BlockPos target) {
        int dx = target.getX() - source.getX();
        int dz = target.getZ() - source.getZ();
        if (Math.abs(dx) > Math.abs(dz)) return dx >= 0 ? Direction.EAST : Direction.WEST;
        return dz >= 0 ? Direction.SOUTH : Direction.NORTH;
    }

    private double getDouble(CompoundTag data, String key, double fallback) {
        return data.contains(key) ? data.getDouble(key) : fallback;
    }
}
