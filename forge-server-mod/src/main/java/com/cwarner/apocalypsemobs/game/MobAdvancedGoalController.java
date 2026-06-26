package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import net.minecraft.core.registries.BuiltInRegistries;
import net.minecraft.nbt.CompoundTag;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.damagesource.DamageSource;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.monster.Monster;
import net.minecraft.world.level.Level;
import net.minecraftforge.event.entity.living.LivingAttackEvent;
import net.minecraftforge.event.entity.living.LivingDeathEvent;
import net.minecraftforge.event.entity.living.LivingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

import java.util.Optional;

public final class MobAdvancedGoalController {
    @SubscribeEvent
    public void onLivingAttack(LivingAttackEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!MobPropertyApplier.isProfiled(monster)) return;
        if (isImmune(monster.getPersistentData(), event.getSource())) {
            event.setCanceled(true);
        }
    }

    @SubscribeEvent
    public void onLivingTick(LivingEvent.LivingTickEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;
        if (!MobPropertyApplier.isProfiled(monster)) return;
        CompoundTag data = monster.getPersistentData();
        if (!data.getBoolean(MobPropertyApplier.PREVENT_SUN_BURN_TAG)) return;
        if (level.isDay() && monster.isOnFire() && level.canSeeSky(monster.blockPosition())) {
            monster.clearFire();
        }
    }

    @SubscribeEvent
    public void onLivingDeath(LivingDeathEvent event) {
        if (!(event.getEntity() instanceof Monster monster)) return;
        if (!(monster.level() instanceof ServerLevel level)) return;
        if (!MobPropertyApplier.isProfiled(monster)) return;

        ApocalypseConfig config = ConfigManager.get();
        if (!config.enabled) return;

        CompoundTag data = monster.getPersistentData();
        if (data.getBoolean(MobPropertyApplier.DEATH_EXPLOSION_TAG)) {
            float power = (float) Math.max(0.1D, data.getDouble(MobPropertyApplier.DEATH_EXPLOSION_POWER_TAG));
            boolean fire = data.getBoolean(MobPropertyApplier.DEATH_EXPLOSION_FIRE_TAG);
            level.explode(monster, monster.getX(), monster.getY(), monster.getZ(), power, fire, Level.ExplosionInteraction.MOB);
        }

        if (data.getBoolean(MobPropertyApplier.DEATH_SPAWN_TAG)) {
            spawnDeathMobs(level, monster, data);
        }
    }

    private boolean isImmune(CompoundTag data, DamageSource source) {
        String msgId = source.getMsgId();
        if (data.getBoolean(MobPropertyApplier.IMMUNE_FIRE_TAG) && (msgId.contains("fire") || msgId.equals("lava") || msgId.equals("onFire") || msgId.equals("inFire"))) return true;
        if (data.getBoolean(MobPropertyApplier.IMMUNE_FALL_TAG) && msgId.equals("fall")) return true;
        if (data.getBoolean(MobPropertyApplier.IMMUNE_EXPLOSION_TAG) && msgId.startsWith("explosion")) return true;
        return data.getBoolean(MobPropertyApplier.IMMUNE_PROJECTILE_TAG) && (msgId.equals("arrow") || msgId.equals("trident") || msgId.equals("thrown"));
    }

    private void spawnDeathMobs(ServerLevel level, Monster source, CompoundTag data) {
        Optional<EntityType<?>> type = BuiltInRegistries.ENTITY_TYPE.getOptional(new ResourceLocation(data.getString(MobPropertyApplier.DEATH_SPAWN_ENTITY_TAG)));
        if (type.isEmpty()) return;
        int count = Math.max(0, Math.min(50, data.getInt(MobPropertyApplier.DEATH_SPAWN_COUNT_TAG)));
        double chance = Math.max(0.0D, Math.min(1.0D, data.getDouble(MobPropertyApplier.DEATH_SPAWN_CHANCE_TAG)));
        for (int i = 0; i < count; i++) {
            if (level.random.nextDouble() > chance) continue;
            var entity = type.get().create(level);
            if (!(entity instanceof Mob mob)) continue;
            mob.moveTo(source.getX(), source.getY(), source.getZ(), source.getYRot(), source.getXRot());
            level.addFreshEntity(mob);
        }
    }
}
