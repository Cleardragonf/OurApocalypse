import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import {
  Alert,
  Autocomplete,
  Button,
  Checkbox,
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
  Tooltip,
  Typography
} from '@mui/material';
import { Fragment, useMemo, useState } from 'react';
import type { ApocalypseConfig, DropProfile, DropRule, EconomyKillRewardTargetMode, EconomyParticipantRewardMode, RewardTargetMode } from '../types';
import { VANILLA_DROP_ITEM_OPTIONS } from '../registryOptions';
import { entityOptionLabel, entitySearchText, mergeEntityRegistryOptions, resolveEntityInput } from '../entityOptions';

const ITEM_DISPLAY_TOOLTIP = 'Minecraft items display without the minecraft: prefix; modded IDs keep their namespace. The saved config still stores the full registry ID.';



const REWARD_TARGET_LABELS: Record<RewardTargetMode, string> = {
  KILLER: 'Killer player',
  NEAREST_PLAYER: 'Nearest player',
  ALL_PLAYERS: 'All players',
  EVENT_TARGET: 'Event target placeholder'
};

const ECONOMY_REWARD_TARGET_LABELS: Record<EconomyKillRewardTargetMode, string> = {
  KILLER: 'Killer player',
  NEAREST_PLAYER: 'Nearest player',
  ALL_PLAYERS: 'All players',
  ALL_PARTICIPANTS: 'Players who damaged mob',
  TOP_DAMAGER: 'Top damage dealer'
};

const ECONOMY_PARTICIPANT_MODE_LABELS: Record<EconomyParticipantRewardMode, string> = {
  FULL_TO_EACH_PARTICIPANT: 'Full amount to each',
  SPLIT_BETWEEN_PARTICIPANTS: 'Split evenly',
  PROPORTIONAL_BY_DAMAGE: 'Split by damage dealt'
};

function economyRewardChance(rule: DropRule): number {
  return Number.isFinite(rule.economyRewardChance) ? Number(rule.economyRewardChance) : 1;
}

function economyRewardMin(rule: DropRule): number {
  return Number.isFinite(rule.economyRewardMinAmount) ? Number(rule.economyRewardMinAmount) : 5;
}

function economyRewardMax(rule: DropRule): number {
  return Number.isFinite(rule.economyRewardMaxAmount) ? Number(rule.economyRewardMaxAmount) : Math.max(economyRewardMin(rule), 10);
}

function economyRewardTarget(rule: DropRule): EconomyKillRewardTargetMode {
  return (rule.economyRewardTargetMode ?? 'KILLER') as EconomyKillRewardTargetMode;
}

function economyRewardParticipantMode(rule: DropRule): EconomyParticipantRewardMode {
  return (rule.economyRewardParticipantMode ?? 'FULL_TO_EACH_PARTICIPANT') as EconomyParticipantRewardMode;
}

function economyRewardReason(rule: DropRule): string {
  return rule.economyRewardReason ?? 'apocalypse-drop-economy-reward';
}

function rewardChance(rule: DropRule): number {
  return Number.isFinite(rule.ourMagicRewardChance) ? Number(rule.ourMagicRewardChance) : 1;
}

function rewardMinXp(rule: DropRule): number {
  return Number.isFinite(rule.ourMagicRewardMinExperience) ? Number(rule.ourMagicRewardMinExperience) : 1;
}

function rewardMaxXp(rule: DropRule): number {
  return Number.isFinite(rule.ourMagicRewardMaxExperience) ? Number(rule.ourMagicRewardMaxExperience) : Math.max(1, rewardMinXp(rule));
}

function rewardTarget(rule: DropRule): RewardTargetMode {
  return (rule.ourMagicRewardTargetMode ?? 'KILLER') as RewardTargetMode;
}

function rewardReason(rule: DropRule): string {
  return rule.ourMagicRewardReason ?? 'apocalypse-drop-profile-reward';
}

const DROP_ENTITY_OPTIONS = [
  { id: '*', label: 'All hostile mobs (*)' },
  { id: 'minecraft:blaze', label: 'Blaze' },
  { id: 'minecraft:cave_spider', label: 'Cave Spider' },
  { id: 'minecraft:creeper', label: 'Creeper' },
  { id: 'minecraft:drowned', label: 'Drowned' },
  { id: 'minecraft:elder_guardian', label: 'Elder Guardian' },
  { id: 'minecraft:enderman', label: 'Enderman' },
  { id: 'minecraft:endermite', label: 'Endermite' },
  { id: 'minecraft:evoker', label: 'Evoker' },
  { id: 'minecraft:ghast', label: 'Ghast' },
  { id: 'minecraft:guardian', label: 'Guardian' },
  { id: 'minecraft:hoglin', label: 'Hoglin' },
  { id: 'minecraft:husk', label: 'Husk' },
  { id: 'minecraft:illusioner', label: 'Illusioner' },
  { id: 'minecraft:magma_cube', label: 'Magma Cube' },
  { id: 'minecraft:phantom', label: 'Phantom' },
  { id: 'minecraft:piglin_brute', label: 'Piglin Brute' },
  { id: 'minecraft:pillager', label: 'Pillager' },
  { id: 'minecraft:ravager', label: 'Ravager' },
  { id: 'minecraft:shulker', label: 'Shulker' },
  { id: 'minecraft:silverfish', label: 'Silverfish' },
  { id: 'minecraft:skeleton', label: 'Skeleton' },
  { id: 'minecraft:slime', label: 'Slime' },
  { id: 'minecraft:spider', label: 'Spider' },
  { id: 'minecraft:stray', label: 'Stray' },
  { id: 'minecraft:vex', label: 'Vex' },
  { id: 'minecraft:vindicator', label: 'Vindicator' },
  { id: 'minecraft:warden', label: 'Warden' },
  { id: 'minecraft:witch', label: 'Witch' },
  { id: 'minecraft:wither_skeleton', label: 'Wither Skeleton' },
  { id: 'minecraft:zoglin', label: 'Zoglin' },
  { id: 'minecraft:zombie', label: 'Zombie' },
  { id: 'minecraft:zombie_villager', label: 'Zombie Villager' },
  { id: 'minecraft:zombified_piglin', label: 'Zombified Piglin' }
] as const;

type Props = {
  config: ApocalypseConfig;
  registryItems: string[];
  registryEntities: string[];
  refreshRegistryItems: () => void;
  refreshRegistryEntities: () => void;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};


function shortRegistryLabel(value: string): string {
  if (!value) return '';
  if (value === '*') return 'All';
  const separatorIndex = value.indexOf(':');
  if (separatorIndex < 0) return value;
  const namespace = value.slice(0, separatorIndex);
  const path = value.slice(separatorIndex + 1);
  return namespace === 'minecraft' ? path : value;
}

function registrySearchText(value: string): string {
  return `${shortRegistryLabel(value)} ${value}`.toLowerCase();
}

function resolveRegistryItemInput(value: string, options: string[]): string {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const exactId = options.find((option) => option.toLowerCase() === trimmed.toLowerCase());
  if (exactId) return exactId;

  const exactLabel = options.find((option) => shortRegistryLabel(option).toLowerCase() === trimmed.toLowerCase());
  return exactLabel ?? trimmed;
}

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function newRule(): DropRule {
  return {
    entity: '*',
    item: 'minecraft:emerald',
    minCount: 1,
    maxCount: 1,
    chance: 0.01,
    minDay: 1,
    enabled: true,
    economyRewardEnabled: false,
    economyRewardChance: 1,
    economyRewardTargetMode: 'KILLER',
    economyRewardParticipantMode: 'FULL_TO_EACH_PARTICIPANT',
    economyRewardMinAmount: 5,
    economyRewardMaxAmount: 10,
    economyRewardReason: 'apocalypse-drop-economy-reward',
    ourMagicRewardEnabled: false,
    ourMagicRewardChance: 1,
    ourMagicRewardTargetMode: 'KILLER',
    ourMagicRewardMinExperience: 1,
    ourMagicRewardMaxExperience: 3,
    ourMagicRewardReason: 'apocalypse-drop-profile-reward'
  };
}

function newProfile(): DropProfile {
  const suffix = Date.now().toString(36);
  return {
    id: `custom-night-${suffix}`,
    name: `Custom Night ${suffix}`,
    enabled: true,
    minDay: 1,
    maxDay: 30,
    weight: 10,
    overrideVanillaDrops: false,
    rules: [newRule()]
  };
}

function isProfileActiveOnDay(profile: DropProfile, day: number): boolean {
  return profile.enabled
    && Number(profile.weight || 0) > 0
    && day >= Number(profile.minDay || 1)
    && day <= Number(profile.maxDay || 30);
}

function effectiveChance(profile: DropProfile, allProfiles: DropProfile[], day: number): number {
  const active = allProfiles.filter((entry) => isProfileActiveOnDay(entry, day));
  const total = active.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
  return total > 0 && isProfileActiveOnDay(profile, day) ? (Number(profile.weight || 0) / total) * 100 : 0;
}

export default function DropRulesTable({ config, registryItems, registryEntities, refreshRegistryItems, refreshRegistryEntities, updateConfig }: Props) {
  const profiles = config.drops.nightProfiles ?? [];
  const itemOptions = useMemo(() => {
    const merged = new Set<string>([...VANILLA_DROP_ITEM_OPTIONS, ...registryItems]);
    return [...merged].sort();
  }, [registryItems]);
  const entityOptions = useMemo(() => mergeEntityRegistryOptions(registryEntities, true), [registryEntities]);
  const [selectedProfileId, setSelectedProfileId] = useState(() => profiles[0]?.id ?? '');

  const selectedProfile = useMemo(() => {
    return profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0];
  }, [profiles, selectedProfileId]);

  const updateDropSettings = (patch: Partial<ApocalypseConfig['drops']>) => {
    updateConfig((draft) => {
      draft.drops = {
        ...draft.drops,
        ...patch
      };
    });
  };


  const updateProfile = (profileId: string, patch: Partial<DropProfile>) => {
    updateConfig((draft) => {
      draft.drops.nightProfiles = (draft.drops.nightProfiles ?? []).map((profile) =>
        profile.id === profileId ? { ...profile, ...patch } : profile
      );
    });
  };

  const updateProfileRule = (profileId: string, index: number, patch: Partial<DropRule>) => {
    updateConfig((draft) => {
      draft.drops.nightProfiles = (draft.drops.nightProfiles ?? []).map((profile) => {
        if (profile.id !== profileId) return profile;
        const rules = profile.rules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule));
        return { ...profile, rules };
      });
    });
  };

  const updateLegacyRule = (index: number, patch: Partial<DropRule>) => {
    updateConfig((draft) => {
      draft.drops.rules = draft.drops.rules.map((rule, ruleIndex) => (ruleIndex === index ? { ...rule, ...patch } : rule));
    });
  };

  const addProfile = () => {
    const profile = newProfile();
    updateConfig((draft) => {
      draft.drops.nightProfiles = [...(draft.drops.nightProfiles ?? []), profile];
    });
    setSelectedProfileId(profile.id);
  };

  const duplicateProfile = (profile: DropProfile) => {
    const copy = {
      ...profile,
      id: `${profile.id}-copy-${Date.now().toString(36)}`,
      name: `${profile.name} Copy`,
      rules: profile.rules.map((rule) => ({ ...rule }))
    };
    updateConfig((draft) => {
      draft.drops.nightProfiles = [...(draft.drops.nightProfiles ?? []), copy];
    });
    setSelectedProfileId(copy.id);
  };

  const removeProfile = (profileId: string) => {
    const remaining = profiles.filter((profile) => profile.id !== profileId);
    updateConfig((draft) => {
      draft.drops.nightProfiles = remaining;
    });
    setSelectedProfileId(remaining[0]?.id ?? '');
  };

  const addRuleToProfile = (profileId: string) => {
    updateConfig((draft) => {
      draft.drops.nightProfiles = (draft.drops.nightProfiles ?? []).map((profile) =>
        profile.id === profileId ? { ...profile, rules: [...profile.rules, newRule()] } : profile
      );
    });
  };

  const removeRuleFromProfile = (profileId: string, index: number) => {
    updateConfig((draft) => {
      draft.drops.nightProfiles = (draft.drops.nightProfiles ?? []).map((profile) =>
        profile.id === profileId ? { ...profile, rules: profile.rules.filter((_, ruleIndex) => ruleIndex !== index) } : profile
      );
    });
  };

  const activeProfileCount = profiles.filter((profile) => profile.enabled).length;

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <div>
          <Typography variant="h6">Nightly drop profiles</Typography>
          <Typography color="text.secondary" variant="body2">
            The mod chooses one weighted drop profile per Minecraft night/day key. That profile's rules control drops for that night.
          </Typography>
        </div>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControlLabel control={<Switch checked={config.drops.enabled} onChange={(event) => updateDropSettings({ enabled: event.target.checked })} />} label="Drops Enabled" />
          <FormControlLabel control={<Switch checked={config.drops.overrideVanillaDrops} onChange={(event) => updateDropSettings({ overrideVanillaDrops: event.target.checked })} />} label="Global Override Vanilla" />
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Drop Mode</InputLabel>
            <Select label="Drop Mode" value={config.drops.activeMode ?? 'NIGHT_PROFILES'} onChange={(event) => updateDropSettings({ activeMode: event.target.value as ApocalypseConfig['drops']['activeMode'] })}>
              <MenuItem value="NIGHT_PROFILES">Night Profiles</MenuItem>
              <MenuItem value="LEGACY_RULES">Legacy Rules</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={refreshRegistryItems}>Load Item Registry</Button>
          <Button variant="outlined" onClick={refreshRegistryEntities}>Load Entity Registry</Button>
          <Button startIcon={<AddIcon />} variant="contained" onClick={addProfile}>Add Profile</Button>
        </Stack>
      </Stack>

      <Alert severity="info">
        Active drop profile count: {activeProfileCount}. Drop profiles only roll against other active drop profiles for the same Minecraft day/night. Wave profiles and entity profiles are separate rolls.
      </Alert>

      <Alert severity="warning">
        OurMagic XP and Economy money reward rows live inside Drops. The OurMagic connection/header/token settings are edited in Admin → Config → Core Config.
      </Alert>

      {config.drops.activeMode !== 'LEGACY_RULES' && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
            <FormControl sx={{ minWidth: 320 }} size="small">
              <InputLabel>Selected Profile</InputLabel>
              <Select label="Selected Profile" value={selectedProfile?.id ?? ''} onChange={(event) => setSelectedProfileId(event.target.value)}>
                {profiles.map((profile) => (
                  <MenuItem key={profile.id} value={profile.id}>{profile.name} ({profile.minDay}-{profile.maxDay})</MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedProfile && <Button startIcon={<ContentCopyIcon />} variant="outlined" onClick={() => duplicateProfile(selectedProfile)}>Duplicate</Button>}
            {selectedProfile && <Button color="error" startIcon={<DeleteIcon />} variant="outlined" onClick={() => removeProfile(selectedProfile.id)}>Delete Profile</Button>}
          </Stack>

          {selectedProfile ? (
            <Stack spacing={2}>
              <Stack direction="row" spacing={2} flexWrap="wrap" alignItems="center">
                <FormControlLabel control={<Switch checked={selectedProfile.enabled} onChange={(event) => updateProfile(selectedProfile.id, { enabled: event.target.checked })} />} label="Profile Enabled" />
                <FormControlLabel control={<Switch checked={selectedProfile.overrideVanillaDrops} onChange={(event) => updateProfile(selectedProfile.id, { overrideVanillaDrops: event.target.checked })} />} label="Profile Overrides Vanilla" />
                <Typography color="text.secondary" variant="body2">
                  Approx chance among active drop profiles on day {selectedProfile.minDay}: {effectiveChance(selectedProfile, profiles, selectedProfile.minDay).toFixed(1)}%
                </Typography>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Profile ID" value={selectedProfile.id} disabled helperText="Stable internal key used by the mod for nightly selection." />
                <TextField fullWidth label="Profile Name" value={selectedProfile.name} onChange={(event) => updateProfile(selectedProfile.id, { name: event.target.value })} />
                <TextField type="number" label="Min Day" value={selectedProfile.minDay} onChange={(event) => updateProfile(selectedProfile.id, { minDay: numberValue(event.target.value, selectedProfile.minDay) })} />
                <TextField type="number" label="Max Day" value={selectedProfile.maxDay} onChange={(event) => updateProfile(selectedProfile.id, { maxDay: numberValue(event.target.value, selectedProfile.maxDay) })} />
                <TextField type="number" label="Weight" value={selectedProfile.weight} onChange={(event) => updateProfile(selectedProfile.id, { weight: numberValue(event.target.value, selectedProfile.weight) })} />
              </Stack>

              <RulesTable
                rows={selectedProfile.rules}
                itemOptions={itemOptions}
                entityOptions={entityOptions}
                onAdd={() => addRuleToProfile(selectedProfile.id)}
                onUpdate={(index, patch) => updateProfileRule(selectedProfile.id, index, patch)}
                onRemove={(index) => removeRuleFromProfile(selectedProfile.id, index)}
              />
            </Stack>
          ) : (
            <Alert severity="warning">No drop profiles exist yet. Add a profile to configure nightly drops.</Alert>
          )}
        </Stack>
      )}

      {config.drops.activeMode === 'LEGACY_RULES' && (
        <Stack spacing={2}>
          <Alert severity="warning">Legacy rules are always evaluated by difficulty day and do not randomize a different profile per night.</Alert>
          <RulesTable
            rows={config.drops.rules}
            itemOptions={itemOptions}
            entityOptions={entityOptions}
            onAdd={() => updateConfig((draft) => { draft.drops.rules = [...draft.drops.rules, newRule()]; })}
            onUpdate={updateLegacyRule}
            onRemove={(index) => updateConfig((draft) => { draft.drops.rules = draft.drops.rules.filter((_, ruleIndex) => ruleIndex !== index); })}
          />
        </Stack>
      )}
    </Stack>
  );
}

function RulesTable({ rows, itemOptions, entityOptions, onAdd, onUpdate, onRemove }: { rows: DropRule[]; itemOptions: string[]; entityOptions: string[]; onAdd: () => void; onUpdate: (index: number, patch: Partial<DropRule>) => void; onRemove: (index: number) => void }) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="subtitle1" fontWeight={800}>Rules</Typography>
        <Button startIcon={<AddIcon />} variant="outlined" onClick={onAdd}>Add Rule</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Enabled</TableCell>
            <TableCell>Entity</TableCell>
            <TableCell>Item</TableCell>
            <TableCell>Min</TableCell>
            <TableCell>Max</TableCell>
            <TableCell>Chance 0-1</TableCell>
            <TableCell>Min Day</TableCell>
            <TableCell>Rewards</TableCell>
            <TableCell align="right">Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <Fragment key={`drop-rule-fragment-${index}`}>
              <TableRow key={`drop-rule-${index}`}>
                <TableCell><Checkbox checked={row.enabled} onChange={(event) => onUpdate(index, { enabled: event.target.checked })} /></TableCell>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    disableClearable
                    options={entityOptions}
                    value={row.entity || '*'}
                    getOptionLabel={(option) => entityOptionLabel(option)}
                    isOptionEqualToValue={(option, value) => option === value}
                    filterOptions={(options, state) => {
                      const query = state.inputValue.trim().toLowerCase();
                      if (!query) return options.slice(0, 200);
                      return options.filter((option) => entitySearchText(option).includes(query)).slice(0, 200);
                    }}
                    onChange={(_, value) => onUpdate(index, { entity: resolveEntityInput(value, entityOptions) || '*' })}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') onUpdate(index, { entity: resolveEntityInput(value, entityOptions) || '*' });
                    }}
                    renderInput={(params) => <TextField {...params} label="Entity" size="small" helperText="Use * for any entity" />}
                    sx={{ minWidth: 260 }}
                  />
                </TableCell>
                <TableCell>
                  <Autocomplete
                    freeSolo
                    disableClearable
                    options={itemOptions}
                    value={row.item || ''}
                    getOptionLabel={(option) => shortRegistryLabel(option)}
                    isOptionEqualToValue={(option, value) => option === value}
                    filterOptions={(options, state) => {
                      const query = state.inputValue.trim().toLowerCase();
                      if (!query) return options.slice(0, 200);
                      return options.filter((option) => registrySearchText(option).includes(query)).slice(0, 200);
                    }}
                    onChange={(_, value) => onUpdate(index, { item: resolveRegistryItemInput(value, itemOptions) })}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') onUpdate(index, { item: resolveRegistryItemInput(value, itemOptions) });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Item"
                        size="small"
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              <Tooltip title={ITEM_DISPLAY_TOOLTIP} arrow>
                                <HelpOutlineIcon color="action" fontSize="small" sx={{ mr: 0.5 }} />
                              </Tooltip>
                              {params.InputProps.endAdornment}
                            </>
                          )
                        }}
                      />
                    )}
                    sx={{ minWidth: 280 }}
                  />
                </TableCell>
                <TableCell><TextField type="number" value={row.minCount} onChange={(event) => onUpdate(index, { minCount: numberValue(event.target.value, row.minCount) })} /></TableCell>
                <TableCell><TextField type="number" value={row.maxCount} onChange={(event) => onUpdate(index, { maxCount: numberValue(event.target.value, row.maxCount) })} /></TableCell>
                <TableCell><TextField type="number" inputProps={{ step: 0.01 }} value={row.chance} onChange={(event) => onUpdate(index, { chance: numberValue(event.target.value, row.chance) })} /></TableCell>
                <TableCell><TextField type="number" value={row.minDay} onChange={(event) => onUpdate(index, { minDay: numberValue(event.target.value, row.minDay) })} /></TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <FormControlLabel
                      control={<Checkbox checked={row.economyRewardEnabled ?? false} onChange={(event) => onUpdate(index, {
                        economyRewardEnabled: event.target.checked,
                        economyRewardChance: economyRewardChance(row),
                        economyRewardTargetMode: economyRewardTarget(row),
                        economyRewardParticipantMode: economyRewardParticipantMode(row),
                        economyRewardMinAmount: economyRewardMin(row),
                        economyRewardMaxAmount: economyRewardMax(row),
                        economyRewardReason: economyRewardReason(row)
                      })} />}
                      label="Economy $"
                    />
                    <FormControlLabel
                      control={<Checkbox checked={row.ourMagicRewardEnabled ?? false} onChange={(event) => onUpdate(index, {
                        ourMagicRewardEnabled: event.target.checked,
                        ourMagicRewardChance: rewardChance(row),
                        ourMagicRewardTargetMode: rewardTarget(row),
                        ourMagicRewardMinExperience: rewardMinXp(row),
                        ourMagicRewardMaxExperience: rewardMaxXp(row),
                        ourMagicRewardReason: rewardReason(row)
                      })} />}
                      label="OurMagic XP"
                    />
                  </Stack>
                </TableCell>
                <TableCell align="right">
                  <IconButton color="error" onClick={() => onRemove(index)}><DeleteIcon /></IconButton>
                </TableCell>
              </TableRow>
              {row.economyRewardEnabled && (
                <TableRow key={`drop-rule-${index}-economy-reward`}>
                  <TableCell />
                  <TableCell colSpan={8}>
                    <Stack spacing={1} sx={{ borderLeft: 3, borderColor: 'success.main', pl: 2, py: 1 }}>
                      <Typography variant="subtitle2" fontWeight={900}>Economy money reward for this drop rule</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uses this same entity/profile/min-day row. Participants means players who damaged the mob before it died.
                      </Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField
                          type="number"
                          label="Min $"
                          size="small"
                          value={economyRewardMin(row)}
                          onChange={(event) => onUpdate(index, { economyRewardMinAmount: numberValue(event.target.value, economyRewardMin(row)) })}
                        />
                        <TextField
                          type="number"
                          label="Max $"
                          size="small"
                          value={economyRewardMax(row)}
                          onChange={(event) => onUpdate(index, { economyRewardMaxAmount: numberValue(event.target.value, economyRewardMax(row)) })}
                        />
                        <TextField
                          type="number"
                          label="Reward Chance 0-1"
                          size="small"
                          inputProps={{ step: 0.01 }}
                          value={economyRewardChance(row)}
                          onChange={(event) => onUpdate(index, { economyRewardChance: numberValue(event.target.value, economyRewardChance(row)) })}
                        />
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel>Reward Target</InputLabel>
                          <Select
                            label="Reward Target"
                            value={economyRewardTarget(row)}
                            onChange={(event) => onUpdate(index, { economyRewardTargetMode: event.target.value as EconomyKillRewardTargetMode, economyRewardParticipantMode: economyRewardParticipantMode(row) })}
                          >
                            {(Object.keys(ECONOMY_REWARD_TARGET_LABELS) as EconomyKillRewardTargetMode[]).map((target) => (
                              <MenuItem key={target} value={target}>{ECONOMY_REWARD_TARGET_LABELS[target]}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        {economyRewardTarget(row) === 'ALL_PARTICIPANTS' && (
                          <FormControl size="small" sx={{ minWidth: 220 }}>
                            <InputLabel>Participant Payout</InputLabel>
                            <Select
                              label="Participant Payout"
                              value={economyRewardParticipantMode(row)}
                              onChange={(event) => onUpdate(index, { economyRewardParticipantMode: event.target.value as EconomyParticipantRewardMode })}
                            >
                              {(Object.keys(ECONOMY_PARTICIPANT_MODE_LABELS) as EconomyParticipantRewardMode[]).map((mode) => (
                                <MenuItem key={mode} value={mode}>{ECONOMY_PARTICIPANT_MODE_LABELS[mode]}</MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                        <TextField
                          fullWidth
                          label="Reason / Source"
                          size="small"
                          value={economyRewardReason(row)}
                          onChange={(event) => onUpdate(index, { economyRewardReason: event.target.value })}
                        />
                      </Stack>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
              {row.ourMagicRewardEnabled && (
                <TableRow key={`drop-rule-${index}-ourmagic-reward`}>
                  <TableCell />
                  <TableCell colSpan={8}>
                    <Stack spacing={1} sx={{ borderLeft: 3, borderColor: 'primary.main', pl: 2, py: 1 }}>
                      <Typography variant="subtitle2" fontWeight={900}>OurMagic reward for this drop rule</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Uses this same entity/profile/min-day row. Item drops and XP rewards can roll separately.
                      </Typography>
                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
                        <TextField
                          type="number"
                          label="XP Min"
                          size="small"
                          value={rewardMinXp(row)}
                          onChange={(event) => onUpdate(index, { ourMagicRewardMinExperience: numberValue(event.target.value, rewardMinXp(row)) })}
                        />
                        <TextField
                          type="number"
                          label="XP Max"
                          size="small"
                          value={rewardMaxXp(row)}
                          onChange={(event) => onUpdate(index, { ourMagicRewardMaxExperience: numberValue(event.target.value, rewardMaxXp(row)) })}
                        />
                        <TextField
                          type="number"
                          label="Reward Chance 0-1"
                          size="small"
                          inputProps={{ step: 0.01 }}
                          value={rewardChance(row)}
                          onChange={(event) => onUpdate(index, { ourMagicRewardChance: numberValue(event.target.value, rewardChance(row)) })}
                        />
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <InputLabel>Reward Target</InputLabel>
                          <Select
                            label="Reward Target"
                            value={rewardTarget(row)}
                            onChange={(event) => onUpdate(index, { ourMagicRewardTargetMode: event.target.value as RewardTargetMode })}
                          >
                            {(Object.keys(REWARD_TARGET_LABELS) as RewardTargetMode[]).map((target) => (
                              <MenuItem key={target} value={target}>{REWARD_TARGET_LABELS[target]}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          label="Reason / Source"
                          size="small"
                          value={rewardReason(row)}
                          onChange={(event) => onUpdate(index, { ourMagicRewardReason: event.target.value })}
                        />
                      </Stack>
                    </Stack>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
