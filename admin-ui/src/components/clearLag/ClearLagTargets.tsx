import { FormControlLabel, Grid, Switch } from "@mui/material";
import type { ApocalypseConfig } from "../../types";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function ClearLagTargets({ config, updateConfig }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeDroppedItems} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeDroppedItems = event.target.checked; })} />} label="Dropped Items" /></Grid>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeExperienceOrbs} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeExperienceOrbs = event.target.checked; })} />} label="Experience Orbs" /></Grid>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeProjectiles} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeProjectiles = event.target.checked; })} />} label="Projectiles" /></Grid>
      <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.clearLag.removeEmptyVehicles} onChange={(event) => updateConfig((draft) => { draft.clearLag.removeEmptyVehicles = event.target.checked; })} />} label="Empty Vehicles" /></Grid>
    </Grid>
  );
}
