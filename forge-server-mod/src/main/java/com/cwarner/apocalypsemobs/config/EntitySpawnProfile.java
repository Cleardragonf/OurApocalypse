package com.cwarner.apocalypsemobs.config;

import java.util.ArrayList;
import java.util.List;

public class EntitySpawnProfile {
    public String id;
    public String name;
    public boolean enabled;
    public int minDay;
    public int maxDay;
    public int weight;
    public List<EntityWeight> weights;

    public EntitySpawnProfile() {}

    public EntitySpawnProfile(String id, String name, boolean enabled, int minDay, int maxDay, int weight, List<EntityWeight> weights) {
        this.id = id;
        this.name = name;
        this.enabled = enabled;
        this.minDay = minDay;
        this.maxDay = maxDay;
        this.weight = weight;
        this.weights = weights;
    }

    public void sanitize() {
        if (id == null || id.isBlank()) id = "unnamed-entity-profile";
        if (name == null || name.isBlank()) name = id;
        minDay = Math.max(1, Math.min(30, minDay));
        maxDay = Math.max(minDay, Math.min(30, maxDay));
        weight = Math.max(0, weight);
        if (weights == null) weights = new ArrayList<>();
        for (EntityWeight entry : weights) {
            if (entry != null) entry.sanitize();
        }
    }
}
