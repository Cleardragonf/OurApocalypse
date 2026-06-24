package com.cwarner.apocalypsemobs.config;

public class DropRule {
    public String entity;
    public String item;
    public int minCount;
    public int maxCount;
    public double chance;
    public int minDay;
    public boolean enabled;

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
