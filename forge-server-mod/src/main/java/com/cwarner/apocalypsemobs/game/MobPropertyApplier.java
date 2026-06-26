package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.EntityWeight;
import com.cwarner.apocalypsemobs.config.MobProperties;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.RandomSource;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.ai.attributes.AttributeInstance;
import net.minecraft.world.entity.ai.attributes.Attributes;
import net.minecraft.world.entity.monster.Creeper;
import net.minecraft.world.entity.monster.EnderMan;
import net.minecraft.world.entity.monster.Spider;
import net.minecraft.world.effect.MobEffect;
import net.minecraft.world.effect.MobEffectInstance;

import java.util.Optional;

/** Applies profile-specific server-side vanilla attribute modifiers to spawned apocalypse mobs. */
public final class MobPropertyApplier {
    public static final String APOCALYPSE_PROFILE_TAG = "ApocalypseMobsProfiled";
    public static final String TARGET_PLAYERS_TAG = "ApocalypseMobsTargetPlayers";
    public static final String BREAK_BLOCKS_TAG = "ApocalypseMobsBreakBlocks";
    public static final String PLACE_BLOCKS_TAG = "ApocalypseMobsPlaceBlocks";
    public static final String BRIDGE_GAPS_TAG = "ApocalypseMobsBridgeGaps";
    public static final String EXPLODING_ARROWS_TAG = "ApocalypseMobsExplodingArrows";
    public static final String EXPLODING_ARROW_CHANCE_TAG = "ApocalypseMobsExplodingArrowChance";
    public static final String EXPLODING_ARROW_POWER_TAG = "ApocalypseMobsExplodingArrowPower";
    public static final String EXPLODING_ARROW_BREAK_BLOCKS_TAG = "ApocalypseMobsExplodingArrowBreakBlocks";
    public static final String CREEPER_WALL_EXPLOSIONS_TAG = "ApocalypseMobsCreeperWallExplosions";
    public static final String CREEPER_WALL_EXPLOSION_CHANCE_TAG = "ApocalypseMobsCreeperWallExplosionChance";
    public static final String CREEPER_WALL_EXPLOSION_POWER_TAG = "ApocalypseMobsCreeperWallExplosionPower";
    public static final String CREEPER_WALL_EXPLOSION_COOLDOWN_TAG = "ApocalypseMobsCreeperWallExplosionCooldown";
    public static final String ENDERMAN_TELEPORT_PLAYERS_TAG = "ApocalypseMobsEndermanTeleportPlayers";
    public static final String ENDERMAN_TELEPORT_CHANCE_TAG = "ApocalypseMobsEndermanTeleportChance";
    public static final String ENDERMAN_TELEPORT_RADIUS_TAG = "ApocalypseMobsEndermanTeleportRadius";
    public static final String ENDERMAN_TELEPORT_COOLDOWN_TAG = "ApocalypseMobsEndermanTeleportCooldown";
    public static final String SPIDER_WEB_PLAYERS_TAG = "ApocalypseMobsSpiderWebPlayers";
    public static final String SPIDER_WEB_CHANCE_TAG = "ApocalypseMobsSpiderWebChance";
    public static final String SPIDER_WEB_COOLDOWN_TAG = "ApocalypseMobsSpiderWebCooldown";
    public static final String ECONOMY_REWARD_ENABLED_TAG = "ApocalypseMobsEconomyRewardEnabled";
    public static final String ECONOMY_REWARD_CHANCE_TAG = "ApocalypseMobsEconomyRewardChance";
    public static final String ECONOMY_REWARD_MIN_AMOUNT_TAG = "ApocalypseMobsEconomyRewardMinAmount";
    public static final String ECONOMY_REWARD_MAX_AMOUNT_TAG = "ApocalypseMobsEconomyRewardMaxAmount";
    public static final String ECONOMY_REWARD_TARGET_MODE_TAG = "ApocalypseMobsEconomyRewardTargetMode";
    public static final String ECONOMY_REWARD_PARTICIPANT_MODE_TAG = "ApocalypseMobsEconomyRewardParticipantMode";
    public static final String ECONOMY_REWARD_REASON_TAG = "ApocalypseMobsEconomyRewardReason";

    private MobPropertyApplier() {}

    public static void apply(Entity entity, EntityWeight rule) {
        if (!(entity instanceof LivingEntity living) || rule == null || rule.properties == null) return;
        MobProperties properties = rule.properties;
        entity.getPersistentData().putBoolean(APOCALYPSE_PROFILE_TAG, true);
        entity.getPersistentData().putBoolean(TARGET_PLAYERS_TAG, properties.targetPlayers);
        entity.getPersistentData().putBoolean(BREAK_BLOCKS_TAG, properties.breakBlocks);
        entity.getPersistentData().putBoolean(PLACE_BLOCKS_TAG, properties.placeBlocks);
        entity.getPersistentData().putBoolean(BRIDGE_GAPS_TAG, properties.bridgeGaps);
        entity.getPersistentData().putBoolean(EXPLODING_ARROWS_TAG, properties.explodingArrows && supportsExplodingArrows(entity));
        entity.getPersistentData().putDouble(EXPLODING_ARROW_CHANCE_TAG, properties.explodingArrowChance);
        entity.getPersistentData().putDouble(EXPLODING_ARROW_POWER_TAG, properties.explodingArrowPower);
        entity.getPersistentData().putBoolean(EXPLODING_ARROW_BREAK_BLOCKS_TAG, properties.explodingArrowBreakBlocks);
        entity.getPersistentData().putBoolean(CREEPER_WALL_EXPLOSIONS_TAG, properties.creeperWallExplosions && supportsCreeperWallExplosions(entity));
        entity.getPersistentData().putDouble(CREEPER_WALL_EXPLOSION_CHANCE_TAG, properties.creeperWallExplosionChance);
        entity.getPersistentData().putDouble(CREEPER_WALL_EXPLOSION_POWER_TAG, properties.creeperWallExplosionPower);
        entity.getPersistentData().putInt(CREEPER_WALL_EXPLOSION_COOLDOWN_TAG, properties.creeperWallExplosionCooldownTicks);
        entity.getPersistentData().putBoolean(ENDERMAN_TELEPORT_PLAYERS_TAG, properties.endermanTeleportPlayers && supportsEndermanTeleportPlayers(entity));
        entity.getPersistentData().putDouble(ENDERMAN_TELEPORT_CHANCE_TAG, properties.endermanTeleportChance);
        entity.getPersistentData().putInt(ENDERMAN_TELEPORT_RADIUS_TAG, properties.endermanTeleportRadius);
        entity.getPersistentData().putInt(ENDERMAN_TELEPORT_COOLDOWN_TAG, properties.endermanTeleportCooldownTicks);
        entity.getPersistentData().putBoolean(SPIDER_WEB_PLAYERS_TAG, properties.spiderWebPlayers && supportsSpiderWebPlayers(entity));
        entity.getPersistentData().putDouble(SPIDER_WEB_CHANCE_TAG, properties.spiderWebChance);
        entity.getPersistentData().putInt(SPIDER_WEB_COOLDOWN_TAG, properties.spiderWebCooldownTicks);
        entity.getPersistentData().putBoolean(ECONOMY_REWARD_ENABLED_TAG, rule.economyRewardEnabled);
        entity.getPersistentData().putDouble(ECONOMY_REWARD_CHANCE_TAG, rule.economyRewardChance);
        entity.getPersistentData().putDouble(ECONOMY_REWARD_MIN_AMOUNT_TAG, rule.economyRewardMinAmount);
        entity.getPersistentData().putDouble(ECONOMY_REWARD_MAX_AMOUNT_TAG, rule.economyRewardMaxAmount);
        entity.getPersistentData().putString(ECONOMY_REWARD_TARGET_MODE_TAG, rule.economyRewardTargetMode);
        entity.getPersistentData().putString(ECONOMY_REWARD_PARTICIPANT_MODE_TAG, rule.economyRewardParticipantMode);
        entity.getPersistentData().putString(ECONOMY_REWARD_REASON_TAG, rule.economyRewardReason);

        if (!properties.enabled) return;

        RandomSource random = living.getRandom();
        double maxHealthValue = ranged(properties.maxHealthMode, properties.maxHealth, properties.maxHealthMin, properties.maxHealthMax, random);
        double attackDamageValue = ranged(properties.attackDamageMode, properties.attackDamage, properties.attackDamageMin, properties.attackDamageMax, random);
        double movementSpeedValue = ranged(properties.movementSpeedMode, properties.movementSpeed, properties.movementSpeedMin, properties.movementSpeedMax, random);
        double followRangeValue = ranged(properties.followRangeMode, properties.followRange, properties.followRangeMin, properties.followRangeMax, random);
        double armor = ranged(properties.armorMode, properties.armor, properties.armorMin, properties.armorMax, random);
        double armorToughness = ranged(properties.armorToughnessMode, properties.armorToughness, properties.armorToughnessMin, properties.armorToughnessMax, random);
        double knockbackResistance = ranged(properties.knockbackResistanceMode, properties.knockbackResistance, properties.knockbackResistanceMin, properties.knockbackResistanceMax, random);
        double stepHeight = ranged(properties.stepHeightMode, properties.stepHeight, properties.stepHeightMin, properties.stepHeightMax, random);

        setBaseIfPositive(living, Attributes.MAX_HEALTH, maxHealthValue, 1.0D, 2048.0D);
        if (maxHealthValue > 0.0D) {
            AttributeInstance maxHealth = living.getAttribute(Attributes.MAX_HEALTH);
            if (maxHealth != null) {
                living.setHealth((float) Math.max(1.0D, maxHealth.getValue()));
            }
        }

        setBaseIfPositive(living, Attributes.ATTACK_DAMAGE, attackDamageValue, 0.0D, 2048.0D);
        setBaseIfPositive(living, Attributes.MOVEMENT_SPEED, movementSpeedValue, 0.0D, 10.0D);
        setBaseIfPositive(living, Attributes.FOLLOW_RANGE, followRangeValue, 0.0D, 256.0D);
        setBaseIfPositive(living, Attributes.ARMOR, armor, 0.0D, 100.0D);
        setBaseIfPositive(living, Attributes.ARMOR_TOUGHNESS, armorToughness, 0.0D, 100.0D);
        setBaseIfPositive(living, Attributes.KNOCKBACK_RESISTANCE, knockbackResistance, 0.0D, 1.0D);

        if (stepHeight > 0.0D) {
            living.setMaxUpStep((float) stepHeight);
        }

        if (properties.persistent && entity instanceof Mob mob) {
            mob.setPersistenceRequired();
        }

        if (properties.customName != null && !properties.customName.isBlank()) {
            living.setCustomName(Component.literal(properties.customName));
            living.setCustomNameVisible(false);
        }

        applyEffects(living, properties, random);
    }

    private static void applyEffects(LivingEntity living, MobProperties properties, RandomSource random) {
        if (properties.effects == null || properties.effects.isEmpty()) return;
        for (var rule : properties.effects) {
            if (rule == null || !rule.enabled || rule.chance <= 0.0D || random.nextDouble() > rule.chance) continue;
            Optional<MobEffect> effect = BuiltInRegistries.MOB_EFFECT.getOptional(new ResourceLocation(rule.effect));
            if (effect.isEmpty()) continue;
            living.addEffect(new MobEffectInstance(effect.get(), Math.max(1, rule.durationTicks), Math.max(0, rule.amplifier), rule.ambient, rule.showParticles));
        }
    }


    public static boolean supportsExplodingArrows(Entity entity) {
        String id = entityId(entity);
        return id.equals("minecraft:skeleton")
                || id.equals("minecraft:stray")
                || id.equals("minecraft:pillager")
                || id.endsWith(":skeleton")
                || id.endsWith(":stray")
                || id.endsWith(":pillager")
                || id.contains("archer")
                || id.contains("bow")
                || id.contains("crossbow");
    }

    public static boolean supportsCreeperWallExplosions(Entity entity) {
        String id = entityId(entity);
        return entity instanceof Creeper || id.equals("minecraft:creeper") || id.endsWith(":creeper") || id.contains("creeper");
    }

    public static boolean supportsEndermanTeleportPlayers(Entity entity) {
        String id = entityId(entity);
        return entity instanceof EnderMan || id.equals("minecraft:enderman") || id.endsWith(":enderman") || id.contains("enderman");
    }

    public static boolean supportsSpiderWebPlayers(Entity entity) {
        String id = entityId(entity);
        return entity instanceof Spider || id.equals("minecraft:spider") || id.equals("minecraft:cave_spider") || id.endsWith(":spider") || id.contains("spider");
    }

    public static boolean isProfiled(Entity entity) {
        return entity.getPersistentData().getBoolean(APOCALYPSE_PROFILE_TAG)
                || entity.getPersistentData().contains(TARGET_PLAYERS_TAG);
    }

    private static String entityId(Entity entity) {
        return String.valueOf(BuiltInRegistries.ENTITY_TYPE.getKey(entity.getType())).toLowerCase(java.util.Locale.ROOT);
    }

    private static double ranged(String mode, double fixed, double min, double max, RandomSource random) {
        if (!"RANGED".equals(mode)) return fixed;
        if (max <= min) return min;
        return min + (random.nextDouble() * (max - min));
    }

    private static void setBaseIfPositive(LivingEntity living, net.minecraft.world.entity.ai.attributes.Attribute attribute, double value, double min, double max) {
        AttributeInstance instance = living.getAttribute(attribute);
        if (instance == null || value <= 0.0D) return;
        instance.setBaseValue(Math.max(min, Math.min(max, value)));
    }
}
