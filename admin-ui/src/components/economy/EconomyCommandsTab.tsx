import { Alert, Button, Grid, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import type { EconomyWalletResponse } from "../../types";
import { numberValue } from "../../utils/number";

type Props = {
  fetchBalance: (player: string) => Promise<EconomyWalletResponse>;
  applyOperation: (operation: "add" | "remove" | "set", player: string, value: number) => Promise<EconomyWalletResponse>;
  setError: (message: string | null) => void;
};

export default function EconomyCommandsTab({ fetchBalance, applyOperation, setError }: Props) {
  const [player, setPlayer] = useState("");
  const [value, setValue] = useState(0);
  const [wallet, setWallet] = useState<EconomyWalletResponse | null>(null);
  const [busy, setBusy] = useState(false);

  const run = async (action: "balance" | "add" | "remove" | "set") => {
    if (!player.trim()) {
      setError("Enter an online player name.");
      return;
    }
    setBusy(true);
    try {
      const next = action === "balance"
        ? await fetchBalance(player.trim())
        : await applyOperation(action, player.trim(), value);
      setWallet(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Economy command failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Stack spacing={2}>
      <Alert severity="info">These buttons call the mod REST API. The target player must be online. In game, players can use /bal and operators can use /economy add, remove, or set.</Alert>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={4}>
          <TextField fullWidth label="Player" value={player} onChange={(event) => setPlayer(event.target.value)} />
        </Grid>
        <Grid item xs={12} md={3}>
          <TextField fullWidth type="number" label="Value" value={value} onChange={(event) => setValue(numberValue(event.target.value, value))} />
        </Grid>
        <Grid item xs={12} md={5}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button variant="outlined" disabled={busy} onClick={() => run("balance")}>Balance</Button>
            <Button variant="contained" disabled={busy} onClick={() => run("add")}>Add</Button>
            <Button variant="outlined" disabled={busy} onClick={() => run("remove")}>Remove</Button>
            <Button color="warning" variant="outlined" disabled={busy} onClick={() => run("set")}>Set</Button>
          </Stack>
        </Grid>
      </Grid>
      {wallet && (
        <Typography fontWeight={800}>
          {wallet.player}: {wallet.balance.toFixed(2)} {wallet.currencyName}
        </Typography>
      )}
    </Stack>
  );
}
