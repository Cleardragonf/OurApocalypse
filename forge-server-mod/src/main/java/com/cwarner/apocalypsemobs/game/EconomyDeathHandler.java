package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraftforge.event.entity.living.LivingDeathEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.List;

public final class EconomyDeathHandler {
    @SubscribeEvent
    public void onLivingDeath(LivingDeathEvent event) {
        if (!(event.getEntity() instanceof ServerPlayer player)) return;

        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled || !config.economy.enabled || !config.economy.deathCosts.enabled) return;

        ApocalypseConfig.EconomyDeathCostRule rule = selectRule(config.economy.deathCosts.rules, event.getSource());
        String mode = rule == null ? config.economy.deathCosts.defaultMode : rule.mode;
        double amount = rule == null ? config.economy.deathCosts.defaultAmount : rule.amount;
        double percent = rule == null ? config.economy.deathCosts.defaultPercent : rule.percent;
        String reason = rule == null ? "death-cost" : rule.reason;

        EconomyWalletLedger.WalletRecord before = EconomyWalletLedger.balance(player);
        double cost = "PERCENT_BALANCE".equals(mode) ? before.balance * (percent / 100.0D) : amount;
        if (cost <= 0.0D) return;

        EconomyWalletLedger.WalletRecord after = EconomyWalletLedger.remove(player, cost, reason == null || reason.isBlank() ? "death-cost" : reason);
        double charged = Math.max(0.0D, before.balance - after.balance);
        if (charged > 0.0D) {
            player.sendSystemMessage(Component.literal("Death cost: " + format(charged) + " " + config.economy.currencyName));
        }
    }

    private static ApocalypseConfig.EconomyDeathCostRule selectRule(List<ApocalypseConfig.EconomyDeathCostRule> rules, DamageSource source) {
        if (rules == null || rules.isEmpty()) return null;
        ApocalypseConfig.EconomyDeathCostRule fallback = null;
        for (ApocalypseConfig.EconomyDeathCostRule rule : rules) {
            if (rule == null || !rule.enabled) continue;
            if ("ANY".equals(rule.deathCause)) {
                if (fallback == null) fallback = rule;
                continue;
            }
            if (matchesDeathCause(rule.deathCause, source)) return rule;
        }
        return fallback;
    }

    private static boolean matchesDeathCause(String configuredCause, DamageSource source) {
        if (configuredCause == null || configuredCause.isBlank() || source == null) return false;
        String configured = configuredCause.trim();
        String msgId = source.getMsgId();
        if (configured.equals(msgId) || configured.equals("minecraft:" + msgId)) return true;
        if ("minecraft:explosion".equals(configured) && msgId.startsWith("explosion")) return true;
        return "minecraft:void".equals(configured) && "outOfWorld".equals(msgId);
    }

    private static String format(double value) {
        return String.format(java.util.Locale.ROOT, "%.2f", value);
    }
}
