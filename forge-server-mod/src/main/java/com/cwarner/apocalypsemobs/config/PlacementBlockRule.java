package com.cwarner.apocalypsemobs.config;

public class PlacementBlockRule {
    public String block;
    public int weight;
    public int minDay;
    public boolean enabled;

    public PlacementBlockRule() {
        this("minecraft:cobblestone", 1, 1, true);
    }

    public PlacementBlockRule(String block, int weight, int minDay, boolean enabled) {
        this.block = block;
        this.weight = weight;
        this.minDay = minDay;
        this.enabled = enabled;
    }

    public void sanitize() {
        if (block == null || block.isBlank()) block = "minecraft:cobblestone";
        weight = Math.max(0, weight);
        minDay = Math.max(1, Math.min(30, minDay));
    }
}
