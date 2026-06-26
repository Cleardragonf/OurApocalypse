import { FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Switch, TextField } from "@mui/material";
import type { ApocalypseConfig } from "../../types";
import { numberValue } from "../../utils/number";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function CoreConfigFields({ config, updateConfig }: Props) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}><FormControlLabel control={<Switch checked={config.enabled} onChange={(event) => updateConfig((draft) => { draft.enabled = event.target.checked; })} />} label="Mod Enabled" /></Grid>
      <Grid item xs={12} md={4}>
        <FormControl fullWidth><InputLabel>Difficulty Mode</InputLabel><Select label="Difficulty Mode" value={config.difficultyMode} onChange={(event) => updateConfig((draft) => { draft.difficultyMode = event.target.value as ApocalypseConfig["difficultyMode"]; })}>
          <MenuItem value="REAL_MONTH_DAY">Real Month Day</MenuItem><MenuItem value="WORLD_DAY_CYCLE">World Day Cycle</MenuItem><MenuItem value="MANUAL">Manual</MenuItem>
        </Select></FormControl>
      </Grid>
      <Grid item xs={12} md={4}><TextField fullWidth type="number" label="Manual Difficulty Day" value={config.manualDifficultyDay} onChange={(event) => updateConfig((draft) => { draft.manualDifficultyDay = numberValue(event.target.value, draft.manualDifficultyDay); })} /></Grid>
    </Grid>
  );
}
