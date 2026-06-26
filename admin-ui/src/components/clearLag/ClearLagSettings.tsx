import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import type { ApocalypseConfig } from "../../types";
import { numberValue } from "../../utils/number";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function ClearLagSettings({ config, updateConfig }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.enabled} onChange={(event) => updateConfig((draft) => { draft.clearLag.enabled = event.target.checked; })} />} label="Clear Lag Enabled" /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Interval Seconds" value={config.clearLag.intervalSeconds} onChange={(event) => updateConfig((draft) => { draft.clearLag.intervalSeconds = numberValue(event.target.value, draft.clearLag.intervalSeconds); })} /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Warning Seconds" value={config.clearLag.warningSeconds} onChange={(event) => updateConfig((draft) => { draft.clearLag.warningSeconds = numberValue(event.target.value, draft.clearLag.warningSeconds); })} /></Grid>
      <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Max Removed Per Run" value={config.clearLag.maxEntitiesPerRun} onChange={(event) => updateConfig((draft) => { draft.clearLag.maxEntitiesPerRun = numberValue(event.target.value, draft.clearLag.maxEntitiesPerRun); })} /></Grid>
    </Grid>
  );
}
