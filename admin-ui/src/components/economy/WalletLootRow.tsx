import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import type { EconomyEntityRewardRule, EconomyWalletLootMode } from "../../types";
import { numberValue } from "../../utils/number";

type Props = { row: EconomyEntityRewardRule; onChange: (patch: Partial<EconomyEntityRewardRule>) => void };

export default function WalletLootRow({ row, onChange }: Props) {
  const enabled = Boolean(row.lootVictimWalletEnabled);
  const mode = row.lootVictimWalletMode ?? "PERCENT_BALANCE";
  return (
    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
      <FormControlLabel control={<Switch checked={enabled} onChange={(event) => onChange({ lootVictimWalletEnabled: event.target.checked })} />} label="Loot defeated player's wallet" />
      <FormControl size="small" sx={{ minWidth: 190 }} disabled={!enabled}><InputLabel>Wallet Loot Mode</InputLabel><Select label="Wallet Loot Mode" value={mode} onChange={(event) => onChange({ lootVictimWalletMode: event.target.value as EconomyWalletLootMode })}><MenuItem value="FIXED">Fixed range</MenuItem><MenuItem value="PERCENT_BALANCE">Percent of victim wallet</MenuItem></Select></FormControl>
      {mode === "FIXED" ? (
        <><TextField size="small" type="number" label="Loot Min $" disabled={!enabled} value={row.lootVictimWalletMinAmount ?? 0} onChange={(event) => onChange({ lootVictimWalletMinAmount: numberValue(event.target.value, row.lootVictimWalletMinAmount ?? 0) })} /><TextField size="small" type="number" label="Loot Max $" disabled={!enabled} value={row.lootVictimWalletMaxAmount ?? 0} onChange={(event) => onChange({ lootVictimWalletMaxAmount: numberValue(event.target.value, row.lootVictimWalletMaxAmount ?? 0) })} /></>
      ) : (
        <><TextField size="small" type="number" label="Wallet %" disabled={!enabled} value={row.lootVictimWalletPercent ?? 10} onChange={(event) => onChange({ lootVictimWalletPercent: numberValue(event.target.value, row.lootVictimWalletPercent ?? 10) })} /><TextField size="small" type="number" label="Max Loot Cap $" helperText="0 = no cap" disabled={!enabled} value={row.lootVictimWalletMaxPercentAmount ?? 0} onChange={(event) => onChange({ lootVictimWalletMaxPercentAmount: numberValue(event.target.value, row.lootVictimWalletMaxPercentAmount ?? 0) })} /></>
      )}
      <Typography variant="caption" color="text.secondary">Intended for player kills: money is removed from the defeated player's wallet and awarded to the configured target.</Typography>
    </Stack>
  );
}
