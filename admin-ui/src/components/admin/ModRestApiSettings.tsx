import { FormControlLabel, Grid, Switch, TextField, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../types";
import { numberValue } from "../../utils/number";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function ModRestApiSettings({ config, updateConfig }: Props) {
  return (
    <>
      <Typography variant="h6">Mod REST API Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.adminApi.enabled} onChange={(event) => updateConfig((draft) => { draft.adminApi.enabled = event.target.checked; })} />} label="Admin API Enabled" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth label="Host" value={config.adminApi.host} onChange={(event) => updateConfig((draft) => { draft.adminApi.host = event.target.value; })} /></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Port" value={config.adminApi.port} onChange={(event) => updateConfig((draft) => { draft.adminApi.port = numberValue(event.target.value, draft.adminApi.port); })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth label="Token" value={config.adminApi.adminToken} onChange={(event) => updateConfig((draft) => { draft.adminApi.adminToken = event.target.value; })} /></Grid>
        <Grid item xs={12} md={1}><FormControlLabel control={<Switch checked={config.adminApi.requireToken} onChange={(event) => updateConfig((draft) => { draft.adminApi.requireToken = event.target.checked; })} />} label="Require" /></Grid>
      </Grid>
    </>
  );
}
