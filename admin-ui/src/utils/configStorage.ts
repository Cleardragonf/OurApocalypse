import type { ApocalypseConfig, EntityWeight, MobProperties, UiConnectionSettings } from "../types";
import { defaultConfig, defaultConnectionSettings } from "../defaultConfig";

export const CONFIG_STORAGE_KEY = "apocalypse-mobs-ui-owned-config-v8";
export const LEGACY_CONFIG_STORAGE_KEYS = [
  "apocalypse-mobs-ui-owned-config-v7",
  "apocalypse-mobs-ui-owned-config-v6",
  "apocalypse-mobs-ui-owned-config-v5",
  "apocalypse-mobs-ui-owned-config-v4",
];
export const CONNECTION_STORAGE_KEY = "apocalypse-mobs-rest-connection-v1";
export const REVISION_STORAGE_KEY = "apocalypse-mobs-local-revision-v8";

export function cloneConfig(config: ApocalypseConfig): ApocalypseConfig {
  return JSON.parse(JSON.stringify(config)) as ApocalypseConfig;
}

export function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? patch : base) as T;
  if (base && typeof base === "object") {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    const patchObject = patch && typeof patch === "object" ? (patch as Record<string, unknown>) : {};
    for (const key of Object.keys(patchObject)) {
      result[key] = key in result ? deepMerge(result[key], patchObject[key]) : patchObject[key];
    }
    return result as T;
  }
  return (patch ?? base) as T;
}

function migrateOurMagicSettings(input: Partial<ApocalypseConfig>): Partial<ApocalypseConfig> {
  const integrations = input.integrations as Record<string, unknown> | undefined;
  const ourMagic = integrations?.ourMagic as Record<string, unknown> | undefined;
  if (!ourMagic) return input;

  const migrated = { ...ourMagic };
  const legacyUrl =
    typeof migrated.gatewayUrl === "string"
      ? migrated.gatewayUrl
      : typeof migrated.baseUrl === "string"
        ? `${migrated.baseUrl.replace(/\/+$/, "")}/${String(migrated.giveExperiencePath || "api/mod/our-magic/experience").replace(/^\/+/, "")}`
        : "";

  if (legacyUrl && typeof migrated.host !== "string") {
    try {
      const url = new URL(legacyUrl);
      migrated.host = url.hostname || defaultConfig.integrations.ourMagic.host;
      migrated.port = url.port ? Number(url.port) : defaultConfig.integrations.ourMagic.port;
    } catch {
      migrated.host = defaultConfig.integrations.ourMagic.host;
      migrated.port = defaultConfig.integrations.ourMagic.port;
    }
  }

  delete migrated.gatewayUrl;
  delete migrated.baseUrl;
  delete migrated.giveExperiencePath;
  delete migrated.tokenHeader;
  delete migrated.timeoutMillis;

  return {
    ...input,
    integrations: {
      ...input.integrations,
      ourMagic: {
        enabled: typeof migrated.enabled === "boolean" ? migrated.enabled : defaultConfig.integrations.ourMagic.enabled,
        host:
          typeof migrated.host === "string" && migrated.host.trim()
            ? migrated.host
            : defaultConfig.integrations.ourMagic.host,
        port: typeof migrated.port === "number" && Number.isFinite(migrated.port) ? migrated.port : defaultConfig.integrations.ourMagic.port,
        token: typeof migrated.token === "string" ? migrated.token : defaultConfig.integrations.ourMagic.token,
      },
    },
  };
}

export function defaultMobProperties(): MobProperties {
  return {
    enabled: false,
    maxHealthMode: "FIXED",
    maxHealth: 0,
    maxHealthMin: 0,
    maxHealthMax: 0,
    attackDamageMode: "FIXED",
    attackDamage: 0,
    attackDamageMin: 0,
    attackDamageMax: 0,
    movementSpeedMode: "FIXED",
    movementSpeed: 0,
    movementSpeedMin: 0,
    movementSpeedMax: 0,
    followRangeMode: "FIXED",
    followRange: 0,
    followRangeMin: 0,
    followRangeMax: 0,
    armorMode: "FIXED",
    armor: 0,
    armorMin: 0,
    armorMax: 0,
    armorToughnessMode: "FIXED",
    armorToughness: 0,
    armorToughnessMin: 0,
    armorToughnessMax: 0,
    knockbackResistanceMode: "FIXED",
    knockbackResistance: 0,
    knockbackResistanceMin: 0,
    knockbackResistanceMax: 0,
    stepHeightMode: "FIXED",
    stepHeight: 0,
    stepHeightMin: 0,
    stepHeightMax: 0,
    persistent: false,
    customName: "",
    targetPlayers: true,
    breakBlocks: true,
    placeBlocks: true,
    bridgeGaps: true,
    explodingArrows: false,
    explodingArrowChance: 0,
    explodingArrowPower: 2,
    explodingArrowBreakBlocks: true,
    creeperWallExplosions: false,
    creeperWallExplosionChance: 0,
    creeperWallExplosionPower: 2.8,
    creeperWallExplosionCooldownTicks: 100,
    endermanTeleportPlayers: false,
    endermanTeleportChance: 0,
    endermanTeleportRadius: 12,
    endermanTeleportCooldownTicks: 160,
    spiderWebPlayers: false,
    spiderWebChance: 0,
    spiderWebCooldownTicks: 100,
  };
}

export function normalizeMobProperties(properties: Partial<MobProperties> | undefined): MobProperties {
  const defaults = defaultMobProperties();
  const merged = { ...defaults, ...(properties ?? {}) };
  const legacy = (properties ?? {}) as Record<string, unknown>;
  const copyLegacy = (nextKey: keyof MobProperties, oldKey: string) => {
    const nextRecord = merged as Record<string, unknown>;
    if (nextRecord[nextKey as string] === defaults[nextKey] && typeof legacy[oldKey] !== "undefined") {
      nextRecord[nextKey as string] = legacy[oldKey];
    }
  };

  copyLegacy("maxHealthMode", "maxHealthMultiplierMode");
  copyLegacy("maxHealth", "maxHealthMultiplier");
  copyLegacy("maxHealthMin", "maxHealthMultiplierMin");
  copyLegacy("maxHealthMax", "maxHealthMultiplierMax");
  copyLegacy("attackDamageMode", "attackDamageMultiplierMode");
  copyLegacy("attackDamage", "attackDamageMultiplier");
  copyLegacy("attackDamageMin", "attackDamageMultiplierMin");
  copyLegacy("attackDamageMax", "attackDamageMultiplierMax");
  copyLegacy("movementSpeedMode", "movementSpeedMultiplierMode");
  copyLegacy("movementSpeed", "movementSpeedMultiplier");
  copyLegacy("movementSpeedMin", "movementSpeedMultiplierMin");
  copyLegacy("movementSpeedMax", "movementSpeedMultiplierMax");
  copyLegacy("followRangeMode", "followRangeMultiplierMode");
  copyLegacy("followRange", "followRangeMultiplier");
  copyLegacy("followRangeMin", "followRangeMultiplierMin");
  copyLegacy("followRangeMax", "followRangeMultiplierMax");
  copyLegacy("armor", "armorBonus");
  copyLegacy("armorMin", "armorBonusMin");
  copyLegacy("armorMax", "armorBonusMax");
  copyLegacy("armorMode", "armorBonusMode");
  copyLegacy("armorToughness", "armorToughnessBonus");
  copyLegacy("armorToughnessMin", "armorToughnessBonusMin");
  copyLegacy("armorToughnessMax", "armorToughnessBonusMax");
  copyLegacy("armorToughnessMode", "armorToughnessBonusMode");
  copyLegacy("knockbackResistance", "knockbackResistanceBonus");
  copyLegacy("knockbackResistanceMin", "knockbackResistanceBonusMin");
  copyLegacy("knockbackResistanceMax", "knockbackResistanceBonusMax");
  copyLegacy("knockbackResistanceMode", "knockbackResistanceBonusMode");

  const alignRangeDefaults = (valueKey: keyof MobProperties, minKey: keyof MobProperties, maxKey: keyof MobProperties) => {
    const fixed = merged[valueKey];
    const raw = properties as Record<string, unknown> | undefined;
    if (typeof fixed !== "number") return;
    if (typeof raw?.[minKey as string] !== "number") (merged as Record<string, unknown>)[minKey as string] = fixed;
    if (typeof raw?.[maxKey as string] !== "number") (merged as Record<string, unknown>)[maxKey as string] = fixed;
  };

  alignRangeDefaults("maxHealth", "maxHealthMin", "maxHealthMax");
  alignRangeDefaults("attackDamage", "attackDamageMin", "attackDamageMax");
  alignRangeDefaults("movementSpeed", "movementSpeedMin", "movementSpeedMax");
  alignRangeDefaults("followRange", "followRangeMin", "followRangeMax");
  alignRangeDefaults("armor", "armorMin", "armorMax");
  alignRangeDefaults("armorToughness", "armorToughnessMin", "armorToughnessMax");
  alignRangeDefaults("knockbackResistance", "knockbackResistanceMin", "knockbackResistanceMax");
  alignRangeDefaults("stepHeight", "stepHeightMin", "stepHeightMax");
  return merged;
}

function normalizeEntityWeightRows(rows: EntityWeight[] | undefined): EntityWeight[] {
  return (rows ?? []).map((row) => ({
    ...row,
    spawnChance: Number.isFinite(row.spawnChance) ? row.spawnChance : 1,
    properties: normalizeMobProperties(row.properties),
  }));
}

export function normalizeConfig(input: unknown): ApocalypseConfig {
  const parsed = migrateOurMagicSettings(input && typeof input === "object" ? (input as Partial<ApocalypseConfig>) : {});
  const merged = deepMerge(defaultConfig, parsed);
  if (!("entitySpawning" in parsed) && Array.isArray(parsed.entityWeights) && parsed.entityWeights.length > 0) {
    merged.entitySpawning.legacyWeights = parsed.entityWeights;
    merged.entityWeights = parsed.entityWeights;
  }
  merged.entitySpawning.failedChanceBehavior = merged.entitySpawning.failedChanceBehavior ?? "SKIP_SPAWN";
  merged.entitySpawning.legacyWeights = normalizeEntityWeightRows(merged.entitySpawning.legacyWeights);
  merged.entityWeights = normalizeEntityWeightRows(merged.entityWeights);
  merged.entitySpawning.nightProfiles = (merged.entitySpawning.nightProfiles ?? []).map((profile) => ({
    ...profile,
    weights: normalizeEntityWeightRows(profile.weights),
  }));

  const defaultEvent = defaultConfig.scheduledEvents.events[0];
  merged.scheduledEvents = {
    enabled: merged.scheduledEvents?.enabled ?? true,
    events: (merged.scheduledEvents?.events ?? []).map((event, eventIndex) => ({
      ...event,
      id: event.id || `event-${eventIndex + 1}`,
      name: event.name || `Scheduled Event ${eventIndex + 1}`,
      enabled: event.enabled ?? true,
      minDay: Number.isFinite(event.minDay) ? event.minDay : 1,
      maxDay: Number.isFinite(event.maxDay) ? event.maxDay : 30,
      chance: Number.isFinite(event.chance) ? event.chance : 1,
      cooldownTicks: Number.isFinite(event.cooldownTicks) ? event.cooldownTicks : 0,
      runOncePerNight: event.runOncePerNight ?? true,
      eventKind: event.eventKind ?? "COMMAND_SEQUENCE",
      itemDropParty: deepMerge(defaultEvent.itemDropParty, event.itemDropParty),
      experienceFarm: deepMerge(defaultEvent.experienceFarm, event.experienceFarm),
      steps: (event.steps ?? []).map((step, stepIndex) => ({
        ...step,
        id: step.id || `${event.id || `event-${eventIndex + 1}`}-step-${stepIndex + 1}`,
        type: step.type ?? "COMMAND",
      })),
    })),
  };
  delete (merged as ApocalypseConfig & { rewards?: unknown }).rewards;
  merged.integrations = deepMerge(defaultConfig.integrations, merged.integrations);
  return merged;
}

export function loadConfig(): ApocalypseConfig {
  const stored =
    window.localStorage.getItem(CONFIG_STORAGE_KEY) ??
    LEGACY_CONFIG_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
  if (!stored) return normalizeConfig(defaultConfig);
  try {
    return normalizeConfig(JSON.parse(stored));
  } catch {
    return normalizeConfig(defaultConfig);
  }
}

export function loadConnectionSettings(): UiConnectionSettings {
  const stored = window.localStorage.getItem(CONNECTION_STORAGE_KEY);
  if (!stored) return defaultConnectionSettings;
  try {
    return { ...defaultConnectionSettings, ...(JSON.parse(stored) as UiConnectionSettings) };
  } catch {
    return defaultConnectionSettings;
  }
}

export function loadRevision(): number {
  return Number(window.localStorage.getItem(REVISION_STORAGE_KEY) || "1");
}

export function saveConfigLocal(config: ApocalypseConfig, revision: number): string {
  window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  window.localStorage.setItem(REVISION_STORAGE_KEY, String(revision));
  return JSON.stringify(config, null, 2);
}

export function saveConnectionSettings(settings: UiConnectionSettings): void {
  window.localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(settings));
}
