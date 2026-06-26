package com.cwarner.apocalypsemobs.config;

public class EntityWeight {
    public String entity;
    public int weight;
    public int minDay;
    /**
     * Chance that this entity actually spawns after it wins the weighted selection roll.
     * 1.0 = 100%, 0.35 = 35%.
     */
    public double spawnChance = 1.0D;
    public boolean enabled;
    /** Optional profile-specific economy reward override applied when this row's entity is killed. */
    public boolean economyRewardEnabled = false;
    public double economyRewardChance = 1.0D;
    public double economyRewardMinAmount = 5.0D;
    public double economyRewardMaxAmount = 10.0D;
    public String economyRewardTargetMode = "KILLER";
    public String economyRewardParticipantMode = "FULL_TO_EACH_PARTICIPANT";
    public String economyRewardReason = "apocalypse-entity-kill-reward";
    /** Optional profile-specific mob property modifiers applied after this entity spawns. */
    public MobProperties properties = MobProperties.normal();

    public EntityWeight() {}

    public EntityWeight(String entity, int weight, int minDay, boolean enabled) {
        this(entity, weight, minDay, 1.0D, enabled);
    }

    public EntityWeight(String entity, int weight, int minDay, double spawnChance, boolean enabled) {
        this.entity = entity;
        this.weight = weight;
        this.minDay = minDay;
        this.spawnChance = spawnChance;
        this.enabled = enabled;
        this.properties = MobProperties.normal();
    }

    public void sanitize() {
        if (entity == null || entity.isBlank()) entity = "minecraft:zombie";
        weight = Math.max(0, weight);
        minDay = Math.max(1, Math.min(30, minDay));
        if (Double.isNaN(spawnChance) || Double.isInfinite(spawnChance)) spawnChance = 1.0D;
        spawnChance = Math.max(0.0D, Math.min(1.0D, spawnChance));
        if (Double.isNaN(economyRewardChance) || Double.isInfinite(economyRewardChance)) economyRewardChance = 1.0D;
        economyRewardChance = Math.max(0.0D, Math.min(1.0D, economyRewardChance));
        if (Double.isNaN(economyRewardMinAmount) || Double.isInfinite(economyRewardMinAmount)) economyRewardMinAmount = 0.0D;
        if (Double.isNaN(economyRewardMaxAmount) || Double.isInfinite(economyRewardMaxAmount)) economyRewardMaxAmount = economyRewardMinAmount;
        economyRewardMinAmount = Math.max(0.0D, economyRewardMinAmount);
        economyRewardMaxAmount = Math.max(economyRewardMinAmount, economyRewardMaxAmount);
        if (!"NEAREST_PLAYER".equals(economyRewardTargetMode) && !"ALL_PLAYERS".equals(economyRewardTargetMode) && !"ALL_PARTICIPANTS".equals(economyRewardTargetMode) && !"TOP_DAMAGER".equals(economyRewardTargetMode)) economyRewardTargetMode = "KILLER";
        if (!"SPLIT_BETWEEN_PARTICIPANTS".equals(economyRewardParticipantMode) && !"PROPORTIONAL_BY_DAMAGE".equals(economyRewardParticipantMode)) economyRewardParticipantMode = "FULL_TO_EACH_PARTICIPANT";
        if (economyRewardReason == null) economyRewardReason = "";
        if (properties == null) properties = MobProperties.normal();
        properties.sanitize();
    }
}
