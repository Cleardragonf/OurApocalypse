export type DifficultyMode = "REAL_MONTH_DAY" | "WORLD_DAY_CYCLE" | "MANUAL";
export type ProfileMode = "NIGHT_PROFILES" | "LEGACY_RULES";
export type PropertyValueMode = "FIXED" | "RANGED";

export type MobProperties = {
  enabled: boolean;
  maxHealthMode: PropertyValueMode;
  maxHealth: number;
  maxHealthMin: number;
  maxHealthMax: number;
  attackDamageMode: PropertyValueMode;
  attackDamage: number;
  attackDamageMin: number;
  attackDamageMax: number;
  movementSpeedMode: PropertyValueMode;
  movementSpeed: number;
  movementSpeedMin: number;
  movementSpeedMax: number;
  followRangeMode: PropertyValueMode;
  followRange: number;
  followRangeMin: number;
  followRangeMax: number;
  armorMode: PropertyValueMode;
  armor: number;
  armorMin: number;
  armorMax: number;
  armorToughnessMode: PropertyValueMode;
  armorToughness: number;
  armorToughnessMin: number;
  armorToughnessMax: number;
  knockbackResistanceMode: PropertyValueMode;
  knockbackResistance: number;
  knockbackResistanceMin: number;
  knockbackResistanceMax: number;
  stepHeightMode: PropertyValueMode;
  stepHeight: number;
  stepHeightMin: number;
  stepHeightMax: number;
  persistent: boolean;
  customName: string;
  targetPlayers: boolean;
  breakBlocks: boolean;
  placeBlocks: boolean;
  bridgeGaps: boolean;
  monsterAiWallAttack: boolean;
  wallAttackUseBlockHp: boolean;
  wallAttackCooldownTicks: number;
  wallAttackDamagePerHit: number;
  nerdPoleEnabled: boolean;
  maxPillarHeight: number;
  pillarCooldownTicks: number;
  airBridgeEnabled: boolean;
  maxBridgeLength: number;
  bridgeCooldownTicks: number;
  killAfterPillarOrBridge: boolean;
  frustrationTicks: number;
  monsterAiBuildBlock: string;
  megaAggroEnabled: boolean;
  daytimeMegaAggro: boolean;
  sprintDistance: number;
  destroyTorches: boolean;
  torchRadius: number;
  torchMinDay: number;
  /** Enables MonsterApocalypse-style natural/passive spawn placement checks for non-hostile entities. */
  naturalSpawnEnabled: boolean;
  naturalSpawnMinLight: number;
  naturalSpawnMaxLight: number;
  naturalSpawnYMin: number;
  naturalSpawnYMax: number;
  naturalSpawnAllowWater: boolean;
  naturalSpawnAllowAir: boolean;
  naturalSpawnRequireBlockBelow: boolean;
  naturalSpawnBlockMode: "DISABLED" | "BLACKLIST" | "WHITELIST";
  naturalSpawnBlocks: string[];
  explodingArrows: boolean;
  explodingArrowChance: number;
  explodingArrowPower: number;
  explodingArrowBreakBlocks: boolean;
  creeperWallExplosions: boolean;
  creeperWallExplosionChance: number;
  creeperWallExplosionPower: number;
  creeperWallExplosionCooldownTicks: number;
  endermanTeleportPlayers: boolean;
  endermanTeleportChance: number;
  endermanTeleportRadius: number;
  endermanTeleportCooldownTicks: number;
  spiderWebPlayers: boolean;
  spiderWebChance: number;
  spiderWebCooldownTicks: number;
};

export type ScheduledEventStepType =
  | "COMMAND"
  | "WAIT"
  | "STOP"
  | "TARGET_PLAYER";
export type ScheduledEventTargetMode =
  | "NEAREST_PLAYER"
  | "RANDOM_PLAYER"
  | "ALL_PLAYERS"
  | "SPECIFIC_PLAYER"
  | "EVENT_PLAYER";
export type ScheduledEventKind =
  | "COMMAND_SEQUENCE"
  | "ITEM_DROP_PARTY"
  | "EXPERIENCE_FARM";
export type ModEventCenterMode =
  | "TARGET_PLAYER"
  | "WORLD_SPAWN"
  | "SPECIFIC_COORDINATES";
export type ExperienceProvider = "VANILLA_XP" | "OURMAGIC_API";
export type ScheduledCommandParameterType =
  | "STRING"
  | "NUMBER"
  | "BOOLEAN"
  | "SELECT";
export type ScheduledCommandParameterValue = string | number | boolean;

export type ScheduledCommandParameterDefinition = {
  key: string;
  label: string;
  type: ScheduledCommandParameterType;
  required?: boolean;
  defaultValue?: ScheduledCommandParameterValue;
  options?: string[];
  placeholder?: string;
  helperText?: string;
};

export type ScheduledCommandDefinition = {
  key: string;
  name: string;
  description?: string;
  parameters: ScheduledCommandParameterDefinition[];
};

export type ScheduledEventStep = {
  id: string;
  type: ScheduledEventStepType;
  /** Registry-style command key, such as "give" or "difficulty". */
  commandKey?: string;
  /** Structured parameter values used to generate command. */
  commandArgs?: Record<string, ScheduledCommandParameterValue>;
  /** Generated server command line. Store with or without leading slash; UI displays a slash-style command line. */
  command?: string;
  waitTicks?: number;
  targetMode?: ScheduledEventTargetMode;
  targetPlayerName?: string;
  notes?: string;
};

export type ItemDropPartyItemRule = {
  id: string;
  enabled: boolean;
  item: string;
  weight: number;
  minCount: number;
  maxCount: number;
  chance: number;
};

export type ItemDropPartySettings = {
  targetMode: ScheduledEventTargetMode;
  targetPlayerName: string;
  centerMode: ModEventCenterMode;
  x: number;
  y: number;
  z: number;
  radius: number;
  durationTicks: number;
  intervalTicks: number;
  maxItemsPerInterval: number;
  announce: boolean;
  items: ItemDropPartyItemRule[];
};

export type ExperienceFarmSettings = {
  targetMode: ScheduledEventTargetMode;
  targetPlayerName: string;
  provider: ExperienceProvider;
  amountPerInterval: number;
  durationTicks: number;
  intervalTicks: number;
  multiplier: number;
  reason: string;
  announce: boolean;
};

export type ScheduledEvent = {
  id: string;
  name: string;
  enabled: boolean;
  minDay: number;
  maxDay: number;
  chance: number;
  cooldownTicks: number;
  runOncePerNight: boolean;
  eventKind: ScheduledEventKind;
  itemDropParty: ItemDropPartySettings;
  experienceFarm: ExperienceFarmSettings;
  steps: ScheduledEventStep[];
};

export type ScheduledEventsConfig = {
  enabled: boolean;
  events: ScheduledEvent[];
};

export type RewardTargetMode =
  | "KILLER"
  | "NEAREST_PLAYER"
  | "ALL_PLAYERS"
  | "EVENT_TARGET";
export type RewardType = "VANILLA_XP" | "OURMAGIC_XP";

export type RewardRule = {
  id: string;
  enabled: boolean;
  entity: string;
  minDay: number;
  chance: number;
  targetMode: RewardTargetMode;
  rewardType: RewardType;
  minExperience: number;
  maxExperience: number;
  reason: string;
};

export type RewardsConfig = {
  enabled: boolean;
  rules: RewardRule[];
};

export type IntegrationsConfig = {
  ourMagic: {
    enabled: boolean;
    host: string;
    port: number;
    token: string;
  };
};

export type EconomyDeathCostMode = "FIXED" | "PERCENT_BALANCE";
export type EconomyWalletLootMode = "FIXED" | "PERCENT_BALANCE";
export type EconomyKillRewardTargetMode =
  | "KILLER"
  | "NEAREST_PLAYER"
  | "ALL_PLAYERS"
  | "ALL_PARTICIPANTS"
  | "TOP_DAMAGER";
export type EconomyParticipantRewardMode =
  | "FULL_TO_EACH_PARTICIPANT"
  | "SPLIT_BETWEEN_PARTICIPANTS"
  | "PROPORTIONAL_BY_DAMAGE";

export type EconomyDeathCostRule = {
  id: string;
  enabled: boolean;
  deathCause: string;
  mode: EconomyDeathCostMode;
  amount: number;
  percent: number;
  reason: string;
};

export type EconomyEntityRewardRule = {
  id: string;
  enabled: boolean;
  entity: string;
  minDay: number;
  chance: number;
  minAmount: number;
  maxAmount: number;
  targetMode: EconomyKillRewardTargetMode;
  participantRewardMode?: EconomyParticipantRewardMode;
  lootVictimWalletEnabled?: boolean;
  lootVictimWalletMode?: EconomyWalletLootMode;
  lootVictimWalletMinAmount?: number;
  lootVictimWalletMaxAmount?: number;
  lootVictimWalletPercent?: number;
  lootVictimWalletMaxPercentAmount?: number;
  reason: string;
};

export type EconomyMarketListing = {
  id: string;
  enabled: boolean;
  item: string;
  displayName: string;
  price: number;
  minDay: number;
  maxPerPurchase: number;
  stock: number;
  playerPurchaseLimit: number;
  commandOnPurchase: string;
};

export type EconomyConfig = {
  enabled: boolean;
  currencyName: string;
  startingBalance: number;
  payWhileActive: {
    enabled: boolean;
    amountPerHour: number;
    payoutIntervalSeconds: number;
    afkStopsTimer: boolean;
    afkTimeoutSeconds: number;
  };
  deathCosts: {
    enabled: boolean;
    defaultMode: EconomyDeathCostMode;
    defaultAmount: number;
    defaultPercent: number;
    rules: EconomyDeathCostRule[];
  };
  killRewards: {
    enabled: boolean;
    defaultMinAmount: number;
    defaultMaxAmount: number;
    defaultChance: number;
    rules: EconomyEntityRewardRule[];
  };
  market: {
    enabled: boolean;
    loggedInPlayersOnly: boolean;
    allowOutOfStockPurchases: boolean;
    listings: EconomyMarketListing[];
  };
};


export type MonsterApocalypseSpawnPoint = {
  id: string;
  name: string;
  enabled: boolean;
  dimension: string;
  x: number;
  y: number;
  z: number;
  entity: string;
  periodTicks: number;
  count: number;
  minLight: number;
  maxLight: number;
  chance: number;
};

export type MonsterApocalypseConfig = {
  enabled: boolean;
  note: string;
  nightmare: {
    alwaysNight: boolean;
    multiplier: number;
    periodTicks: number;
    exponential: boolean;
  };
  bonusSpawns: {
    enabled: boolean;
    monstersPerPlayer: number;
    spawnChance: number;
    periodTicks: number;
    minDistance: number;
    maxDistance: number;
    yOffset: number;
    minLight: number;
    maxLight: number;
    spawnInAir: boolean;
    naturalisticEnabled: boolean;
    naturalisticAttemptsPerTick: number;
    naturalisticCountPerSpot: number;
    naturalisticYMin: number;
    naturalisticYMax: number;
  };
  monsterBehavior: {
    megaAggroEnabled: boolean;
    daytimeMegaAggro: boolean;
    sprintDistance: number;
    destroyTorches: boolean;
    torchRadius: number;
    torchMinDay: number;
    zombieWallAttack: boolean;
    wallAttackUseBlockHp: boolean;
    wallAttackCooldownTicks: number;
    wallAttackDamagePerHit: number;
    pillarUp: boolean;
    maxPillarHeight: number;
    pillarCooldownTicks: number;
    airBridge: boolean;
    maxBridgeLength: number;
    bridgeCooldownTicks: number;
    killAfterPillarOrBridge: boolean;
    frustrationTicks: number;
    buildingBlock: string;
    superSkeletons: boolean;
    witherSkeletonSuperArrows: boolean;
    superArrowPeriodTicks: number;
    superArrowChance: number;
    superArrowRangeXZ: number;
    superArrowRangeY: number;
    superArrowPlayerProtectionRadius: number;
    actionRpgDamagePeriodMs: number;
  };
  spawnBlockFilter: {
    enabled: boolean;
    invertToWhitelist: boolean;
    blocks: string[];
  };
  spawnPoints: MonsterApocalypseSpawnPoint[];
};

export type ClearLagConfig = {
  enabled: boolean;
  intervalSeconds: number;
  warningSeconds: number;
  maxEntitiesPerRun: number;
  announceWarning: boolean;
  announceCompletion: boolean;
  removeDroppedItems: boolean;
  removeExperienceOrbs: boolean;
  removeProjectiles: boolean;
  removeEmptyVehicles: boolean;
  itemWhitelist: string[];
  warningMessage: string;
  completionMessage: string;
};

export type CommandRegistryEntry = {
  name: string;
  usage?: string;
  childCount?: number;
};

export type EntityWeight = {
  entity: string;
  weight: number;
  minDay: number;
  /** 0.0 to 1.0. 1.0 means 100% chance after this entity wins the weighted roll. */
  spawnChance: number;
  enabled: boolean;
  /** Optional profile-specific mob property modifiers applied after spawn. */
  properties?: MobProperties;
};

export type PlacementBlockRule = {
  block: string;
  weight: number;
  minDay: number;
  enabled: boolean;
};

export type WaveProfile = {
  id: string;
  name: string;
  enabled: boolean;
  minDay: number;
  maxDay: number;
  weight: number;
  minWaves: number;
  maxWaves: number;
  minMobs: number;
  maxMobs: number;
  spawnRadiusMin: number;
  spawnRadiusMax: number;
  maxSpawnAttemptsPerMob: number;
  spawnAroundEachPlayer: boolean;
  avoidCreativeAndSpectator: boolean;
  announceWaves: boolean;
};

export type EntitySpawnProfile = {
  id: string;
  name: string;
  enabled: boolean;
  minDay: number;
  maxDay: number;
  weight: number;
  weights: EntityWeight[];
};

export type DropRule = {
  entity: string;
  item: string;
  minCount: number;
  maxCount: number;
  chance: number;
  minDay: number;
  enabled: boolean;
  /** Optional economy money reward that lives with this drop rule/profile row. */
  economyRewardEnabled?: boolean;
  economyRewardChance?: number;
  economyRewardMinAmount?: number;
  economyRewardMaxAmount?: number;
  economyRewardTargetMode?: EconomyKillRewardTargetMode;
  economyRewardParticipantMode?: EconomyParticipantRewardMode;
  economyRewardReason?: string;
  /** Optional non-item reward that lives with this drop rule/profile row. */
  ourMagicRewardEnabled?: boolean;
  ourMagicRewardChance?: number;
  ourMagicRewardTargetMode?: RewardTargetMode;
  ourMagicRewardMinExperience?: number;
  ourMagicRewardMaxExperience?: number;
  ourMagicRewardReason?: string;
};

export type DropProfile = {
  id: string;
  name: string;
  enabled: boolean;
  minDay: number;
  maxDay: number;
  weight: number;
  overrideVanillaDrops: boolean;
  rules: DropRule[];
};

export type ApocalypseConfig = {
  enabled: boolean;
  difficultyMode: DifficultyMode;
  manualDifficultyDay: number;
  adminApi: {
    enabled: boolean;
    host: string;
    port: number;
    adminToken: string;
    requireToken: boolean;
  };
  waves: {
    enabled: boolean;
    onlyAtNight: boolean;
    tickCheckInterval: number;
    activeMode: ProfileMode;
    nightProfiles: WaveProfile[];
    minWavesDay1: number;
    maxWavesDay1: number;
    minWavesDay30: number;
    maxWavesDay30: number;
    minMobsDay1: number;
    maxMobsDay1: number;
    minMobsDay30: number;
    maxMobsDay30: number;
    spawnRadiusMin: number;
    spawnRadiusMax: number;
    maxSpawnAttemptsPerMob: number;
    spawnAroundEachPlayer: boolean;
    avoidCreativeAndSpectator: boolean;
    announceWaves: boolean;
  };
  entitySpawning: {
    activeMode: ProfileMode;
    /** SKIP_SPAWN = failed chance produces no mob. REROLL_ENTITY = try another entity after a failed chance roll. */
    failedChanceBehavior: "SKIP_SPAWN" | "REROLL_ENTITY";
    legacyWeights: EntityWeight[];
    nightProfiles: EntitySpawnProfile[];
  };
  behavior: {
    enabled: boolean;
    mobTickInterval: number;
    targetRangeDay1: number;
    targetRangeDay30: number;
    navigationSpeedDay1: number;
    navigationSpeedDay30: number;
    breakBlocks: boolean;
    breakBlocksMinDay: number;
    maxBreakHardnessDay1: number;
    maxBreakHardnessDay30: number;
    dropBrokenBlocks: boolean;
    placeBlocks: boolean;
    placeBlocksMinDay: number;
    bridgeGaps: boolean;
    bridgeMinDay: number;
    placementBlock: string;
    placementBlocks: PlacementBlockRule[];
    protectSpawnRadius: number;
    protectedBlocks: string[];
  };
  cleanup: {
    enabled: boolean;
    trackPlacedBlocks: boolean;
    rollbackOnlyIfBlockStillMatches: boolean;
    rollbackOnServerStart: boolean;
    maxLedgerEntries: number;
    maxRollbackPerRequest: number;
  };
  drops: {
    enabled: boolean;
    overrideVanillaDrops: boolean;
    activeMode: ProfileMode;
    nightProfiles: DropProfile[];
    rules: DropRule[];
  };
  scheduledEvents: ScheduledEventsConfig;
  clearLag: ClearLagConfig;
  economy: EconomyConfig;
  monsterApocalypse: MonsterApocalypseConfig;
  /** Legacy hidden field from the old separate Rewards tab. New XP rewards live on drops.rules. */
  rewards?: RewardsConfig;
  integrations: IntegrationsConfig;
  /** Legacy mirror retained for older configs/mod code. */
  entityWeights: EntityWeight[];
  entityBlacklist: string[];
  allowedDimensions: string[];
};

export type UiConnectionSettings = {
  modApiBaseUrl: string;
  adminToken: string;
  pollSeconds: number;
  autoApplyLive: boolean;
};

export type ModStatus = {
  modId?: string;
  modVersion?: string;
  connected?: boolean;
  communication?: string;
  configPath?: string;
  ledgerPath?: string;
  configRevision?: number;
  players?: number;
  maxPlayers?: number;
  serverTickCount?: number;
  difficultyDay?: number;
  dayTime?: number;
  gameTime?: number;
  dimension?: string;
  activeWaveProfile?: string;
  activeEntityProfile?: string;
  placedBlockOpenCount?: number;
  placedBlockTotalCount?: number;
  lastMessageAt?: string;
};

export type PlacedBlockRecord = {
  id: string;
  dimension: string;
  x: number;
  y: number;
  z: number;
  previousBlock: string;
  placedBlock: string;
  reason: string;
  entityType: string;
  entityUuid: string;
  gameTime: number;
  createdAt: string;
  rolledBack: boolean;
  rolledBackAt?: string;
  notes?: string;
};

export type PlacedBlocksResponse = {
  ledgerPath: string;
  openCount: number;
  totalCount: number;
  records: PlacedBlockRecord[];
};

export type RollbackSummary = {
  requested: number;
  scanned: number;
  rolledBack: number;
  skipped: number;
};
