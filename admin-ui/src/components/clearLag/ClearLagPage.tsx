import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import { Alert, Box, Button, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { AdminUiController } from "../../hooks/useAdminUiController";
import ClearLagMessages from "./ClearLagMessages";
import ClearLagSettings from "./ClearLagSettings";
import ClearLagTargets from "./ClearLagTargets";
import ClearLagWhitelist from "./ClearLagWhitelist";

export default function ClearLagPage({ controller }: { controller: AdminUiController }) {
  return (
    <Card><CardContent><Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
        <Box><Typography variant="h6">Clear Lag</Typography><Typography color="text.secondary" variant="body2">UI-ready configuration for scheduled lag cleanup. Server-side execution can be wired next.</Typography></Box>
        <Stack direction="row" spacing={1} flexWrap="wrap"><Button startIcon={<DownloadIcon />} onClick={controller.exportJson}>Export JSON</Button><Button startIcon={<SaveIcon />} variant="contained" onClick={() => controller.applyConfigToMod("manual")}>Apply to Mod</Button></Stack>
      </Stack>
      <Alert severity="info">This tab prepares the Clear Lag config shape. It is separate from Apocalypse wave/drop settings and can later run its own cleanup scheduler.</Alert>
      <ClearLagSettings config={controller.config} updateConfig={controller.updateConfig} />
      <Divider /><Typography variant="subtitle1" fontWeight={800}>Cleanup targets</Typography><ClearLagTargets config={controller.config} updateConfig={controller.updateConfig} />
      <Divider /><Typography variant="subtitle1" fontWeight={800}>Messages</Typography><ClearLagMessages config={controller.config} updateConfig={controller.updateConfig} />
      <Divider /><ClearLagWhitelist config={controller.config} updateConfig={controller.updateConfig} />
    </Stack></CardContent></Card>
  );
}
