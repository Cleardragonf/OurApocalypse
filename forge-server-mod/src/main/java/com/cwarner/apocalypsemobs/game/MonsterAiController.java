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
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

/**
 * MonsterApocalypse-style pressure AI. This layer focuses on the behavior that is different from
 * vanilla pathfinding: stuck detection, wall damage, nerd-poling, air-bridging, and mega aggro.
 */
public final class MonsterAiController {
    private static final String LAST_X = "ApocalypseMobsMonsterAiLastX";
    private static final String LAST_Y = "ApocalypseMobsMonsterAiLastY";
    private static final String LAST_Z = "ApocalypseMobsMonsterAiLastZ";
    private static final String STUCK_TICKS = "ApocalypseMobsMonsterAiStuckTicks";
    private static final String LAST_WALL_ATTACK_TICK = "ApocalypseMobsLastWallAttackTick";
    private static final String LAST_PILLAR_TICK = "ApocalypseMobsLastPillarTick";
    private static final String LAST_BRIDGE_TICK = "ApocalypseMobsLastBridgeTick";
    private static final String PILLAR_COUNT = "ApocalypseMobsPillarCount";
    private static final Map<String, Double> WALL_DAMAGE = new HashMap<>();

    @SubscribeEvent
    public void onLivingTick(LivingEvent.LivingTickEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;

        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || !config.behavior.enabled) return;
        // Per-row Monster AI is enabled by tags stored on the spawned mob; no global Monster AI tab is required.

        CompoundTag data = monster.getPersistentData();
        boolean megaAggroEnabled = data.getBoolean(MobPropertyApplier.MEGA_AGGRO_ENABLED_TAG);
        boolean nerdPoleEnabled = data.getBoolean(MobPropertyApplier.NERD_POLE_ENABLED_TAG);
        boolean airBridgeEnabled = data.getBoolean(MobPropertyApplier.AIR_BRIDGE_ENABLED_TAG);
        boolean wallAttackEnabled = data.getBoolean(MobPropertyApplier.MONSTER_AI_WALL_ATTACK_TAG);
        boolean destroyTorches = data.getBoolean(MobPropertyApplier.DESTROY_TORCHES_TAG);
        if (!megaAggroEnabled && !nerdPoleEnabled && !airBridgeEnabled && !wallAttackEnabled && !destroyTorches) return;

        int interval = Math.max(5, Math.min(config.behavior.mobTickInterval, 20));
        if (monster.tickCount % interval != 0) return;

        int day = DifficultyCalculator.getDifficultyDay(level);
        double targetRange = DifficultyCalculator.lerpDouble(config.behavior.targetRangeDay1, config.behavior.targetRangeDay30, level);
        int sprintDistance = Math.max(0, data.getInt(MobPropertyApplier.SPRINT_DISTANCE_TAG));
        boolean megaAggro = megaAggroEnabled && (!level.isDay() || data.getBoolean(MobPropertyApplier.DAYTIME_MEGA_AGGRO_TAG));
        if (megaAggro) targetRange = Math.max(targetRange, Math.max(64.0D, sprintDistance * 4.0D));

        ServerPlayer target = findNearestTarget(level, monster.blockPosition(), targetRange);
        if (target == null) return;

        double speed = DifficultyCalculator.lerpDouble(config.behavior.navigationSpeedDay1, config.behavior.navigationSpeedDay30, level);
        if (megaAggro && monster.distanceTo(target) <= Math.max(1, sprintDistance)) {
            speed *= 1.35D;
            monster.setSprinting(true);
        }

        monster.setTarget(target);
        monster.getNavigation().moveTo(target, speed);

        if (destroyTorches && day >= Math.max(1, data.getInt(MobPropertyApplier.TORCH_MIN_DAY_TAG))) {
            tryDestroyNearbyTorch(level, monster, config, Math.max(1, data.getInt(MobPropertyApplier.TORCH_RADIUS_TAG)));
        }

        boolean stuck = updateStuckTicks(monster, interval) >= Math.max(20, data.getInt(MobPropertyApplier.FRUSTRATION_TICKS_TAG));
        boolean noLineOfSight = !monster.hasLineOfSight(target);
        boolean didBuild = false;

        if (nerdPoleEnabled && config.behavior.placeBlocks && day >= config.behavior.placeBlocksMinDay) {
            didBuild = tryNerdPole(level, monster, target, config);
        }
        if (!didBuild && airBridgeEnabled && config.behavior.bridgeGaps && day >= config.behavior.bridgeMinDay) {
            didBuild = tryAirBridge(level, monster, target, config);
        }
        if (didBuild && data.getBoolean(MobPropertyApplier.KILL_AFTER_BUILDING_TAG)) {
            monster.discard();
            return;
        }
        if (wallAttackEnabled && config.behavior.breakBlocks && day >= config.behavior.breakBlocksMinDay && (stuck || noLineOfSight)) {
            tryWallAttack(level, monster, target, config);
        }
    }

    private boolean tryNerdPole(ServerLevel level, Monster monster, ServerPlayer target, ApocalypseConfig config) {
        if (target.blockPosition().getY() <= monster.blockPosition().getY() + 1) return false;
        CompoundTag data = monster.getPersistentData();
        if (data.getInt(PILLAR_COUNT) >= Math.max(1, data.getInt(MobPropertyApplier.MAX_PILLAR_HEIGHT_TAG))) return false;
        if (!cooldownReady(level, data, LAST_PILLAR_TICK, data.getInt(MobPropertyApplier.PILLAR_COOLDOWN_TAG))) return false;

        BlockPos feet = monster.blockPosition();
        BlockPos below = feet.below();
        if (!canPlaceAt(level, feet, config)) return false;
        if (level.getBlockState(below).isAir()) return false;

        boolean placed = placeTracked(level, feet, buildBlock(data), "NERD_POLE_UP", monster);
        if (!placed) return false;

        data.putLong(LAST_PILLAR_TICK, level.getGameTime());
        data.putInt(PILLAR_COUNT, data.getInt(PILLAR_COUNT) + 1);
        monster.teleportTo(monster.getX(), monster.getY() + 1.0D, monster.getZ());
        monster.fallDistance = 0.0F;
        return true;
    }

    private boolean tryAirBridge(ServerLevel level, Monster monster, ServerPlayer target, ApocalypseConfig config) {
        CompoundTag data = monster.getPersistentData();
        if (!cooldownReady(level, data, LAST_BRIDGE_TICK, data.getInt(MobPropertyApplier.BRIDGE_COOLDOWN_TAG))) return false;

        Direction direction = horizontalDirectionToward(monster.blockPosition(), target.blockPosition());
        int horizontalDistance = Math.max(Math.abs(target.blockPosition().getX() - monster.blockPosition().getX()), Math.abs(target.blockPosition().getZ() - monster.blockPosition().getZ()));
        int maxScan = Math.max(1, Math.min(Math.max(1, data.getInt(MobPropertyApplier.MAX_BRIDGE_LENGTH_TAG)), horizontalDistance + 1));
        BlockPos cursor = monster.blockPosition();
        for (int distance = 1; distance <= maxScan; distance++) {
            cursor = cursor.relative(direction);
            BlockPos bridgeBlock = cursor.below();
            BlockPos mobSpace = bridgeBlock.above();
            if (!canPlaceAt(level, bridgeBlock, config)) continue;
            if (!level.isEmptyBlock(mobSpace) || !level.isEmptyBlock(mobSpace.above())) continue;
            if (!placeTracked(level, bridgeBlock, buildBlock(data), "AIR_BRIDGE", monster)) return false;
            data.putLong(LAST_BRIDGE_TICK, level.getGameTime());
            return true;
        }
        return false;
    }

    private void tryWallAttack(ServerLevel level, Monster monster, ServerPlayer target, ApocalypseConfig config) {
        CompoundTag data = monster.getPersistentData();
        if (!cooldownReady(level, data, LAST_WALL_ATTACK_TICK, data.getInt(MobPropertyApplier.WALL_ATTACK_COOLDOWN_TAG))) return;

        BlockPos targetBlock = findAttackableWall(level, monster.blockPosition(), target.blockPosition(), config);
        if (targetBlock == null) return;

        data.putLong(LAST_WALL_ATTACK_TICK, level.getGameTime());
        if (!data.getBoolean(MobPropertyApplier.WALL_ATTACK_USE_BLOCK_HP_TAG)) {
            level.destroyBlock(targetBlock, config.behavior.dropBrokenBlocks);
            return;
        }

        String damageKey = damageKey(level, targetBlock);
        BlockState state = level.getBlockState(targetBlock);
        double currentDamage = WALL_DAMAGE.getOrDefault(damageKey, 0.0D) + Math.max(0.1D, data.getDouble(MobPropertyApplier.WALL_ATTACK_DAMAGE_TAG));
        double requiredDamage = requiredDamage(level, targetBlock, state);
        if (currentDamage >= requiredDamage) {
            WALL_DAMAGE.remove(damageKey);
            level.destroyBlock(targetBlock, config.behavior.dropBrokenBlocks);
        } else {
            WALL_DAMAGE.put(damageKey, currentDamage);
        }
    }

    private int updateStuckTicks(Monster monster, int interval) {
        CompoundTag data = monster.getPersistentData();
        BlockPos pos = monster.blockPosition();
        if (!data.contains(LAST_X)) {
            rememberPosition(data, pos);
            data.putInt(STUCK_TICKS, 0);
            return 0;
        }
        boolean moved = data.getInt(LAST_X) != pos.getX() || data.getInt(LAST_Y) != pos.getY() || data.getInt(LAST_Z) != pos.getZ();
        if (moved) {
            rememberPosition(data, pos);
            data.putInt(STUCK_TICKS, 0);
            data.putInt(PILLAR_COUNT, 0);
            return 0;
        }
        int stuckTicks = data.getInt(STUCK_TICKS) + interval;
        data.putInt(STUCK_TICKS, stuckTicks);
        return stuckTicks;
    }

    private void rememberPosition(CompoundTag data, BlockPos pos) {
        data.putInt(LAST_X, pos.getX());
        data.putInt(LAST_Y, pos.getY());
        data.putInt(LAST_Z, pos.getZ());
    }

    private BlockPos findAttackableWall(ServerLevel level, BlockPos source, BlockPos target, ApocalypseConfig config) {
        Direction direction = horizontalDirectionToward(source, target);
        BlockPos front = source.relative(direction);
        BlockPos head = front.above();
        BlockPos upper = head.above();
        if (isBreakable(level, front, config)) return front;
        if (isBreakable(level, head, config)) return head;
        if (isBreakable(level, upper, config)) return upper;
        return null;
    }

    private boolean isBreakable(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
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

    private double requiredDamage(ServerLevel level, BlockPos pos, BlockState state) {
        float hardness = state.getDestroySpeed(level, pos);
        return Math.max(1.0D, hardness * 5.0D);
    }

    private boolean canPlaceAt(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
        if (!level.isLoaded(pos) || !level.getWorldBorder().isWithinBounds(pos)) return false;
        if (isProtectedPosition(level, pos, config)) return false;
        return level.isEmptyBlock(pos);
    }

    private boolean placeTracked(ServerLevel level, BlockPos pos, BlockState placedState, String reason, Monster monster) {
        BlockState previousState = level.getBlockState(pos);
        if (!level.setBlockAndUpdate(pos, placedState)) return false;
        BlockPlacementLedger.recordPlacement(level, pos, previousState, placedState, reason, monster);
        return true;
    }

    private BlockState buildBlock(CompoundTag data) {
        String blockId = data.getString(MobPropertyApplier.MONSTER_AI_BUILD_BLOCK_TAG);
        if (blockId == null || blockId.isBlank()) blockId = "minecraft:cobblestone";
        Optional<Block> block = BuiltInRegistries.BLOCK.getOptional(new ResourceLocation(blockId));
        return block.map(Block::defaultBlockState).orElse(Blocks.COBBLESTONE.defaultBlockState());
    }


    private void tryDestroyNearbyTorch(ServerLevel level, Monster monster, ApocalypseConfig config, int radius) {
        BlockPos center = monster.blockPosition();
        for (BlockPos pos : BlockPos.betweenClosed(center.offset(-radius, -1, -radius), center.offset(radius, 2, radius))) {
            BlockState state = level.getBlockState(pos);
            String blockId = BuiltInRegistries.BLOCK.getKey(state.getBlock()).toString();
            if (!blockId.contains("torch")) continue;
            if (isProtectedPosition(level, pos, config)) continue;
            level.destroyBlock(pos, false);
            return;
        }
    }

    private boolean cooldownReady(ServerLevel level, CompoundTag data, String lastTickKey, int cooldownTicks) {
        long lastTick = data.getLong(lastTickKey);
        return lastTick <= 0L || level.getGameTime() - lastTick >= Math.max(5, cooldownTicks);
    }

    private ServerPlayer findNearestTarget(ServerLevel level, BlockPos source, double range) {
        double rangeSqr = range * range;
        return level.players().stream()
                .filter(player -> !player.isCreative() && !player.isSpectator() && player.isAlive())
                .filter(player -> player.distanceToSqr(source.getX(), source.getY(), source.getZ()) <= rangeSqr)
                .min(Comparator.comparingDouble(player -> player.distanceToSqr(source.getX(), source.getY(), source.getZ())))
                .orElse(null);
    }


    private boolean isProtectedPosition(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
        if (config.behavior.protectSpawnRadius <= 0) return false;
        BlockPos spawn = level.getSharedSpawnPos();
        return spawn.distSqr(pos) <= (double) config.behavior.protectSpawnRadius * config.behavior.protectSpawnRadius;
    }

    private Direction horizontalDirectionToward(BlockPos source, BlockPos target) {
        int dx = target.getX() - source.getX();
        int dz = target.getZ() - source.getZ();
        if (Math.abs(dx) > Math.abs(dz)) return dx >= 0 ? Direction.EAST : Direction.WEST;
        return dz >= 0 ? Direction.SOUTH : Direction.NORTH;
    }

    private String damageKey(ServerLevel level, BlockPos pos) {
        return level.dimension().location() + ":" + pos.getX() + ":" + pos.getY() + ":" + pos.getZ();
    }
}
