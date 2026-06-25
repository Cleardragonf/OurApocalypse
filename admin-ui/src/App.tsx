import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloudDoneIcon from '@mui/icons-material/CloudDone';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import RestoreIcon from '@mui/icons-material/Restore';
import SaveIcon from '@mui/icons-material/Save';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { ApocalypseConfig, EntityWeight, MobProperties, ModStatus, PlacedBlocksResponse, PlacementBlockRule, RollbackSummary, UiConnectionSettings } from './types';
import { defaultConfig, defaultConnectionSettings } from './defaultConfig';
import DropRulesTable from './components/DropRulesTable';
import WaveProfilesEditor from './components/WaveProfilesEditor';
import EntitySpawnProfilesEditor from './components/EntitySpawnProfilesEditor';
import ScheduledEventsEditor from './components/ScheduledEventsEditor';

const CONFIG_STORAGE_KEY = 'apocalypse-mobs-ui-owned-config-v7';
const LEGACY_CONFIG_STORAGE_KEYS = ['apocalypse-mobs-ui-owned-config-v6', 'apocalypse-mobs-ui-owned-config-v5', 'apocalypse-mobs-ui-owned-config-v4'];
const CONNECTION_STORAGE_KEY = 'apocalypse-mobs-rest-connection-v1';
const REVISION_STORAGE_KEY = 'apocalypse-mobs-local-revision-v7';

type MainPageKey = 'admin' | 'apocalypse' | 'scheduled-events' | 'clear-lag';
type AdminTabKey = 'current' | 'config';
type ApocalypseTabKey = 'waves' | 'entities' | 'drops' | 'cleanup' | 'json';

function cloneConfig(config: ApocalypseConfig): ApocalypseConfig {
  return JSON.parse(JSON.stringify(config)) as ApocalypseConfig;
}

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function deepMerge<T>(base: T, patch: unknown): T {
  if (Array.isArray(base)) return (Array.isArray(patch) ? patch : base) as T;
  if (base && typeof base === 'object') {
    const result: Record<string, unknown> = { ...(base as Record<string, unknown>) };
    const patchObject = patch && typeof patch === 'object' ? (patch as Record<string, unknown>) : {};
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
  const legacyUrl = typeof migrated.gatewayUrl === 'string'
    ? migrated.gatewayUrl
    : typeof migrated.baseUrl === 'string'
      ? `${migrated.baseUrl.replace(/\/+$/, '')}/${String(migrated.giveExperiencePath || 'api/mod/our-magic/experience').replace(/^\/+/, '')}`
      : '';

  if (legacyUrl && typeof migrated.host !== 'string') {
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

  const migratedOurMagic: ApocalypseConfig['integrations']['ourMagic'] = {
    enabled: typeof migrated.enabled === 'boolean' ? migrated.enabled : defaultConfig.integrations.ourMagic.enabled,
    host: typeof migrated.host === 'string' && migrated.host.trim() ? migrated.host : defaultConfig.integrations.ourMagic.host,
    port: typeof migrated.port === 'number' && Number.isFinite(migrated.port) ? migrated.port : defaultConfig.integrations.ourMagic.port,
    token: typeof migrated.token === 'string' ? migrated.token : defaultConfig.integrations.ourMagic.token,
  };

  return {
    ...input,
    integrations: {
      ...input.integrations,
      ourMagic: migratedOurMagic,
    },
  };
}


function defaultMobProperties(): MobProperties {
  return {
    enabled: false,
    maxHealthMode: 'FIXED',
    maxHealth: 0,
    maxHealthMin: 0,
    maxHealthMax: 0,
    attackDamageMode: 'FIXED',
    attackDamage: 0,
    attackDamageMin: 0,
    attackDamageMax: 0,
    movementSpeedMode: 'FIXED',
    movementSpeed: 0,
    movementSpeedMin: 0,
    movementSpeedMax: 0,
    followRangeMode: 'FIXED',
    followRange: 0,
    followRangeMin: 0,
    followRangeMax: 0,
    armorMode: 'FIXED',
    armor: 0,
    armorMin: 0,
    armorMax: 0,
    armorToughnessMode: 'FIXED',
    armorToughness: 0,
    armorToughnessMin: 0,
    armorToughnessMax: 0,
    knockbackResistanceMode: 'FIXED',
    knockbackResistance: 0,
    knockbackResistanceMin: 0,
    knockbackResistanceMax: 0,
    stepHeightMode: 'FIXED',
    stepHeight: 0,
    stepHeightMin: 0,
    stepHeightMax: 0,
    persistent: false,
    customName: '',
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
    spiderWebCooldownTicks: 100
  };
}

function normalizeMobProperties(properties: Partial<MobProperties> | undefined): MobProperties {
  const merged = { ...defaultMobProperties(), ...(properties ?? {}) };

  const legacy = (properties ?? {}) as Record<string, unknown>;
  const copyLegacy = (nextKey: keyof MobProperties, oldKey: string) => {
    const nextRecord = merged as Record<string, unknown>;
    if (nextRecord[nextKey as string] === defaultMobProperties()[nextKey] && typeof legacy[oldKey] !== 'undefined') {
      nextRecord[nextKey as string] = legacy[oldKey];
    }
  };
  copyLegacy('maxHealthMode', 'maxHealthMultiplierMode');
  copyLegacy('maxHealth', 'maxHealthMultiplier');
  copyLegacy('maxHealthMin', 'maxHealthMultiplierMin');
  copyLegacy('maxHealthMax', 'maxHealthMultiplierMax');
  copyLegacy('attackDamageMode', 'attackDamageMultiplierMode');
  copyLegacy('attackDamage', 'attackDamageMultiplier');
  copyLegacy('attackDamageMin', 'attackDamageMultiplierMin');
  copyLegacy('attackDamageMax', 'attackDamageMultiplierMax');
  copyLegacy('movementSpeedMode', 'movementSpeedMultiplierMode');
  copyLegacy('movementSpeed', 'movementSpeedMultiplier');
  copyLegacy('movementSpeedMin', 'movementSpeedMultiplierMin');
  copyLegacy('movementSpeedMax', 'movementSpeedMultiplierMax');
  copyLegacy('followRangeMode', 'followRangeMultiplierMode');
  copyLegacy('followRange', 'followRangeMultiplier');
  copyLegacy('followRangeMin', 'followRangeMultiplierMin');
  copyLegacy('followRangeMax', 'followRangeMultiplierMax');
  copyLegacy('armor', 'armorBonus');
  copyLegacy('armorMin', 'armorBonusMin');
  copyLegacy('armorMax', 'armorBonusMax');
  copyLegacy('armorMode', 'armorBonusMode');
  copyLegacy('armorToughness', 'armorToughnessBonus');
  copyLegacy('armorToughnessMin', 'armorToughnessBonusMin');
  copyLegacy('armorToughnessMax', 'armorToughnessBonusMax');
  copyLegacy('armorToughnessMode', 'armorToughnessBonusMode');
  copyLegacy('knockbackResistance', 'knockbackResistanceBonus');
  copyLegacy('knockbackResistanceMin', 'knockbackResistanceBonusMin');
  copyLegacy('knockbackResistanceMax', 'knockbackResistanceBonusMax');
  copyLegacy('knockbackResistanceMode', 'knockbackResistanceBonusMode');
  const alignRangeDefaults = (valueKey: keyof MobProperties, minKey: keyof MobProperties, maxKey: keyof MobProperties) => {
    const raw = properties as Record<string, unknown> | undefined;
    const fixed = merged[valueKey];
    if (typeof fixed !== 'number') return;
    if (typeof raw?.[minKey as string] !== 'number') {
      (merged as Record<string, unknown>)[minKey as string] = fixed;
    }
    if (typeof raw?.[maxKey as string] !== 'number') {
      (merged as Record<string, unknown>)[maxKey as string] = fixed;
    }
  };
  alignRangeDefaults('maxHealth', 'maxHealthMin', 'maxHealthMax');
  alignRangeDefaults('attackDamage', 'attackDamageMin', 'attackDamageMax');
  alignRangeDefaults('movementSpeed', 'movementSpeedMin', 'movementSpeedMax');
  alignRangeDefaults('followRange', 'followRangeMin', 'followRangeMax');
  alignRangeDefaults('armor', 'armorMin', 'armorMax');
  alignRangeDefaults('armorToughness', 'armorToughnessMin', 'armorToughnessMax');
  alignRangeDefaults('knockbackResistance', 'knockbackResistanceMin', 'knockbackResistanceMax');
  alignRangeDefaults('stepHeight', 'stepHeightMin', 'stepHeightMax');
  return merged;
}

function normalizeEntityWeightRows(rows: EntityWeight[] | undefined): EntityWeight[] {
  return (rows ?? []).map((row) => ({
    ...row,
    spawnChance: Number.isFinite(row.spawnChance) ? row.spawnChance : 1,
    properties: normalizeMobProperties(row.properties)
  }));
}

function normalizeConfig(input: unknown): ApocalypseConfig {
  const parsed = migrateOurMagicSettings(input && typeof input === 'object' ? input as Partial<ApocalypseConfig> : {});
  const merged = deepMerge(defaultConfig, parsed);
  if (!('entitySpawning' in parsed) && Array.isArray(parsed.entityWeights) && parsed.entityWeights.length > 0) {
    merged.entitySpawning.legacyWeights = parsed.entityWeights;
    merged.entityWeights = parsed.entityWeights;
  }
  merged.entitySpawning.failedChanceBehavior = merged.entitySpawning.failedChanceBehavior ?? 'SKIP_SPAWN';
  merged.entitySpawning.legacyWeights = normalizeEntityWeightRows(merged.entitySpawning.legacyWeights);
  merged.entityWeights = normalizeEntityWeightRows(merged.entityWeights);
  merged.entitySpawning.nightProfiles = (merged.entitySpawning.nightProfiles ?? []).map((profile) => ({
    ...profile,
    weights: normalizeEntityWeightRows(profile.weights)
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
      eventKind: event.eventKind ?? 'COMMAND_SEQUENCE',
      itemDropParty: deepMerge(defaultEvent.itemDropParty, event.itemDropParty),
      experienceFarm: deepMerge(defaultEvent.experienceFarm, event.experienceFarm),
      steps: (event.steps ?? []).map((step, stepIndex) => ({
        ...step,
        id: step.id || `${event.id || `event-${eventIndex + 1}`}-step-${stepIndex + 1}`,
        type: step.type ?? 'COMMAND'
      }))
    }))
  };
  delete (merged as ApocalypseConfig & { rewards?: unknown }).rewards;
  merged.integrations = deepMerge(defaultConfig.integrations, merged.integrations);
  return merged;
}

function loadConfig(): ApocalypseConfig {
  const stored = window.localStorage.getItem(CONFIG_STORAGE_KEY)
    ?? LEGACY_CONFIG_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);
  if (!stored) return normalizeConfig(defaultConfig);
  try {
    return normalizeConfig(JSON.parse(stored));
  } catch {
    return normalizeConfig(defaultConfig);
  }
}

function loadConnectionSettings(): UiConnectionSettings {
  const stored = window.localStorage.getItem(CONNECTION_STORAGE_KEY);
  if (!stored) return defaultConnectionSettings;
  try {
    return { ...defaultConnectionSettings, ...(JSON.parse(stored) as UiConnectionSettings) };
  } catch {
    return defaultConnectionSettings;
  }
}

function apiBase(settings: UiConnectionSettings): string {
  return settings.modApiBaseUrl.replace(/\/$/, '');
}

function apiHeaders(settings: UiConnectionSettings): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-apocalypse-token': settings.adminToken
  };
}

export default function App() {
  const [mainPage, setMainPage] = useState<MainPageKey>('admin');
  const [adminTab, setAdminTab] = useState<AdminTabKey>('current');
  const [apocalypseTab, setApocalypseTab] = useState<ApocalypseTabKey>('waves');
  const [config, setConfig] = useState<ApocalypseConfig>(() => loadConfig());
  const [connectionSettings, setConnectionSettings] = useState<UiConnectionSettings>(() => loadConnectionSettings());
  const [revision, setRevision] = useState(() => Number(window.localStorage.getItem(REVISION_STORAGE_KEY) || '1'));
  const [appliedRevision, setAppliedRevision] = useState<number | null>(null);
  const [modStatus, setModStatus] = useState<ModStatus | null>(null);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlocksResponse | null>(null);
  const [registryItems, setRegistryItems] = useState<string[]>([]);
  const [registryCommands, setRegistryCommands] = useState<string[]>([]);
  const [online, setOnline] = useState(false);
  const [notice, setNotice] = useState('UI config is stored locally and remains editable when the mod is offline.');
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState(() => JSON.stringify(loadConfig(), null, 2));
  const [rollbackLimit, setRollbackLimit] = useState(250);
  const pollTimerRef = useRef<number | null>(null);
  const liveApplyTimerRef = useRef<number | null>(null);
  const registryItemsLoadedRef = useRef(false);
  const registryCommandsLoadedRef = useRef(false);

  const effectiveDifficultyDay = modStatus?.difficultyDay ?? config.manualDifficultyDay;
  const effectiveWeights = useMemo(() => {
    const blacklist = new Set(config.entityBlacklist);
    const source = config.entitySpawning?.legacyWeights?.length ? config.entitySpawning.legacyWeights : config.entityWeights;
    const active = source.filter((entry) => entry.enabled && effectiveDifficultyDay >= entry.minDay && !blacklist.has(entry.entity));
    const total = active.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
    return active.map((entry) => {
      const selectionChance = total > 0 ? (entry.weight / total) * 100 : 0;
      const spawnChance = Number.isFinite(entry.spawnChance) ? entry.spawnChance : 1;
      return {
        ...entry,
        spawnChance,
        selectionChance,
        perAttemptChance: selectionChance * spawnChance
      };
    });
  }, [config, effectiveDifficultyDay]);

  const saveLocalOnly = (nextConfig: ApocalypseConfig, nextRevision = revision) => {
    window.localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(nextConfig));
    window.localStorage.setItem(REVISION_STORAGE_KEY, String(nextRevision));
    setRawJson(JSON.stringify(nextConfig, null, 2));
  };

  const updateConfig = (updater: (draft: ApocalypseConfig) => void) => {
    setConfig((prev) => {
      const copy = cloneConfig(prev);
      updater(copy);
      const nextRevision = revision + 1;
      setRevision(nextRevision);
      saveLocalOnly(copy, nextRevision);
      return copy;
    });
  };

  const updateConnectionSettings = (patch: Partial<UiConnectionSettings>) => {
    setConnectionSettings((prev) => {
      const next = { ...prev, ...patch };
      window.localStorage.setItem(CONNECTION_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  };

  const fetchRegistryItems = async (quiet = true) => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/registry/items`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Registry item fetch failed: ${res.status}`);
      const body = (await res.json()) as { items?: string[] };
      setRegistryItems(Array.isArray(body.items) ? body.items : []);
      registryItemsLoadedRef.current = true;
      if (!quiet) setNotice(`Loaded ${body.items?.length ?? 0} item registry entries from the mod.`);
      return body.items ?? [];
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : 'Unable to load item registry from mod.');
      return [];
    }
  };


  const fetchRegistryCommands = async (quiet = true) => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/registry/commands`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Command registry fetch failed: ${res.status}`);
      const body = (await res.json()) as { commands?: Array<string | { name?: string }> };
      const commands = (body.commands ?? [])
        .map((entry) => typeof entry === 'string' ? entry : entry.name)
        .filter((entry): entry is string => typeof entry === 'string' && entry.trim().length > 0)
        .map((entry) => entry.replace(/^\//, ''));
      setRegistryCommands(commands);
      registryCommandsLoadedRef.current = true;
      if (!quiet) setNotice(`Loaded ${commands.length} server command entries from the mod.`);
      return commands;
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : 'Unable to load command registry from mod.');
      return [];
    }
  };

  const fetchCommandSuggestions = async (input: string): Promise<string[]> => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/registry/command-suggestions?input=${encodeURIComponent(input)}`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Command suggestions failed: ${res.status}`);
      const body = (await res.json()) as { suggestions?: string[] };
      return Array.isArray(body.suggestions) ? body.suggestions : [];
    } catch {
      return [];
    }
  };

  const fetchStatus = async (quiet = false) => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/status`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Status failed: ${res.status}`);
      const status = (await res.json()) as ModStatus;
      setModStatus({ ...status, connected: true, lastMessageAt: new Date().toISOString() });
      setOnline(true);
      setError(null);
      if (!quiet) setNotice('Connected to mod REST API.');
      if (!registryItemsLoadedRef.current) {
        void fetchRegistryItems(true);
      }
      if (!registryCommandsLoadedRef.current) {
        void fetchRegistryCommands(true);
      }
      return status;
    } catch (err) {
      setOnline(false);
      setModStatus((prev) => (prev ? { ...prev, connected: false } : null));
      if (!quiet) setError(err instanceof Error ? err.message : 'Unable to reach mod REST API.');
      return null;
    }
  };

  const applyConfigToMod = async (source = 'manual') => {
    saveLocalOnly(config, revision);
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/config`, {
        method: 'PUT',
        headers: apiHeaders(connectionSettings),
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error(`Apply failed: ${res.status}`);
      const body = (await res.json()) as { revision?: number; status?: ModStatus };
      setOnline(true);
      setAppliedRevision(revision);
      if (body.status) setModStatus({ ...body.status, connected: true, lastMessageAt: new Date().toISOString() });
      setNotice(`Applied UI config revision ${revision} to mod via REST (${source}).`);
      setError(null);
      return true;
    } catch (err) {
      setOnline(false);
      setNotice(`Saved local revision ${revision}. It will apply when the mod REST API is reachable.`);
      setError(err instanceof Error ? err.message : 'Unable to apply config to mod.');
      return false;
    }
  };

  const fetchPlacedBlocks = async () => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/placed-blocks?limit=500`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Placed blocks failed: ${res.status}`);
      const body = (await res.json()) as PlacedBlocksResponse;
      setPlacedBlocks(body);
      setOnline(true);
      setError(null);
    } catch (err) {
      setOnline(false);
      setError(err instanceof Error ? err.message : 'Unable to fetch placed block ledger.');
    }
  };

  const rollbackPlacedBlocks = async (all = false) => {
    try {
      const query = all ? 'all=true' : `limit=${rollbackLimit}`;
      const res = await fetch(`${apiBase(connectionSettings)}/api/rollback/placed-blocks?${query}`, {
        method: 'POST',
        headers: apiHeaders(connectionSettings)
      });
      if (!res.ok) throw new Error(`Rollback failed: ${res.status}`);
      const body = (await res.json()) as { summary: RollbackSummary; status?: ModStatus };
      setNotice(`Rollback complete. Rolled back ${body.summary.rolledBack}, skipped ${body.summary.skipped}.`);
      if (body.status) setModStatus({ ...body.status, connected: true, lastMessageAt: new Date().toISOString() });
      await fetchPlacedBlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rollback failed.');
    }
  };

  useEffect(() => {
    registryItemsLoadedRef.current = false;
    registryCommandsLoadedRef.current = false;
    setRegistryItems([]);
    setRegistryCommands([]);
  }, [connectionSettings.modApiBaseUrl, connectionSettings.adminToken]);

  useEffect(() => {
    fetchStatus(true).then((status) => {
      if (status && connectionSettings.autoApplyLive && appliedRevision !== revision) {
        applyConfigToMod('startup-auto-apply');
      }
    });

    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = window.setInterval(async () => {
      const status = await fetchStatus(true);
      if (status && connectionSettings.autoApplyLive && appliedRevision !== revision) {
        await applyConfigToMod('poll-auto-apply');
      }
    }, Math.max(1, connectionSettings.pollSeconds) * 1000);

    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionSettings.modApiBaseUrl, connectionSettings.adminToken, connectionSettings.pollSeconds, connectionSettings.autoApplyLive, revision, appliedRevision]);

  useEffect(() => {
    saveLocalOnly(config, revision);
    if (!connectionSettings.autoApplyLive || !online) return;
    if (appliedRevision === revision) return;
    if (liveApplyTimerRef.current) window.clearTimeout(liveApplyTimerRef.current);
    liveApplyTimerRef.current = window.setTimeout(() => {
      applyConfigToMod('live-debounce');
    }, 750);
    return () => {
      if (liveApplyTimerRef.current) window.clearTimeout(liveApplyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, revision]);

  const resetToDefaults = () => {
    const nextRevision = revision + 1;
    setConfig(defaultConfig);
    setRevision(nextRevision);
    saveLocalOnly(defaultConfig, nextRevision);
    setNotice('Reset local UI config to defaults.');
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `apocalypse-mobs-ui-config-rev-${revision}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (file: File | null) => {
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = normalizeConfig(JSON.parse(text));
        const nextRevision = revision + 1;
        setConfig(parsed);
        setRevision(nextRevision);
        saveLocalOnly(parsed, nextRevision);
        setNotice(`Imported ${file.name} as local config revision ${nextRevision}.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Import failed.');
      }
    });
  };

  const applyRawJson = () => {
    try {
      const parsed = normalizeConfig(JSON.parse(rawJson));
      const nextRevision = revision + 1;
      setConfig(parsed);
      setRevision(nextRevision);
      saveLocalOnly(parsed, nextRevision);
      setError(null);
      setNotice(`Applied raw JSON as local revision ${nextRevision}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Raw JSON is invalid.');
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
          <Box>
            <Typography variant="h4" fontWeight={900}>Apocalypse Mobs Admin</Typography>
            <Typography color="text.secondary">UI-owned config, REST/polling communication, offline-safe editing, and mob-placed block rollback.</Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip icon={online ? <CloudDoneIcon /> : <CloudOffIcon />} color={online ? 'success' : 'default'} label={online ? 'Mod API Online' : 'Offline / UI only'} />
            <Chip color="primary" label={`Local rev ${revision}`} />
            <Chip color={appliedRevision === revision ? 'success' : 'warning'} label={appliedRevision === revision ? 'Applied' : 'Pending apply'} />
          </Stack>
        </Stack>

        {notice && <Alert severity="info">{notice}</Alert>}
        {error && <Alert severity="warning" onClose={() => setError(null)}>{error}</Alert>}

        <Card>
          <Tabs value={mainPage} onChange={(_, value) => setMainPage(value)} variant="scrollable" scrollButtons="auto">
            <Tab value="admin" label="Admin" />
            <Tab value="apocalypse" label="Apocalypse" />
            <Tab value="scheduled-events" label="Scheduled Events" />
            <Tab value="clear-lag" label="Clear Lag" />
          </Tabs>
        </Card>

        {mainPage === 'admin' && (
          <>
            <Card>
              <Tabs value={adminTab} onChange={(_, value) => setAdminTab(value)} variant="scrollable" scrollButtons="auto">
                <Tab value="current" label="Current" />
                <Tab value="config" label="Config" />
              </Tabs>
            </Card>

        {adminTab === 'current' && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <Card><CardContent><Stack spacing={2}>
                <Typography variant="h6">Connection</Typography>
                <Alert severity="info">This is REST/polling now — not WebSocket. The UI remains usable even if the mod cannot be reached.</Alert>
                <TextField fullWidth label="Mod REST API Base URL" value={connectionSettings.modApiBaseUrl} onChange={(event) => updateConnectionSettings({ modApiBaseUrl: event.target.value })} />
                <TextField fullWidth label="Admin Token" value={connectionSettings.adminToken} onChange={(event) => updateConnectionSettings({ adminToken: event.target.value })} />
                <TextField type="number" label="Poll Seconds" value={connectionSettings.pollSeconds} onChange={(event) => updateConnectionSettings({ pollSeconds: numberValue(event.target.value, connectionSettings.pollSeconds) })} />
                <FormControlLabel control={<Switch checked={connectionSettings.autoApplyLive} onChange={(event) => updateConnectionSettings({ autoApplyLive: event.target.checked })} />} label="Auto-apply local changes when mod API is reachable" />
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Button startIcon={<RefreshIcon />} variant="outlined" onClick={() => fetchStatus()}>Check Status</Button>
                  <Button startIcon={<SaveIcon />} variant="contained" onClick={() => applyConfigToMod('manual')}>Apply Config to Mod</Button>
                </Stack>
              </Stack></CardContent></Card>
            </Grid>
            <Grid item xs={12} md={7}>
              <Card><CardContent><Stack spacing={2}>
                <Typography variant="h6">Mod Status</Typography>
                <Grid container spacing={2}>
                  <Status label="Connected" value={online ? 'Yes' : 'No'} />
                  <Status label="Mod Version" value={modStatus?.modVersion ?? 'Unknown'} />
                  <Status label="Communication" value={modStatus?.communication ?? 'REST_POLLING'} />
                  <Status label="Players" value={`${modStatus?.players ?? 0}/${modStatus?.maxPlayers ?? 0}`} />
                  <Status label="Difficulty Day" value={String(effectiveDifficultyDay)} />
                  <Status label="Wave Profile" value={modStatus?.activeWaveProfile ?? (config.waves.activeMode === 'LEGACY_RULES' ? 'Legacy Rules' : 'Night Profiles')} />
                  <Status label="Entity Profile" value={modStatus?.activeEntityProfile ?? (config.entitySpawning.activeMode === 'LEGACY_RULES' ? 'Legacy Rules' : 'Night Profiles')} />
                  <Status label="Placed Blocks Open" value={String(modStatus?.placedBlockOpenCount ?? placedBlocks?.openCount ?? 0)} />
                  <Status label="Placed Blocks Total" value={String(modStatus?.placedBlockTotalCount ?? placedBlocks?.totalCount ?? 0)} />
                  <Status label="Config Path" value={modStatus?.configPath ?? 'Unavailable until mod connects'} wide />
                  <Status label="Ledger Path" value={modStatus?.ledgerPath ?? 'Unavailable until mod connects'} wide />
                </Grid>
              </Stack></CardContent></Card>
            </Grid>
          </Grid>
        )}

        {adminTab === 'config' && (
          <Card><CardContent><Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h6">Core Config</Typography>
                <Typography color="text.secondary" variant="body2">These controls save locally first. Apply pushes them to the mod REST API when available.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button startIcon={<DownloadIcon />} onClick={exportJson}>Export JSON</Button>
                <Button component="label" startIcon={<UploadFileIcon />}>Import JSON<input hidden type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0] ?? null)} /></Button>
                <Button color="warning" onClick={resetToDefaults}>Reset Defaults</Button>
                <Button startIcon={<SaveIcon />} variant="contained" onClick={() => applyConfigToMod('manual')}>Apply to Mod</Button>
              </Stack>
            </Stack>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}><FormControlLabel control={<Switch checked={config.enabled} onChange={(event) => updateConfig((draft) => { draft.enabled = event.target.checked; })} />} label="Mod Enabled" /></Grid>
              <Grid item xs={12} md={4}><FormControl fullWidth><InputLabel>Difficulty Mode</InputLabel><Select label="Difficulty Mode" value={config.difficultyMode} onChange={(event) => updateConfig((draft) => { draft.difficultyMode = event.target.value as ApocalypseConfig['difficultyMode']; })}><MenuItem value="REAL_MONTH_DAY">Real Month Day</MenuItem><MenuItem value="WORLD_DAY_CYCLE">World Day Cycle</MenuItem><MenuItem value="MANUAL">Manual</MenuItem></Select></FormControl></Grid>
              <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Manual Difficulty Day" value={config.manualDifficultyDay} onChange={(event) => updateConfig((draft) => { draft.manualDifficultyDay = numberValue(event.target.value, draft.manualDifficultyDay); })} /></Grid>
            </Grid>
            <Divider />
            <Typography variant="h6">Mod REST API Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.adminApi.enabled} onChange={(event) => updateConfig((draft) => { draft.adminApi.enabled = event.target.checked; })} />} label="Admin API Enabled" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Host" value={config.adminApi.host} onChange={(event) => updateConfig((draft) => { draft.adminApi.host = event.target.value; })} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Port" value={config.adminApi.port} onChange={(event) => updateConfig((draft) => { draft.adminApi.port = numberValue(event.target.value, draft.adminApi.port); })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Token" value={config.adminApi.adminToken} onChange={(event) => updateConfig((draft) => { draft.adminApi.adminToken = event.target.value; })} /></Grid>
              <Grid item xs={12} md={1}><FormControlLabel control={<Switch checked={config.adminApi.requireToken} onChange={(event) => updateConfig((draft) => { draft.adminApi.requireToken = event.target.checked; })} />} label="Require" /></Grid>
            </Grid>

            <Divider />
            <Typography variant="h6">OurMagic Integration Settings</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.integrations.ourMagic.enabled} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.enabled = event.target.checked; })} />} label="OurMagic Enabled" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Host" value={config.integrations.ourMagic.host} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.host = event.target.value; })} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Port" value={config.integrations.ourMagic.port} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.port = numberValue(event.target.value, draft.integrations.ourMagic.port); })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth label="Token" value={config.integrations.ourMagic.token} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.token = event.target.value; })} /></Grid>
            </Grid>
          </Stack></CardContent></Card>
        )}

          </>
        )}

        {mainPage === 'apocalypse' && (
          <>
            <Card>
              <Tabs value={apocalypseTab} onChange={(_, value) => setApocalypseTab(value)} variant="scrollable" scrollButtons="auto">
                <Tab value="waves" label="Waves" />
                <Tab value="entities" label="Entities" />
                <Tab value="drops" label="Drops" />
                <Tab value="cleanup" label="Cleanup" />
                <Tab value="json" label="Raw JSON" />
              </Tabs>
            </Card>

        {apocalypseTab === 'waves' && (
          <Card><CardContent><WaveProfilesEditor config={config} updateConfig={updateConfig} /></CardContent></Card>
        )}

        {apocalypseTab === 'entities' && (
          <Card><CardContent><EntitySpawnProfilesEditor config={config} effectiveRows={effectiveWeights} updateConfig={updateConfig} /></CardContent></Card>
        )}

        {apocalypseTab === 'drops' && (
          <Card><CardContent><DropRulesTable config={config} registryItems={registryItems} refreshRegistryItems={() => fetchRegistryItems(false)} updateConfig={updateConfig} /></CardContent></Card>
        )}

        {apocalypseTab === 'cleanup' && (
          <Card><CardContent><Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h6">Placed Block Cleanup / Rollback</Typography>
                <Typography color="text.secondary" variant="body2">The mod records every block placed by mob bridge/step behavior. Rollback only removes a block if it still matches the recorded placed block.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button startIcon={<RefreshIcon />} onClick={fetchPlacedBlocks}>Refresh Ledger</Button>
                <TextField size="small" type="number" label="Rollback Limit" value={rollbackLimit} onChange={(event) => setRollbackLimit(numberValue(event.target.value, rollbackLimit))} />
                <Button startIcon={<RestoreIcon />} color="warning" variant="contained" onClick={() => rollbackPlacedBlocks(false)}>Rollback Latest</Button>
                <Button color="error" variant="outlined" onClick={() => rollbackPlacedBlocks(true)}>Rollback All</Button>
              </Stack>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.enabled} onChange={(event) => updateConfig((draft) => { draft.cleanup.enabled = event.target.checked; })} />} label="Cleanup Enabled" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.trackPlacedBlocks} onChange={(event) => updateConfig((draft) => { draft.cleanup.trackPlacedBlocks = event.target.checked; })} />} label="Track Placed Blocks" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.rollbackOnlyIfBlockStillMatches} onChange={(event) => updateConfig((draft) => { draft.cleanup.rollbackOnlyIfBlockStillMatches = event.target.checked; })} />} label="Safe Rollback Match" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.rollbackOnServerStart} onChange={(event) => updateConfig((draft) => { draft.cleanup.rollbackOnServerStart = event.target.checked; })} />} label="Rollback On Server Start" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Max Ledger Entries" value={config.cleanup.maxLedgerEntries} onChange={(event) => updateConfig((draft) => { draft.cleanup.maxLedgerEntries = numberValue(event.target.value, draft.cleanup.maxLedgerEntries); })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Max Rollback Per Request" value={config.cleanup.maxRollbackPerRequest} onChange={(event) => updateConfig((draft) => { draft.cleanup.maxRollbackPerRequest = numberValue(event.target.value, draft.cleanup.maxRollbackPerRequest); })} /></Grid>
            </Grid>

            <PlacementBlocksEditor rows={config.behavior.placementBlocks} onChange={(rows) => updateConfig((draft) => { draft.behavior.placementBlocks = rows; })} />

            <Divider />
            <Typography variant="subtitle1" fontWeight={800}>Recorded mob-placed blocks</Typography>
            <Typography color="text.secondary" variant="body2">Open: {placedBlocks?.openCount ?? 0}, Total: {placedBlocks?.totalCount ?? 0}</Typography>
            <Table size="small">
              <TableHead><TableRow><TableCell>Rolled Back</TableCell><TableCell>Block</TableCell><TableCell>Previous</TableCell><TableCell>Reason</TableCell><TableCell>Entity</TableCell><TableCell>Dimension</TableCell><TableCell>Position</TableCell><TableCell>Created</TableCell></TableRow></TableHead>
              <TableBody>
                {(placedBlocks?.records ?? []).map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.rolledBack ? 'Yes' : 'No'}</TableCell>
                    <TableCell>{row.placedBlock}</TableCell>
                    <TableCell>{row.previousBlock}</TableCell>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell>{row.entityType}</TableCell>
                    <TableCell>{row.dimension}</TableCell>
                    <TableCell>{row.x}, {row.y}, {row.z}</TableCell>
                    <TableCell>{row.createdAt}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Stack></CardContent></Card>
        )}

        {apocalypseTab === 'json' && (
          <Card><CardContent><Stack spacing={2}>
            <Typography variant="h6">Raw JSON</Typography>
            <TextField value={rawJson} onChange={(event) => setRawJson(event.target.value)} multiline minRows={24} fullWidth sx={{ fontFamily: 'monospace' }} />
            <Stack direction="row" spacing={1}><Button variant="contained" onClick={applyRawJson}>Apply Raw JSON Locally</Button><Button onClick={() => applyConfigToMod('raw-json')}>Apply to Mod</Button></Stack>
          </Stack></CardContent></Card>
        )}

          </>
        )}

        {mainPage === 'scheduled-events' && (
          <Card><CardContent>
            <ScheduledEventsEditor
              config={config}
              commandRegistry={registryCommands}
              refreshCommandRegistry={() => fetchRegistryCommands(false)}
              fetchCommandSuggestions={fetchCommandSuggestions}
              updateConfig={updateConfig}
            />
          </CardContent></Card>
        )}

        {mainPage === 'clear-lag' && (
          <Card><CardContent><Stack spacing={3}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
              <Box>
                <Typography variant="h6">Clear Lag</Typography>
                <Typography color="text.secondary" variant="body2">UI-ready configuration for scheduled lag cleanup. Server-side execution can be wired next.</Typography>
              </Box>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button startIcon={<DownloadIcon />} onClick={exportJson}>Export JSON</Button>
                <Button startIcon={<SaveIcon />} variant="contained" onClick={() => applyConfigToMod('manual')}>Apply to Mod</Button>
              </Stack>
            </Stack>

            <Alert severity="info">This tab prepares the Clear Lag config shape. It is separate from Apocalypse wave/drop settings and can later run its own cleanup scheduler.</Alert>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.enabled} onChange={(event) => updateConfig((draft) => { draft.clearLag.enabled = event.target.checked; })} />} label="Clear Lag Enabled" /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Interval Seconds" value={config.clearLag.intervalSeconds} onChange={(event) => updateConfig((draft) => { draft.clearLag.intervalSeconds = numberValue(event.target.value, draft.clearLag.intervalSeconds); })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Warning Seconds" value={config.clearLag.warningSeconds} onChange={(event) => updateConfig((draft) => { draft.clearLag.warningSeconds = numberValue(event.target.value, draft.clearLag.warningSeconds); })} /></Grid>
              <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Max Removed Per Run" value={config.clearLag.maxEntitiesPerRun} onChange={(event) => updateConfig((draft) => { draft.clearLag.maxEntitiesPerRun = numberValue(event.target.value, draft.clearLag.maxEntitiesPerRun); })} /></Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle1" fontWeight={800}>Cleanup targets</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeDroppedItems} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeDroppedItems = event.target.checked; })} />} label="Dropped Items" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeExperienceOrbs} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeExperienceOrbs = event.target.checked; })} />} label="Experience Orbs" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeProjectiles} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeProjectiles = event.target.checked; })} />} label="Projectiles" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeEmptyVehicles} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeEmptyVehicles = event.target.checked; })} />} label="Empty Vehicles" /></Grid>
            </Grid>

            <Divider />
            <Typography variant="subtitle1" fontWeight={800}>Messages</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.announceWarning} onChange={(event) => updateConfig((draft) => { draft.clearLag.announceWarning = event.target.checked; })} />} label="Announce Warning" /></Grid>
              <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.announceCompletion} onChange={(event) => updateConfig((draft) => { draft.clearLag.announceCompletion = event.target.checked; })} />} label="Announce Completion" /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth label="Warning Message" value={config.clearLag.warningMessage} onChange={(event) => updateConfig((draft) => { draft.clearLag.warningMessage = event.target.value; })} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Completion Message" value={config.clearLag.completionMessage} onChange={(event) => updateConfig((draft) => { draft.clearLag.completionMessage = event.target.value; })} /></Grid>
            </Grid>

            <Divider />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Item Whitelist"
              helperText="One item ID per line. Whitelisted dropped items will be preserved when item cleanup is enabled."
              value={config.clearLag.itemWhitelist.join('\n')}
              onChange={(event) => updateConfig((draft) => { draft.clearLag.itemWhitelist = event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean); })}
            />
          </Stack></CardContent></Card>
        )}
      </Stack>
    </Container>
  );
}

function Status({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <Grid item xs={12} md={wide ? 12 : 4}><Card variant="outlined"><CardContent><Typography variant="caption" color="text.secondary">{label}</Typography><Typography fontWeight={800} sx={{ wordBreak: 'break-word' }}>{value}</Typography></CardContent></Card></Grid>;
}

function numberFields<T extends object>(source: T, fields: string[]): string[] {
  return fields.filter((field) => typeof (source as Record<string, unknown>)[field] === 'number');
}

function PlacementBlocksEditor({ rows, onChange }: { rows: PlacementBlockRule[]; onChange: (rows: PlacementBlockRule[]) => void }) {
  const update = (index: number, patch: Partial<PlacementBlockRule>) => onChange(rows.map((row, rowIndex) => rowIndex === index ? { ...row, ...patch } : row));
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="subtitle1" fontWeight={800}>Blocks mobs may place</Typography>
          <Typography color="text.secondary" variant="body2">This is the placement palette. The ledger below is the actual cleanup/rollback list.</Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => onChange([...rows, { block: 'minecraft:cobblestone', weight: 1, minDay: 1, enabled: true }])}>Add Block</Button>
      </Stack>
      <Table size="small">
        <TableHead><TableRow><TableCell>Enabled</TableCell><TableCell>Block</TableCell><TableCell>Weight</TableCell><TableCell>Min Day</TableCell><TableCell align="right">Remove</TableCell></TableRow></TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={`${row.block}-${index}`}>
              <TableCell><Checkbox checked={row.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} /></TableCell>
              <TableCell><TextField fullWidth value={row.block} onChange={(event) => update(index, { block: event.target.value })} /></TableCell>
              <TableCell width={140}><TextField type="number" value={row.weight} onChange={(event) => update(index, { weight: numberValue(event.target.value, row.weight) })} /></TableCell>
              <TableCell width={140}><TextField type="number" value={row.minDay} onChange={(event) => update(index, { minDay: numberValue(event.target.value, row.minDay) })} /></TableCell>
              <TableCell align="right"><IconButton color="error" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}><DeleteIcon /></IconButton></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
