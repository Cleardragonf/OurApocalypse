package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.EntitySpawnProfile;
import com.cwarner.apocalypsemobs.config.EntityWeight;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.MobCategory;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

public final class WeightedEntityPicker {
    private static final Map<String, SelectedEntityProfile> SELECTED_ENTITY_PROFILES = new HashMap<>();

    private WeightedEntityPicker() {}

    public static PickResult pickDetailed(ApocalypseConfig config, int difficultyDay, ServerLevel level, RandomSource random) {
        EntitySpawnProfile profile = config.entitySpawning.useNightProfiles()
                ? selectedNightProfile(level, config, difficultyDay).orElse(null)
                : null;
        List<EntityWeight> weights = profile != null ? profile.weights : config.entitySpawning.legacyWeights;
        return pickFromWeights(config, weights, difficultyDay, random, profile != null ? profile.name : "Legacy Entity Weights");
    }

    public static EntityType<?> pick(ApocalypseConfig config, int difficultyDay, ServerLevel level, RandomSource random) {
        PickResult result = pickDetailed(config, difficultyDay, level, random);
        return result == null ? null : result.type();
    }

    /** Legacy signature retained for older call sites. */
    public static EntityType<?> pick(ApocalypseConfig config, int difficultyDay, RandomSource random) {
        PickResult result = pickFromWeights(config, config.entitySpawning.legacyWeights, difficultyDay, random, "Legacy Entity Weights");
        return result == null ? null : result.type();
    }

    public static String getActiveProfileName(ServerLevel level, ApocalypseConfig config, int difficultyDay) {
        if (config == null || config.entitySpawning == null || !config.entitySpawning.useNightProfiles()) return "Legacy Entity Weights";
        return selectedNightProfile(level, config, difficultyDay).map(profile -> profile.name).orElse("None");
    }

    private static PickResult pickFromWeights(ApocalypseConfig config, List<EntityWeight> weights, int difficultyDay, RandomSource random, String profileName) {
        List<WeightedType> active = new ArrayList<>();
        int totalWeight = 0;
        List<EntityWeight> source = weights != null && !weights.isEmpty() ? weights : config.entityWeights;

        for (EntityWeight entry : source) {
            if (entry == null || !entry.enabled || entry.weight <= 0 || entry.entity == null) continue;
            if (difficultyDay < entry.minDay) continue;
            if (config.entityBlacklist.contains(entry.entity)) continue;
            Optional<EntityType<?>> optionalType = BuiltInRegistries.ENTITY_TYPE.getOptional(new ResourceLocation(entry.entity));
            if (optionalType.isEmpty()) continue;
            EntityType<?> type = optionalType.get();
            if (type.getCategory() != MobCategory.MONSTER) continue;
            double spawnChance = Math.max(0.0D, Math.min(1.0D, entry.spawnChance));
            if (spawnChance <= 0.0D) continue;
            active.add(new WeightedType(type, entry, entry.weight, spawnChance));
            totalWeight += entry.weight;
        }

        if (active.isEmpty() || totalWeight <= 0) return new PickResult(EntityType.ZOMBIE, null, profileName);

        String failedBehavior = config.entitySpawning.failedChanceBehavior == null
                ? "SKIP_SPAWN"
                : config.entitySpawning.failedChanceBehavior;
        int attempts = "REROLL_ENTITY".equals(failedBehavior) ? Math.max(1, active.size() * 3) : 1;

        for (int attempt = 0; attempt < attempts; attempt++) {
            WeightedType selected = pickWeightedType(active, totalWeight, random);
            if (selected == null) return null;
            if (random.nextDouble() <= selected.spawnChance) return new PickResult(selected.type, selected.rule, profileName);
            if (!"REROLL_ENTITY".equals(failedBehavior)) return null;
        }

        return null;
    }

    private static WeightedType pickWeightedType(List<WeightedType> active, int totalWeight, RandomSource random) {
        if (active.isEmpty() || totalWeight <= 0) return null;
        int roll = random.nextInt(totalWeight) + 1;
        int cursor = 0;
        for (WeightedType weightedType : active) {
            cursor += weightedType.weight;
            if (roll <= cursor) return weightedType;
        }
        return active.get(active.size() - 1);
    }

    private static Optional<EntitySpawnProfile> selectedNightProfile(ServerLevel level, ApocalypseConfig config, int difficultyDay) {
        long worldDay = Math.max(0L, level.getDayTime() / 24000L);
        String dimension = level.dimension().location().toString();
        String key = dimension + ":" + worldDay;
        int configIdentity = config.entitySpawning.nightProfiles.hashCode();
        SelectedEntityProfile cached = SELECTED_ENTITY_PROFILES.get(key);
        if (cached != null && cached.configIdentity == configIdentity) return Optional.ofNullable(cached.profile);

        List<EntitySpawnProfile> candidates = activeProfiles(config, difficultyDay);
        EntitySpawnProfile selected = pickWeightedProfile(level, dimension, worldDay, candidates);
        SELECTED_ENTITY_PROFILES.put(key, new SelectedEntityProfile(selected, configIdentity));
        pruneOldProfiles(dimension, worldDay);
        return Optional.ofNullable(selected);
    }

    private static List<EntitySpawnProfile> activeProfiles(ApocalypseConfig config, int difficultyDay) {
        List<EntitySpawnProfile> candidates = new ArrayList<>();
        if (config.entitySpawning.nightProfiles == null) return candidates;
        for (EntitySpawnProfile profile : config.entitySpawning.nightProfiles) {
            if (profile == null || !profile.enabled || profile.weight <= 0) continue;
            if (difficultyDay < profile.minDay || difficultyDay > profile.maxDay) continue;
            if (profile.weights == null || profile.weights.isEmpty()) continue;
            candidates.add(profile);
        }
        return candidates;
    }

    private static EntitySpawnProfile pickWeightedProfile(ServerLevel level, String dimension, long worldDay, List<EntitySpawnProfile> candidates) {
        if (candidates.isEmpty()) return null;
        int totalWeight = candidates.stream().mapToInt(profile -> Math.max(0, profile.weight)).sum();
        if (totalWeight <= 0) return candidates.get(0);

        long seed = level.getSeed() ^ (worldDay * 132897987541L) ^ dimension.hashCode() ^ 0xE7717A5EL;
        Random random = new Random(seed);
        int roll = random.nextInt(totalWeight);
        int cursor = 0;
        for (EntitySpawnProfile profile : candidates) {
            cursor += Math.max(0, profile.weight);
            if (roll < cursor) return profile;
        }
        return candidates.get(candidates.size() - 1);
    }

    private static void pruneOldProfiles(String dimension, long currentWorldDay) {
        SELECTED_ENTITY_PROFILES.keySet().removeIf(key -> key.startsWith(dimension + ":") && parseWorldDay(key) < currentWorldDay - 2L);
    }

    private static long parseWorldDay(String key) {
        int index = key.lastIndexOf(':');
        if (index < 0) return 0L;
        try {
            return Long.parseLong(key.substring(index + 1));
        } catch (NumberFormatException ex) {
            return 0L;
        }
    }

    public record PickResult(EntityType<?> type, EntityWeight rule, String profileName) {}
    private record WeightedType(EntityType<?> type, EntityWeight rule, int weight, double spawnChance) {}
    private record SelectedEntityProfile(EntitySpawnProfile profile, int configIdentity) {}
}
