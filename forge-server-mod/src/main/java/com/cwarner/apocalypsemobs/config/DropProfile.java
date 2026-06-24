package com.cwarner.apocalypsemobs.config;

import java.util.ArrayList;
import java.util.List;

public class DropProfile {
    public String id;
    public String name;
    public boolean enabled;
    public int minDay;
    public int maxDay;
    public int weight;
    public boolean overrideVanillaDrops;
    public List<DropRule> rules;

    public DropProfile() {}

    public DropProfile(String id, String name, boolean enabled, int minDay, int maxDay, int weight, boolean overrideVanillaDrops, List<DropRule> rules) {
        this.id = id;
        this.name = name;
        this.enabled = enabled;
        this.minDay = minDay;
        this.maxDay = maxDay;
        this.weight = weight;
        this.overrideVanillaDrops = overrideVanillaDrops;
        this.rules = rules;
    }

    public void sanitize() {
        if (id == null || id.isBlank()) id = "unnamed-profile";
        if (name == null || name.isBlank()) name = id;
        minDay = Math.max(1, Math.min(30, minDay));
        maxDay = Math.max(minDay, Math.min(30, maxDay));
        weight = Math.max(0, weight);
        if (rules == null) rules = new ArrayList<>();
        for (DropRule rule : rules) {
            if (rule != null) rule.sanitize();
        }
    }
}
