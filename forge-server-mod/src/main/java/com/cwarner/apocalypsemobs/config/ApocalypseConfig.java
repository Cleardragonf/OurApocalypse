package com.cwarner.apocalypsemobs.config;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

public class ApocalypseConfig {
    public boolean enabled = true;
    public DifficultyMode difficultyMode = DifficultyMode.REAL_MONTH_DAY;
    public int manualDifficultyDay = 1;

    public AdminApiSettings adminApi = new AdminApiSettings();
    public WaveSettings waves = new WaveSettings();
    public EntitySpawnSettings entitySpawning = new EntitySpawnSettings();
    public BehaviorSettings behavior = new BehaviorSettings();
    public DropSettings drops = new DropSettings();
    public ScheduledEventSettings scheduledEvents = new ScheduledEventSettings();
    public ClearLagSettings clearLag = new ClearLagSettings();
    public EconomySettings economy = new EconomySettings();
    public IntegrationSettings integrations = new IntegrationSettings();
    public CleanupSettings cleanup = new CleanupSettings();

    /** Legacy entity pool retained for backward compatibility and LEGACY_RULES mode. */
    public List<EntityWeight> entityWeights = defaultEntityWeights();
    public Set<String> entityBlacklist = defaultEntityBlacklist();
    public Set<String> allowedDimensions = defaultAllowedDimensions();

    public void sanitize() {
        manualDifficultyDay = clamp(manualDifficultyDay, 1, 30);
        if (difficultyMode == null) difficultyMode = DifficultyMode.REAL_MONTH_DAY;
        if (adminApi == null) adminApi = new AdminApiSettings();
        if (waves == null) waves = new WaveSettings();
        if (entitySpawning == null) entitySpawning = new EntitySpawnSettings();
        if (behavior == null) behavior = new BehaviorSettings();
        if (drops == null) drops = new DropSettings();
        if (scheduledEvents == null) scheduledEvents = new ScheduledEventSettings();
        if (clearLag == null) clearLag = new ClearLagSettings();
        if (economy == null) economy = new EconomySettings();
        if (integrations == null) integrations = new IntegrationSettings();
        if (cleanup == null) cleanup = new CleanupSettings();
        if (entityWeights == null) entityWeights = defaultEntityWeights();
        if (entityBlacklist == null) entityBlacklist = defaultEntityBlacklist();
        if (allowedDimensions == null) allowedDimensions = defaultAllowedDimensions();

        adminApi.sanitize();
        waves.sanitize();
        entitySpawning.sanitize(this);
        behavior.sanitize();
        drops.sanitize();
        scheduledEvents.sanitize();
        clearLag.sanitize();
        economy.sanitize();
        integrations.sanitize();
        cleanup.sanitize();
        for (EntityWeight weight : entityWeights) if (weight != null) weight.sanitize();
    }

    private static int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    public static Set<String> defaultAllowedDimensions() {
        Set<String> result = new LinkedHashSet<>();
        result.add("minecraft:overworld");
        return result;
    }

    public static Set<String> defaultEntityBlacklist() {
        Set<String> result = new LinkedHashSet<>();
        result.add("minecraft:ender_dragon");
        result.add("minecraft:wither");
        result.add("minecraft:warden");
        result.add("minecraft:elder_guardian");
        return result;
    }

    private static EntityWeight enhancedEntityWeight(String entity, int weight, int minDay, double spawnChance, boolean enabled, double maxHealthValue, double attackDamageValue, double movementSpeedValue, double followRangeValue, double armor, boolean persistent) {
        EntityWeight result = new EntityWeight(entity, weight, minDay, spawnChance, enabled);
        result.properties = MobProperties.stronger(maxHealthValue, attackDamageValue, movementSpeedValue);
        result.properties.followRange = followRangeValue;
        result.properties.followRangeMin = followRangeValue;
        result.properties.followRangeMax = followRangeValue;
        result.properties.armor = armor;
        result.properties.armorMin = armor;
        result.properties.armorMax = armor;
        result.properties.persistent = persistent;
        return result;
    }

    private static EntityWeight arrowEntityWeight(String entity, int weight, int minDay, double chance, double power) {
        EntityWeight result = new EntityWeight(entity, weight, minDay, true);
        result.properties = MobProperties.normal();
        result.properties.explodingArrows = true;
        result.properties.explodingArrowChance = chance;
        result.properties.explodingArrowPower = power;
        return result;
    }

    private static EntityWeight creeperWallEntityWeight(int weight, int minDay, double chance, double power) {
        EntityWeight result = new EntityWeight("minecraft:creeper", weight, minDay, true);
        result.properties = MobProperties.normal();
        result.properties.creeperWallExplosions = true;
        result.properties.creeperWallExplosionChance = chance;
        result.properties.creeperWallExplosionPower = power;
        return result;
    }

    private static EntityWeight spiderWebEntityWeight(String entity, int weight, int minDay, double chance) {
        EntityWeight result = new EntityWeight(entity, weight, minDay, true);
        result.properties = MobProperties.normal();
        result.properties.spiderWebPlayers = true;
        result.properties.spiderWebChance = chance;
        return result;
    }

    private static EntityWeight endermanTeleportEntityWeight(int weight, int minDay, double chance, int radius) {
        EntityWeight result = new EntityWeight("minecraft:enderman", weight, minDay, true);
        result.properties = MobProperties.normal();
        result.properties.endermanTeleportPlayers = true;
        result.properties.endermanTeleportChance = chance;
        result.properties.endermanTeleportRadius = radius;
        return result;
    }

    public static List<EntityWeight> defaultEntityWeights() {
        List<EntityWeight> result = new ArrayList<>();
        result.add(new EntityWeight("minecraft:zombie", 22, 1, true));
        result.add(new EntityWeight("minecraft:skeleton", 18, 1, true));
        result.add(new EntityWeight("minecraft:spider", 14, 1, true));
        result.add(new EntityWeight("minecraft:creeper", 10, 2, true));
        result.add(new EntityWeight("minecraft:husk", 10, 3, true));
        result.add(new EntityWeight("minecraft:drowned", 8, 3, true));
        result.add(new EntityWeight("minecraft:stray", 8, 5, true));
        result.add(new EntityWeight("minecraft:cave_spider", 8, 5, true));
        result.add(new EntityWeight("minecraft:slime", 6, 7, true));
        result.add(new EntityWeight("minecraft:enderman", 7, 8, true));
        result.add(new EntityWeight("minecraft:witch", 7, 10, true));
        result.add(new EntityWeight("minecraft:pillager", 8, 12, true));
        result.add(new EntityWeight("minecraft:vindicator", 5, 14, true));
        result.add(new EntityWeight("minecraft:phantom", 10, 14, true));
        result.add(new EntityWeight("minecraft:magma_cube", 5, 16, true));
        result.add(new EntityWeight("minecraft:blaze", 8, 18, true));
        result.add(new EntityWeight("minecraft:wither_skeleton", 6, 20, true));
        result.add(new EntityWeight("minecraft:zoglin", 5, 22, true));
        result.add(new EntityWeight("minecraft:ghast", 30, 24, true));
        return result;
    }

    public static class AdminApiSettings {
        public boolean enabled = true;
        public String host = "127.0.0.1";
        public int port = 8766;
        public String adminToken = "change-me-now";
        public boolean requireToken = true;

        public void sanitize() {
            if (host == null || host.isBlank()) host = "127.0.0.1";
            port = Math.max(1, Math.min(65535, port));
            if (adminToken == null) adminToken = "";
        }
    }

    public static class WaveSettings {
        public boolean enabled = true;
        public boolean onlyAtNight = true;
        public int tickCheckInterval = 100;
        public String activeMode = "NIGHT_PROFILES";
        public List<WaveProfile> nightProfiles = defaultNightProfiles();

        /** Legacy fields retained for backward compatibility and LEGACY_RULES mode. */
        public int minWavesDay1 = 1;
        public int maxWavesDay1 = 1;
        public int minWavesDay30 = 4;
        public int maxWavesDay30 = 6;
        public int minMobsDay1 = 5;
        public int maxMobsDay1 = 12;
        public int minMobsDay30 = 35;
        public int maxMobsDay30 = 75;
        public int spawnRadiusMin = 24;
        public int spawnRadiusMax = 56;
        public int maxSpawnAttemptsPerMob = 12;
        public boolean spawnAroundEachPlayer = true;
        public boolean avoidCreativeAndSpectator = true;
        public boolean announceWaves = true;

        public void sanitize() {
            tickCheckInterval = Math.max(20, tickCheckInterval);
            if (activeMode == null || activeMode.isBlank()) activeMode = "NIGHT_PROFILES";
            if (!"LEGACY_RULES".equals(activeMode)) activeMode = "NIGHT_PROFILES";
            if (nightProfiles == null) nightProfiles = defaultNightProfiles();
            for (WaveProfile profile : nightProfiles) if (profile != null) profile.sanitize();

            minWavesDay1 = Math.max(0, minWavesDay1);
            maxWavesDay1 = Math.max(minWavesDay1, maxWavesDay1);
            minWavesDay30 = Math.max(0, minWavesDay30);
            maxWavesDay30 = Math.max(minWavesDay30, maxWavesDay30);
            minMobsDay1 = Math.max(0, minMobsDay1);
            maxMobsDay1 = Math.max(minMobsDay1, maxMobsDay1);
            minMobsDay30 = Math.max(0, minMobsDay30);
            maxMobsDay30 = Math.max(minMobsDay30, maxMobsDay30);
            spawnRadiusMin = Math.max(8, spawnRadiusMin);
            spawnRadiusMax = Math.max(spawnRadiusMin, spawnRadiusMax);
            maxSpawnAttemptsPerMob = Math.max(1, maxSpawnAttemptsPerMob);
        }

        public boolean useNightProfiles() {
            return "NIGHT_PROFILES".equals(activeMode) && nightProfiles != null && !nightProfiles.isEmpty();
        }

        public static List<WaveProfile> defaultNightProfiles() {
            List<WaveProfile> result = new ArrayList<>();
            result.add(new WaveProfile("early-pressure", "Nights 1-9: Early Pressure", true, 1, 9, 80,
                    1, 2, 6, 16, 24, 52, 10, true, true, true));
            result.add(new WaveProfile("midnight-surge", "Nights 10-19: Midnight Surge", true, 10, 19, 60,
                    2, 4, 18, 42, 28, 60, 12, true, true, true));
            result.add(new WaveProfile("blood-moon-wave", "Nights 10-30: Rare Blood Moon Wave", true, 10, 30, 12,
                    4, 7, 45, 95, 30, 70, 16, true, true, true));
            result.add(new WaveProfile("endgame-onslaught", "Nights 20-30: Endgame Onslaught", true, 20, 30, 45,
                    3, 6, 35, 85, 30, 72, 14, true, true, true));
            return result;
        }
    }

    public static class EntitySpawnSettings {
        public String activeMode = "NIGHT_PROFILES";
        /**
         * SKIP_SPAWN: if the chosen entity fails its spawnChance roll, that spawn attempt produces no mob.
         * REROLL_ENTITY: if the chosen entity fails, try another weighted entity before giving up.
         */
        public String failedChanceBehavior = "SKIP_SPAWN";
        public List<EntityWeight> legacyWeights = defaultEntityWeights();
        public List<EntitySpawnProfile> nightProfiles = defaultNightProfiles();

        public void sanitize(ApocalypseConfig owner) {
            if (activeMode == null || activeMode.isBlank()) activeMode = "NIGHT_PROFILES";
            if (!"LEGACY_RULES".equals(activeMode)) activeMode = "NIGHT_PROFILES";
            if (!"REROLL_ENTITY".equals(failedChanceBehavior)) failedChanceBehavior = "SKIP_SPAWN";
            if (legacyWeights == null || legacyWeights.isEmpty()) {
                legacyWeights = owner.entityWeights != null && !owner.entityWeights.isEmpty() ? owner.entityWeights : defaultEntityWeights();
            }
            for (EntityWeight weight : legacyWeights) if (weight != null) weight.sanitize();
            if (nightProfiles == null) nightProfiles = defaultNightProfiles();
            for (EntitySpawnProfile profile : nightProfiles) if (profile != null) profile.sanitize();
            owner.entityWeights = legacyWeights;
        }

        public boolean useNightProfiles() {
            return "NIGHT_PROFILES".equals(activeMode) && nightProfiles != null && !nightProfiles.isEmpty();
        }

        public static List<EntitySpawnProfile> defaultNightProfiles() {
            List<EntitySpawnProfile> result = new ArrayList<>();
            result.add(new EntitySpawnProfile("overworld-pack", "Nights 1-12: Overworld Pack", true, 1, 12, 75, List.of(
                    new EntityWeight("minecraft:zombie", 25, 1, true),
                    arrowEntityWeight("minecraft:skeleton", 20, 1, 0.12D, 1.8D),
                    spiderWebEntityWeight("minecraft:spider", 15, 1, 0.10D),
                    creeperWallEntityWeight(10, 2, 0.12D, 2.5D),
                    new EntityWeight("minecraft:husk", 8, 3, true),
                    new EntityWeight("minecraft:stray", 6, 5, true)
            )));
            result.add(new EntitySpawnProfile("raider-night", "Nights 10-22: Raider Night", true, 10, 22, 25, List.of(
                    arrowEntityWeight("minecraft:pillager", 35, 10, 0.08D, 1.6D),
                    new EntityWeight("minecraft:vindicator", 18, 14, true),
                    new EntityWeight("minecraft:witch", 14, 10, true),
                    enhancedEntityWeight("minecraft:zombie", 18, 1, 1.0D, true, 28.0D, 4.0D, 0.27D, 40.0D, 2.0D, false),
                    arrowEntityWeight("minecraft:skeleton", 15, 1, 0.18D, 2.0D)
            )));
            result.add(new EntitySpawnProfile("nether-breach", "Nights 16-30: Nether Breach", true, 16, 30, 35, List.of(
                    new EntityWeight("minecraft:blaze", 20, 16, true),
                    new EntityWeight("minecraft:magma_cube", 15, 16, true),
                    new EntityWeight("minecraft:wither_skeleton", 12, 20, true),
                    new EntityWeight("minecraft:zoglin", 10, 22, true),
                    new EntityWeight("minecraft:ghast", 30, 24, true)
            )));
            result.add(new EntitySpawnProfile("endgame-chaos", "Nights 24-30: Endgame Chaos", true, 24, 30, 18, List.of(
                    new EntityWeight("minecraft:ghast", 30, 24, true),
                    endermanTeleportEntityWeight(20, 8, 0.16D, 14),
                    new EntityWeight("minecraft:blaze", 18, 18, true),
                    enhancedEntityWeight("minecraft:wither_skeleton", 16, 20, 1.0D, true, 36.0D, 7.0D, 0.32D, 48.0D, 4.0D, true),
                    new EntityWeight("minecraft:witch", 12, 10, true)
            )));
            return result;
        }
    }

    public static class BehaviorSettings {
        public boolean enabled = true;
        public int mobTickInterval = 20;
        public double targetRangeDay1 = 24.0D;
        public double targetRangeDay30 = 80.0D;
        public double navigationSpeedDay1 = 1.0D;
        public double navigationSpeedDay30 = 1.45D;
        public boolean breakBlocks = true;
        public int breakBlocksMinDay = 8;
        public float maxBreakHardnessDay1 = 0.6F;
        public float maxBreakHardnessDay30 = 6.0F;
        public boolean dropBrokenBlocks = false;
        public boolean placeBlocks = true;
        public int placeBlocksMinDay = 12;
        public boolean bridgeGaps = true;
        public int bridgeMinDay = 16;
        public String placementBlock = "minecraft:cobblestone";
        public List<PlacementBlockRule> placementBlocks = defaultPlacementBlocks();
        public int protectSpawnRadius = 24;
        public Set<String> protectedBlocks = defaultProtectedBlocks();

        public void sanitize() {
            mobTickInterval = Math.max(5, mobTickInterval);
            breakBlocksMinDay = Math.max(1, Math.min(30, breakBlocksMinDay));
            placeBlocksMinDay = Math.max(1, Math.min(30, placeBlocksMinDay));
            bridgeMinDay = Math.max(1, Math.min(30, bridgeMinDay));
            targetRangeDay1 = Math.max(4.0D, targetRangeDay1);
            targetRangeDay30 = Math.max(targetRangeDay1, targetRangeDay30);
            navigationSpeedDay1 = Math.max(0.1D, navigationSpeedDay1);
            navigationSpeedDay30 = Math.max(navigationSpeedDay1, navigationSpeedDay30);
            maxBreakHardnessDay1 = Math.max(0.0F, maxBreakHardnessDay1);
            maxBreakHardnessDay30 = Math.max(maxBreakHardnessDay1, maxBreakHardnessDay30);
            if (placementBlock == null || placementBlock.isBlank()) placementBlock = "minecraft:cobblestone";
            if (placementBlocks == null || placementBlocks.isEmpty()) placementBlocks = defaultPlacementBlocks();
            for (PlacementBlockRule rule : placementBlocks) if (rule != null) rule.sanitize();
            if (protectedBlocks == null) protectedBlocks = defaultProtectedBlocks();
        }

        public static List<PlacementBlockRule> defaultPlacementBlocks() {
            List<PlacementBlockRule> result = new ArrayList<>();
            result.add(new PlacementBlockRule("minecraft:cobblestone", 80, 1, true));
            result.add(new PlacementBlockRule("minecraft:dirt", 35, 1, true));
            result.add(new PlacementBlockRule("minecraft:netherrack", 25, 16, true));
            result.add(new PlacementBlockRule("minecraft:blackstone", 10, 22, true));
            return result;
        }

        public static Set<String> defaultProtectedBlocks() {
            Set<String> result = new LinkedHashSet<>();
            result.add("minecraft:bedrock");
            result.add("minecraft:obsidian");
            result.add("minecraft:crying_obsidian");
            result.add("minecraft:end_portal_frame");
            result.add("minecraft:end_portal");
            result.add("minecraft:nether_portal");
            result.add("minecraft:command_block");
            result.add("minecraft:chain_command_block");
            result.add("minecraft:repeating_command_block");
            result.add("minecraft:barrier");
            return result;
        }
    }


    public static class EconomySettings {
        public boolean enabled = true;
        public String currencyName = "Dollars";
        public double startingBalance = 0.0D;
        public PayWhileActiveSettings payWhileActive = new PayWhileActiveSettings();
        public EconomyDeathCostSettings deathCosts = new EconomyDeathCostSettings();
        public EconomyKillRewardSettings killRewards = new EconomyKillRewardSettings();
        public EconomyMarketSettings market = new EconomyMarketSettings();

        public void sanitize() {
            if (currencyName == null || currencyName.isBlank()) currencyName = "Dollars";
            startingBalance = Math.max(0.0D, startingBalance);
            if (payWhileActive == null) payWhileActive = new PayWhileActiveSettings();
            if (deathCosts == null) deathCosts = new EconomyDeathCostSettings();
            if (killRewards == null) killRewards = new EconomyKillRewardSettings();
            if (market == null) market = new EconomyMarketSettings();
            payWhileActive.sanitize();
            deathCosts.sanitize();
            killRewards.sanitize();
            market.sanitize();
        }
    }

    public static class PayWhileActiveSettings {
        public boolean enabled = true;
        public double amountPerHour = 100.0D;
        public int payoutIntervalSeconds = 60;
        public boolean afkStopsTimer = true;
        public int afkTimeoutSeconds = 300;

        public void sanitize() {
            amountPerHour = Math.max(0.0D, amountPerHour);
            payoutIntervalSeconds = Math.max(5, payoutIntervalSeconds);
            afkTimeoutSeconds = Math.max(10, afkTimeoutSeconds);
        }
    }

    public static class EconomyDeathCostSettings {
        public boolean enabled = true;
        public String defaultMode = "FIXED";
        public double defaultAmount = 50.0D;
        public double defaultPercent = 5.0D;
        public List<EconomyDeathCostRule> rules = defaultRules();

        public void sanitize() {
            if (!"PERCENT_BALANCE".equals(defaultMode)) defaultMode = "FIXED";
            defaultAmount = Math.max(0.0D, defaultAmount);
            defaultPercent = clamp(defaultPercent, 0.0D, 100.0D);
            if (rules == null) rules = defaultRules();
            for (EconomyDeathCostRule rule : rules) if (rule != null) rule.sanitize();
        }

        public static List<EconomyDeathCostRule> defaultRules() {
            List<EconomyDeathCostRule> result = new ArrayList<>();
            result.add(new EconomyDeathCostRule("death-any", "ANY", "FIXED", 50.0D, 5.0D, "death-cost", true));
            result.add(new EconomyDeathCostRule("death-explosion", "minecraft:explosion", "FIXED", 75.0D, 8.0D, "explosion-death-cost", true));
            result.add(new EconomyDeathCostRule("death-void", "minecraft:void", "PERCENT_BALANCE", 0.0D, 15.0D, "void-death-cost", true));
            return result;
        }
    }

    public static class EconomyDeathCostRule {
        public String id = "death-cost";
        public boolean enabled = true;
        public String deathCause = "ANY";
        public String mode = "FIXED";
        public double amount = 50.0D;
        public double percent = 5.0D;
        public String reason = "death-cost";

        public EconomyDeathCostRule() {}

        public EconomyDeathCostRule(String id, String deathCause, String mode, double amount, double percent, String reason, boolean enabled) {
            this.id = id;
            this.deathCause = deathCause;
            this.mode = mode;
            this.amount = amount;
            this.percent = percent;
            this.reason = reason;
            this.enabled = enabled;
        }

        public void sanitize() {
            if (id == null || id.isBlank()) id = "death-cost";
            if (deathCause == null || deathCause.isBlank()) deathCause = "ANY";
            if (!"PERCENT_BALANCE".equals(mode)) mode = "FIXED";
            amount = Math.max(0.0D, amount);
            percent = clamp(percent, 0.0D, 100.0D);
            if (reason == null) reason = "";
        }
    }

    public static class EconomyKillRewardSettings {
        public boolean enabled = true;
        public double defaultMinAmount = 1.0D;
        public double defaultMaxAmount = 3.0D;
        public double defaultChance = 1.0D;
        public List<EconomyEntityRewardRule> rules = defaultRules();

        public void sanitize() {
            defaultMinAmount = Math.max(0.0D, defaultMinAmount);
            defaultMaxAmount = Math.max(defaultMinAmount, defaultMaxAmount);
            defaultChance = clamp(defaultChance, 0.0D, 1.0D);
            if (rules == null) rules = defaultRules();
            for (EconomyEntityRewardRule rule : rules) if (rule != null) rule.sanitize();
        }

        public static List<EconomyEntityRewardRule> defaultRules() {
            List<EconomyEntityRewardRule> result = new ArrayList<>();
            result.add(new EconomyEntityRewardRule("reward-zombie", "minecraft:zombie", 1, 1.0D, 5.0D, 8.0D, "KILLER", "zombie-kill", true));
            result.add(new EconomyEntityRewardRule("reward-skeleton", "minecraft:skeleton", 1, 1.0D, 6.0D, 10.0D, "KILLER", "skeleton-kill", true));
            result.add(new EconomyEntityRewardRule("reward-creeper", "minecraft:creeper", 2, 1.0D, 12.0D, 18.0D, "KILLER", "creeper-kill", true));
            result.add(new EconomyEntityRewardRule("reward-ghast", "minecraft:ghast", 20, 1.0D, 35.0D, 60.0D, "KILLER", "ghast-kill", true));
            EconomyEntityRewardRule playerLoot = new EconomyEntityRewardRule("reward-player-wallet-loot", "minecraft:player", 1, 1.0D, 0.0D, 0.0D, "KILLER", "player-wallet-loot", true);
            playerLoot.lootVictimWalletEnabled = true;
            playerLoot.lootVictimWalletMode = "PERCENT_BALANCE";
            playerLoot.lootVictimWalletPercent = 10.0D;
            playerLoot.lootVictimWalletMaxPercentAmount = 500.0D;
            result.add(playerLoot);
            return result;
        }
    }

    public static class EconomyEntityRewardRule {
        public String id = "kill-reward";
        public boolean enabled = true;
        public String entity = "minecraft:zombie";
        public int minDay = 1;
        public double chance = 1.0D;
        public double minAmount = 1.0D;
        public double maxAmount = 3.0D;
        public String targetMode = "KILLER";
        public String participantRewardMode = "FULL_TO_EACH_PARTICIPANT";
        public boolean lootVictimWalletEnabled = false;
        public String lootVictimWalletMode = "PERCENT_BALANCE";
        public double lootVictimWalletMinAmount = 0.0D;
        public double lootVictimWalletMaxAmount = 0.0D;
        public double lootVictimWalletPercent = 10.0D;
        public double lootVictimWalletMaxPercentAmount = 500.0D;
        public String reason = "economy-kill-reward";

        public EconomyEntityRewardRule() {}

        public EconomyEntityRewardRule(String id, String entity, int minDay, double chance, double minAmount, double maxAmount, String targetMode, String reason, boolean enabled) {
            this(id, entity, minDay, chance, minAmount, maxAmount, targetMode, "FULL_TO_EACH_PARTICIPANT", reason, enabled);
        }

        public EconomyEntityRewardRule(String id, String entity, int minDay, double chance, double minAmount, double maxAmount, String targetMode, String participantRewardMode, String reason, boolean enabled) {
            this.id = id;
            this.entity = entity;
            this.minDay = minDay;
            this.chance = chance;
            this.minAmount = minAmount;
            this.maxAmount = maxAmount;
            this.targetMode = targetMode;
            this.participantRewardMode = participantRewardMode;
            this.reason = reason;
            this.enabled = enabled;
        }

        public void sanitize() {
            if (id == null || id.isBlank()) id = "kill-reward";
            if (entity == null || entity.isBlank()) entity = "minecraft:zombie";
            minDay = clamp(minDay, 1, 30);
            chance = clamp(chance, 0.0D, 1.0D);
            minAmount = Math.max(0.0D, minAmount);
            maxAmount = Math.max(minAmount, maxAmount);
            if (!"NEAREST_PLAYER".equals(targetMode) && !"ALL_PLAYERS".equals(targetMode) && !"ALL_PARTICIPANTS".equals(targetMode) && !"TOP_DAMAGER".equals(targetMode)) targetMode = "KILLER";
            if (!"SPLIT_BETWEEN_PARTICIPANTS".equals(participantRewardMode) && !"PROPORTIONAL_BY_DAMAGE".equals(participantRewardMode)) participantRewardMode = "FULL_TO_EACH_PARTICIPANT";
            if (!"FIXED".equals(lootVictimWalletMode)) lootVictimWalletMode = "PERCENT_BALANCE";
            if (Double.isNaN(lootVictimWalletMinAmount) || Double.isInfinite(lootVictimWalletMinAmount)) lootVictimWalletMinAmount = 0.0D;
            if (Double.isNaN(lootVictimWalletMaxAmount) || Double.isInfinite(lootVictimWalletMaxAmount)) lootVictimWalletMaxAmount = lootVictimWalletMinAmount;
            lootVictimWalletMinAmount = Math.max(0.0D, lootVictimWalletMinAmount);
            lootVictimWalletMaxAmount = Math.max(lootVictimWalletMinAmount, lootVictimWalletMaxAmount);
            if (Double.isNaN(lootVictimWalletPercent) || Double.isInfinite(lootVictimWalletPercent)) lootVictimWalletPercent = 10.0D;
            lootVictimWalletPercent = clamp(lootVictimWalletPercent, 0.0D, 100.0D);
            if (Double.isNaN(lootVictimWalletMaxPercentAmount) || Double.isInfinite(lootVictimWalletMaxPercentAmount)) lootVictimWalletMaxPercentAmount = 0.0D;
            lootVictimWalletMaxPercentAmount = Math.max(0.0D, lootVictimWalletMaxPercentAmount);
            if (reason == null) reason = "";
        }
    }

    public static class EconomyMarketSettings {
        public boolean enabled = true;
        public boolean loggedInPlayersOnly = true;
        public boolean allowOutOfStockPurchases = false;
        public List<EconomyMarketListing> listings = defaultListings();

        public void sanitize() {
            if (listings == null) listings = defaultListings();
            for (EconomyMarketListing listing : listings) if (listing != null) listing.sanitize();
        }

        public static List<EconomyMarketListing> defaultListings() {
            List<EconomyMarketListing> result = new ArrayList<>();
            result.add(new EconomyMarketListing("market-bread", "minecraft:bread", "Bread", 25.0D, 1, 16, -1, 0, "", true));
            result.add(new EconomyMarketListing("market-arrows", "minecraft:arrow", "Arrows", 2.0D, 1, 64, -1, 0, "", true));
            result.add(new EconomyMarketListing("market-iron-sword", "minecraft:iron_sword", "Iron Sword", 250.0D, 5, 1, -1, 0, "", true));
            return result;
        }
    }

    public static class EconomyMarketListing {
        public String id = "market-listing";
        public boolean enabled = true;
        public String item = "minecraft:bread";
        public String displayName = "Bread";
        public double price = 25.0D;
        public int minDay = 1;
        public int maxPerPurchase = 16;
        public int stock = -1;
        public int playerPurchaseLimit = 0;
        public String commandOnPurchase = "";

        public EconomyMarketListing() {}

        public EconomyMarketListing(String id, String item, String displayName, double price, int minDay, int maxPerPurchase, int stock, int playerPurchaseLimit, String commandOnPurchase, boolean enabled) {
            this.id = id;
            this.item = item;
            this.displayName = displayName;
            this.price = price;
            this.minDay = minDay;
            this.maxPerPurchase = maxPerPurchase;
            this.stock = stock;
            this.playerPurchaseLimit = playerPurchaseLimit;
            this.commandOnPurchase = commandOnPurchase;
            this.enabled = enabled;
        }

        public void sanitize() {
            if (id == null || id.isBlank()) id = "market-listing";
            if (item == null || item.isBlank()) item = "minecraft:bread";
            if (displayName == null || displayName.isBlank()) displayName = item;
            price = Math.max(0.0D, price);
            minDay = clamp(minDay, 1, 30);
            maxPerPurchase = Math.max(1, maxPerPurchase);
            stock = Math.max(-1, stock);
            playerPurchaseLimit = Math.max(0, playerPurchaseLimit);
            if (commandOnPurchase == null) commandOnPurchase = "";
        }
    }


    public static class ClearLagSettings {
        public boolean enabled = false;
        public int intervalSeconds = 300;
        public int warningSeconds = 30;
        public int maxEntitiesPerRun = 500;
        public boolean announceWarning = true;
        public boolean announceCompletion = true;
        public boolean removeDroppedItems = true;
        public boolean removeExperienceOrbs = true;
        public boolean removeProjectiles = false;
        public boolean removeEmptyVehicles = false;
        public List<String> itemWhitelist = defaultItemWhitelist();
        public String warningMessage = "Clear Lag will remove loose entities in {seconds} seconds.";
        public String completionMessage = "Clear Lag removed {count} loose entities.";

        public void sanitize() {
            intervalSeconds = Math.max(10, intervalSeconds);
            warningSeconds = Math.max(0, Math.min(warningSeconds, intervalSeconds));
            maxEntitiesPerRun = Math.max(1, maxEntitiesPerRun);
            if (itemWhitelist == null) itemWhitelist = defaultItemWhitelist();
            itemWhitelist.removeIf(item -> item == null || item.isBlank());
            if (warningMessage == null) warningMessage = "";
            if (completionMessage == null) completionMessage = "";
        }

        public static List<String> defaultItemWhitelist() {
            List<String> result = new ArrayList<>();
            result.add("minecraft:nether_star");
            result.add("minecraft:dragon_egg");
            return result;
        }
    }

    public static class ScheduledEventSettings {
        public boolean enabled = true;
        public List<ScheduledEventDefinition> events = defaultEvents();

        public void sanitize() {
            if (events == null) events = defaultEvents();
            for (ScheduledEventDefinition event : events) if (event != null) event.sanitize();
        }

        public static List<ScheduledEventDefinition> defaultEvents() {
            List<ScheduledEventDefinition> result = new ArrayList<>();
            ScheduledEventDefinition firstNight = new ScheduledEventDefinition();
            firstNight.id = "first-night-welcome";
            firstNight.name = "First Night Warning";
            firstNight.minDay = 1;
            firstNight.maxDay = 1;
            firstNight.chance = 1.0D;
            firstNight.cooldownTicks = 0;
            firstNight.runOncePerNight = true;
            firstNight.eventKind = "COMMAND_SEQUENCE";
            firstNight.steps.add(ScheduledEventStep.command("/say The first apocalypse night has begun."));
            firstNight.steps.add(ScheduledEventStep.waitTicks(40));
            firstNight.steps.add(ScheduledEventStep.command("/title @a title {\"text\":\"Survive the night\",\"color\":\"red\"}"));
            firstNight.steps.add(ScheduledEventStep.stop());
            result.add(firstNight);
            return result;
        }
    }

    private static String sanitizeTargetMode(String targetMode, String fallback) {
        if (targetMode == null || targetMode.isBlank()) return fallback;
        if ("NEAREST_PLAYER".equals(targetMode) || "RANDOM_PLAYER".equals(targetMode) || "ALL_PLAYERS".equals(targetMode) || "SPECIFIC_PLAYER".equals(targetMode) || "EVENT_PLAYER".equals(targetMode)) {
            return targetMode;
        }
        return fallback;
    }

    public static class ItemDropPartySettings {
        public String targetMode = "RANDOM_PLAYER";
        public String targetPlayerName = "";
        public String centerMode = "TARGET_PLAYER";
        public int x = 0;
        public int y = 90;
        public int z = 0;
        public int radius = 24;
        public int durationTicks = 800;
        public int intervalTicks = 20;
        public int maxItemsPerInterval = 10;
        public boolean announce = true;
        public List<ItemDropPartyItemRule> items = defaultDropPartyItems();

        public void sanitize() {
            targetMode = sanitizeTargetMode(targetMode, "RANDOM_PLAYER");
            if (targetPlayerName == null) targetPlayerName = "";
            if (centerMode == null || centerMode.isBlank()) centerMode = "TARGET_PLAYER";
            if (!"WORLD_SPAWN".equals(centerMode) && !"SPECIFIC_COORDINATES".equals(centerMode)) centerMode = "TARGET_PLAYER";
            radius = clamp(radius, 1, 256);
            durationTicks = Math.max(20, durationTicks);
            intervalTicks = Math.max(1, intervalTicks);
            maxItemsPerInterval = Math.max(1, maxItemsPerInterval);
            if (items == null) items = defaultDropPartyItems();
            for (ItemDropPartyItemRule item : items) if (item != null) item.sanitize();
        }

        public static List<ItemDropPartyItemRule> defaultDropPartyItems() {
            List<ItemDropPartyItemRule> result = new ArrayList<>();
            result.add(new ItemDropPartyItemRule("drop-party-bread", "minecraft:bread", 60, 1, 2, 1.0D, true));
            result.add(new ItemDropPartyItemRule("drop-party-iron", "minecraft:iron_ingot", 20, 1, 3, 0.8D, true));
            return result;
        }
    }

    public static class ItemDropPartyItemRule {
        public String id = "drop-party-item";
        public boolean enabled = true;
        public String item = "minecraft:bread";
        public int weight = 50;
        public int minCount = 1;
        public int maxCount = 2;
        public double chance = 1.0D;

        public ItemDropPartyItemRule() {}

        public ItemDropPartyItemRule(String id, String item, int weight, int minCount, int maxCount, double chance, boolean enabled) {
            this.id = id;
            this.item = item;
            this.weight = weight;
            this.minCount = minCount;
            this.maxCount = maxCount;
            this.chance = chance;
            this.enabled = enabled;
        }

        public void sanitize() {
            if (id == null || id.isBlank()) id = "drop-party-item";
            if (item == null || item.isBlank()) item = "minecraft:bread";
            weight = Math.max(0, weight);
            minCount = Math.max(0, minCount);
            maxCount = Math.max(minCount, maxCount);
            chance = clamp(chance, 0.0D, 1.0D);
        }
    }

    public static class ExperienceFarmSettings {
        public String targetMode = "ALL_PLAYERS";
        public String targetPlayerName = "";
        public String provider = "OURMAGIC_API";
        public int amountPerInterval = 5;
        public int durationTicks = 1200;
        public int intervalTicks = 100;
        public double multiplier = 1.5D;
        public String reason = "experience-farm-event";
        public boolean announce = true;

        public void sanitize() {
            targetMode = sanitizeTargetMode(targetMode, "ALL_PLAYERS");
            if (targetPlayerName == null) targetPlayerName = "";
            if (provider == null || provider.isBlank()) provider = "OURMAGIC_API";
            if (!"VANILLA_XP".equals(provider)) provider = "OURMAGIC_API";
            amountPerInterval = Math.max(0, amountPerInterval);
            durationTicks = Math.max(20, durationTicks);
            intervalTicks = Math.max(1, intervalTicks);
            multiplier = Math.max(0.0D, multiplier);
            if (reason == null) reason = "";
        }
    }

    public static class ScheduledEventDefinition {
        public String id = "event";
        public String name = "Scheduled Event";
        public boolean enabled = true;
        public int minDay = 1;
        public int maxDay = 30;
        public double chance = 1.0D;
        public int cooldownTicks = 0;
        public boolean runOncePerNight = true;
        public String eventKind = "COMMAND_SEQUENCE";
        public ItemDropPartySettings itemDropParty = new ItemDropPartySettings();
        public ExperienceFarmSettings experienceFarm = new ExperienceFarmSettings();
        public List<ScheduledEventStep> steps = new ArrayList<>();

        public void sanitize() {
            if (id == null || id.isBlank()) id = "event";
            if (name == null || name.isBlank()) name = id;
            minDay = clamp(minDay, 1, 30);
            maxDay = clamp(maxDay, minDay, 30);
            chance = clamp(chance, 0.0D, 1.0D);
            cooldownTicks = Math.max(0, cooldownTicks);
            if (eventKind == null || eventKind.isBlank()) eventKind = "COMMAND_SEQUENCE";
            if (!"ITEM_DROP_PARTY".equals(eventKind) && !"EXPERIENCE_FARM".equals(eventKind)) eventKind = "COMMAND_SEQUENCE";
            if (itemDropParty == null) itemDropParty = new ItemDropPartySettings();
            if (experienceFarm == null) experienceFarm = new ExperienceFarmSettings();
            itemDropParty.sanitize();
            experienceFarm.sanitize();
            if (steps == null) steps = new ArrayList<>();
            for (ScheduledEventStep step : steps) if (step != null) step.sanitize();
        }
    }

    public static class ScheduledEventStep {
        public String id = "step";
        public String type = "COMMAND";
        public String commandKey = "";
        public Map<String, Object> commandArgs = new LinkedHashMap<>();
        public String command = "";
        public int waitTicks = 20;
        public String targetMode = "NEAREST_PLAYER";
        public String targetPlayerName = "";
        public String notes = "";

        public static ScheduledEventStep command(String command) {
            ScheduledEventStep step = new ScheduledEventStep();
            step.id = "step-command-" + Math.abs(command.hashCode());
            step.type = "COMMAND";
            step.commandKey = command.replaceFirst("^/", "").split("\\s+", 2)[0];
            step.command = command;
            return step;
        }

        public static ScheduledEventStep waitTicks(int ticks) {
            ScheduledEventStep step = new ScheduledEventStep();
            step.id = "step-wait-" + ticks;
            step.type = "WAIT";
            step.waitTicks = ticks;
            return step;
        }

        public static ScheduledEventStep stop() {
            ScheduledEventStep step = new ScheduledEventStep();
            step.id = "step-stop";
            step.type = "STOP";
            return step;
        }

        public void sanitize() {
            if (id == null || id.isBlank()) id = "step";
            if (type == null || type.isBlank()) type = "COMMAND";
            if (!"WAIT".equals(type) && !"STOP".equals(type) && !"TARGET_PLAYER".equals(type)) type = "COMMAND";
            if (command == null) command = "";
            waitTicks = Math.max(0, waitTicks);
            if (targetMode == null || targetMode.isBlank()) targetMode = "NEAREST_PLAYER";
            if (targetPlayerName == null) targetPlayerName = "";
            if (notes == null) notes = "";
        }
    }

    public static class IntegrationSettings {
        public OurMagicSettings ourMagic = new OurMagicSettings();

        public void sanitize() {
            if (ourMagic == null) ourMagic = new OurMagicSettings();
            ourMagic.sanitize();
        }
    }

    public static class OurMagicSettings {
        public boolean enabled = false;
        public String host = "127.0.0.1";
        public int port = 8767;
        public String token = "change-me-now";

        public void sanitize() {
            if (host == null || host.isBlank()) host = "127.0.0.1";
            port = Math.max(1, Math.min(65535, port));
            if (token == null) token = "";
        }
    }

    public static class CleanupSettings {
        public boolean enabled = true;
        public boolean trackPlacedBlocks = true;
        public boolean rollbackOnlyIfBlockStillMatches = true;
        public boolean rollbackOnServerStart = false;
        public int maxLedgerEntries = 20000;
        public int maxRollbackPerRequest = 2000;

        public void sanitize() {
            maxLedgerEntries = Math.max(100, maxLedgerEntries);
            maxRollbackPerRequest = Math.max(1, maxRollbackPerRequest);
        }
    }

    public static class DropSettings {
        public boolean enabled = true;
        public boolean overrideVanillaDrops = false;
        public String activeMode = "NIGHT_PROFILES";
        public List<DropProfile> nightProfiles = defaultNightProfiles();
        public List<DropRule> rules = defaultDropRules();

        public void sanitize() {
            if (activeMode == null || activeMode.isBlank()) activeMode = "NIGHT_PROFILES";
            if (!"LEGACY_RULES".equals(activeMode)) activeMode = "NIGHT_PROFILES";
            if (rules == null) rules = defaultDropRules();
            if (nightProfiles == null) nightProfiles = defaultNightProfiles();
            for (DropRule rule : rules) if (rule != null) rule.sanitize();
            for (DropProfile profile : nightProfiles) if (profile != null) profile.sanitize();
        }

        public boolean useNightProfiles() {
            return "NIGHT_PROFILES".equals(activeMode) && nightProfiles != null && !nightProfiles.isEmpty();
        }

        public static List<DropProfile> defaultNightProfiles() {
            List<DropProfile> result = new ArrayList<>();
            result.add(new DropProfile("early-scraps", "Nights 1-9: Scraps", true, 1, 9, 70, false, List.of(
                    new DropRule("minecraft:zombie", "minecraft:iron_nugget", 1, 2, 0.20D, 1, true),
                    new DropRule("minecraft:skeleton", "minecraft:arrow", 2, 6, 0.45D, 1, true),
                    new DropRule("*", "minecraft:rotten_flesh", 1, 3, 0.08D, 1, true)
            )));
            result.add(new DropProfile("midnight-supplies", "Nights 10-19: Supplies", true, 10, 19, 60, false, List.of(
                    new DropRule("*", "minecraft:bread", 1, 2, 0.07D, 10, true),
                    new DropRule("minecraft:witch", "minecraft:redstone", 1, 4, 0.25D, 10, true),
                    new DropRule("minecraft:creeper", "minecraft:gunpowder", 1, 5, 0.60D, 10, true)
            )));
            result.add(new DropProfile("blood-moon-rare", "Nights 10-30: Rare Blood Moon", true, 10, 30, 12, false, List.of(
                    new DropRule("*", "minecraft:emerald", 1, 2, 0.10D, 10, true),
                    new DropRule("*", "minecraft:diamond", 1, 1, 0.015D, 20, true),
                    new DropRule("minecraft:ghast", "minecraft:ghast_tear", 1, 3, 0.85D, 20, true)
            )));
            result.add(new DropProfile("endgame-relics", "Nights 20-30: Endgame Relics", true, 20, 30, 35, false, List.of(
                    new DropRule("*", "minecraft:golden_apple", 1, 1, 0.025D, 20, true),
                    new DropRule("minecraft:wither_skeleton", "minecraft:wither_skeleton_skull", 1, 1, 0.08D, 20, true),
                    new DropRule("*", "minecraft:experience_bottle", 1, 4, 0.15D, 20, true)
            )));
            return result;
        }

        public static List<DropRule> defaultDropRules() {
            List<DropRule> result = new ArrayList<>();
            result.add(new DropRule("minecraft:zombie", "minecraft:iron_nugget", 1, 3, 0.25D, 5, true));
            result.add(new DropRule("minecraft:skeleton", "minecraft:arrow", 2, 8, 0.50D, 1, true));
            result.add(new DropRule("minecraft:creeper", "minecraft:gunpowder", 1, 4, 0.65D, 1, true));
            result.add(new DropRule("minecraft:ghast", "minecraft:ghast_tear", 1, 2, 0.80D, 20, true));
            result.add(new DropRule("*", "minecraft:emerald", 1, 1, 0.02D, 25, true));
            return result;
        }
    }
}
