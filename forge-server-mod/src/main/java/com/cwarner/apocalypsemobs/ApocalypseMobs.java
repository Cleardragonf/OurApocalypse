package com.cwarner.apocalypsemobs;

import com.cwarner.apocalypsemobs.admin.AdminHttpServer;
import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.cwarner.apocalypsemobs.game.BlockPlacementLedger;
import com.cwarner.apocalypsemobs.game.EconomyCommands;
import com.cwarner.apocalypsemobs.game.EconomyDeathHandler;
import com.cwarner.apocalypsemobs.game.EconomyWalletLedger;
import com.cwarner.apocalypsemobs.game.MobBehaviorController;
import com.cwarner.apocalypsemobs.game.MobDropHandler;
import com.cwarner.apocalypsemobs.game.SpecialMobGoalController;
import com.cwarner.apocalypsemobs.game.WaveDirector;
import com.mojang.logging.LogUtils;
import net.minecraftforge.common.MinecraftForge;
import net.minecraftforge.event.server.ServerStartedEvent;
import net.minecraftforge.event.server.ServerStoppingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import org.slf4j.Logger;

@Mod(ApocalypseMobs.MOD_ID)
public final class ApocalypseMobs {
    public static final String MOD_ID = "apocalypse_mobs";
    public static final Logger LOGGER = LogUtils.getLogger();

    private final AdminHttpServer adminHttpServer = new AdminHttpServer();

    public ApocalypseMobs() {
        ConfigManager.loadOrCreate();
        BlockPlacementLedger.loadOrCreate();
        EconomyWalletLedger.loadOrCreate();
        MinecraftForge.EVENT_BUS.register(this);
        MinecraftForge.EVENT_BUS.register(new EconomyCommands());
        MinecraftForge.EVENT_BUS.register(new EconomyDeathHandler());
        MinecraftForge.EVENT_BUS.register(new WaveDirector());
        MinecraftForge.EVENT_BUS.register(new MobBehaviorController());
        MinecraftForge.EVENT_BUS.register(new MobDropHandler());
        MinecraftForge.EVENT_BUS.register(new SpecialMobGoalController());
        LOGGER.info("Apocalypse Mobs initialized.");
    }

    @SubscribeEvent
    public void onServerStarted(ServerStartedEvent event) {
        BlockPlacementLedger.loadOrCreate();
        EconomyWalletLedger.loadOrCreate();
        adminHttpServer.start(event.getServer());
        if (ConfigManager.get().cleanup.rollbackOnServerStart) {
            event.getServer().execute(() -> BlockPlacementLedger.rollback(event.getServer(), ConfigManager.get().cleanup.maxRollbackPerRequest));
        }
    }

    @SubscribeEvent
    public void onServerStopping(ServerStoppingEvent event) {
        adminHttpServer.stop();
        BlockPlacementLedger.saveQuietly();
        EconomyWalletLedger.saveQuietly();
    }
}
