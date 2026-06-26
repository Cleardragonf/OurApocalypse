import { Grid, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaNumberField from "./MaNumberField";
import MaSwitchField from "./MaSwitchField";

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MaNightmareSettings({ config, updateConfig }: Props) {
  const settings = config.monsterApocalypse.nightmare;
  return (
    <>
      <Typography variant="h6" gutterBottom>Nightmare / night controls</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.alwaysNight} label="Always night" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.nightmare.alwaysNight = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.exponential} label="Exponential scaling" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.nightmare.exponential = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaNumberField label="Nightmare multiplier" value={settings.multiplier} step={0.1} min={0} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.nightmare.multiplier = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaNumberField label="Period ticks" value={settings.periodTicks} min={20} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.nightmare.periodTicks = value; })} /></Grid>
      </Grid>
    </>
  );
}
