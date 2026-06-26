import { Grid, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaNumberField from "./MaNumberField";
import MaSwitchField from "./MaSwitchField";

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MaBonusSpawnSettings({ config, updateConfig }: Props) {
  const settings = config.monsterApocalypse.bonusSpawns;
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Bonus / naturalistic spawns</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.enabled} label="Bonus spawns" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.enabled = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.spawnInAir} label="Allow midair" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.spawnInAir = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Mobs / player" value={settings.monstersPerPlayer} min={0} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.monstersPerPlayer = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Chance 0-1" value={settings.spawnChance} min={0} max={1} step={0.01} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.spawnChance = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Period ticks" value={settings.periodTicks} min={20} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.periodTicks = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Min distance" value={settings.minDistance} min={0} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.minDistance = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Max distance" value={settings.maxDistance} min={0} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.maxDistance = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Y offset" value={settings.yOffset} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.yOffset = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Min light" value={settings.minLight} min={0} max={15} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.minLight = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Max light" value={settings.maxLight} min={0} max={15} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.bonusSpawns.maxLight = value; })} /></Grid>
      </Grid>
    </>
  );
}
