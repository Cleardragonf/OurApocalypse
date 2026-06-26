import { Button, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaNumberField from "./MaNumberField";
import MaSwitchField from "./MaSwitchField";

const TARGET_ENTITIES = ["minecraft:zombie", "minecraft:skeleton", "minecraft:creeper", "minecraft:spider", "minecraft:enderman", "minecraft:pillager", "minecraft:blaze"];

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MaSpawnPointsTable({ config, updateConfig }: Props) {
  const rows = config.monsterApocalypse.spawnPoints;
  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3, mb: 1 }}>
        <Typography variant="h6">UI-managed spawn points</Typography>
        <Button variant="contained" onClick={() => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints.push({ id: `ma-spawnpoint-${Date.now()}`, name: "New Spawn Point", enabled: true, dimension: "minecraft:overworld", x: 0, y: 80, z: 0, entity: "minecraft:zombie", periodTicks: 1200, count: 3, minLight: 0, maxLight: 7, chance: 1 }); })}>Add spawn point</Button>
      </Stack>
      <Grid container spacing={2}>
        {rows.map((row, index) => (
          <Grid item xs={12} key={row.id}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} md={1}><MaSwitchField checked={row.enabled} label="On" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].enabled = value; })} /></Grid>
              <Grid item xs={12} md={2}><TextField fullWidth label="Name" value={row.name} onChange={(event) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].name = event.target.value; })} /></Grid>
              <Grid item xs={12} md={2}><TextField select fullWidth label="Entity" value={row.entity} onChange={(event) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].entity = event.target.value; })}>{TARGET_ENTITIES.map((entity) => <MenuItem key={entity} value={entity}>{entity.replace("minecraft:", "")}</MenuItem>)}</TextField></Grid>
              <Grid item xs={4} md={1}><MaNumberField label="X" value={row.x} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].x = value; })} /></Grid>
              <Grid item xs={4} md={1}><MaNumberField label="Y" value={row.y} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].y = value; })} /></Grid>
              <Grid item xs={4} md={1}><MaNumberField label="Z" value={row.z} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].z = value; })} /></Grid>
              <Grid item xs={6} md={1}><MaNumberField label="Ticks" value={row.periodTicks} min={20} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].periodTicks = value; })} /></Grid>
              <Grid item xs={6} md={1}><MaNumberField label="Count" value={row.count} min={1} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].count = value; })} /></Grid>
              <Grid item xs={6} md={1}><MaNumberField label="Chance" value={row.chance} min={0} max={1} step={0.01} onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints[index].chance = value; })} /></Grid>
              <Grid item xs={6} md={1}><Button color="error" onClick={() => updateConfig((draft) => { draft.monsterApocalypse.spawnPoints.splice(index, 1); })}>Delete</Button></Grid>
            </Grid>
          </Grid>
        ))}
      </Grid>
    </>
  );
}
