import { FormControlLabel, Grid, Switch, TextField, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../types";
import { numberValue } from "../../utils/number";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function OurMagicSettings({ config, updateConfig }: Props) {
  return (
    <>
      <Typography variant="h6">OurMagic Integration Settings</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.integrations.ourMagic.enabled} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.enabled = event.target.checked; })} />} label="OurMagic Enabled" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth label="Host" value={config.integrations.ourMagic.host} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.host = event.target.value; })} /></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth type="number" label="Port" value={config.integrations.ourMagic.port} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.port = numberValue(event.target.value, draft.integrations.ourMagic.port); })} /></Grid>
        <Grid item xs={12} md={4}><TextField fullWidth label="Token" value={config.integrations.ourMagic.token} onChange={(event) => updateConfig((draft) => { draft.integrations.ourMagic.token = event.target.value; })} /></Grid>
      </Grid>
    </>
  );
}
