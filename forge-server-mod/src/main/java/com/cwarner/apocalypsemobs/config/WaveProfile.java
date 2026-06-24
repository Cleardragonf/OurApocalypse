package com.cwarner.apocalypsemobs.config;

public class WaveProfile {
    public String id;
    public String name;
    public boolean enabled;
    public int minDay;
    public int maxDay;
    public int weight;
    public int minWaves;
    public int maxWaves;
    public int minMobs;
    public int maxMobs;
    public int spawnRadiusMin;
    public int spawnRadiusMax;
    public int maxSpawnAttemptsPerMob;
    public boolean spawnAroundEachPlayer;
    public boolean avoidCreativeAndSpectator;
    public boolean announceWaves;

    public WaveProfile() {}

    public WaveProfile(String id, String name, boolean enabled, int minDay, int maxDay, int weight,
                       int minWaves, int maxWaves, int minMobs, int maxMobs,
                       int spawnRadiusMin, int spawnRadiusMax, int maxSpawnAttemptsPerMob,
                       boolean spawnAroundEachPlayer, boolean avoidCreativeAndSpectator, boolean announceWaves) {
        this.id = id;
        this.name = name;
        this.enabled = enabled;
        this.minDay = minDay;
        this.maxDay = maxDay;
        this.weight = weight;
        this.minWaves = minWaves;
        this.maxWaves = maxWaves;
        this.minMobs = minMobs;
        this.maxMobs = maxMobs;
        this.spawnRadiusMin = spawnRadiusMin;
        this.spawnRadiusMax = spawnRadiusMax;
        this.maxSpawnAttemptsPerMob = maxSpawnAttemptsPerMob;
        this.spawnAroundEachPlayer = spawnAroundEachPlayer;
        this.avoidCreativeAndSpectator = avoidCreativeAndSpectator;
        this.announceWaves = announceWaves;
    }

    public void sanitize() {
        if (id == null || id.isBlank()) id = "unnamed-wave-profile";
        if (name == null || name.isBlank()) name = id;
        minDay = Math.max(1, Math.min(30, minDay));
        maxDay = Math.max(minDay, Math.min(30, maxDay));
        weight = Math.max(0, weight);
        minWaves = Math.max(0, minWaves);
        maxWaves = Math.max(minWaves, maxWaves);
        minMobs = Math.max(0, minMobs);
        maxMobs = Math.max(minMobs, maxMobs);
        spawnRadiusMin = Math.max(8, spawnRadiusMin);
        spawnRadiusMax = Math.max(spawnRadiusMin, spawnRadiusMax);
        maxSpawnAttemptsPerMob = Math.max(1, maxSpawnAttemptsPerMob);
    }
}
