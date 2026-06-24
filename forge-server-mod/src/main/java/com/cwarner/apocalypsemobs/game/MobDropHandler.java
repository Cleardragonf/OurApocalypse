package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.config.DropProfile;
import com.cwarner.apocalypsemobs.config.DropRule;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraftforge.event.entity.living.LivingDropsEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

public final class MobDropHandler {
    private final Map<String, SelectedNightProfile> selectedProfiles = new HashMap<>();

    @SubscribeEvent
    public void onLivingDrops(LivingDropsEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;
        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || !config.drops.enabled) return;

        int difficultyDay = DifficultyCalculator.getDifficultyDay(level);
        String entityId = EntityType.getKey(monster.getType()).toString();
        DropProfile profile = config.drops.useNightProfiles() ? selectedNightProfile(level, config, difficultyDay) : null;
        List<DropRule> rules = profile != null ? profile.rules : config.drops.rules;
        if (rules == null || rules.isEmpty()) return;

        if (config.drops.overrideVanillaDrops || (profile != null && profile.overrideVanillaDrops)) {
            event.getDrops().clear();
        }

        for (DropRule rule : rules) {
            if (rule == null || !rule.enabled || rule.item == null || rule.entity == null) continue;
            if (difficultyDay < rule.minDay) continue;
            if (!"*".equals(rule.entity) && !rule.entity.equals(entityId)) continue;
            if (level.random.nextDouble() > rule.chance) continue;
            Optional<Item> optionalItem = BuiltInRegistries.ITEM.getOptional(new ResourceLocation(rule.item));
            if (optionalItem.isEmpty()) continue;
            int count = rule.minCount;
            if (rule.maxCount > rule.minCount) count += level.random.nextInt(rule.maxCount - rule.minCount + 1);
            if (count <= 0) continue;
            ItemStack stack = new ItemStack(optionalItem.get(), count);
            event.getDrops().add(new ItemEntity(level, monster.getX(), monster.getY(), monster.getZ(), stack));
        }
    }

    public String getActiveProfileName(ServerLevel level) {
        ApocalypseConfig config = ConfigManager.get();
        if (config == null || config.drops == null || !config.drops.useNightProfiles()) return "Legacy Rules";
        DropProfile profile = selectedNightProfile(level, config, DifficultyCalculator.getDifficultyDay(level));
        return profile == null ? "None" : profile.name;
    }

    private DropProfile selectedNightProfile(ServerLevel level, ApocalypseConfig config, int difficultyDay) {
        long worldDay = Math.max(0L, level.getDayTime() / 24000L);
        String dimension = level.dimension().location().toString();
        String key = dimension + ":" + worldDay;
        SelectedNightProfile cached = selectedProfiles.get(key);
        if (cached != null && cached.configIdentity == config.drops.nightProfiles.hashCode()) {
            return cached.profile;
        }

        List<DropProfile> candidates = activeProfiles(config, difficultyDay);
        DropProfile selected = pickWeightedProfile(level, dimension, worldDay, candidates);
        selectedProfiles.put(key, new SelectedNightProfile(selected, config.drops.nightProfiles.hashCode()));
        pruneOldProfiles(dimension, worldDay);
        return selected;
    }

    private static List<DropProfile> activeProfiles(ApocalypseConfig config, int difficultyDay) {
        List<DropProfile> candidates = new ArrayList<>();
        if (config.drops.nightProfiles == null) return candidates;
        for (DropProfile profile : config.drops.nightProfiles) {
            if (profile == null || !profile.enabled || profile.weight <= 0) continue;
            if (difficultyDay < profile.minDay || difficultyDay > profile.maxDay) continue;
            if (profile.rules == null || profile.rules.isEmpty()) continue;
            candidates.add(profile);
        }
        return candidates;
    }

    private static DropProfile pickWeightedProfile(ServerLevel level, String dimension, long worldDay, List<DropProfile> candidates) {
        if (candidates.isEmpty()) return null;
        int totalWeight = candidates.stream().mapToInt(profile -> Math.max(0, profile.weight)).sum();
        if (totalWeight <= 0) return candidates.get(0);

        long seed = level.getSeed() ^ (worldDay * 341873128712L) ^ dimension.hashCode();
        Random random = new Random(seed);
        int roll = random.nextInt(totalWeight);
        int cursor = 0;
        for (DropProfile profile : candidates) {
            cursor += Math.max(0, profile.weight);
            if (roll < cursor) return profile;
        }
        return candidates.get(candidates.size() - 1);
    }

    private void pruneOldProfiles(String dimension, long currentWorldDay) {
        selectedProfiles.keySet().removeIf(key -> key.startsWith(dimension + ":") && parseWorldDay(key) < currentWorldDay - 2L);
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

    private record SelectedNightProfile(DropProfile profile, int configIdentity) {}
}
