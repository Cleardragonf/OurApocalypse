package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.ApocalypseMobs;
import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.config.WaveProfile;
import net.minecraft.ChatFormatting;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.MobSpawnType;
import net.minecraft.world.level.Level;
import net.minecraftforge.event.TickEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;

public final class WaveDirector {
    private final Map<String, NightState> nightStates = new HashMap<>();

    @SubscribeEvent
    public void onServerTick(TickEvent.ServerTickEvent event) {
        if (event.phase != TickEvent.Phase.END) return;

        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || !config.waves.enabled) return;

        if (event.getServer().getTickCount() % config.waves.tickCheckInterval != 0) return;

        for (ServerLevel level : event.getServer().getAllLevels()) {
            String dimension = level.dimension().location().toString();
            if (!config.allowedDimensions.contains(dimension)) continue;
            processLevel(level, config);
        }
    }

    private void processLevel(ServerLevel level, ApocalypseConfig config) {
        boolean night = !config.waves.onlyAtNight || isNight(level);
        String key = level.dimension().location().toString();
        NightState state = nightStates.computeIfAbsent(key, ignored -> new NightState());

        long worldDay = Math.max(0L, level.getDayTime() / 24000L);
        if (!night) {
            state.currentNightDay = -1L;
            state.wavesPlanned = 0;
            state.wavesSent = 0;
            state.nextWaveGameTime = 0L;
            state.waveProfile = null;
            return;
        }

        int difficultyDay = DifficultyCalculator.getDifficultyDay(level);
        if (state.currentNightDay != worldDay) {
            state.currentNightDay = worldDay;
            state.waveProfile = config.waves.useNightProfiles() ? selectedNightProfile(level, config, difficultyDay) : null;
            state.wavesPlanned = rollWaveCount(level, config, state.waveProfile);
            state.wavesSent = 0;
            state.nextWaveGameTime = level.getGameTime();
        }

        if (state.wavesSent >= state.wavesPlanned) return;
        if (level.getGameTime() < state.nextWaveGameTime) return;

        spawnWave(level, config, state.waveProfile, state.wavesSent + 1, state.wavesPlanned);
        state.wavesSent++;

        long nightLengthTicks = 10000L;
        long spacing = Math.max(400L, nightLengthTicks / Math.max(1, state.wavesPlanned));
        state.nextWaveGameTime = level.getGameTime() + spacing;
    }

    private void spawnWave(ServerLevel level, ApocalypseConfig config, WaveProfile profile, int waveNumber, int totalWaves) {
        boolean avoidCreativeAndSpectator = profile != null ? profile.avoidCreativeAndSpectator : config.waves.avoidCreativeAndSpectator;
        boolean spawnAroundEachPlayer = profile != null ? profile.spawnAroundEachPlayer : config.waves.spawnAroundEachPlayer;
        boolean announceWaves = profile != null ? profile.announceWaves : config.waves.announceWaves;

        List<ServerPlayer> players = level.players().stream()
                .filter(player -> !(avoidCreativeAndSpectator && (player.isCreative() || player.isSpectator())))
                .toList();

        if (players.isEmpty()) return;

        int difficultyDay = DifficultyCalculator.getDifficultyDay(level);
        int totalMobCount = rollMobCount(level, config, profile);
        int perPlayer = spawnAroundEachPlayer ? Math.max(1, totalMobCount / players.size()) : totalMobCount;
        int spawned = 0;

        for (ServerPlayer player : players) {
            int countForPlayer = spawnAroundEachPlayer ? perPlayer : totalMobCount;
            for (int i = 0; i < countForPlayer; i++) {
                WeightedEntityPicker.PickResult picked = WeightedEntityPicker.pickDetailed(config, difficultyDay, level, level.random);
                if (picked == null || picked.type() == null) continue;
                EntityType<?> type = picked.type();
                BlockPos pos = SpawnLocator.findSpawnPos(level, player, type, config, profile);
                if (pos == null) continue;
                Entity entity = type.create(level);
                if (entity == null) continue;
                entity.moveTo(pos.getX() + 0.5D, pos.getY(), pos.getZ() + 0.5D, level.random.nextFloat() * 360.0F, 0.0F);
                if (entity instanceof Mob mob) {
                    mob.finalizeSpawn(level, level.getCurrentDifficultyAt(pos), MobSpawnType.EVENT, null, null);
                }
                MobPropertyApplier.apply(entity, picked.rule());
                level.addFreshEntity(entity);
                spawned++;
            }
            if (!spawnAroundEachPlayer) break;
        }

        String waveName = profile != null ? profile.name : "Legacy Wave Rules";
        String entityProfile = WeightedEntityPicker.getActiveProfileName(level, config, difficultyDay);
        if (announceWaves && spawned > 0) {
            Component message = Component.literal("Apocalypse wave " + waveNumber + "/" + totalWaves + " spawned " + spawned + " mobs. Wave: " + waveName + ". Entity pool: " + entityProfile + ". Difficulty day " + difficultyDay + ".")
                    .withStyle(ChatFormatting.DARK_RED);
            level.getServer().getPlayerList().broadcastSystemMessage(message, false);
        }

        ApocalypseMobs.LOGGER.info("Spawned apocalypse wave {}/{} in {} with {} mobs at difficulty day {} using wave profile '{}' and entity profile '{}'.",
                waveNumber, totalWaves, level.dimension().location(), spawned, difficultyDay, waveName, entityProfile);
    }

    private WaveProfile selectedNightProfile(ServerLevel level, ApocalypseConfig config, int difficultyDay) {
        List<WaveProfile> candidates = new ArrayList<>();
        for (WaveProfile profile : config.waves.nightProfiles) {
            if (profile == null || !profile.enabled || profile.weight <= 0) continue;
            if (difficultyDay < profile.minDay || difficultyDay > profile.maxDay) continue;
            candidates.add(profile);
        }
        if (candidates.isEmpty()) return null;

        long worldDay = Math.max(0L, level.getDayTime() / 24000L);
        String dimension = level.dimension().location().toString();
        int totalWeight = candidates.stream().mapToInt(profile -> Math.max(0, profile.weight)).sum();
        if (totalWeight <= 0) return candidates.get(0);

        long seed = level.getSeed() ^ (worldDay * 922337203685477L) ^ dimension.hashCode() ^ 0xA11CE5L;
        Random random = new Random(seed);
        int roll = random.nextInt(totalWeight);
        int cursor = 0;
        for (WaveProfile profile : candidates) {
            cursor += Math.max(0, profile.weight);
            if (roll < cursor) return profile;
        }
        return candidates.get(candidates.size() - 1);
    }

    private int rollWaveCount(ServerLevel level, ApocalypseConfig config, WaveProfile profile) {
        if (profile != null) {
            return randomBetween(level, profile.minWaves, Math.max(profile.minWaves, profile.maxWaves));
        }
        int min = DifficultyCalculator.lerpInt(config.waves.minWavesDay1, config.waves.minWavesDay30, level);
        int max = DifficultyCalculator.lerpInt(config.waves.maxWavesDay1, config.waves.maxWavesDay30, level);
        return randomBetween(level, min, Math.max(min, max));
    }

    private int rollMobCount(ServerLevel level, ApocalypseConfig config, WaveProfile profile) {
        if (profile != null) {
            return randomBetween(level, profile.minMobs, Math.max(profile.minMobs, profile.maxMobs));
        }
        int min = DifficultyCalculator.lerpInt(config.waves.minMobsDay1, config.waves.minMobsDay30, level);
        int max = DifficultyCalculator.lerpInt(config.waves.maxMobsDay1, config.waves.maxMobsDay30, level);
        return randomBetween(level, min, Math.max(min, max));
    }

    private boolean isNight(ServerLevel level) {
        if (level.dimension() != Level.OVERWORLD) return true;
        long dayTime = level.getDayTime() % 24000L;
        return dayTime >= 13000L && dayTime <= 23000L;
    }

    private int randomBetween(ServerLevel level, int min, int max) {
        if (max <= min) return min;
        return min + level.random.nextInt(max - min + 1);
    }

    private static final class NightState {
        private long currentNightDay = -1L;
        private int wavesPlanned = 0;
        private int wavesSent = 0;
        private long nextWaveGameTime = 0L;
        private WaveProfile waveProfile;
    }
}
