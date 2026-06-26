package com.cwarner.apocalypsemobs.config;

public class DropRule {
    public String entity;
    public String item;
    public int minCount;
    public int maxCount;
    public double chance;
    public int minDay;
    public boolean enabled;

    /** Optional economy money reward tied directly to this drop rule/profile row. */
    public boolean economyRewardEnabled = false;
    public double economyRewardChance = 1.0D;
    public double economyRewardMinAmount = 5.0D;
    public double economyRewardMaxAmount = 10.0D;
    public String economyRewardTargetMode = "KILLER";
    public String economyRewardParticipantMode = "FULL_TO_EACH_PARTICIPANT";
    public String economyRewardReason = "apocalypse-drop-economy-reward";

    /** Optional OurMagic XP/API reward tied directly to this drop rule/profile row. */
    public boolean ourMagicRewardEnabled = false;
    public double ourMagicRewardChance = 1.0D;
    public String ourMagicRewardTargetMode = "KILLER";
    public int ourMagicRewardMinExperience = 1;
    public int ourMagicRewardMaxExperience = 3;
    public String ourMagicRewardReason = "apocalypse-drop-profile-reward";

    public DropRule() {}

    public DropRule(String entity, String item, int minCount, int maxCount, double chance, int minDay, boolean enabled) {
        this.entity = entity;
        this.item = item;
        this.minCount = minCount;
        this.maxCount = maxCount;
        this.chance = chance;
        this.minDay = minDay;
        this.enabled = enabled;
    }

    public void sanitize() {
        minCount = Math.max(0, minCount);
        maxCount = Math.max(minCount, maxCount);
        chance = Math.max(0.0D, Math.min(1.0D, chance));
        minDay = Math.max(1, Math.min(30, minDay));
        if (Double.isNaN(economyRewardChance) || Double.isInfinite(economyRewardChance)) economyRewardChance = 1.0D;
        economyRewardChance = Math.max(0.0D, Math.min(1.0D, economyRewardChance));
        if (Double.isNaN(economyRewardMinAmount) || Double.isInfinite(economyRewardMinAmount)) economyRewardMinAmount = 0.0D;
        if (Double.isNaN(economyRewardMaxAmount) || Double.isInfinite(economyRewardMaxAmount)) economyRewardMaxAmount = economyRewardMinAmount;
        economyRewardMinAmount = Math.max(0.0D, economyRewardMinAmount);
        economyRewardMaxAmount = Math.max(economyRewardMinAmount, economyRewardMaxAmount);
        if (!"NEAREST_PLAYER".equals(economyRewardTargetMode) && !"ALL_PLAYERS".equals(economyRewardTargetMode) && !"ALL_PARTICIPANTS".equals(economyRewardTargetMode) && !"TOP_DAMAGER".equals(economyRewardTargetMode)) economyRewardTargetMode = "KILLER";
        if (!"SPLIT_BETWEEN_PARTICIPANTS".equals(economyRewardParticipantMode) && !"PROPORTIONAL_BY_DAMAGE".equals(economyRewardParticipantMode)) economyRewardParticipantMode = "FULL_TO_EACH_PARTICIPANT";
        if (economyRewardReason == null || economyRewardReason.isBlank()) economyRewardReason = "apocalypse-drop-economy-reward";
        ourMagicRewardChance = Math.max(0.0D, Math.min(1.0D, ourMagicRewardChance));
        ourMagicRewardMinExperience = Math.max(0, ourMagicRewardMinExperience);
        ourMagicRewardMaxExperience = Math.max(ourMagicRewardMinExperience, ourMagicRewardMaxExperience);
        if (ourMagicRewardTargetMode == null || ourMagicRewardTargetMode.isBlank()) ourMagicRewardTargetMode = "KILLER";
        if (!"NEAREST_PLAYER".equals(ourMagicRewardTargetMode) && !"ALL_PLAYERS".equals(ourMagicRewardTargetMode) && !"EVENT_TARGET".equals(ourMagicRewardTargetMode)) {
            ourMagicRewardTargetMode = "KILLER";
        }
        if (ourMagicRewardReason == null || ourMagicRewardReason.isBlank()) ourMagicRewardReason = "apocalypse-drop-profile-reward";
    }
}
