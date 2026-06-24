import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import type { ApocalypseConfig, EntitySpawnProfile, EntityWeight, MobProperties } from '../types';
import EntityWeightsTable from './EntityWeightsTable';

type EffectiveEntityWeight = EntityWeight & {
  selectionChance: number;
  perAttemptChance: number;
};

type Props = {
  config: ApocalypseConfig;
  effectiveRows: EffectiveEntityWeight[];
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
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

function newProfile(): EntitySpawnProfile {
  const suffix = Date.now().toString(36);
  return {
    id: `custom-entity-pool-${suffix}`,
    name: `Custom Entity Pool ${suffix}`,
    enabled: true,
    minDay: 1,
    maxDay: 30,
    weight: 10,
    weights: [{ entity: 'minecraft:zombie', weight: 10, minDay: 1, spawnChance: 1, enabled: true, properties: defaultMobProperties() }]
  };
}

function isProfileActive(profile: EntitySpawnProfile, difficultyDay: number): boolean {
  return profile.enabled
    && profile.weight > 0
    && difficultyDay >= profile.minDay
    && difficultyDay <= profile.maxDay;
}

function effectiveProfileChance(profile: EntitySpawnProfile, allProfiles: EntitySpawnProfile[], difficultyDay: number): number {
  const active = allProfiles.filter((entry) => isProfileActive(entry, difficultyDay));
  const total = active.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
  return total > 0 && isProfileActive(profile, difficultyDay) ? (profile.weight / total) * 100 : 0;
}

function calculateEffectiveRows(rows: EntityWeight[], difficultyDay: number, blacklist: string[]): EffectiveEntityWeight[] {
  const blacklistSet = new Set(blacklist);
  const active = rows.filter((entry) => entry.enabled && difficultyDay >= entry.minDay && !blacklistSet.has(entry.entity));
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
}

export default function EntitySpawnProfilesEditor({ config, effectiveRows, updateConfig }: Props) {
  const profiles = config.entitySpawning.nightProfiles ?? [];
  const [selectedProfileId, setSelectedProfileId] = useState(() => profiles[0]?.id ?? '');
  const selectedProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0], [profiles, selectedProfileId]);
  const [previewDay, setPreviewDay] = useState(() => selectedProfile?.minDay ?? config.manualDifficultyDay ?? 1);

  useEffect(() => {
    if (selectedProfile) {
      setPreviewDay(selectedProfile.minDay);
    }
  }, [selectedProfile?.id]);

  const updateEntitySettings = (patch: Partial<ApocalypseConfig['entitySpawning']>) => {
    updateConfig((draft) => { draft.entitySpawning = { ...draft.entitySpawning, ...patch }; });
  };

  const updateProfile = (profileId: string, patch: Partial<EntitySpawnProfile>) => {
    updateConfig((draft) => {
      draft.entitySpawning.nightProfiles = (draft.entitySpawning.nightProfiles ?? []).map((profile) => profile.id === profileId ? { ...profile, ...patch } : profile);
    });
  };

  const addProfile = () => {
    const profile = newProfile();
    updateConfig((draft) => { draft.entitySpawning.nightProfiles = [...(draft.entitySpawning.nightProfiles ?? []), profile]; });
    setSelectedProfileId(profile.id);
  };

  const duplicateProfile = (profile: EntitySpawnProfile) => {
    const copy = { ...profile, id: `${profile.id}-copy-${Date.now().toString(36)}`, name: `${profile.name} Copy`, weights: profile.weights.map((weight) => ({ ...weight, properties: weight.properties ? { ...weight.properties } : undefined })) };
    updateConfig((draft) => { draft.entitySpawning.nightProfiles = [...(draft.entitySpawning.nightProfiles ?? []), copy]; });
    setSelectedProfileId(copy.id);
  };

  const removeProfile = (profileId: string) => {
    const remaining = profiles.filter((profile) => profile.id !== profileId);
    updateConfig((draft) => { draft.entitySpawning.nightProfiles = remaining; });
    setSelectedProfileId(remaining[0]?.id ?? '');
  };

  const updateProfileWeights = (profileId: string, rows: EntityWeight[]) => {
    updateProfile(profileId, { weights: rows });
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <div>
          <Typography variant="h6">Nightly entity-pool profiles</Typography>
          <Typography color="text.secondary" variant="body2">LEGACY_RULES uses the old flat entity table. NIGHT_PROFILES rolls one weighted entity pool per Minecraft night, then every spawn attempt rolls inside that selected pool.</Typography>
        </div>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel>Entity Spawn Mode</InputLabel>
            <Select label="Entity Spawn Mode" value={config.entitySpawning.activeMode ?? 'NIGHT_PROFILES'} onChange={(event) => updateEntitySettings({ activeMode: event.target.value as ApocalypseConfig['entitySpawning']['activeMode'] })}>
              <MenuItem value="NIGHT_PROFILES">Night Profiles</MenuItem>
              <MenuItem value="LEGACY_RULES">Legacy Rules</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 220 }} size="small">
            <InputLabel>Failed Chance Behavior</InputLabel>
            <Select label="Failed Chance Behavior" value={config.entitySpawning.failedChanceBehavior ?? 'SKIP_SPAWN'} onChange={(event) => updateEntitySettings({ failedChanceBehavior: event.target.value as ApocalypseConfig['entitySpawning']['failedChanceBehavior'] })}>
              <MenuItem value="SKIP_SPAWN">Skip Spawn</MenuItem>
              <MenuItem value="REROLL_ENTITY">Reroll Entity</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<AddIcon />} variant="contained" onClick={addProfile}>Add Profile</Button>
        </Stack>
      </Stack>

      {config.entitySpawning.activeMode === 'LEGACY_RULES' ? (
        <Stack spacing={2}>
          <Alert severity="warning">Legacy mode uses one flat entity table every night. This is still kept for old configs.</Alert>
          <EntityWeightsTable
            rows={config.entitySpawning.legacyWeights}
            effectiveRows={effectiveRows}
            onChange={(rows) => updateConfig((draft) => { draft.entitySpawning.legacyWeights = rows; draft.entityWeights = rows; })}
          />
        </Stack>
      ) : (
        <Stack spacing={2}>
          <Alert severity="info">Profiles use min/max day plus weight. Entity profiles only roll against other active entity profiles for the same Minecraft day/night. Wave profiles and drop profiles are separate rolls. Each entity has Spawn Chance and optional Mob Properties.</Alert>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 340 }} size="small">
              <InputLabel>Selected Profile</InputLabel>
              <Select label="Selected Profile" value={selectedProfile?.id ?? ''} onChange={(event) => setSelectedProfileId(event.target.value)}>
                {profiles.map((profile) => <MenuItem key={profile.id} value={profile.id}>{profile.name} ({profile.minDay}-{profile.maxDay})</MenuItem>)}
              </Select>
            </FormControl>
            {selectedProfile && <Button startIcon={<ContentCopyIcon />} variant="outlined" onClick={() => duplicateProfile(selectedProfile)}>Duplicate</Button>}
            {selectedProfile && <Button color="error" startIcon={<DeleteIcon />} variant="outlined" onClick={() => removeProfile(selectedProfile.id)}>Delete Profile</Button>}
          </Stack>

          {selectedProfile ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                <FormControlLabel control={<Switch checked={selectedProfile.enabled} onChange={(event) => updateProfile(selectedProfile.id, { enabled: event.target.checked })} />} label="Profile Enabled" />
                <Typography color="text.secondary" variant="body2">Approx chance among active entity profiles on preview day {previewDay}: {effectiveProfileChance(selectedProfile, profiles, previewDay).toFixed(1)}%</Typography>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Profile ID" value={selectedProfile.id} disabled />
                <TextField fullWidth label="Profile Name" value={selectedProfile.name} onChange={(event) => updateProfile(selectedProfile.id, { name: event.target.value })} />
                <TextField type="number" label="Min Day" value={selectedProfile.minDay} onChange={(event) => updateProfile(selectedProfile.id, { minDay: numberValue(event.target.value, selectedProfile.minDay) })} />
                <TextField type="number" label="Max Day" value={selectedProfile.maxDay} onChange={(event) => updateProfile(selectedProfile.id, { maxDay: numberValue(event.target.value, selectedProfile.maxDay) })} />
                <TextField type="number" label="Weight" value={selectedProfile.weight} onChange={(event) => updateProfile(selectedProfile.id, { weight: numberValue(event.target.value, selectedProfile.weight) })} />
                <TextField type="number" label="Preview Day" value={previewDay} onChange={(event) => setPreviewDay(numberValue(event.target.value, previewDay))} helperText="Used only for chance preview" />
              </Stack>
              <EntityWeightsTable
                rows={selectedProfile.weights}
                effectiveRows={calculateEffectiveRows(selectedProfile.weights, previewDay, config.entityBlacklist)}
                onChange={(rows) => updateProfileWeights(selectedProfile.id, rows)}
                selectionColumnLabel="Selection Chance"
              />
            </Stack>
          ) : <Alert severity="warning">No entity profiles exist yet. Add one to configure nightly entity pools.</Alert>}
        </Stack>
      )}
    </Stack>
  );
}
