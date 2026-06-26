package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.config.DropProfile;
import com.cwarner.apocalypsemobs.config.DropRule;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.network.chat.Component;
import net.minecraft.network.protocol.game.ClientboundSetSubtitleTextPacket;
import net.minecraft.network.protocol.game.ClientboundSetTitleTextPacket;
import net.minecraft.network.protocol.game.ClientboundSetTitlesAnimationPacket;
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
import net.minecraftforge.event.entity.living.LivingHurtEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

public final class MobDropHandler {
    private final Map<String, SelectedNightProfile> selectedProfiles = new HashMap<>();
    private final Map<UUID, Map<UUID, DamageShare>> damageShares = new HashMap<>();

    @SubscribeEvent
    public void onLivingHurt(LivingHurtEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel)) return;
        if (!(event.getSource().getEntity() instanceof ServerPlayer player)) return;
        if (event.getAmount() <= 0.0F) return;

        Map<UUID, DamageShare> shares = damageShares.computeIfAbsent(monster.getUUID(), ignored -> new LinkedHashMap<>());
        DamageShare share = shares.computeIfAbsent(player.getUUID(), ignored -> new DamageShare(player.getUUID()));
        share.damage += event.getAmount();
    }

    @SubscribeEvent
    public void onLivingDrops(LivingDropsEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;
        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled) return;

        int difficultyDay = DifficultyCalculator.getDifficultyDay(level);
        String entityId = EntityType.getKey(monster.getType()).toString();
        Map<UUID, DamageShare> shares = damageShares.remove(monster.getUUID());

        if (config.drops.enabled) {
            DropProfile profile = config.drops.useNightProfiles() ? selectedNightProfile(level, config, difficultyDay) : null;
            List<DropRule> rules = profile != null ? profile.rules : config.drops.rules;

            if (rules != null && !rules.isEmpty()) {
                if (config.drops.overrideVanillaDrops || (profile != null && profile.overrideVanillaDrops)) {
                    event.getDrops().clear();
                }

                for (DropRule rule : rules) {
                    if (rule == null || !rule.enabled || rule.item == null || rule.entity == null) continue;
                    if (difficultyDay < rule.minDay) continue;
                    if (!"*".equals(rule.entity) && !rule.entity.equals(entityId)) continue;
                    rollItemDrop(event, level, monster, rule);
                    rollDropEconomyReward(level, monster, shares, rule, entityId, config);
                    rollOurMagicReward(level, monster, rule, entityId);
                }
            }
        }

        if (config.economy.enabled && config.economy.killRewards.enabled) {
            boolean profileRewardConfigured = rollProfileEconomyReward(level, monster, shares, entityId);
            if (!profileRewardConfigured) {
                rollConfiguredKillRewards(level, monster, shares, config, difficultyDay, entityId);
            }
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

    private static void rollDropEconomyReward(ServerLevel level, Monster monster, Map<UUID, DamageShare> shares, DropRule rule, String entityId, ApocalypseConfig config) {
        if (!config.economy.enabled || !rule.economyRewardEnabled) return;
        if (level.random.nextDouble() > rule.economyRewardChance) return;
        double amount = randomAmount(level, rule.economyRewardMinAmount, rule.economyRewardMaxAmount);
        if (amount <= 0.0D) return;
        payRewardTargets(level, monster, shares, rule.economyRewardTargetMode, rule.economyRewardParticipantMode, amount, rule.economyRewardReason, entityId);
    }

    private static boolean rollProfileEconomyReward(ServerLevel level, Monster monster, Map<UUID, DamageShare> shares, String entityId) {
        CompoundTag data = monster.getPersistentData();
        if (!data.getBoolean(MobPropertyApplier.ECONOMY_REWARD_ENABLED_TAG)) return false;
        if (level.random.nextDouble() > data.getDouble(MobPropertyApplier.ECONOMY_REWARD_CHANCE_TAG)) return true;
        double amount = randomAmount(level, data.getDouble(MobPropertyApplier.ECONOMY_REWARD_MIN_AMOUNT_TAG), data.getDouble(MobPropertyApplier.ECONOMY_REWARD_MAX_AMOUNT_TAG));
        if (amount <= 0.0D) return true;
        payRewardTargets(level, monster, shares, data.getString(MobPropertyApplier.ECONOMY_REWARD_TARGET_MODE_TAG), data.getString(MobPropertyApplier.ECONOMY_REWARD_PARTICIPANT_MODE_TAG), amount, data.getString(MobPropertyApplier.ECONOMY_REWARD_REASON_TAG), entityId);
        return true;
    }

    private static void rollConfiguredKillRewards(ServerLevel level, Monster monster, Map<UUID, DamageShare> shares, ApocalypseConfig config, int difficultyDay, String entityId) {
        List<ApocalypseConfig.EconomyEntityRewardRule> matches = config.economy.killRewards.rules == null ? List.of() : config.economy.killRewards.rules.stream()
                .filter(rule -> rule != null && rule.enabled)
                .filter(rule -> difficultyDay >= rule.minDay)
                .filter(rule -> "*".equals(rule.entity) || entityId.equals(rule.entity))
                .toList();

        if (matches.isEmpty()) {
            if (level.random.nextDouble() > config.economy.killRewards.defaultChance) return;
            double amount = randomAmount(level, config.economy.killRewards.defaultMinAmount, config.economy.killRewards.defaultMaxAmount);
            if (amount > 0.0D) {
                payRewardTargets(level, monster, shares, "KILLER", "FULL_TO_EACH_PARTICIPANT", amount, "economy-kill-reward", entityId);
            }
            return;
        }

        for (ApocalypseConfig.EconomyEntityRewardRule rule : matches) {
            if (level.random.nextDouble() > rule.chance) continue;
            double amount = randomAmount(level, rule.minAmount, rule.maxAmount);
            if (amount <= 0.0D) continue;
            payRewardTargets(level, monster, shares, rule.targetMode, rule.participantRewardMode, amount, rule.reason, entityId);
        }
    }

    private static void payRewardTargets(ServerLevel level, Monster monster, Map<UUID, DamageShare> shares, String targetMode, String participantMode, double amount, String reason, String entityId) {
        String resolvedReason = reason == null || reason.isBlank() ? "economy-kill-reward" : reason;
        if ("TOP_DAMAGER".equals(targetMode)) {
            topDamager(level, shares).ifPresent(player -> grantKillReward(player, amount, resolvedReason, entityId));
            return;
        }

        if ("ALL_PARTICIPANTS".equals(targetMode)) {
            Map<ServerPlayer, Double> payouts = participantPayouts(level, shares, participantMode, amount);
            for (Map.Entry<ServerPlayer, Double> entry : payouts.entrySet()) {
                grantKillReward(entry.getKey(), entry.getValue(), resolvedReason, entityId);
            }
            return;
        }

        for (ServerPlayer player : resolveRewardTargets(level, monster, targetMode)) {
            grantKillReward(player, amount, resolvedReason, entityId);
        }
    }

    private static void grantKillReward(ServerPlayer player, double amount, String reason, String entityId) {
        if (amount <= 0.0D) return;
        EconomyWalletLedger.add(player, amount, reason + ":" + entityId);
        sendKillRewardSubtitle(player, amount);
    }

    private static void sendKillRewardSubtitle(ServerPlayer player, double amount) {
        String currencyName = ConfigManager.get().economy.currencyName;
        Component subtitle = Component.literal("+" + format(amount) + " " + currencyName);
        player.connection.send(new ClientboundSetTitlesAnimationPacket(5, 35, 10));
        player.connection.send(new ClientboundSetTitleTextPacket(Component.empty()));
        player.connection.send(new ClientboundSetSubtitleTextPacket(subtitle));
    }

    private static double randomAmount(ServerLevel level, double min, double max) {
        double low = Math.max(0.0D, min);
        double high = Math.max(low, max);
        if (high <= low) return low;
        return low + (level.random.nextDouble() * (high - low));
    }

    private static Optional<ServerPlayer> topDamager(ServerLevel level, Map<UUID, DamageShare> shares) {
        if (shares == null || shares.isEmpty()) return Optional.empty();
        return shares.values().stream()
                .max(Comparator.comparingDouble(share -> share.damage))
                .flatMap(share -> onlinePlayer(level, share.playerId));
    }

    private static Map<ServerPlayer, Double> participantPayouts(ServerLevel level, Map<UUID, DamageShare> shares, String participantMode, double amount) {
        Map<ServerPlayer, Double> payouts = new LinkedHashMap<>();
        if (shares == null || shares.isEmpty()) return payouts;

        List<DamageShare> activeShares = shares.values().stream()
                .filter(share -> share.damage > 0.0D)
                .toList();
        if (activeShares.isEmpty()) return payouts;

        if ("PROPORTIONAL_BY_DAMAGE".equals(participantMode)) {
            double totalDamage = activeShares.stream().mapToDouble(share -> share.damage).sum();
            if (totalDamage <= 0.0D) return payouts;
            for (DamageShare share : activeShares) {
                onlinePlayer(level, share.playerId).ifPresent(player -> payouts.put(player, amount * (share.damage / totalDamage)));
            }
            return payouts;
        }

        double payout = "SPLIT_BETWEEN_PARTICIPANTS".equals(participantMode) ? amount / activeShares.size() : amount;
        for (DamageShare share : activeShares) {
            onlinePlayer(level, share.playerId).ifPresent(player -> payouts.put(player, payout));
        }
        return payouts;
    }

    private static Optional<ServerPlayer> onlinePlayer(ServerLevel level, UUID playerId) {
        if (level.getServer() == null) return Optional.empty();
        return Optional.ofNullable(level.getServer().getPlayerList().getPlayer(playerId));
    }

    private static String format(double value) {
        return String.format(java.util.Locale.ROOT, "%.2f", value);
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

    private static final class DamageShare {
        private final UUID playerId;
        private double damage;

        private DamageShare(UUID playerId) {
            this.playerId = playerId;
        }
    }
}
