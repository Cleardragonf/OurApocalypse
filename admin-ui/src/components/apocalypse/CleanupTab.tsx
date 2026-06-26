import RefreshIcon from "@mui/icons-material/Refresh";
import RestoreIcon from "@mui/icons-material/Restore";
import { Box, Button, Divider, FormControlLabel, Grid, Stack, Switch, TextField, Typography } from "@mui/material";
import type { AdminUiController } from "../../hooks/useAdminUiController";
import { numberValue } from "../../utils/number";
import PlacedBlocksLedgerTable from "../placement/PlacedBlocksLedgerTable";
import PlacementBlocksEditor from "../placement/PlacementBlocksEditor";

export default function CleanupTab({ controller }: { controller: AdminUiController }) {
  const { config, placedBlocks, rollbackLimit, updateConfig } = controller;
  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box><Typography variant="h6">Placed Block Cleanup / Rollback</Typography><Typography color="text.secondary" variant="body2">The mod records every block placed by mob bridge/step behavior. Rollback only removes a block if it still matches the recorded placed block.</Typography></Box>
        <Stack direction="row" spacing={1} flexWrap="wrap"><Button startIcon={<RefreshIcon />} onClick={controller.fetchPlacedBlocks}>Refresh Ledger</Button><TextField size="small" type="number" label="Rollback Limit" value={rollbackLimit} onChange={(event) => controller.setRollbackLimit(numberValue(event.target.value, rollbackLimit))} /><Button startIcon={<RestoreIcon />} color="warning" variant="contained" onClick={() => controller.rollbackPlacedBlocks(false)}>Rollback Latest</Button><Button color="error" variant="outlined" onClick={() => controller.rollbackPlacedBlocks(true)}>Rollback All</Button></Stack>
      </Stack>
      <Grid container spacing={2}>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.enabled} onChange={(event) => updateConfig((draft) => { draft.cleanup.enabled = event.target.checked; })} />} label="Cleanup Enabled" /></Grid>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.trackPlacedBlocks} onChange={(event) => updateConfig((draft) => { draft.cleanup.trackPlacedBlocks = event.target.checked; })} />} label="Track Placed Blocks" /></Grid>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.rollbackOnlyIfBlockStillMatches} onChange={(event) => updateConfig((draft) => { draft.cleanup.rollbackOnlyIfBlockStillMatches = event.target.checked; })} />} label="Safe Rollback Match" /></Grid>
        <Grid item xs={12} md={3}><FormControlLabel control={<Switch checked={config.cleanup.rollbackOnServerStart} onChange={(event) => updateConfig((draft) => { draft.cleanup.rollbackOnServerStart = event.target.checked; })} />} label="Rollback On Server Start" /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Max Ledger Entries" value={config.cleanup.maxLedgerEntries} onChange={(event) => updateConfig((draft) => { draft.cleanup.maxLedgerEntries = numberValue(event.target.value, draft.cleanup.maxLedgerEntries); })} /></Grid>
        <Grid item xs={12} md={3}><TextField fullWidth type="number" label="Max Rollback Per Request" value={config.cleanup.maxRollbackPerRequest} onChange={(event) => updateConfig((draft) => { draft.cleanup.maxRollbackPerRequest = numberValue(event.target.value, draft.cleanup.maxRollbackPerRequest); })} /></Grid>
      </Grid>
      <PlacementBlocksEditor rows={config.behavior.placementBlocks} onChange={(rows) => updateConfig((draft) => { draft.behavior.placementBlocks = rows; })} />
      <Divider />
      <Typography variant="subtitle1" fontWeight={800}>Recorded mob-placed blocks</Typography>
      <Typography color="text.secondary" variant="body2">Open: {placedBlocks?.openCount ?? 0}, Total: {placedBlocks?.totalCount ?? 0}</Typography>
      <PlacedBlocksLedgerTable placedBlocks={placedBlocks} />
    </Stack>
  );
}
