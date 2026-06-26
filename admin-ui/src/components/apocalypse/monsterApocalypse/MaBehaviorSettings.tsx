import { Grid, TextField, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaNumberField from "./MaNumberField";
import MaSwitchField from "./MaSwitchField";

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MaBehaviorSettings({ config, updateConfig }: Props) {
  const settings = config.monsterApocalypse.monsterBehavior;
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Monster behavior inspired by MonsterApocalypse</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.megaAggroEnabled} label="Mega aggro" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.megaAggroEnabled = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.daytimeMegaAggro} label="Daytime mega aggro" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.daytimeMegaAggro = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.destroyTorches} label="Destroy torches" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.destroyTorches = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.zombieWallAttack} label="Wall attack" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.zombieWallAttack = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Sprint distance" value={settings.sprintDistance} min={0} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.sprintDistance = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Torch radius" value={settings.torchRadius} min={1} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.torchRadius = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Torch min day" value={settings.torchMinDay} min={1} max={30} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.torchMinDay = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Frustration ticks" value={settings.frustrationTicks} min={20} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.frustrationTicks = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Wall cooldown" value={settings.wallAttackCooldownTicks} min={5} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.wallAttackCooldownTicks = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Wall damage/hit" value={settings.wallAttackDamagePerHit} min={0.1} step={0.1} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.wallAttackDamagePerHit = value; })} /></Grid>
        <Grid item xs={12} md={2}><TextField fullWidth label="Build block" value={settings.buildingBlock} onChange={(event) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.buildingBlock = event.target.value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.pillarUp} label="Nerd pole up" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.pillarUp = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Max pillar height" value={settings.maxPillarHeight} min={1} max={128} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.maxPillarHeight = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Pillar cooldown" value={settings.pillarCooldownTicks} min={5} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.pillarCooldownTicks = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.airBridge} label="Air bridge" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.airBridge = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Max bridge length" value={settings.maxBridgeLength} min={1} max={128} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.maxBridgeLength = value; })} /></Grid>
        <Grid item xs={6} md={2}><MaNumberField label="Bridge cooldown" value={settings.bridgeCooldownTicks} min={5} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.bridgeCooldownTicks = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.killAfterPillarOrBridge} label="Kill after building" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.killAfterPillarOrBridge = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={settings.wallAttackUseBlockHp} label="Wall block HP style" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.monsterBehavior.wallAttackUseBlockHp = value; })} /></Grid>
      </Grid>
    </>
  );
}
