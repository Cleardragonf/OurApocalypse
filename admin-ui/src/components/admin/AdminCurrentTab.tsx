import RefreshIcon from "@mui/icons-material/Refresh";
import SaveIcon from "@mui/icons-material/Save";
import { Alert, Button, Card, CardContent, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import type { AdminUiController } from "../../hooks/useAdminUiController";
import { numberValue } from "../../utils/number";
import StatusCard from "../common/StatusCard";

type Props = { controller: AdminUiController };

export default function AdminCurrentTab({ controller }: Props) {
  const { config, connectionSettings, effectiveDifficultyDay, modStatus, online, placedBlocks } = controller;
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Card><CardContent><Stack spacing={2}>
          <Typography variant="h6">Connection</Typography>
          <Alert severity="info">This is REST/polling now — not WebSocket. The UI remains usable even if the mod cannot be reached.</Alert>
          <TextField fullWidth label="Mod REST API Base URL" value={connectionSettings.modApiBaseUrl} onChange={(event) => controller.updateConnectionSettings({ modApiBaseUrl: event.target.value })} />
          <TextField fullWidth label="Admin Token" value={connectionSettings.adminToken} onChange={(event) => controller.updateConnectionSettings({ adminToken: event.target.value })} />
          <TextField type="number" label="Poll Seconds" value={connectionSettings.pollSeconds} onChange={(event) => controller.updateConnectionSettings({ pollSeconds: numberValue(event.target.value, connectionSettings.pollSeconds) })} />
          <FormControlLabel control={<Switch checked={connectionSettings.autoApplyLive} onChange={(event) => controller.updateConnectionSettings({ autoApplyLive: event.target.checked })} />} label="Auto-apply local changes when mod API is reachable" />
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button startIcon={<RefreshIcon />} variant="outlined" onClick={() => controller.fetchStatus()}>Check Status</Button>
            <Button startIcon={<SaveIcon />} variant="contained" onClick={() => controller.applyConfigToMod("manual")}>Apply Config to Mod</Button>
          </Stack>
        </Stack></CardContent></Card>
      </Grid>
      <Grid item xs={12} md={7}>
        <Card><CardContent><Stack spacing={2}>
          <Typography variant="h6">Mod Status</Typography>
          <Grid container spacing={2}>
            <StatusCard label="Connected" value={online ? "Yes" : "No"} />
            <StatusCard label="Mod Version" value={modStatus?.modVersion ?? "Unknown"} />
            <StatusCard label="Communication" value={modStatus?.communication ?? "REST_POLLING"} />
            <StatusCard label="Players" value={`${modStatus?.players ?? 0}/${modStatus?.maxPlayers ?? 0}`} />
            <StatusCard label="Difficulty Day" value={String(effectiveDifficultyDay)} />
            <StatusCard label="Wave Profile" value={modStatus?.activeWaveProfile ?? (config.waves.activeMode === "LEGACY_RULES" ? "Legacy Rules" : "Night Profiles")} />
            <StatusCard label="Entity Profile" value={modStatus?.activeEntityProfile ?? (config.entitySpawning.activeMode === "LEGACY_RULES" ? "Legacy Rules" : "Night Profiles")} />
            <StatusCard label="Placed Blocks Open" value={String(modStatus?.placedBlockOpenCount ?? placedBlocks?.openCount ?? 0)} />
            <StatusCard label="Placed Blocks Total" value={String(modStatus?.placedBlockTotalCount ?? placedBlocks?.totalCount ?? 0)} />
            <StatusCard label="Config Path" value={modStatus?.configPath ?? "Unavailable until mod connects"} wide />
            <StatusCard label="Ledger Path" value={modStatus?.ledgerPath ?? "Unavailable until mod connects"} wide />
          </Grid>
        </Stack></CardContent></Card>
      </Grid>
    </Grid>
  );
}
