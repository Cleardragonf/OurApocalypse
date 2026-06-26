import { Grid, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaNumberField from "./MaNumberField";
import MaSwitchField from "./MaSwitchField";

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MaSkeletonSettings({ config, updateConfig }: Props) {
  const settings = config.monsterApocalypse.monsterBehavior;
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Super skeleton arrows</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.superSkeletons} label="Super skeletons" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.superSkeletons = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.witherSkeletonSuperArrows} label="Wither skeleton arrows" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.witherSkeletonSuperArrows = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Period ticks" value={settings.superArrowPeriodTicks} min={20} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.superArrowPeriodTicks = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Chance 0-1" value={settings.superArrowChance} min={0} max={1} step={0.01} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.superArrowChance = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Range X/Z" value={settings.superArrowRangeXZ} min={1} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.superArrowRangeXZ = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Range Y" value={settings.superArrowRangeY} min={1} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.superArrowRangeY = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Player protect radius" value={settings.superArrowPlayerProtectionRadius} min={0} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.superArrowPlayerProtectionRadius = value; })} /></Grid>
      </Grid>
    </>
  );
}
