package com.cwarner.apocalypsemobs.config;

import java.util.ArrayList;
import java.util.List;

/**
 * Optional per-entity property overrides applied immediately after an apocalypse mob spawns.
 * These are intentionally server-side vanilla attribute changes, so clients do not need this mod.
 */
public class MobProperties {
    public boolean enabled = false;

    /**
     * Numeric mob properties can be FIXED or RANGED.
     * FIXED uses the exact value field. RANGED picks an exact value between Min/Max per spawned mob.
     * A value of 0 means leave that property vanilla/unchanged.
     */
    public String maxHealthMode = "FIXED";
    public double maxHealth = 0.0D;
    public double maxHealthMin = 0.0D;
    public double maxHealthMax = 0.0D;

    public String attackDamageMode = "FIXED";
    public double attackDamage = 0.0D;
    public double attackDamageMin = 0.0D;
    public double attackDamageMax = 0.0D;

    public String movementSpeedMode = "FIXED";
    public double movementSpeed = 0.0D;
    public double movementSpeedMin = 0.0D;
    public double movementSpeedMax = 0.0D;

    public String followRangeMode = "FIXED";
    public double followRange = 0.0D;
    public double followRangeMin = 0.0D;
    public double followRangeMax = 0.0D;

    public String armorMode = "FIXED";
    public double armor = 0.0D;
    public double armorMin = 0.0D;
    public double armorMax = 0.0D;

    public String armorToughnessMode = "FIXED";
    public double armorToughness = 0.0D;
    public double armorToughnessMin = 0.0D;
    public double armorToughnessMax = 0.0D;

    public String knockbackResistanceMode = "FIXED";
    public double knockbackResistance = 0.0D;
    public double knockbackResistanceMin = 0.0D;
    public double knockbackResistanceMax = 0.0D;

    /**
     * Fixed/ranged step height override. 0 means leave vanilla step height alone.
     * Values around 1.0 let mobs step onto full blocks more easily.
     */
    public String stepHeightMode = "FIXED";
    public double stepHeight = 0.0D;
    public double stepHeightMin = 0.0D;
    public double stepHeightMax = 0.0D;

    public boolean persistent = false;
    public String customName = "";
    public boolean targetPlayers = true;
    public boolean breakBlocks = true;
    public boolean placeBlocks = true;
    public boolean bridgeGaps = true;

    /** Per-spawn MonsterApocalypse-style AI behavior. These are stored on spawned mobs so each row/profile can behave differently. */
    public boolean monsterAiWallAttack = false;
    public boolean wallAttackUseBlockHp = true;
    public int wallAttackCooldownTicks = 20;
    public double wallAttackDamagePerHit = 1.0D;
    public boolean nerdPoleEnabled = false;
    public int maxPillarHeight = 12;
    public int pillarCooldownTicks = 40;
    public boolean airBridgeEnabled = false;
    public int maxBridgeLength = 24;
    public int bridgeCooldownTicks = 40;
    public boolean killAfterPillarOrBridge = false;
    public int frustrationTicks = 100;
    public String monsterAiBuildBlock = "minecraft:cobblestone";
    public boolean megaAggroEnabled = false;
    public boolean daytimeMegaAggro = false;
    public int sprintDistance = 18;
    public boolean destroyTorches = false;
    public int torchRadius = 5;
    public int torchMinDay = 6;

    /** Per-row natural/passive spawning rules. Non-hostile entities only participate in apocalypse pools when this is enabled. */
    public boolean naturalSpawnEnabled = false;
    public int naturalSpawnMinLight = 0;
    public int naturalSpawnMaxLight = 15;
    public int naturalSpawnYMin = -64;
    public int naturalSpawnYMax = 320;
    public boolean naturalSpawnAllowWater = false;
    public boolean naturalSpawnAllowAir = false;
    public boolean naturalSpawnRequireBlockBelow = true;
    /** DISABLED, BLACKLIST, or WHITELIST. */
    public String naturalSpawnBlockMode = "DISABLED";
    public List<String> naturalSpawnBlocks = new ArrayList<>();

    /** Skeletons, strays, pillagers, and other arrow shooters can make arrows explode on impact. */
    public boolean explodingArrows = false;
    public double explodingArrowChance = 0.0D;
    public double explodingArrowPower = 2.0D;
    public boolean explodingArrowBreakBlocks = true;

    /** Creepers can use a controlled wall explosion when blocked from a player. */
    public boolean creeperWallExplosions = false;
    public double creeperWallExplosionChance = 0.0D;
    public double creeperWallExplosionPower = 2.8D;
    public int creeperWallExplosionCooldownTicks = 100;

    /** Endermen can randomly teleport their target player to a nearby safe location. */
    public boolean endermanTeleportPlayers = false;
    public double endermanTeleportChance = 0.0D;
    public int endermanTeleportRadius = 12;
    public int endermanTeleportCooldownTicks = 160;

    /** Spiders can place cobwebs on/around their target player. */
    public boolean spiderWebPlayers = false;
    public double spiderWebChance = 0.0D;
    public int spiderWebCooldownTicks = 100;

    public MobProperties() {}

    public MobProperties(boolean enabled, double maxHealth, double attackDamage, double movementSpeed, double followRange, double armor, double armorToughness, double knockbackResistance, boolean persistent, String customName) {
        this.enabled = enabled;
        this.maxHealth = maxHealth;
        this.maxHealthMin = maxHealth;
        this.maxHealthMax = maxHealth;
        this.attackDamage = attackDamage;
        this.attackDamageMin = attackDamage;
        this.attackDamageMax = attackDamage;
        this.movementSpeed = movementSpeed;
        this.movementSpeedMin = movementSpeed;
        this.movementSpeedMax = movementSpeed;
        this.followRange = followRange;
        this.followRangeMin = followRange;
        this.followRangeMax = followRange;
        this.armor = armor;
        this.armorMin = armor;
        this.armorMax = armor;
        this.armorToughness = armorToughness;
        this.armorToughnessMin = armorToughness;
        this.armorToughnessMax = armorToughness;
        this.knockbackResistance = knockbackResistance;
        this.knockbackResistanceMin = knockbackResistance;
        this.knockbackResistanceMax = knockbackResistance;
        this.persistent = persistent;
        this.customName = customName;
    }

    public static MobProperties normal() {
        return new MobProperties();
    }

    public static MobProperties stronger(double maxHealthValue, double attackDamageValue, double movementSpeedValue) {
        MobProperties properties = new MobProperties();
        properties.enabled = true;
        properties.maxHealth = maxHealthValue;
        properties.maxHealthMin = maxHealthValue;
        properties.maxHealthMax = maxHealthValue;
        properties.attackDamage = attackDamageValue;
        properties.attackDamageMin = attackDamageValue;
        properties.attackDamageMax = attackDamageValue;
        properties.movementSpeed = movementSpeedValue;
        properties.movementSpeedMin = movementSpeedValue;
        properties.movementSpeedMax = movementSpeedValue;
        return properties;
    }

    public void sanitize() {
        maxHealthMode = sanitizeMode(maxHealthMode);
        maxHealth = clampFinite(maxHealth, 0.0D, 2048.0D, 0.0D);
        maxHealthMin = clampFinite(maxHealthMin, 0.0D, 2048.0D, maxHealth);
        maxHealthMax = clampFinite(maxHealthMax, 0.0D, 2048.0D, maxHealth);
        if (maxHealthMin > maxHealthMax) {
            double tmp = maxHealthMin;
            maxHealthMin = maxHealthMax;
            maxHealthMax = tmp;
        }

        attackDamageMode = sanitizeMode(attackDamageMode);
        attackDamage = clampFinite(attackDamage, 0.0D, 2048.0D, 0.0D);
        attackDamageMin = clampFinite(attackDamageMin, 0.0D, 100.0D, attackDamage);
        attackDamageMax = clampFinite(attackDamageMax, 0.0D, 100.0D, attackDamage);
        if (attackDamageMin > attackDamageMax) {
            double tmp = attackDamageMin;
            attackDamageMin = attackDamageMax;
            attackDamageMax = tmp;
        }

        movementSpeedMode = sanitizeMode(movementSpeedMode);
        movementSpeed = clampFinite(movementSpeed, 0.0D, 10.0D, 0.0D);
        movementSpeedMin = clampFinite(movementSpeedMin, 0.0D, 10.0D, movementSpeed);
        movementSpeedMax = clampFinite(movementSpeedMax, 0.0D, 10.0D, movementSpeed);
        if (movementSpeedMin > movementSpeedMax) {
            double tmp = movementSpeedMin;
            movementSpeedMin = movementSpeedMax;
            movementSpeedMax = tmp;
        }

        followRangeMode = sanitizeMode(followRangeMode);
        followRange = clampFinite(followRange, 0.0D, 256.0D, 0.0D);
        followRangeMin = clampFinite(followRangeMin, 0.0D, 256.0D, followRange);
        followRangeMax = clampFinite(followRangeMax, 0.0D, 256.0D, followRange);
        if (followRangeMin > followRangeMax) {
            double tmp = followRangeMin;
            followRangeMin = followRangeMax;
            followRangeMax = tmp;
        }

        armorMode = sanitizeMode(armorMode);
        armor = clampFinite(armor, 0.0D, 100.0D, 0.0D);
        armorMin = clampFinite(armorMin, 0.0D, 100.0D, armor);
        armorMax = clampFinite(armorMax, 0.0D, 100.0D, armor);
        if (armorMin > armorMax) {
            double tmp = armorMin;
            armorMin = armorMax;
            armorMax = tmp;
        }

        armorToughnessMode = sanitizeMode(armorToughnessMode);
        armorToughness = clampFinite(armorToughness, 0.0D, 100.0D, 0.0D);
        armorToughnessMin = clampFinite(armorToughnessMin, 0.0D, 100.0D, armorToughness);
        armorToughnessMax = clampFinite(armorToughnessMax, 0.0D, 100.0D, armorToughness);
        if (armorToughnessMin > armorToughnessMax) {
            double tmp = armorToughnessMin;
            armorToughnessMin = armorToughnessMax;
            armorToughnessMax = tmp;
        }

        knockbackResistanceMode = sanitizeMode(knockbackResistanceMode);
        knockbackResistance = clampFinite(knockbackResistance, 0.0D, 1.0D, 0.0D);
        knockbackResistanceMin = clampFinite(knockbackResistanceMin, 0.0D, 1.0D, knockbackResistance);
        knockbackResistanceMax = clampFinite(knockbackResistanceMax, 0.0D, 1.0D, knockbackResistance);
        if (knockbackResistanceMin > knockbackResistanceMax) {
            double tmp = knockbackResistanceMin;
            knockbackResistanceMin = knockbackResistanceMax;
            knockbackResistanceMax = tmp;
        }

        stepHeightMode = sanitizeMode(stepHeightMode);
        stepHeight = clampFinite(stepHeight, 0.0D, 3.0D, 0.0D);
        stepHeightMin = clampFinite(stepHeightMin, 0.0D, 3.0D, stepHeight);
        stepHeightMax = clampFinite(stepHeightMax, 0.0D, 3.0D, stepHeight);
        if (stepHeightMin > stepHeightMax) {
            double tmp = stepHeightMin;
            stepHeightMin = stepHeightMax;
            stepHeightMax = tmp;
        }

        wallAttackCooldownTicks = Math.max(5, wallAttackCooldownTicks);
        wallAttackDamagePerHit = clampFinite(wallAttackDamagePerHit, 0.1D, 64.0D, 1.0D);
        maxPillarHeight = Math.max(1, Math.min(128, maxPillarHeight));
        pillarCooldownTicks = Math.max(5, pillarCooldownTicks);
        maxBridgeLength = Math.max(1, Math.min(128, maxBridgeLength));
        bridgeCooldownTicks = Math.max(5, bridgeCooldownTicks);
        frustrationTicks = Math.max(20, frustrationTicks);
        if (monsterAiBuildBlock == null || monsterAiBuildBlock.isBlank()) monsterAiBuildBlock = "minecraft:cobblestone";
        monsterAiBuildBlock = monsterAiBuildBlock.trim();
        sprintDistance = Math.max(0, sprintDistance);
        torchRadius = Math.max(1, Math.min(32, torchRadius));
        torchMinDay = Math.max(1, Math.min(30, torchMinDay));
        naturalSpawnMinLight = Math.max(0, Math.min(15, naturalSpawnMinLight));
        naturalSpawnMaxLight = Math.max(0, Math.min(15, naturalSpawnMaxLight));
        if (naturalSpawnMinLight > naturalSpawnMaxLight) {
            int tmp = naturalSpawnMinLight;
            naturalSpawnMinLight = naturalSpawnMaxLight;
            naturalSpawnMaxLight = tmp;
        }
        if (naturalSpawnYMin > naturalSpawnYMax) {
            int tmp = naturalSpawnYMin;
            naturalSpawnYMin = naturalSpawnYMax;
            naturalSpawnYMax = tmp;
        }
        if (naturalSpawnBlockMode == null || naturalSpawnBlockMode.isBlank()) naturalSpawnBlockMode = "DISABLED";
        naturalSpawnBlockMode = naturalSpawnBlockMode.trim().toUpperCase(java.util.Locale.ROOT);
        if (!naturalSpawnBlockMode.equals("BLACKLIST") && !naturalSpawnBlockMode.equals("WHITELIST")) naturalSpawnBlockMode = "DISABLED";
        if (naturalSpawnBlocks == null) naturalSpawnBlocks = new ArrayList<>();
        naturalSpawnBlocks.removeIf(value -> value == null || value.isBlank());
        naturalSpawnBlocks.replaceAll(String::trim);

        explodingArrowChance = clampFinite(explodingArrowChance, 0.0D, 1.0D, 0.0D);
        explodingArrowPower = clampFinite(explodingArrowPower, 0.1D, 12.0D, 2.0D);
        creeperWallExplosionChance = clampFinite(creeperWallExplosionChance, 0.0D, 1.0D, 0.0D);
        creeperWallExplosionPower = clampFinite(creeperWallExplosionPower, 0.1D, 12.0D, 2.8D);
        creeperWallExplosionCooldownTicks = Math.max(20, creeperWallExplosionCooldownTicks);
        endermanTeleportChance = clampFinite(endermanTeleportChance, 0.0D, 1.0D, 0.0D);
        endermanTeleportRadius = Math.max(4, Math.min(64, endermanTeleportRadius));
        endermanTeleportCooldownTicks = Math.max(20, endermanTeleportCooldownTicks);
        spiderWebChance = clampFinite(spiderWebChance, 0.0D, 1.0D, 0.0D);
        spiderWebCooldownTicks = Math.max(20, spiderWebCooldownTicks);
        if (customName == null) customName = "";
        customName = customName.trim();
    }

    private static String sanitizeMode(String mode) {
        return "RANGED".equals(mode) ? "RANGED" : "FIXED";
    }

    private static double clampFinite(double value, double min, double max, double fallback) {
        if (Double.isNaN(value) || Double.isInfinite(value)) return fallback;
        return Math.max(min, Math.min(max, value));
    }
}
