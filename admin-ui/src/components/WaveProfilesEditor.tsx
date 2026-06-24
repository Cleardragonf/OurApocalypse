import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  Alert,
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
  Typography
} from '@mui/material';
import { useMemo, useState } from 'react';
import type { ApocalypseConfig, WaveProfile } from '../types';

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

function numberValue(value: string, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function newProfile(): WaveProfile {
  const suffix = Date.now().toString(36);
  return {
    id: `custom-wave-${suffix}`,
    name: `Custom Wave ${suffix}`,
    enabled: true,
    minDay: 1,
    maxDay: 30,
    weight: 10,
    minWaves: 1,
    maxWaves: 2,
    minMobs: 8,
    maxMobs: 20,
    spawnRadiusMin: 24,
    spawnRadiusMax: 56,
    maxSpawnAttemptsPerMob: 12,
    spawnAroundEachPlayer: true,
    avoidCreativeAndSpectator: true,
    announceWaves: true
  };
}

function isProfileActiveOnDay(profile: WaveProfile, day: number): boolean {
  return profile.enabled
    && Number(profile.weight || 0) > 0
    && day >= Number(profile.minDay || 1)
    && day <= Number(profile.maxDay || 30);
}

function effectiveChance(profile: WaveProfile, allProfiles: WaveProfile[], day: number): number {
  const active = allProfiles.filter((entry) => isProfileActiveOnDay(entry, day));
  const total = active.reduce((sum, entry) => sum + Number(entry.weight || 0), 0);
  return total > 0 && isProfileActiveOnDay(profile, day) ? (Number(profile.weight || 0) / total) * 100 : 0;
}

export default function WaveProfilesEditor({ config, updateConfig }: Props) {
  const profiles = config.waves.nightProfiles ?? [];
  const [selectedProfileId, setSelectedProfileId] = useState(() => profiles[0]?.id ?? '');
  const selectedProfile = useMemo(() => profiles.find((profile) => profile.id === selectedProfileId) ?? profiles[0], [profiles, selectedProfileId]);

  const updateWaveSettings = (patch: Partial<ApocalypseConfig['waves']>) => {
    updateConfig((draft) => { draft.waves = { ...draft.waves, ...patch }; });
  };

  const updateProfile = (profileId: string, patch: Partial<WaveProfile>) => {
    updateConfig((draft) => {
      draft.waves.nightProfiles = (draft.waves.nightProfiles ?? []).map((profile) => profile.id === profileId ? { ...profile, ...patch } : profile);
    });
  };

  const addProfile = () => {
    const profile = newProfile();
    updateConfig((draft) => { draft.waves.nightProfiles = [...(draft.waves.nightProfiles ?? []), profile]; });
    setSelectedProfileId(profile.id);
  };

  const duplicateProfile = (profile: WaveProfile) => {
    const copy = { ...profile, id: `${profile.id}-copy-${Date.now().toString(36)}`, name: `${profile.name} Copy` };
    updateConfig((draft) => { draft.waves.nightProfiles = [...(draft.waves.nightProfiles ?? []), copy]; });
    setSelectedProfileId(copy.id);
  };

  const removeProfile = (profileId: string) => {
    const remaining = profiles.filter((profile) => profile.id !== profileId);
    updateConfig((draft) => { draft.waves.nightProfiles = remaining; });
    setSelectedProfileId(remaining[0]?.id ?? '');
  };

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
        <div>
          <Typography variant="h6">Nightly wave profiles</Typography>
          <Typography color="text.secondary" variant="body2">LEGACY_RULES uses the old day-1/day-30 scaling. NIGHT_PROFILES rolls one weighted wave profile per Minecraft night.</Typography>
        </div>
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControlLabel control={<Switch checked={config.waves.enabled} onChange={(event) => updateWaveSettings({ enabled: event.target.checked })} />} label="Waves Enabled" />
          <FormControlLabel control={<Switch checked={config.waves.onlyAtNight} onChange={(event) => updateWaveSettings({ onlyAtNight: event.target.checked })} />} label="Only At Night" />
          <FormControl sx={{ minWidth: 200 }} size="small">
            <InputLabel>Wave Mode</InputLabel>
            <Select label="Wave Mode" value={config.waves.activeMode ?? 'NIGHT_PROFILES'} onChange={(event) => updateWaveSettings({ activeMode: event.target.value as ApocalypseConfig['waves']['activeMode'] })}>
              <MenuItem value="NIGHT_PROFILES">Night Profiles</MenuItem>
              <MenuItem value="LEGACY_RULES">Legacy Rules</MenuItem>
            </Select>
          </FormControl>
          <Button startIcon={<AddIcon />} variant="contained" onClick={addProfile}>Add Profile</Button>
        </Stack>
      </Stack>

      <TextField type="number" label="Tick Check Interval" value={config.waves.tickCheckInterval} onChange={(event) => updateWaveSettings({ tickCheckInterval: numberValue(event.target.value, config.waves.tickCheckInterval) })} sx={{ maxWidth: 260 }} />

      {config.waves.activeMode === 'LEGACY_RULES' ? (
        <LegacyWaveSettings config={config} updateConfig={updateConfig} />
      ) : (
        <Stack spacing={2}>
          <Alert severity="info">Profiles use min/max day plus weight. Wave profiles only roll against other active wave profiles for the same Minecraft day/night. Entity profiles and drop profiles are separate rolls.</Alert>
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
                <Typography color="text.secondary" variant="body2">Approx chance among active wave profiles on day {selectedProfile.minDay}: {effectiveChance(selectedProfile, profiles, selectedProfile.minDay).toFixed(1)}%</Typography>
              </Stack>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField fullWidth label="Profile ID" value={selectedProfile.id} disabled />
                <TextField fullWidth label="Profile Name" value={selectedProfile.name} onChange={(event) => updateProfile(selectedProfile.id, { name: event.target.value })} />
                <TextField type="number" label="Min Day" value={selectedProfile.minDay} onChange={(event) => updateProfile(selectedProfile.id, { minDay: numberValue(event.target.value, selectedProfile.minDay) })} />
                <TextField type="number" label="Max Day" value={selectedProfile.maxDay} onChange={(event) => updateProfile(selectedProfile.id, { maxDay: numberValue(event.target.value, selectedProfile.maxDay) })} />
                <TextField type="number" label="Weight" value={selectedProfile.weight} onChange={(event) => updateProfile(selectedProfile.id, { weight: numberValue(event.target.value, selectedProfile.weight) })} />
              </Stack>

              <Table size="small">
                <TableHead><TableRow><TableCell>Setting</TableCell><TableCell>Min</TableCell><TableCell>Max</TableCell><TableCell>Spawn Controls</TableCell></TableRow></TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Waves per night</TableCell>
                    <TableCell><TextField type="number" value={selectedProfile.minWaves} onChange={(event) => updateProfile(selectedProfile.id, { minWaves: numberValue(event.target.value, selectedProfile.minWaves) })} /></TableCell>
                    <TableCell><TextField type="number" value={selectedProfile.maxWaves} onChange={(event) => updateProfile(selectedProfile.id, { maxWaves: numberValue(event.target.value, selectedProfile.maxWaves) })} /></TableCell>
                    <TableCell rowSpan={3}>
                      <Stack spacing={1}>
                        <TextField type="number" label="Max Spawn Attempts/Mob" value={selectedProfile.maxSpawnAttemptsPerMob} onChange={(event) => updateProfile(selectedProfile.id, { maxSpawnAttemptsPerMob: numberValue(event.target.value, selectedProfile.maxSpawnAttemptsPerMob) })} />
                        <FormControlLabel control={<Checkbox checked={selectedProfile.spawnAroundEachPlayer} onChange={(event) => updateProfile(selectedProfile.id, { spawnAroundEachPlayer: event.target.checked })} />} label="Spawn around each player" />
                        <FormControlLabel control={<Checkbox checked={selectedProfile.avoidCreativeAndSpectator} onChange={(event) => updateProfile(selectedProfile.id, { avoidCreativeAndSpectator: event.target.checked })} />} label="Avoid creative/spectator" />
                        <FormControlLabel control={<Checkbox checked={selectedProfile.announceWaves} onChange={(event) => updateProfile(selectedProfile.id, { announceWaves: event.target.checked })} />} label="Announce waves" />
                      </Stack>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Mobs per wave</TableCell>
                    <TableCell><TextField type="number" value={selectedProfile.minMobs} onChange={(event) => updateProfile(selectedProfile.id, { minMobs: numberValue(event.target.value, selectedProfile.minMobs) })} /></TableCell>
                    <TableCell><TextField type="number" value={selectedProfile.maxMobs} onChange={(event) => updateProfile(selectedProfile.id, { maxMobs: numberValue(event.target.value, selectedProfile.maxMobs) })} /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Spawn radius</TableCell>
                    <TableCell><TextField type="number" value={selectedProfile.spawnRadiusMin} onChange={(event) => updateProfile(selectedProfile.id, { spawnRadiusMin: numberValue(event.target.value, selectedProfile.spawnRadiusMin) })} /></TableCell>
                    <TableCell><TextField type="number" value={selectedProfile.spawnRadiusMax} onChange={(event) => updateProfile(selectedProfile.id, { spawnRadiusMax: numberValue(event.target.value, selectedProfile.spawnRadiusMax) })} /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Stack>
          ) : <Alert severity="warning">No wave profiles exist yet. Add one to configure night-profile waves.</Alert>}
        </Stack>
      )}
    </Stack>
  );
}

function LegacyWaveSettings({ config, updateConfig }: Props) {
  const fields: Array<keyof ApocalypseConfig['waves']> = ['minWavesDay1','maxWavesDay1','minWavesDay30','maxWavesDay30','minMobsDay1','maxMobsDay1','minMobsDay30','maxMobsDay30','spawnRadiusMin','spawnRadiusMax','maxSpawnAttemptsPerMob'];
  return (
    <Stack spacing={2}>
      <Alert severity="warning">Legacy mode uses the older flat fields and linearly scales from day 1 to day 30.</Alert>
      <Table size="small">
        <TableHead><TableRow><TableCell>Field</TableCell><TableCell>Value</TableCell></TableRow></TableHead>
        <TableBody>
          {fields.map((field) => (
            <TableRow key={field}>
              <TableCell>{field}</TableCell>
              <TableCell><TextField type="number" value={Number(config.waves[field] ?? 0)} onChange={(event) => updateConfig((draft) => { (draft.waves as Record<string, unknown>)[field] = numberValue(event.target.value, Number(draft.waves[field] ?? 0)); })} /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Stack>
  );
}
