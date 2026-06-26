package com.cwarner.apocalypsemobs.game;

import com.cwarner.apocalypsemobs.config.ConfigManager;
import com.mojang.brigadier.arguments.DoubleArgumentType;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.commands.arguments.EntityArgument;
import net.minecraft.network.chat.Component;
import net.minecraft.server.level.ServerPlayer;
import net.minecraftforge.event.RegisterCommandsEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;

public final class EconomyCommands {
    @SubscribeEvent
    public void onRegisterCommands(RegisterCommandsEvent event) {
        event.getDispatcher().register(Commands.literal("bal")
                .executes(context -> showBalance(context.getSource().getPlayerOrException()))
                .then(Commands.argument("player", EntityArgument.player())
                        .requires(source -> source.hasPermission(2))
                        .executes(context -> showBalance(EntityArgument.getPlayer(context, "player")))));

        event.getDispatcher().register(Commands.literal("economy")
                .requires(source -> source.hasPermission(2))
                .then(Commands.literal("add")
                        .then(Commands.argument("player", EntityArgument.player())
                                .then(Commands.argument("value", DoubleArgumentType.doubleArg(0.0D))
                                        .executes(context -> apply(context.getSource(), EntityArgument.getPlayer(context, "player"), DoubleArgumentType.getDouble(context, "value"), "add")))))
                .then(Commands.literal("remove")
                        .then(Commands.argument("player", EntityArgument.player())
                                .then(Commands.argument("value", DoubleArgumentType.doubleArg(0.0D))
                                        .executes(context -> apply(context.getSource(), EntityArgument.getPlayer(context, "player"), DoubleArgumentType.getDouble(context, "value"), "remove")))))
                .then(Commands.literal("set")
                        .then(Commands.argument("player", EntityArgument.player())
                                .then(Commands.argument("value", DoubleArgumentType.doubleArg(0.0D))
                                        .executes(context -> apply(context.getSource(), EntityArgument.getPlayer(context, "player"), DoubleArgumentType.getDouble(context, "value"), "set"))))));
    }

    private static int showBalance(ServerPlayer player) {
        EconomyWalletLedger.WalletRecord wallet = EconomyWalletLedger.balance(player);
        player.sendSystemMessage(Component.literal("Balance: " + format(wallet.balance) + " " + ConfigManager.get().economy.currencyName));
        return 1;
    }

    private static int apply(CommandSourceStack source, ServerPlayer target, double value, String operation) {
        EconomyWalletLedger.WalletRecord wallet = switch (operation) {
            case "add" -> EconomyWalletLedger.add(target, value, "command:add");
            case "remove" -> EconomyWalletLedger.remove(target, value, "command:remove");
            case "set" -> EconomyWalletLedger.set(target, value, "command:set");
            default -> EconomyWalletLedger.balance(target);
        };
        source.sendSuccess(() -> Component.literal(target.getGameProfile().getName() + " balance: " + format(wallet.balance) + " " + ConfigManager.get().economy.currencyName), true);
        ServerPlayer actor = source.getEntity() instanceof ServerPlayer serverPlayer ? serverPlayer : null;
        if (actor == null || !actor.getUUID().equals(target.getUUID())) {
            target.sendSystemMessage(Component.literal("Balance updated: " + format(wallet.balance) + " " + ConfigManager.get().economy.currencyName));
        }
        return 1;
    }

    private static String format(double value) {
        return String.format("%.2f", value);
    }
}
