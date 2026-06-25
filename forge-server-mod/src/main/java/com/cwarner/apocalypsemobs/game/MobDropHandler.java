package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.config.DropProfile;
import com.cwarner.apocalypsemobs.config.DropRule;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.item.ItemEntity;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.entity.player.Player;
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
            rollItemDrop(event, level, monster, rule);
            rollOurMagicReward(level, monster, rule, entityId);
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

    private static void rollItemDrop(LivingDropsEvent event, ServerLevel level, Monster monster, DropRule rule) {
        if (level.random.nextDouble() > rule.chance) return;
        Optional<Item> optionalItem = BuiltInRegistries.ITEM.getOptional(new ResourceLocation(rule.item));
        if (optionalItem.isEmpty()) return;
        int count = rule.minCount;
        if (rule.maxCount > rule.minCount) count += level.random.nextInt(rule.maxCount - rule.minCount + 1);
        if (count <= 0) return;
        ItemStack stack = new ItemStack(optionalItem.get(), count);
        event.getDrops().add(new ItemEntity(level, monster.getX(), monster.getY(), monster.getZ(), stack));
    }

    private static void rollOurMagicReward(ServerLevel level, Monster monster, DropRule rule, String entityId) {
        if (!rule.ourMagicRewardEnabled || level.random.nextDouble() > rule.ourMagicRewardChance) return;
        int amount = rule.ourMagicRewardMinExperience;
        if (rule.ourMagicRewardMaxExperience > rule.ourMagicRewardMinExperience) {
            amount += level.random.nextInt(rule.ourMagicRewardMaxExperience - rule.ourMagicRewardMinExperience + 1);
        }
        if (amount <= 0) return;

        for (ServerPlayer player : resolveRewardTargets(level, monster, rule.ourMagicRewardTargetMode)) {
            OurMagicGatewayClient.grantExperience(level, player, amount, rule.ourMagicRewardReason, "apocalypse-mobs", entityId, rule.ourMagicRewardTargetMode);
        }
    }

    private static List<ServerPlayer> resolveRewardTargets(ServerLevel level, Monster monster, String targetMode) {
        if ("ALL_PLAYERS".equals(targetMode)) return level.players();
        if ("NEAREST_PLAYER".equals(targetMode)) {
            Player nearest = level.getNearestPlayer(monster, 64.0D);
            return nearest instanceof ServerPlayer serverPlayer ? List.of(serverPlayer) : List.of();
        }
        LivingEntity killer = monster.getKillCredit();
        return killer instanceof ServerPlayer serverPlayer ? List.of(serverPlayer) : List.of();
    }

    private record SelectedNightProfile(DropProfile profile, int configIdentity) {}
}
