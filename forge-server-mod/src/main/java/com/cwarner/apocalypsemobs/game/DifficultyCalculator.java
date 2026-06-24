package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ApocalypseConfig;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.config.DifficultyMode;
import net.minecraft.server.level.ServerLevel;

import java.time.LocalDate;

public final class DifficultyCalculator {
    private DifficultyCalculator() {}

    public static int getDifficultyDay(ServerLevel level) {
        ApocalypseConfig config = ConfigManager.get();
        DifficultyMode mode = config.difficultyMode;
        if (mode == DifficultyMode.MANUAL) return clamp(config.manualDifficultyDay);
        if (mode == DifficultyMode.WORLD_DAY_CYCLE) {
            long worldDay = Math.max(0L, level.getDayTime() / 24000L);
            return (int) (worldDay % 30L) + 1;
        }
        return clamp(LocalDate.now().getDayOfMonth());
    }

    public static double progress(ServerLevel level) {
        return (getDifficultyDay(level) - 1) / 29.0D;
    }

    public static int lerpInt(int day1, int day30, ServerLevel level) {
        return (int) Math.round(day1 + ((day30 - day1) * progress(level)));
    }

    public static double lerpDouble(double day1, double day30, ServerLevel level) {
        return day1 + ((day30 - day1) * progress(level));
    }

    public static float lerpFloat(float day1, float day30, ServerLevel level) {
        return (float) (day1 + ((day30 - day1) * progress(level)));
    }

    private static int clamp(int day) {
        return Math.max(1, Math.min(30, day));
    }
}
