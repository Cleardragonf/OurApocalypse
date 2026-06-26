import { Alert, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../../types";
import MaBonusSpawnSettings from "./MaBonusSpawnSettings";
import MaNightmareSettings from "./MaNightmareSettings";
import MaSkeletonSettings from "./MaSkeletonSettings";
import MaSpawnBlockFilter from "./MaSpawnBlockFilter";
import MaSpawnPointsTable from "./MaSpawnPointsTable";
import MaSwitchField from "./MaSwitchField";

type Props = {
  config: ApocalypseConfig;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function MonsterApocalypseTab({ config, updateConfig }: Props) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">MonsterApocalypse-style controls</Typography>
            <MaSwitchField checked={config.monsterApocalypse.enabled} label="Enable" onChange={(value) => updateConfig((draft) => { draft.monsterApocalypse.enabled = value; })} />
          </Stack>
          <Alert severity="info">
            The uploaded MonsterApocalypse jar is a Bukkit plugin with YAML options for bonus spawning, mega-aggro, wall attacking, torch destruction, super skeleton arrows, spawn-point spawners, and spawn-block filtering. These controls are now UI-owned and sent to this Forge mod through the Admin REST API.
          </Alert>
          <MaNightmareSettings config={config} updateConfig={updateConfig} />
          <Divider />
          <MaBonusSpawnSettings config={config} updateConfig={updateConfig} />
          <Divider />
          <Alert severity="info">
            Per-spawn mob behavior such as mega aggro, wall attacking, nerd-poling, air-bridging, torch destruction, and build block selection now lives under Apocalypse → Entities → Props, because each entity row/profile can behave differently.
          </Alert>
          <MaSkeletonSettings config={config} updateConfig={updateConfig} />
          <Divider />
          <MaSpawnBlockFilter config={config} updateConfig={updateConfig} />
          <Divider />
          <MaSpawnPointsTable config={config} updateConfig={updateConfig} />
        </Stack>
      </CardContent>
    </Card>
  );
}
