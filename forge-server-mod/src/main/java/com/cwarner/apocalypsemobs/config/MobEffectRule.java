package com.cwarner.apocalypsemobs.config;

public class MobEffectRule {
    public boolean enabled = true;
    public String effect = "minecraft:speed";
    public int durationTicks = 600;
    public int amplifier = 0;
    public double chance = 1.0D;
    public boolean ambient = false;
    public boolean showParticles = true;

    public MobEffectRule() {}

    public MobEffectRule(String effect, int durationTicks, int amplifier, double chance, boolean enabled) {
        this.effect = effect;
        this.durationTicks = durationTicks;
        this.amplifier = amplifier;
        this.chance = chance;
        this.enabled = enabled;
    }

    public void sanitize() {
        if (effect == null || effect.isBlank()) effect = "minecraft:speed";
        if (!effect.contains(":")) effect = "minecraft:" + effect.toLowerCase(java.util.Locale.ROOT);
        durationTicks = Math.max(1, durationTicks);
        amplifier = Math.max(0, Math.min(255, amplifier));
        if (Double.isNaN(chance) || Double.isInfinite(chance)) chance = 1.0D;
        chance = Math.max(0.0D, Math.min(1.0D, chance));
    }
}
