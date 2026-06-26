import { Box, Card, CardContent, Divider, Stack, Typography } from "@mui/material";
import type { AdminUiController } from "../../hooks/useAdminUiController";
import ConfigActions from "./ConfigActions";
import CoreConfigFields from "./CoreConfigFields";
import ModRestApiSettings from "./ModRestApiSettings";
import OurMagicSettings from "./OurMagicSettings";

export default function AdminConfigTab({ controller }: { controller: AdminUiController }) {
  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
            <Box><Typography variant="h6">Core Config</Typography><Typography color="text.secondary" variant="body2">These controls save locally first. Apply pushes them to the mod REST API when available.</Typography></Box>
            <ConfigActions exportJson={controller.exportJson} importJson={controller.importJson} resetToDefaults={controller.resetToDefaults} applyConfigToMod={controller.applyConfigToMod} />
          </Stack>
          <CoreConfigFields config={controller.config} updateConfig={controller.updateConfig} />
          <Divider />
          <ModRestApiSettings config={controller.config} updateConfig={controller.updateConfig} />
          <Divider />
          <OurMagicSettings config={controller.config} updateConfig={controller.updateConfig} />
        </Stack>
      </CardContent>
    </Card>
  );
}
