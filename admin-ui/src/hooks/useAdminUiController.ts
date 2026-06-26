import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ApocalypseConfig,
  EntityWeight,
  ModStatus,
  PlacedBlocksResponse,
  RollbackSummary,
  UiConnectionSettings,
} from "../types";
import { defaultConfig } from "../defaultConfig";
import { apiBase, apiHeaders } from "../utils/api";
import {
  cloneConfig,
  loadConfig,
  loadConnectionSettings,
  loadRevision,
  normalizeConfig,
  saveConfigLocal,
  saveConnectionSettings,
} from "../utils/configStorage";

export type EffectiveEntityWeight = EntityWeight & {
  selectionChance: number;
  perAttemptChance: number;
};

export function useAdminUiController() {
  const [config, setConfig] = useState<ApocalypseConfig>(() => loadConfig());
  const [connectionSettings, setConnectionSettings] =
    useState<UiConnectionSettings>(() => loadConnectionSettings());
  const [revision, setRevision] = useState(loadRevision);
  const [appliedRevision, setAppliedRevision] = useState<number | null>(null);
  const [modStatus, setModStatus] = useState<ModStatus | null>(null);
  const [placedBlocks, setPlacedBlocks] = useState<PlacedBlocksResponse | null>(null);
  const [registryItems, setRegistryItems] = useState<string[]>([]);
  const [registryEntities, setRegistryEntities] = useState<string[]>([]);
  const [registryCommands, setRegistryCommands] = useState<string[]>([]);
  const [online, setOnline] = useState(false);
  const [notice, setNotice] = useState("UI config is stored locally and remains editable when the mod is offline.");
  const [error, setError] = useState<string | null>(null);
  const [rawJson, setRawJson] = useState(() => JSON.stringify(loadConfig(), null, 2));
  const [rollbackLimit, setRollbackLimit] = useState(250);

  const pollTimerRef = useRef<number | null>(null);
  const liveApplyTimerRef = useRef<number | null>(null);
  const registryItemsLoadedRef = useRef(false);
  const registryEntitiesLoadedRef = useRef(false);
  const registryCommandsLoadedRef = useRef(false);

  const effectiveDifficultyDay = modStatus?.difficultyDay ?? config.manualDifficultyDay;
  const effectiveWeights = useMemo<EffectiveEntityWeight[]>(() => {
    const blacklist = new Set(config.entityBlacklist);
    const source = config.entitySpawning?.legacyWeights?.length
      ? config.entitySpawning.legacyWeights
      : config.entityWeights;
    const active = source.filter(
      (entry) => entry.enabled && effectiveDifficultyDay >= entry.minDay && !blacklist.has(entry.entity),
    );
    const total = active.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
    return active.map((entry) => {
      const selectionChance = total > 0 ? (entry.weight / total) * 100 : 0;
      const spawnChance = Number.isFinite(entry.spawnChance) ? entry.spawnChance : 1;
      return { ...entry, spawnChance, selectionChance, perAttemptChance: selectionChance * spawnChance };
    });
  }, [config, effectiveDifficultyDay]);

  const saveLocalOnly = (nextConfig: ApocalypseConfig, nextRevision = revision) => {
    setRawJson(saveConfigLocal(nextConfig, nextRevision));
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
      saveConnectionSettings(next);
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
      if (!quiet) setError(err instanceof Error ? err.message : "Unable to load item registry from mod.");
      return [];
    }
  };

  const fetchRegistryEntities = async (quiet = true) => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/registry/entities`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Registry entity fetch failed: ${res.status}`);
      const body = (await res.json()) as { entities?: string[] };
      setRegistryEntities(Array.isArray(body.entities) ? body.entities : []);
      registryEntitiesLoadedRef.current = true;
      if (!quiet) setNotice(`Loaded ${body.entities?.length ?? 0} entity registry entries from the mod.`);
      return body.entities ?? [];
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : "Unable to load entity registry from mod.");
      return [];
    }
  };

  const fetchRegistryCommands = async (quiet = true) => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/registry/commands`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Command registry fetch failed: ${res.status}`);
      const body = (await res.json()) as { commands?: Array<string | { name?: string }> };
      const commands = (body.commands ?? [])
        .map((entry) => (typeof entry === "string" ? entry : entry.name))
        .filter((entry): entry is string => typeof entry === "string" && entry.trim().length > 0)
        .map((entry) => entry.replace(/^\//, ""));
      setRegistryCommands(commands);
      registryCommandsLoadedRef.current = true;
      if (!quiet) setNotice(`Loaded ${commands.length} server command entries from the mod.`);
      return commands;
    } catch (err) {
      if (!quiet) setError(err instanceof Error ? err.message : "Unable to load command registry from mod.");
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
      if (!quiet) setNotice("Connected to mod REST API.");
      if (!registryItemsLoadedRef.current) void fetchRegistryItems(true);
      if (!registryEntitiesLoadedRef.current) void fetchRegistryEntities(true);
      if (!registryCommandsLoadedRef.current) void fetchRegistryCommands(true);
      return status;
    } catch (err) {
      setOnline(false);
      setModStatus((prev) => (prev ? { ...prev, connected: false } : null));
      if (!quiet) setError(err instanceof Error ? err.message : "Unable to reach mod REST API.");
      return null;
    }
  };

  const applyConfigToMod = async (source = "manual") => {
    saveLocalOnly(config, revision);
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/config`, {
        method: "PUT",
        headers: apiHeaders(connectionSettings),
        body: JSON.stringify(config),
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
      setError(err instanceof Error ? err.message : "Unable to apply config to mod.");
      return false;
    }
  };

  const fetchPlacedBlocks = async () => {
    try {
      const res = await fetch(`${apiBase(connectionSettings)}/api/placed-blocks?limit=500`, { headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Placed blocks failed: ${res.status}`);
      setPlacedBlocks((await res.json()) as PlacedBlocksResponse);
      setOnline(true);
      setError(null);
    } catch (err) {
      setOnline(false);
      setError(err instanceof Error ? err.message : "Unable to fetch placed block ledger.");
    }
  };

  const rollbackPlacedBlocks = async (all = false) => {
    try {
      const query = all ? "all=true" : `limit=${rollbackLimit}`;
      const res = await fetch(`${apiBase(connectionSettings)}/api/rollback/placed-blocks?${query}`, { method: "POST", headers: apiHeaders(connectionSettings) });
      if (!res.ok) throw new Error(`Rollback failed: ${res.status}`);
      const body = (await res.json()) as { summary: RollbackSummary; status?: ModStatus };
      setNotice(`Rollback complete. Rolled back ${body.summary.rolledBack}, skipped ${body.summary.skipped}.`);
      if (body.status) setModStatus({ ...body.status, connected: true, lastMessageAt: new Date().toISOString() });
      await fetchPlacedBlocks();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Rollback failed.");
    }
  };

  const resetToDefaults = () => {
    const nextRevision = revision + 1;
    setConfig(defaultConfig);
    setRevision(nextRevision);
    saveLocalOnly(defaultConfig, nextRevision);
    setNotice("Reset local UI config to defaults.");
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
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
        setError(err instanceof Error ? err.message : "Import failed.");
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
      setError(err instanceof Error ? err.message : "Raw JSON is invalid.");
    }
  };

  useEffect(() => {
    registryItemsLoadedRef.current = false;
    registryEntitiesLoadedRef.current = false;
    registryCommandsLoadedRef.current = false;
    setRegistryItems([]);
    setRegistryEntities([]);
    setRegistryCommands([]);
  }, [connectionSettings.modApiBaseUrl, connectionSettings.adminToken]);

  useEffect(() => {
    fetchStatus(true).then((status) => {
      if (status && connectionSettings.autoApplyLive && appliedRevision !== revision) void applyConfigToMod("startup-auto-apply");
    });
    if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    pollTimerRef.current = window.setInterval(async () => {
      const status = await fetchStatus(true);
      if (status && connectionSettings.autoApplyLive && appliedRevision !== revision) await applyConfigToMod("poll-auto-apply");
    }, Math.max(1, connectionSettings.pollSeconds) * 1000);
    return () => {
      if (pollTimerRef.current) window.clearInterval(pollTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionSettings.modApiBaseUrl, connectionSettings.adminToken, connectionSettings.pollSeconds, connectionSettings.autoApplyLive, revision, appliedRevision]);

  useEffect(() => {
    saveLocalOnly(config, revision);
    if (!connectionSettings.autoApplyLive || !online || appliedRevision === revision) return;
    if (liveApplyTimerRef.current) window.clearTimeout(liveApplyTimerRef.current);
    liveApplyTimerRef.current = window.setTimeout(() => void applyConfigToMod("live-debounce"), 750);
    return () => {
      if (liveApplyTimerRef.current) window.clearTimeout(liveApplyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, revision]);

  return {
    config,
    connectionSettings,
    revision,
    appliedRevision,
    modStatus,
    placedBlocks,
    registryItems,
    registryEntities,
    registryCommands,
    online,
    notice,
    error,
    rawJson,
    rollbackLimit,
    effectiveDifficultyDay,
    effectiveWeights,
    setError,
    setRawJson,
    setRollbackLimit,
    updateConfig,
    updateConnectionSettings,
    fetchRegistryItems,
    fetchRegistryEntities,
    fetchRegistryCommands,
    fetchCommandSuggestions,
    fetchStatus,
    fetchPlacedBlocks,
    rollbackPlacedBlocks,
    applyConfigToMod,
    resetToDefaults,
    exportJson,
    importJson,
    applyRawJson,
  };
}

export type AdminUiController = ReturnType<typeof useAdminUiController>;
