import { Button, Grid, TextField, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaSwitchField from "./MaSwitchField";

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MaSpawnBlockFilter({ config, updateConfig }: Props) {
  const filter = config.monsterApocalypse.spawnBlockFilter;
  const blockText = filter.blocks.join("\n");
  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>Spawn block filter</Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><MaSwitchField checked={filter.enabled} label="Enable block filter" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnBlockFilter.enabled = value; })} /></Grid>
        <Grid item xs={12} md={3}><MaSwitchField checked={filter.invertToWhitelist} label="Invert to whitelist" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.spawnBlockFilter.invertToWhitelist = value; })} /></Grid>
        <Grid item xs={12} md={6}><Button variant="outlined" onClick={() => updateConfig((draft) => { draft.monsterApocalypse.spawnBlockFilter.blocks = ["minecraft:bedrock", "minecraft:water", "minecraft:lava", "minecraft:oak_leaves", "minecraft:spruce_leaves"]; })}>Load common unsafe blocks</Button></Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth multiline minRows={4}
            label="Blocks, one registry ID per line"
            value={blockText}
            helperText="Blacklist by default. Turn on whitelist mode to only allow spawning on these blocks."
            onChange={(event) => updateConfig((draft) => { draft.monsterApocalypse.spawnBlockFilter.blocks = event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean); })}
          />
        </Grid>
      </Grid>
    </>
  );
}
