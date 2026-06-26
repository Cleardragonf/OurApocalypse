import { Alert, Box, FormControl, FormControlLabel, Grid, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import type { ApocalypseConfig, EconomyDeathCostMode } from "../../types";
import { numberValue } from "../../utils/number";
import DeathCostRulesTable from "./DeathCostRulesTable";
import EntityRewardRulesTable from "./EntityRewardRulesTable";
import { newDeathRule, newEntityRewardRule } from "./economyUtils";

type Props = { config: ApocalypseConfig; entityOptions: string[]; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function EconomyConfigTab({ config, entityOptions, updateConfig }: Props) {
  const economy = config.economy;
  const updateEconomy = (updater: (economy: ApocalypseConfig["economy"]) => void) => updateConfig((draft) => updater(draft.economy));
  return (
    <Stack spacing={3}>
      <Alert severity="info">Active play pay is intended to pause when a player is AFK. Kill rewards can apply to any entity type, including players.</Alert>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={economy.enabled} onChange={(event) => updateEconomy((draft) => { draft.enabled = event.target.checked; })} />} label="Economy Enabled" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth label="Currency Name" value={economy.currencyName} onChange={(event) => updateEconomy((draft) => { draft.currencyName = event.target.value; })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Starting Balance" value={economy.startingBalance} onChange={(event) => updateEconomy((draft) => { draft.startingBalance = numberValue(event.target.value, draft.startingBalance); })} /></Grid>
      </Grid>
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}><Stack spacing={2}><Typography variant="subtitle1" fontWeight={900}>Active play earnings</Typography><Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={economy.payWhileActive.enabled} onChange={(event) => updateEconomy((draft) => { draft.payWhileActive.enabled = event.target.checked; })} />} label="Pay While Active" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Amount Per Hour" value={economy.payWhileActive.amountPerHour} onChange={(event) => updateEconomy((draft) => { draft.payWhileActive.amountPerHour = numberValue(event.target.value, draft.payWhileActive.amountPerHour); })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Payout Interval Seconds" value={economy.payWhileActive.payoutIntervalSeconds} onChange={(event) => updateEconomy((draft) => { draft.payWhileActive.payoutIntervalSeconds = numberValue(event.target.value, draft.payWhileActive.payoutIntervalSeconds); })} /></Grid>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={economy.payWhileActive.afkStopsTimer} onChange={(event) => updateEconomy((draft) => { draft.payWhileActive.afkStopsTimer = event.target.checked; })} />} label="AFK Stops Timer" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="AFK Timeout Seconds" value={economy.payWhileActive.afkTimeoutSeconds} onChange={(event) => updateEconomy((draft) => { draft.payWhileActive.afkTimeoutSeconds = numberValue(event.target.value, draft.payWhileActive.afkTimeoutSeconds); })} /></Grid>
      </Grid></Stack></Box>
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}><Stack spacing={2}><Typography variant="subtitle1" fontWeight={900}>Death costs</Typography><Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={economy.deathCosts.enabled} onChange={(event) => updateEconomy((draft) => { draft.deathCosts.enabled = event.target.checked; })} />} label="Death Costs Enabled" /></Grid>
        <Grid item xs={12} md={3}><FormControl fullWidth><InputLabel>Default Mode</InputLabel><Select label="Default Mode" value={economy.deathCosts.defaultMode} onChange={(event) => updateEconomy((draft) => { draft.deathCosts.defaultMode = event.target.value as EconomyDeathCostMode; })}><MenuItem value="FIXED">Fixed amount</MenuItem><MenuItem value="PERCENT_BALANCE">Percent balance</MenuItem></Select></FormControl></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Default Amount" value={economy.deathCosts.defaultAmount} onChange={(event) => updateEconomy((draft) => { draft.deathCosts.defaultAmount = numberValue(event.target.value, draft.deathCosts.defaultAmount); })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Default Percent" value={economy.deathCosts.defaultPercent} onChange={(event) => updateEconomy((draft) => { draft.deathCosts.defaultPercent = numberValue(event.target.value, draft.deathCosts.defaultPercent); })} /></Grid>
      </Grid><DeathCostRulesTable rows={economy.deathCosts.rules} onAdd={() => updateEconomy((draft) => { draft.deathCosts.rules.push(newDeathRule()); })} onUpdate={(index, patch) => updateEconomy((draft) => { draft.deathCosts.rules[index] = { ...draft.deathCosts.rules[index], ...patch }; })} onRemove={(index) => updateEconomy((draft) => { draft.deathCosts.rules.splice(index, 1); })} /></Stack></Box>
      <Box sx={{ p: 2, border: "1px solid", borderColor: "divider", borderRadius: 1 }}><Stack spacing={2}><Typography variant="subtitle1" fontWeight={900}>Baseline kill rewards</Typography><Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={economy.killRewards.enabled} onChange={(event) => updateEconomy((draft) => { draft.killRewards.enabled = event.target.checked; })} />} label="Kill Rewards Enabled" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Default Min $" value={economy.killRewards.defaultMinAmount} onChange={(event) => updateEconomy((draft) => { draft.killRewards.defaultMinAmount = numberValue(event.target.value, draft.killRewards.defaultMinAmount); })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Default Max $" value={economy.killRewards.defaultMaxAmount} onChange={(event) => updateEconomy((draft) => { draft.killRewards.defaultMaxAmount = numberValue(event.target.value, draft.killRewards.defaultMaxAmount); })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" inputProps={{ step: 0.01 }} label="Default Chance" value={economy.killRewards.defaultChance} onChange={(event) => updateEconomy((draft) => { draft.killRewards.defaultChance = numberValue(event.target.value, draft.killRewards.defaultChance); })} /></Grid>
      </Grid><EntityRewardRulesTable rows={economy.killRewards.rules} entityOptions={entityOptions} onAdd={() => updateEconomy((draft) => { draft.killRewards.rules.push(newEntityRewardRule()); })} onUpdate={(index, patch) => updateEconomy((draft) => { draft.killRewards.rules[index] = { ...draft.killRewards.rules[index], ...patch }; })} onRemove={(index) => updateEconomy((draft) => { draft.killRewards.rules.splice(index, 1); })} /></Stack></Box>
    </Stack>
  );
}
