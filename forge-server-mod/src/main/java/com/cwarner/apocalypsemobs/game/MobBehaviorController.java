package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.config.PlacementBlockRule;
import net.minecraft.core.BlockPos;
import net.minecraft.core.Direction;
import net.minecraft.core.registries.BuiltInRegistries;
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
import java.util.List;
import java.util.Optional;
import java.util.Random;

public final class MobBehaviorController {
    private final Random random = new Random();

    @SubscribeEvent
    public void onLivingTick(LivingEvent.LivingTickEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;

        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || !config.behavior.enabled) return;
        if (monster.tickCount % config.behavior.mobTickInterval != 0) return;
        if (!allowsBehavior(monster, MobPropertyApplier.TARGET_PLAYERS_TAG)) return;

        int day = DifficultyCalculator.getDifficultyDay(level);
        double targetRange = DifficultyCalculator.lerpDouble(config.behavior.targetRangeDay1, config.behavior.targetRangeDay30, level);
        double speed = DifficultyCalculator.lerpDouble(config.behavior.navigationSpeedDay1, config.behavior.navigationSpeedDay30, level);
        ServerPlayer target = findNearestTarget(level, monster.blockPosition(), targetRange);
        if (target == null) return;

        monster.setTarget(target);
        monster.getNavigation().moveTo(target, speed);

        if (config.behavior.breakBlocks && allowsBehavior(monster, MobPropertyApplier.BREAK_BLOCKS_TAG) && day >= config.behavior.breakBlocksMinDay) {
            tryBreakBlockingBlock(level, monster, target, config);
        }
        if (config.behavior.placeBlocks && allowsBehavior(monster, MobPropertyApplier.PLACE_BLOCKS_TAG) && day >= config.behavior.placeBlocksMinDay) {
            tryPlaceStepBlock(level, monster, target, config, day);
        }
        if (config.behavior.bridgeGaps && allowsBehavior(monster, MobPropertyApplier.BRIDGE_GAPS_TAG) && day >= config.behavior.bridgeMinDay) {
            tryBridgeGap(level, monster, target, config, day);
        }
    }

    private boolean allowsBehavior(Monster monster, String tag) {
        return !monster.getPersistentData().contains(tag) || monster.getPersistentData().getBoolean(tag);
    }

    private ServerPlayer findNearestTarget(ServerLevel level, BlockPos source, double range) {
        double rangeSqr = range * range;
        return level.players().stream()
                .filter(player -> !player.isCreative() && !player.isSpectator() && player.isAlive())
                .filter(player -> player.distanceToSqr(source.getX(), source.getY(), source.getZ()) <= rangeSqr)
                .min(Comparator.comparingDouble(player -> player.distanceToSqr(source.getX(), source.getY(), source.getZ())))
                .orElse(null);
    }

    private void tryBreakBlockingBlock(ServerLevel level, Monster monster, ServerPlayer target, ApocalypseConfig config) {
        Direction direction = horizontalDirectionToward(monster.blockPosition(), target.blockPosition());
        BlockPos front = monster.blockPosition().relative(direction);
        BlockPos head = front.above();

        if (tryBreak(level, front, config)) return;
        tryBreak(level, head, config);
    }

    private boolean tryBreak(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
        if (!level.isLoaded(pos) || isProtectedPosition(level, pos, config)) return false;
        BlockState state = level.getBlockState(pos);
        if (state.isAir()) return false;
        String blockId = BuiltInRegistries.BLOCK.getKey(state.getBlock()).toString();
        if (config.behavior.protectedBlocks.contains(blockId)) return false;
        float hardness = state.getDestroySpeed(level, pos);
        if (hardness < 0) return false;
        float maxHardness = DifficultyCalculator.lerpFloat(config.behavior.maxBreakHardnessDay1, config.behavior.maxBreakHardnessDay30, level);
        if (hardness > maxHardness) return false;
        level.destroyBlock(pos, config.behavior.dropBrokenBlocks);
        return true;
    }

    private void tryPlaceStepBlock(ServerLevel level, Monster monster, ServerPlayer target, ApocalypseConfig config, int day) {
        if (target.blockPosition().getY() <= monster.blockPosition().getY() + 1) return;
        Direction direction = horizontalDirectionToward(monster.blockPosition(), target.blockPosition());
        BlockPos front = monster.blockPosition().relative(direction);
        BlockPos frontBelow = front.below();
        if (!level.isLoaded(front) || isProtectedPosition(level, front, config)) return;
        if (!level.isEmptyBlock(front)) return;
        if (level.getBlockState(frontBelow).isAir()) return;
        placeTracked(level, front, getPlacementBlock(config, day), "STEP_UP", monster);
    }

    private void tryBridgeGap(ServerLevel level, Monster monster, ServerPlayer target, ApocalypseConfig config, int day) {
        Direction direction = horizontalDirectionToward(monster.blockPosition(), target.blockPosition());
        BlockPos frontBelow = monster.blockPosition().relative(direction).below();
        if (!level.isLoaded(frontBelow) || isProtectedPosition(level, frontBelow, config)) return;
        if (!level.isEmptyBlock(frontBelow)) return;
        placeTracked(level, frontBelow, getPlacementBlock(config, day), "BRIDGE_GAP", monster);
    }

    private void placeTracked(ServerLevel level, BlockPos pos, BlockState placedState, String reason, Monster monster) {
        BlockState previousState = level.getBlockState(pos);
        if (level.setBlockAndUpdate(pos, placedState)) {
            BlockPlacementLedger.recordPlacement(level, pos, previousState, placedState, reason, monster);
        }
    }

    private boolean isProtectedPosition(ServerLevel level, BlockPos pos, ApocalypseConfig config) {
        if (config.behavior.protectSpawnRadius <= 0) return false;
        BlockPos spawn = level.getSharedSpawnPos();
        return spawn.distSqr(pos) <= (double) config.behavior.protectSpawnRadius * config.behavior.protectSpawnRadius;
    }

    private BlockState getPlacementBlock(ApocalypseConfig config, int day) {
        List<PlacementBlockRule> candidates = config.behavior.placementBlocks.stream()
                .filter(rule -> rule.enabled && rule.weight > 0 && day >= rule.minDay)
                .toList();
        if (candidates.isEmpty()) return blockState(config.behavior.placementBlock);
        int total = candidates.stream().mapToInt(rule -> Math.max(0, rule.weight)).sum();
        int roll = random.nextInt(Math.max(1, total));
        int cursor = 0;
        for (PlacementBlockRule rule : candidates) {
            cursor += rule.weight;
            if (roll < cursor) return blockState(rule.block);
        }
        return blockState(candidates.get(0).block);
    }

    private BlockState blockState(String blockId) {
        Optional<Block> block = BuiltInRegistries.BLOCK.getOptional(new ResourceLocation(blockId));
        return block.map(Block::defaultBlockState).orElse(Blocks.COBBLESTONE.defaultBlockState());
    }

    private Direction horizontalDirectionToward(BlockPos source, BlockPos target) {
        int dx = target.getX() - source.getX();
        int dz = target.getZ() - source.getZ();
        if (Math.abs(dx) > Math.abs(dz)) return dx >= 0 ? Direction.EAST : Direction.WEST;
        return dz >= 0 ? Direction.SOUTH : Direction.NORTH;
    }
}
