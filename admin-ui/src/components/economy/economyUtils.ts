import type {
  EconomyDeathCostRule,
  EconomyEntityRewardRule,
  EconomyKillRewardTargetMode,
  EconomyMarketListing,
  EconomyParticipantRewardMode,
} from "../../types";

export const ITEM_DISPLAY_TOOLTIP =
  "Minecraft items display without the minecraft: prefix; modded IDs keep their namespace. The saved config still stores the full registry ID.";

export const SPECIAL_ENTITY_OPTIONS = [
  { id: "*", label: "All entities (*)" },
  { id: "minecraft:player", label: "Player" },
] as const;

export const VANILLA_ENTITY_OPTIONS = [
  "allay", "armadillo", "armor_stand", "axolotl", "bat", "bee", "blaze", "camel", "cat", "cave_spider", "chicken", "cod", "cow", "creeper", "dolphin", "donkey", "drowned", "elder_guardian", "ender_dragon", "enderman", "endermite", "evoker", "fox", "frog", "ghast", "glow_squid", "goat", "guardian", "hoglin", "horse", "husk", "illusioner", "iron_golem", "llama", "magma_cube", "mooshroom", "mule", "ocelot", "panda", "parrot", "phantom", "pig", "piglin", "piglin_brute", "pillager", "polar_bear", "pufferfish", "rabbit", "ravager", "salmon", "sheep", "shulker", "silverfish", "skeleton", "skeleton_horse", "slime", "sniffer", "snow_golem", "spider", "squid", "stray", "strider", "tadpole", "trader_llama", "tropical_fish", "turtle", "vex", "villager", "vindicator", "wandering_trader", "warden", "witch", "wither", "wither_skeleton", "wolf", "zoglin", "zombie", "zombie_horse", "zombie_villager", "zombified_piglin"
].map((id) => ({ id: `minecraft:${id}`, label: titleCase(id) })) as ReadonlyArray<{ id: string; label: string }>;

export const DEATH_CAUSES = [
  "ANY", "minecraft:generic", "minecraft:mob_attack", "minecraft:player_attack", "minecraft:arrow", "minecraft:explosion", "minecraft:fall", "minecraft:lava", "minecraft:fire", "minecraft:drown", "minecraft:magic", "minecraft:wither", "minecraft:starve", "minecraft:void",
];

export const REWARD_TARGET_LABELS: Record<EconomyKillRewardTargetMode, string> = {
  KILLER: "Killer player",
  NEAREST_PLAYER: "Nearest player",
  ALL_PLAYERS: "All players",
  ALL_PARTICIPANTS: "Players who damaged mob",
  TOP_DAMAGER: "Top damage dealer",
};

export const PARTICIPANT_MODE_LABELS: Record<EconomyParticipantRewardMode, string> = {
  FULL_TO_EACH_PARTICIPANT: "Full amount to each",
  SPLIT_BETWEEN_PARTICIPANTS: "Split evenly",
  PROPORTIONAL_BY_DAMAGE: "Split by damage dealt",
};

export function titleCase(value: string): string {
  return value.replace(/[_-]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function shortRegistryLabel(value: string): string {
  const separatorIndex = value.indexOf(":");
  if (separatorIndex < 0) return value;
  const namespace = value.slice(0, separatorIndex);
  const path = value.slice(separatorIndex + 1);
  return namespace === "minecraft" ? path : value;
}

export function registrySearchText(value: string): string {
  return `${shortRegistryLabel(value)} ${value}`.toLowerCase();
}

export function resolveRegistryItemInput(value: string, options: string[]): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const exactId = options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  if (exactId) return exactId;
  const exactLabel = options.find((option) => shortRegistryLabel(option).toLowerCase() === trimmed.toLowerCase());
  return exactLabel ?? trimmed;
}

export function entityLabel(entityId: string): string {
  if (entityId === "*") return "All entities (*)";
  const known = [...SPECIAL_ENTITY_OPTIONS, ...VANILLA_ENTITY_OPTIONS].find((option) => option.id === entityId);
  return known?.label ?? shortRegistryLabel(entityId);
}

export function resolveEntityInput(value: string, options: string[]): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const exactId = options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  if (exactId) return exactId;
  const exactLabel = options.find((option) => entityLabel(option).toLowerCase() === trimmed.toLowerCase());
  return exactLabel ?? trimmed;
}

export function newDeathRule(): EconomyDeathCostRule {
  return { id: `death-${Date.now().toString(36)}`, enabled: true, deathCause: "minecraft:player_attack", mode: "FIXED", amount: 50, percent: 5, reason: "death-cost" };
}

export function newEntityRewardRule(): EconomyEntityRewardRule {
  return { id: `kill-${Date.now().toString(36)}`, enabled: true, entity: "minecraft:zombie", minDay: 1, chance: 1, minAmount: 5, maxAmount: 10, targetMode: "KILLER", participantRewardMode: "FULL_TO_EACH_PARTICIPANT", lootVictimWalletEnabled: false, lootVictimWalletMode: "PERCENT_BALANCE", lootVictimWalletMinAmount: 0, lootVictimWalletMaxAmount: 0, lootVictimWalletPercent: 10, lootVictimWalletMaxPercentAmount: 500, reason: "baseline-kill-reward" };
}

export function newMarketListing(): EconomyMarketListing {
  return { id: `market-${Date.now().toString(36)}`, enabled: true, item: "minecraft:bread", displayName: "Bread", price: 25, minDay: 1, maxPerPurchase: 16, stock: -1, playerPurchaseLimit: 0, commandOnPurchase: "" };
}
