import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
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
  TextField,
  Typography,
} from '@mui/material';
import type { ApocalypseConfig, RewardRule, RewardsConfig, RewardTargetMode, RewardType } from '../types';

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

const ENTITY_OPTIONS = [
  '*',
  'minecraft:zombie',
  'minecraft:skeleton',
  'minecraft:creeper',
  'minecraft:spider',
  'minecraft:cave_spider',
  'minecraft:enderman',
  'minecraft:witch',
  'minecraft:husk',
  'minecraft:drowned',
  'minecraft:stray',
  'minecraft:slime',
  'minecraft:pillager',
  'minecraft:vindicator',
  'minecraft:evoker',
  'minecraft:ravager',
  'minecraft:phantom',
  'minecraft:blaze',
  'minecraft:magma_cube',
  'minecraft:wither_skeleton',
  'minecraft:zoglin',
  'minecraft:ghast',
];

const TARGET_LABELS: Record<RewardTargetMode, string> = {
  KILLER: 'Killer',
  NEAREST_PLAYER: 'Nearest Player',
  ALL_PLAYERS: 'All Players',
  EVENT_TARGET: 'Event Target',
};

const REWARD_LABELS: Record<RewardType, string> = {
  OURMAGIC_XP: 'OurMagic XP API',
  VANILLA_XP: 'Vanilla XP Command',
};

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function displayRegistryId(option: string): string {
  if (option === '*') return 'All mobs (*)';
  return option.startsWith('minecraft:') ? option.slice('minecraft:'.length) : option;
}

function defaultRewardRule(): RewardRule {
  return {
    id: newId('reward'),
    enabled: true,
    entity: '*',
    minDay: 1,
    chance: 1,
    targetMode: 'KILLER',
    rewardType: 'OURMAGIC_XP',
    minExperience: 1,
    maxExperience: 3,
    reason: 'apocalypse-mob-reward',
  };
}

function ensureRewardsConfig(draft: ApocalypseConfig): RewardsConfig {
  draft.rewards = {
    enabled: true,
    rules: [],
    ...(draft.rewards ?? {}),
  };
  return draft.rewards;
}

export default function RewardsEditor({ config, updateConfig }: Props) {
  const rewards = config.rewards ?? { enabled: true, rules: [] };
  const rules = rewards.rules ?? [];
  const ourMagic = config.integrations?.ourMagic ?? {
    enabled: false,
    host: '127.0.0.1',
    port: 8767,
    token: '',
  };

  const updateRewards = (patch: Partial<ApocalypseConfig['rewards']>) => {
    updateConfig((draft) => {
      draft.rewards = { ...ensureRewardsConfig(draft), ...patch };
    });
  };

  const updateOurMagic = (patch: Partial<ApocalypseConfig['integrations']['ourMagic']>) => {
    updateConfig((draft) => {
      draft.integrations = {
        ...(draft.integrations ?? { ourMagic }),
        ourMagic: {
          ...(draft.integrations?.ourMagic ?? ourMagic),
          ...patch,
        },
      };
    });
  };

  const updateRule = (ruleId: string, patch: Partial<RewardRule>) => {
    updateConfig((draft) => {
      const rewardsConfig = ensureRewardsConfig(draft);
      rewardsConfig.rules = rewardsConfig.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, ...patch } : rule,
      );
    });
  };

  const addRule = () => {
    updateConfig((draft) => {
      const rewardsConfig = ensureRewardsConfig(draft);
      rewardsConfig.rules = [...rewardsConfig.rules, defaultRewardRule()];
    });
  };

  const removeRule = (ruleId: string) => {
    updateConfig((draft) => {
      const rewardsConfig = ensureRewardsConfig(draft);
      rewardsConfig.rules = rewardsConfig.rules.filter((rule) => rule.id !== ruleId);
    });
  };

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h6" fontWeight={900}>Reward Rules</Typography>
          <Typography color="text.secondary" variant="body2">
            Configure XP-style rewards separately from item drops. These are stored in config now and sent through the Our Magic gateway.
          </Typography>
        </Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={addRule}>Add Reward</Button>
      </Stack>

      <Alert severity="info">
        Item drops stay under Drops. This page is for non-item rewards sent through the Our Magic gateway.
      </Alert>

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="subtitle1" fontWeight={900}>OurMagic Integration</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <FormControlLabel
                  control={<Switch checked={ourMagic.enabled} onChange={(event) => updateOurMagic({ enabled: event.target.checked })} />}
                  label="Enable OurMagic API"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <TextField fullWidth label="Host" value={ourMagic.host} onChange={(event) => updateOurMagic({ host: event.target.value })} />
              </Grid>
              <Grid item xs={12} md={2}>
                <TextField fullWidth type="number" label="Port" value={ourMagic.port} onChange={(event) => updateOurMagic({ port: numberValue(event.target.value, ourMagic.port) })} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Token" value={ourMagic.token} onChange={(event) => updateOurMagic({ token: event.target.value })} helperText="Sent as x-mod-api-key by Apocalypse when the gateway requires a mod API key." />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <FormControlLabel
        control={<Switch checked={rewards.enabled} onChange={(event) => updateRewards({ enabled: event.target.checked })} />}
        label="Rewards Enabled"
      />

      <Stack spacing={2}>
        {rules.map((rule, index) => (
          <Card key={rule.id} variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" gap={1}>
                  <Box>
                    <Typography fontWeight={900}>Reward {index + 1}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {displayRegistryId(rule.entity)} → {rule.minExperience}-{rule.maxExperience} XP via {REWARD_LABELS[rule.rewardType]}
                    </Typography>
                  </Box>
                  <IconButton color="error" onClick={() => removeRule(rule.id)}><DeleteIcon /></IconButton>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={2}>
                    <FormControlLabel
                      control={<Switch checked={rule.enabled} onChange={(event) => updateRule(rule.id, { enabled: event.target.checked })} />}
                      label="Enabled"
                    />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <Autocomplete
                      freeSolo
                      options={ENTITY_OPTIONS}
                      value={rule.entity}
                      onChange={(_, selected) => updateRule(rule.id, { entity: selected ?? '*' })}
                      onInputChange={(_, input, reason) => {
                        if (reason === 'input') updateRule(rule.id, { entity: input });
                      }}
                      getOptionLabel={displayRegistryId}
                      renderInput={(params) => <TextField {...params} label="Entity" helperText="Use * for all mobs." />}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth type="number" label="Min Day" value={rule.minDay} onChange={(event) => updateRule(rule.id, { minDay: numberValue(event.target.value, rule.minDay) })} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth type="number" inputProps={{ step: 0.01, min: 0, max: 1 }} label="Chance 0-1" value={rule.chance} onChange={(event) => updateRule(rule.id, { chance: numberValue(event.target.value, rule.chance) })} />
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Target</InputLabel>
                      <Select label="Target" value={rule.targetMode} onChange={(event) => updateRule(rule.id, { targetMode: event.target.value as RewardTargetMode })}>
                        {(Object.keys(TARGET_LABELS) as RewardTargetMode[]).map((mode) => <MenuItem key={mode} value={mode}>{TARGET_LABELS[mode]}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={3}>
                    <FormControl fullWidth>
                      <InputLabel>Reward Type</InputLabel>
                      <Select label="Reward Type" value={rule.rewardType} onChange={(event) => updateRule(rule.id, { rewardType: event.target.value as RewardType })}>
                        {(Object.keys(REWARD_LABELS) as RewardType[]).map((type) => <MenuItem key={type} value={type}>{REWARD_LABELS[type]}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth type="number" label="Min XP" value={rule.minExperience} onChange={(event) => updateRule(rule.id, { minExperience: numberValue(event.target.value, rule.minExperience) })} />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <TextField fullWidth type="number" label="Max XP" value={rule.maxExperience} onChange={(event) => updateRule(rule.id, { maxExperience: numberValue(event.target.value, rule.maxExperience) })} />
                  </Grid>
                  <Grid item xs={12} md={5}>
                    <TextField fullWidth label="Reason / Source" value={rule.reason} onChange={(event) => updateRule(rule.id, { reason: event.target.value })} />
                  </Grid>
                </Grid>
              </Stack>
            </CardContent>
          </Card>
        ))}

        {rules.length === 0 && (
          <Card variant="outlined"><CardContent><Stack spacing={2}>
            <Typography color="text.secondary">No reward rules yet.</Typography>
            <Button startIcon={<AddIcon />} onClick={addRule}>Add First Reward</Button>
          </Stack></CardContent></Card>
        )}
      </Stack>

      <Divider />
      <Typography color="text.secondary" variant="body2">
        Execution note: Apocalypse sends rewards to the hardcoded Our Magic gateway route on this host and port.
      </Typography>
    </Stack>
  );
}
