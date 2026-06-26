import { FormControlLabel, Grid, Switch, TextField } from "@mui/material";
import type { ApocalypseConfig } from "../../types";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function ClearLagMessages({ config, updateConfig }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.announceWarning} onChange={(event) => updateConfig((draft) => { draft.clearLag.announceWarning = event.target.checked; })} />} label="Announce Warning" /></Grid>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.announceCompletion} onChange={(event) => updateConfig((draft) => { draft.clearLag.announceCompletion = event.target.checked; })} />} label="Announce Completion" /></Grid>
      <Grid item xs={12} md={6}><TextField fullWidth label="Warning Message" value={config.clearLag.warningMessage} onChange={(event) => updateConfig((draft) => { draft.clearLag.warningMessage = event.target.value; })} /></Grid>
      <Grid item xs={12}><TextField fullWidth label="Completion Message" value={config.clearLag.completionMessage} onChange={(event) => updateConfig((draft) => { draft.clearLag.completionMessage = event.target.value; })} /></Grid>
    </Grid>
  );
}
