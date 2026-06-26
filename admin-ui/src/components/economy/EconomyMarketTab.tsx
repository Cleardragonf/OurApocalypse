import { Alert, Box, FormControlLabel, Grid, Stack, Switch, Typography } from "@mui/material";
import type { ApocalypseConfig } from "../../types";
import MarketListingsTable from "./MarketListingsTable";
import { newMarketListing } from "./economyUtils";

type Props = { config: ApocalypseConfig; itemOptions: string[]; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function EconomyMarketTab({ config, itemOptions, updateConfig }: Props) {
  const market = config.economy.market;
  const updateEconomy = (updater: (economy: ApocalypseConfig["economy"]) => void) => updateConfig((draft) => updater(draft.economy));
  return (
    <Stack spacing={3}>
      <Alert severity="info">Market is intentionally isolated from economy config. Players who have logged in can later access these listings from the mod-side market UI/commands.</Alert>
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}><Stack spacing={2}>
        <Typography variant="subtitle1" fontWeight={900}>Market settings</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={market.enabled} onChange={(event) => updateEconomy((draft) => { draft.market.enabled = event.target.checked; })} />} label="Market Enabled" /></Grid>
          <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={market.loggedInPlayersOnly} onChange={(event) => updateEconomy((draft) => { draft.market.loggedInPlayersOnly = event.target.checked; })} />} label="Logged-in Players Only" /></Grid>
          <Grid item xs={12} md={4}><FormControlLabel control={<Switch checked={market.allowOutOfStockPurchases} onChange={(event) => updateEconomy((draft) => { draft.market.allowOutOfStockPurchases = event.target.checked; })} />} label="Allow Out-of-stock Purchases" /></Grid>
        </Grid>
        <MarketListingsTable rows={market.listings} itemOptions={itemOptions} onAdd={() => updateEconomy((draft) => { draft.market.listings.push(newMarketListing()); })} onUpdate={(index, patch) => updateEconomy((draft) => { draft.market.listings[index] = { ...draft.market.listings[index], ...patch }; })} onRemove={(index) => updateEconomy((draft) => { draft.market.listings.splice(index, 1); })} />
      </Stack></Box>
    </Stack>
  );
}
