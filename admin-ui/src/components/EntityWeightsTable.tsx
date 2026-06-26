import { Fragment, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Collapse,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import type { EntityWeight, MobProperties, PropertyValueMode } from '../types';
import { entityOptionLabel, entitySearchText, mergeEntityRegistryOptions, resolveEntityInput } from '../entityOptions';


const HOSTILE_ENTITY_OPTIONS = [
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

function entityLabel(entityId: string): string {
  return entityOptionLabel(entityId);
}

type EffectiveEntityWeight = EntityWeight & {
  selectionChance: number;
  perAttemptChance: number;
};

type Props = {
  rows: EntityWeight[];
  effectiveRows: EffectiveEntityWeight[];
  onChange: (rows: EntityWeight[]) => void;
  registryEntities?: string[];
  onRefreshRegistryEntities?: () => void;
  selectionColumnLabel?: string;
};

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function formatPercent(value: number): string {
  return `${value.toFixed(2)}%`;
}



type NumericMobPropertyEditorProps = {
  disabled: boolean;
  label: string;
  helperText?: string;
  valueKey: keyof MobProperties;
  modeKey: keyof MobProperties;
  minKey: keyof MobProperties;
  maxKey: keyof MobProperties;
  mobProps: MobProperties;
  inputMin: number;
  inputMax?: number;
  step: number;
  onPatch: (patch: Partial<MobProperties>) => void;
};

function numericFieldValue(props: MobProperties, key: keyof MobProperties, fallback: number): number {
  const raw = props[key];
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : fallback;
}

function modeValue(props: MobProperties, key: keyof MobProperties): PropertyValueMode {
  return props[key] === 'RANGED' ? 'RANGED' : 'FIXED';
}

function NumericMobPropertyEditor({
  disabled,
  label,
  helperText,
  valueKey,
  modeKey,
  minKey,
  maxKey,
  mobProps,
  inputMin,
  inputMax,
  step,
  onPatch
}: NumericMobPropertyEditorProps) {
  const mode = modeValue(mobProps, modeKey);
  const fixed = numericFieldValue(mobProps, valueKey, inputMin);
  const min = numericFieldValue(mobProps, minKey, fixed);
  const max = numericFieldValue(mobProps, maxKey, fixed);

  const commonInputProps = { min: inputMin, max: inputMax, step };

  return (
    <Grid item xs={12} md={6} lg={4}>
      <Box sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
        <Stack spacing={1}>
          <TextField
            fullWidth
            select
            disabled={disabled}
            size="small"
            label={`${label} mode`}
            value={mode}
            onChange={(event) => {
              const nextMode = event.target.value as PropertyValueMode;
              onPatch(
                nextMode === 'RANGED'
                  ? ({ [modeKey]: nextMode, [minKey]: fixed, [maxKey]: fixed, enabled: true } as Partial<MobProperties>)
                  : ({ [modeKey]: nextMode, [valueKey]: fixed, enabled: true } as Partial<MobProperties>)
              );
            }}
          >
            <MenuItem value="FIXED">Fixed</MenuItem>
            <MenuItem value="RANGED">Ranged</MenuItem>
          </TextField>
          {mode === 'RANGED' ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                fullWidth
                disabled={disabled}
                type="number"
                size="small"
                label={`${label} min`}
                value={min}
                inputProps={commonInputProps}
                onChange={(event) => onPatch({ [minKey]: numberValue(event.target.value, min), enabled: true } as Partial<MobProperties>)}
              />
              <TextField
                fullWidth
                disabled={disabled}
                type="number"
                size="small"
                label={`${label} max`}
                value={max}
                inputProps={commonInputProps}
                onChange={(event) => onPatch({ [maxKey]: numberValue(event.target.value, max), enabled: true } as Partial<MobProperties>)}
              />
            </Stack>
          ) : (
            <TextField
              fullWidth
              disabled={disabled}
              type="number"
              size="small"
              label={label}
              value={fixed}
              inputProps={commonInputProps}
              onChange={(event) => onPatch({ [valueKey]: numberValue(event.target.value, fixed), [minKey]: numberValue(event.target.value, fixed), [maxKey]: numberValue(event.target.value, fixed), enabled: true } as Partial<MobProperties>)}
              helperText={helperText ?? '0 leaves vanilla / unchanged.'}
            />
          )}
          {mode === 'RANGED' ? <Typography variant="caption" color="text.secondary">{helperText ?? '0 leaves vanilla / unchanged.'}</Typography> : null}
        </Stack>
      </Box>
    </Grid>
  );
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
    monsterAiWallAttack: false,
    wallAttackUseBlockHp: true,
    wallAttackCooldownTicks: 20,
    wallAttackDamagePerHit: 1,
    nerdPoleEnabled: false,
    maxPillarHeight: 12,
    pillarCooldownTicks: 40,
    airBridgeEnabled: false,
    maxBridgeLength: 24,
    bridgeCooldownTicks: 40,
    killAfterPillarOrBridge: false,
    frustrationTicks: 100,
    monsterAiBuildBlock: 'minecraft:cobblestone',
    megaAggroEnabled: false,
    daytimeMegaAggro: false,
    sprintDistance: 18,
    destroyTorches: false,
    torchRadius: 5,
    torchMinDay: 6,
    naturalSpawnEnabled: false,
    naturalSpawnMinLight: 0,
    naturalSpawnMaxLight: 15,
    naturalSpawnYMin: -64,
    naturalSpawnYMax: 320,
    naturalSpawnAllowWater: false,
    naturalSpawnAllowAir: false,
    naturalSpawnRequireBlockBelow: true,
    naturalSpawnBlockMode: 'DISABLED',
    naturalSpawnBlocks: [],
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

function mobProperties(row: EntityWeight): MobProperties {
  const merged = { ...defaultMobProperties(), ...(row.properties ?? {}) };

  const legacy = (row.properties ?? {}) as Record<string, unknown>;
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
  const raw = row.properties as Record<string, unknown> | undefined;
  const alignRangeDefaults = (valueKey: keyof MobProperties, minKey: keyof MobProperties, maxKey: keyof MobProperties) => {
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


type SpecialGoalSupport = {
  explodingArrows: boolean;
  creeperWallExplosions: boolean;
  endermanTeleportPlayers: boolean;
  spiderWebPlayers: boolean;
};

function normalizedEntityId(entity: string): string {
  return (entity || '').trim().toLowerCase();
}

function supportsExplodingArrows(entity: string): boolean {
  const id = normalizedEntityId(entity);
  return (
    id === 'minecraft:skeleton' ||
    id === 'minecraft:stray' ||
    id === 'minecraft:pillager' ||
    id.endsWith(':skeleton') ||
    id.endsWith(':stray') ||
    id.endsWith(':pillager') ||
    id.includes('archer') ||
    id.includes('bow') ||
    id.includes('crossbow')
  );
}

function supportsCreeperWallExplosions(entity: string): boolean {
  const id = normalizedEntityId(entity);
  return id === 'minecraft:creeper' || id.endsWith(':creeper') || id.includes('creeper');
}

function supportsEndermanTeleportPlayers(entity: string): boolean {
  const id = normalizedEntityId(entity);
  return id === 'minecraft:enderman' || id.endsWith(':enderman') || id.includes('enderman');
}

function supportsSpiderWebPlayers(entity: string): boolean {
  const id = normalizedEntityId(entity);
  return id === 'minecraft:spider' || id === 'minecraft:cave_spider' || id.endsWith(':spider') || id.includes('spider');
}

function getSpecialGoalSupport(entity: string): SpecialGoalSupport {
  return {
    explodingArrows: supportsExplodingArrows(entity),
    creeperWallExplosions: supportsCreeperWallExplosions(entity),
    endermanTeleportPlayers: supportsEndermanTeleportPlayers(entity),
    spiderWebPlayers: supportsSpiderWebPlayers(entity)
  };
}

function hasAnySpecialGoalSupport(support: SpecialGoalSupport): boolean {
  return support.explodingArrows || support.creeperWallExplosions || support.endermanTeleportPlayers || support.spiderWebPlayers;
}

function clearUnsupportedSpecialGoals(entity: string, props: MobProperties): MobProperties {
  const support = getSpecialGoalSupport(entity);
  return {
    ...props,
    explodingArrows: support.explodingArrows ? props.explodingArrows : false,
    creeperWallExplosions: support.creeperWallExplosions ? props.creeperWallExplosions : false,
    endermanTeleportPlayers: support.endermanTeleportPlayers ? props.endermanTeleportPlayers : false,
    spiderWebPlayers: support.spiderWebPlayers ? props.spiderWebPlayers : false
  };
}

export default function EntityWeightsTable({ rows, effectiveRows, onChange, registryEntities = [], onRefreshRegistryEntities, selectionColumnLabel = 'Selection Chance' }: Props) {
  const entityOptions = useMemo(() => mergeEntityRegistryOptions(registryEntities, false), [registryEntities]);
  const effectiveByRow = new Map(effectiveRows.map((row) => [`${row.entity}|${row.minDay}|${row.weight}`, row]));
  const [expandedRows, setExpandedRows] = useState<Set<number>>(() => new Set());

  const update = (index: number, patch: Partial<EntityWeight>) => {
    const next = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
    onChange(next);
  };

  const updateProperties = (index: number, patch: Partial<MobProperties>) => {
    const current = mobProperties(rows[index]);
    update(index, { properties: { ...current, ...patch } });
  };

  const addRow = () => onChange([
    ...rows,
    { entity: 'minecraft:zombie', weight: 1, minDay: 1, spawnChance: 1, enabled: true, properties: defaultMobProperties() }
  ]);

  const toggleExpanded = (index: number) => {
    setExpandedRows((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Stack spacing={2}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <div>
          <Typography variant="h6">Weighted entity pool</Typography>
          <Typography color="text.secondary" variant="body2">
            Weight decides selection. Spawn Chance confirms the spawn. Entities can be hostile, neutral, passive, or modded. Non-hostile entities must enable Natural/passive spawning in Props.
          </Typography>
        </div>
        <Stack direction="row" spacing={1} alignItems="center">
          {onRefreshRegistryEntities ? <Button variant="outlined" onClick={onRefreshRegistryEntities}>Load Entity Registry</Button> : null}
          <Button startIcon={<AddIcon />} variant="contained" onClick={addRow}>
            Add Entity
          </Button>
        </Stack>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Enabled</TableCell>
            <TableCell>Entity</TableCell>
            <TableCell>Weight</TableCell>
            <TableCell>Min Day</TableCell>
            <TableCell>
              <Tooltip title="Chance this entity wins the weighted selection roll among active rows.">
                <span>{selectionColumnLabel}</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="Chance the entity actually spawns after it has already been selected.">
                <span>Spawn Chance</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="Selection Chance x Spawn Chance. This is the rough chance for this mob per spawn attempt after this profile has been selected.">
                <span>Per Attempt</span>
              </Tooltip>
            </TableCell>
            <TableCell>
              <Tooltip title="Open profile-specific vanilla attribute changes for this spawned mob.">
                <span>Props</span>
              </Tooltip>
            </TableCell>
            <TableCell align="right">Remove</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const effective = effectiveByRow.get(`${row.entity}|${row.minDay}|${row.weight}`);
            const spawnChance = Number.isFinite(row.spawnChance) ? row.spawnChance : 1;
            const props = mobProperties(row);
            const specialGoalSupport = getSpecialGoalSupport(row.entity);
            const hasSpecialGoals = hasAnySpecialGoalSupport(specialGoalSupport);
            const expanded = expandedRows.has(index);
            return (
              <Fragment key={`entity-row-${index}`}>
                <TableRow>
                  <TableCell>
                    <Checkbox checked={row.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      freeSolo
                      disableClearable
                      options={entityOptions}
                      value={row.entity}
                      getOptionLabel={(option) => entityLabel(option)}
                      isOptionEqualToValue={(option, value) => option === value}
                      filterOptions={(options, state) => {
                        const query = state.inputValue.trim().toLowerCase();
                        if (!query) return options.slice(0, 200);
                        return options.filter((option) => entitySearchText(option).includes(query)).slice(0, 200);
                      }}
                      onChange={(_, value) => {
                        const nextEntity = resolveEntityInput(value, entityOptions);
                        update(index, { entity: nextEntity, properties: clearUnsupportedSpecialGoals(nextEntity, props) });
                      }}
                      onInputChange={(_, value, reason) => {
                        if (reason !== 'input') return;
                        const nextEntity = resolveEntityInput(value, entityOptions);
                        update(index, { entity: nextEntity, properties: clearUnsupportedSpecialGoals(nextEntity, props) });
                      }}
                      renderInput={(params) => <TextField {...params} size="small" label="Entity" helperText="Choose hostile, passive, neutral, water, or modded entities" />}
                      sx={{ minWidth: 280 }}
                    />
                  </TableCell>
                  <TableCell width={105}>
                    <TextField type="number" value={row.weight} onChange={(event) => update(index, { weight: numberValue(event.target.value, row.weight) })} />
                  </TableCell>
                  <TableCell width={105}>
                    <TextField type="number" value={row.minDay} onChange={(event) => update(index, { minDay: numberValue(event.target.value, row.minDay) })} />
                  </TableCell>
                  <TableCell width={130}>{formatPercent(effective?.selectionChance ?? 0)}</TableCell>
                  <TableCell width={130}>
                    <TextField
                      type="number"
                      value={Math.round(spawnChance * 10000) / 100}
                      inputProps={{ min: 0, max: 100, step: 1 }}
                      onChange={(event) => update(index, { spawnChance: clampPercent(numberValue(event.target.value, spawnChance * 100)) / 100 })}
                      helperText="0-100%"
                    />
                  </TableCell>
                  <TableCell width={120}>{formatPercent(effective?.perAttemptChance ?? 0)}</TableCell>
                  <TableCell width={130}>
                    <Button
                      size="small"
                      variant={expanded ? 'contained' : 'outlined'}
                      startIcon={expanded ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}
                      onClick={() => toggleExpanded(index)}
                    >
                      Props
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="error" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 0, borderBottom: expanded ? undefined : 0 }}>
                    <Collapse in={expanded} timeout="auto" unmountOnExit>
                      <Box sx={{ py: 2 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                            <div>
                              <Typography variant="subtitle2">{row.entity || 'minecraft:zombie'} properties</Typography>
                              <Typography variant="body2" color="text.secondary">
                                These property overrides apply only when this row spawns the selected entity. Use 0 to leave a property vanilla/unchanged.
                              </Typography>
                            </div>
                            <FormControlLabel
                              control={<Checkbox checked={props.enabled} onChange={(event) => updateProperties(index, { enabled: event.target.checked })} />}
                              label="Enable mob properties"
                            />
                          </Stack>
                          <Grid container spacing={2}>
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Max health" valueKey="maxHealth" modeKey="maxHealthMode" minKey="maxHealthMin" maxKey="maxHealthMax" mobProps={props} inputMin={0} step={0.05} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Attack damage" valueKey="attackDamage" modeKey="attackDamageMode" minKey="attackDamageMin" maxKey="attackDamageMax" mobProps={props} inputMin={0} step={0.05} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Movement speed" valueKey="movementSpeed" modeKey="movementSpeedMode" minKey="movementSpeedMin" maxKey="movementSpeedMax" mobProps={props} inputMin={0} inputMax={10} step={0.05} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Follow range" valueKey="followRange" modeKey="followRangeMode" minKey="followRangeMin" maxKey="followRangeMax" mobProps={props} inputMin={0} inputMax={128} step={0.05} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Armor" valueKey="armor" modeKey="armorMode" minKey="armorMin" maxKey="armorMax" mobProps={props} inputMin={0} inputMax={100} step={1} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Armor toughness" valueKey="armorToughness" modeKey="armorToughnessMode" minKey="armorToughnessMin" maxKey="armorToughnessMax" mobProps={props} inputMin={0} inputMax={100} step={1} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Knockback resistance" valueKey="knockbackResistance" modeKey="knockbackResistanceMode" minKey="knockbackResistanceMin" maxKey="knockbackResistanceMax" mobProps={props} inputMin={0} inputMax={1} step={0.05} onPatch={(patch) => updateProperties(index, patch)} />
                            <NumericMobPropertyEditor disabled={!props.enabled} label="Step height" helperText="0 leaves vanilla step height. 1.0+ helps mobs step onto full blocks." valueKey="stepHeight" modeKey="stepHeightMode" minKey="stepHeightMin" maxKey="stepHeightMax" mobProps={props} inputMin={0} inputMax={3} step={0.05} onPatch={(patch) => updateProperties(index, patch)} />
                            <Grid item xs={12} sm={6} md={3}>
                              <TextField fullWidth disabled={!props.enabled} label="Custom name" value={props.customName} onChange={(event) => updateProperties(index, { customName: event.target.value, enabled: true })} />
                            </Grid>
                            <Grid item xs={12}>
                              <Stack direction="row" flexWrap="wrap" gap={2}>
                                <FormControlLabel
                                  control={<Checkbox disabled={!props.enabled} checked={props.persistent} onChange={(event) => updateProperties(index, { persistent: event.target.checked, enabled: true })} />}
                                  label="Persistent mob"
                                />
                              </Stack>
                            </Grid>

                            <Grid item xs={12}>
                              <Box sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Stack spacing={2}>
                                  <div>
                                    <Typography variant="subtitle2">Monster AI behavior for this spawn row</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      These are per-row behavior toggles. One zombie profile can nerd-pole while another zombie profile stays vanilla.
                                    </Typography>
                                  </div>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox checked={props.megaAggroEnabled} onChange={(event) => updateProperties(index, { megaAggroEnabled: event.target.checked })} />}
                                        label="Mega aggro"
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox disabled={!props.megaAggroEnabled} checked={props.daytimeMegaAggro} onChange={(event) => updateProperties(index, { daytimeMegaAggro: event.target.checked })} />}
                                        label="Daytime aggro"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.megaAggroEnabled} type="number" label="Sprint distance" value={props.sprintDistance} inputProps={{ min: 0, step: 1 }} onChange={(event) => updateProperties(index, { sprintDistance: numberValue(event.target.value, props.sprintDistance) })} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox checked={props.destroyTorches} onChange={(event) => updateProperties(index, { destroyTorches: event.target.checked })} />}
                                        label="Destroy torches"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.destroyTorches} type="number" label="Torch radius" value={props.torchRadius} inputProps={{ min: 1, step: 1 }} onChange={(event) => updateProperties(index, { torchRadius: numberValue(event.target.value, props.torchRadius) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.destroyTorches} type="number" label="Torch min day" value={props.torchMinDay} inputProps={{ min: 1, max: 30, step: 1 }} onChange={(event) => updateProperties(index, { torchMinDay: numberValue(event.target.value, props.torchMinDay) })} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox checked={props.monsterAiWallAttack} onChange={(event) => updateProperties(index, { monsterAiWallAttack: event.target.checked })} />}
                                        label="Wall attack"
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox disabled={!props.monsterAiWallAttack} checked={props.wallAttackUseBlockHp} onChange={(event) => updateProperties(index, { wallAttackUseBlockHp: event.target.checked })} />}
                                        label="Wall block HP style"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.monsterAiWallAttack} type="number" label="Wall cooldown" value={props.wallAttackCooldownTicks} inputProps={{ min: 5, step: 5 }} onChange={(event) => updateProperties(index, { wallAttackCooldownTicks: numberValue(event.target.value, props.wallAttackCooldownTicks) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.monsterAiWallAttack} type="number" label="Wall damage/hit" value={props.wallAttackDamagePerHit} inputProps={{ min: 0.1, step: 0.1 }} onChange={(event) => updateProperties(index, { wallAttackDamagePerHit: numberValue(event.target.value, props.wallAttackDamagePerHit) })} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox checked={props.nerdPoleEnabled} onChange={(event) => updateProperties(index, { nerdPoleEnabled: event.target.checked })} />}
                                        label="Nerd-pole up"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.nerdPoleEnabled} type="number" label="Max pillar height" value={props.maxPillarHeight} inputProps={{ min: 1, max: 128, step: 1 }} onChange={(event) => updateProperties(index, { maxPillarHeight: numberValue(event.target.value, props.maxPillarHeight) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.nerdPoleEnabled} type="number" label="Pillar cooldown" value={props.pillarCooldownTicks} inputProps={{ min: 5, step: 5 }} onChange={(event) => updateProperties(index, { pillarCooldownTicks: numberValue(event.target.value, props.pillarCooldownTicks) })} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox checked={props.airBridgeEnabled} onChange={(event) => updateProperties(index, { airBridgeEnabled: event.target.checked })} />}
                                        label="Air bridge"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.airBridgeEnabled} type="number" label="Max bridge length" value={props.maxBridgeLength} inputProps={{ min: 1, max: 128, step: 1 }} onChange={(event) => updateProperties(index, { maxBridgeLength: numberValue(event.target.value, props.maxBridgeLength) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.airBridgeEnabled} type="number" label="Bridge cooldown" value={props.bridgeCooldownTicks} inputProps={{ min: 5, step: 5 }} onChange={(event) => updateProperties(index, { bridgeCooldownTicks: numberValue(event.target.value, props.bridgeCooldownTicks) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth type="number" label="Frustration ticks" value={props.frustrationTicks} inputProps={{ min: 20, step: 20 }} onChange={(event) => updateProperties(index, { frustrationTicks: numberValue(event.target.value, props.frustrationTicks) })} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <TextField fullWidth label="Build block" value={props.monsterAiBuildBlock} onChange={(event) => updateProperties(index, { monsterAiBuildBlock: event.target.value })} />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox disabled={!props.nerdPoleEnabled && !props.airBridgeEnabled} checked={props.killAfterPillarOrBridge} onChange={(event) => updateProperties(index, { killAfterPillarOrBridge: event.target.checked })} />}
                                        label="Kill after building"
                                      />
                                    </Grid>
                                  </Grid>
                                </Stack>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Box sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Stack spacing={2}>
                                  <div>
                                    <Typography variant="subtitle2">Natural / passive spawning for this row</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Enable this when the row is a non-hostile entity like sheep, cows, villagers, fish, or other passive/modded mobs. It adds MonsterApocalypse-style natural spawn checks.
                                    </Typography>
                                  </div>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox checked={props.naturalSpawnEnabled} onChange={(event) => updateProperties(index, { naturalSpawnEnabled: event.target.checked })} />}
                                        label="Natural/passive spawn"
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox disabled={!props.naturalSpawnEnabled} checked={props.naturalSpawnRequireBlockBelow} onChange={(event) => updateProperties(index, { naturalSpawnRequireBlockBelow: event.target.checked })} />}
                                        label="Require ground below"
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox disabled={!props.naturalSpawnEnabled} checked={props.naturalSpawnAllowWater} onChange={(event) => updateProperties(index, { naturalSpawnAllowWater: event.target.checked })} />}
                                        label="Allow water"
                                      />
                                    </Grid>
                                    <Grid item xs={12} md={3}>
                                      <FormControlLabel
                                        control={<Checkbox disabled={!props.naturalSpawnEnabled} checked={props.naturalSpawnAllowAir} onChange={(event) => updateProperties(index, { naturalSpawnAllowAir: event.target.checked })} />}
                                        label="Allow air block below"
                                      />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.naturalSpawnEnabled} type="number" label="Min light" value={props.naturalSpawnMinLight} inputProps={{ min: 0, max: 15, step: 1 }} onChange={(event) => updateProperties(index, { naturalSpawnMinLight: numberValue(event.target.value, props.naturalSpawnMinLight) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.naturalSpawnEnabled} type="number" label="Max light" value={props.naturalSpawnMaxLight} inputProps={{ min: 0, max: 15, step: 1 }} onChange={(event) => updateProperties(index, { naturalSpawnMaxLight: numberValue(event.target.value, props.naturalSpawnMaxLight) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.naturalSpawnEnabled} type="number" label="Min Y" value={props.naturalSpawnYMin} inputProps={{ step: 1 }} onChange={(event) => updateProperties(index, { naturalSpawnYMin: numberValue(event.target.value, props.naturalSpawnYMin) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={2}>
                                      <TextField fullWidth disabled={!props.naturalSpawnEnabled} type="number" label="Max Y" value={props.naturalSpawnYMax} inputProps={{ step: 1 }} onChange={(event) => updateProperties(index, { naturalSpawnYMax: numberValue(event.target.value, props.naturalSpawnYMax) })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={3}>
                                      <TextField
                                        fullWidth
                                        select
                                        disabled={!props.naturalSpawnEnabled}
                                        label="Spawn block filter"
                                        value={props.naturalSpawnBlockMode}
                                        onChange={(event) => updateProperties(index, { naturalSpawnBlockMode: event.target.value as MobProperties['naturalSpawnBlockMode'] })}
                                      >
                                        <MenuItem value="DISABLED">Disabled</MenuItem>
                                        <MenuItem value="BLACKLIST">Blacklist blocks</MenuItem>
                                        <MenuItem value="WHITELIST">Whitelist blocks</MenuItem>
                                      </TextField>
                                    </Grid>
                                    <Grid item xs={12} md={9}>
                                      <TextField
                                        fullWidth
                                        disabled={!props.naturalSpawnEnabled || props.naturalSpawnBlockMode === 'DISABLED'}
                                        label="Spawn blocks"
                                        value={(props.naturalSpawnBlocks ?? []).join(', ')}
                                        onChange={(event) => updateProperties(index, { naturalSpawnBlocks: event.target.value.split(',').map((value) => value.trim()).filter(Boolean) })}
                                        helperText="Comma-separated block ids. Example: minecraft:grass_block, minecraft:sand"
                                      />
                                    </Grid>
                                  </Grid>
                                </Stack>
                              </Box>
                            </Grid>

                            <Grid item xs={12}>
                              <Box sx={{ mt: 1, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                                <Stack spacing={2}>
                                  <div>
                                    <Typography variant="subtitle2">Special goals for this entity</Typography>
                                    <Typography variant="body2" color="text.secondary">
                                      Only goals that make sense for {row.entity || 'this entity'} are shown. Unsupported goals are hidden and ignored by the mod.
                                    </Typography>
                                  </div>
                                  {!hasSpecialGoals ? (
                                    <Typography variant="body2" color="text.secondary">
                                      No special goals are available for this entity type. Generic targeting, breaking, placing, bridging, and vanilla attributes still apply.
                                    </Typography>
                                  ) : (
                                    <Grid container spacing={2}>
                                      {specialGoalSupport.explodingArrows ? (
                                        <>
                                          <Grid item xs={12} md={3}>
                                            <FormControlLabel
                                              control={<Checkbox checked={props.explodingArrows} onChange={(event) => updateProperties(index, { explodingArrows: event.target.checked })} />}
                                              label="Exploding arrows"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                              fullWidth
                                              disabled={!props.explodingArrows}
                                              type="number"
                                              label="Arrow explosion chance"
                                              value={Math.round((props.explodingArrowChance ?? 0) * 10000) / 100}
                                              inputProps={{ min: 0, max: 100, step: 1 }}
                                              onChange={(event) => updateProperties(index, { explodingArrowChance: clampPercent(numberValue(event.target.value, (props.explodingArrowChance ?? 0) * 100)) / 100 })}
                                              helperText="0-100%"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField fullWidth disabled={!props.explodingArrows} type="number" label="Arrow explosion power" value={props.explodingArrowPower} inputProps={{ min: 0.1, step: 0.1 }} onChange={(event) => updateProperties(index, { explodingArrowPower: numberValue(event.target.value, props.explodingArrowPower) })} />
                                          </Grid>
                                          <Grid item xs={12} md={3}>
                                            <FormControlLabel
                                              control={<Checkbox disabled={!props.explodingArrows} checked={props.explodingArrowBreakBlocks} onChange={(event) => updateProperties(index, { explodingArrowBreakBlocks: event.target.checked })} />}
                                              label="Arrow explosions break blocks"
                                            />
                                          </Grid>
                                        </>
                                      ) : null}

                                      {specialGoalSupport.creeperWallExplosions ? (
                                        <>
                                          <Grid item xs={12} md={3}>
                                            <FormControlLabel
                                              control={<Checkbox checked={props.creeperWallExplosions} onChange={(event) => updateProperties(index, { creeperWallExplosions: event.target.checked })} />}
                                              label="Creeper wall explosions"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                              fullWidth
                                              disabled={!props.creeperWallExplosions}
                                              type="number"
                                              label="Wall explosion chance"
                                              value={Math.round((props.creeperWallExplosionChance ?? 0) * 10000) / 100}
                                              inputProps={{ min: 0, max: 100, step: 1 }}
                                              onChange={(event) => updateProperties(index, { creeperWallExplosionChance: clampPercent(numberValue(event.target.value, (props.creeperWallExplosionChance ?? 0) * 100)) / 100 })}
                                              helperText="0-100%"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField fullWidth disabled={!props.creeperWallExplosions} type="number" label="Wall explosion power" value={props.creeperWallExplosionPower} inputProps={{ min: 0.1, step: 0.1 }} onChange={(event) => updateProperties(index, { creeperWallExplosionPower: numberValue(event.target.value, props.creeperWallExplosionPower) })} />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField fullWidth disabled={!props.creeperWallExplosions} type="number" label="Wall explosion cooldown ticks" value={props.creeperWallExplosionCooldownTicks} inputProps={{ min: 20, step: 20 }} onChange={(event) => updateProperties(index, { creeperWallExplosionCooldownTicks: numberValue(event.target.value, props.creeperWallExplosionCooldownTicks) })} />
                                          </Grid>
                                        </>
                                      ) : null}

                                      {specialGoalSupport.endermanTeleportPlayers ? (
                                        <>
                                          <Grid item xs={12} md={3}>
                                            <FormControlLabel
                                              control={<Checkbox checked={props.endermanTeleportPlayers} onChange={(event) => updateProperties(index, { endermanTeleportPlayers: event.target.checked })} />}
                                              label="Enderman teleports players"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                              fullWidth
                                              disabled={!props.endermanTeleportPlayers}
                                              type="number"
                                              label="Teleport chance"
                                              value={Math.round((props.endermanTeleportChance ?? 0) * 10000) / 100}
                                              inputProps={{ min: 0, max: 100, step: 1 }}
                                              onChange={(event) => updateProperties(index, { endermanTeleportChance: clampPercent(numberValue(event.target.value, (props.endermanTeleportChance ?? 0) * 100)) / 100 })}
                                              helperText="0-100%"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField fullWidth disabled={!props.endermanTeleportPlayers} type="number" label="Teleport radius" value={props.endermanTeleportRadius} inputProps={{ min: 4, max: 64, step: 1 }} onChange={(event) => updateProperties(index, { endermanTeleportRadius: numberValue(event.target.value, props.endermanTeleportRadius) })} />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField fullWidth disabled={!props.endermanTeleportPlayers} type="number" label="Teleport cooldown ticks" value={props.endermanTeleportCooldownTicks} inputProps={{ min: 20, step: 20 }} onChange={(event) => updateProperties(index, { endermanTeleportCooldownTicks: numberValue(event.target.value, props.endermanTeleportCooldownTicks) })} />
                                          </Grid>
                                        </>
                                      ) : null}

                                      {specialGoalSupport.spiderWebPlayers ? (
                                        <>
                                          <Grid item xs={12} md={3}>
                                            <FormControlLabel
                                              control={<Checkbox checked={props.spiderWebPlayers} onChange={(event) => updateProperties(index, { spiderWebPlayers: event.target.checked })} />}
                                              label="Spider webs players"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField
                                              fullWidth
                                              disabled={!props.spiderWebPlayers}
                                              type="number"
                                              label="Web chance"
                                              value={Math.round((props.spiderWebChance ?? 0) * 10000) / 100}
                                              inputProps={{ min: 0, max: 100, step: 1 }}
                                              onChange={(event) => updateProperties(index, { spiderWebChance: clampPercent(numberValue(event.target.value, (props.spiderWebChance ?? 0) * 100)) / 100 })}
                                              helperText="0-100%"
                                            />
                                          </Grid>
                                          <Grid item xs={12} sm={6} md={3}>
                                            <TextField fullWidth disabled={!props.spiderWebPlayers} type="number" label="Web cooldown ticks" value={props.spiderWebCooldownTicks} inputProps={{ min: 20, step: 20 }} onChange={(event) => updateProperties(index, { spiderWebCooldownTicks: numberValue(event.target.value, props.spiderWebCooldownTicks) })} />
                                          </Grid>
                                        </>
                                      ) : null}
                                    </Grid>
                                  )}
                                </Stack>
                              </Box>
                            </Grid>
                          </Grid>
                        </Stack>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </Fragment>
            );
          })}
        </TableBody>
      </Table>
    </Stack>
  );
}
