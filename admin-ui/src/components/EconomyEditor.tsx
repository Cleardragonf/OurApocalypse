import { Box, Button, Stack, Tab, Tabs, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type { ApocalypseConfig } from "../types";
import { VANILLA_DROP_ITEM_OPTIONS } from "../registryOptions";
import EconomyConfigTab from "./economy/EconomyConfigTab";
import EconomyCommandsTab from "./economy/EconomyCommandsTab";
import EconomyMarketTab from "./economy/EconomyMarketTab";
import { entityLabel, SPECIAL_ENTITY_OPTIONS, VANILLA_ENTITY_OPTIONS } from "./economy/economyUtils";
import type { EconomyWalletResponse } from "../types";

type EconomyTabKey = "config" | "market" | "commands";

type Props = {
  config: ApocalypseConfig;
  registryItems: string[];
  registryEntities: string[];
  refreshRegistryItems: () => void;
  refreshRegistryEntities: () => void;
  fetchEconomyBalance: (player: string) => Promise<EconomyWalletResponse>;
  applyEconomyOperation: (operation: "add" | "remove" | "set", player: string, value: number) => Promise<EconomyWalletResponse>;
  setError: (message: string | null) => void;
  updateConfig: (updater: (draft: ApocalypseConfig) => void) => void;
};

export default function EconomyEditor({ config, registryItems, registryEntities, refreshRegistryItems, refreshRegistryEntities, fetchEconomyBalance, applyEconomyOperation, setError, updateConfig }: Props) {
  const [economyTab, setEconomyTab] = useState<EconomyTabKey>("config");
  const itemOptions = useMemo(() => [...new Set([...VANILLA_DROP_ITEM_OPTIONS, ...registryItems])].sort(), [registryItems]);
  const entityOptions = useMemo(() => {
    const merged = new Set<string>([
      ...SPECIAL_ENTITY_OPTIONS.map((option) => option.id),
      ...VANILLA_ENTITY_OPTIONS.map((option) => option.id),
      ...registryEntities,
    ]);
    return [...merged].sort((a, b) => entityLabel(a).localeCompare(entityLabel(b)));
  }, [registryEntities]);

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h6">Economy</Typography>
          <Typography color="text.secondary" variant="body2">Configure active-play pay, AFK behavior, death costs, kill rewards, and market listings. Participants means players who damaged the entity before it died.</Typography>
        </Box>
        <Stack direction="row" spacing={1} flexWrap="wrap">
          {economyTab === "market" && <Button variant="outlined" onClick={refreshRegistryItems}>Refresh item registry</Button>}
          {economyTab === "config" && <Button variant="outlined" onClick={refreshRegistryEntities}>Refresh entity registry</Button>}
        </Stack>
      </Stack>
      <Tabs value={economyTab} onChange={(_, value) => setEconomyTab(value)} variant="scrollable" scrollButtons="auto"><Tab value="config" label="Config" /><Tab value="market" label="Market" /><Tab value="commands" label="Commands" /></Tabs>
      {economyTab === "config" && <EconomyConfigTab config={config} entityOptions={entityOptions} updateConfig={updateConfig} />}
      {economyTab === "market" && <EconomyMarketTab config={config} itemOptions={itemOptions} updateConfig={updateConfig} />}
      {economyTab === "commands" && <EconomyCommandsTab fetchBalance={fetchEconomyBalance} applyOperation={applyEconomyOperation} setError={setError} />}
    </Stack>
  );
}
