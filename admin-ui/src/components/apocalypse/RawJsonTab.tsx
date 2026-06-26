import { Button, Stack, TextField, Typography } from "@mui/material";
import type { AdminUiController } from "../../hooks/useAdminUiController";

export default function RawJsonTab({ controller }: { controller: AdminUiController }) {
  return (
    <Stack spacing={2}>
      <Typography variant="h6">Raw JSON</Typography>
      <TextField value={controller.rawJson} onChange={(event) => controller.setRawJson(event.target.value)} multiline minRows={24} fullWidth sx={{ fontFamily: "monospace" }} />
      <Stack direction="row" spacing={1}><Button variant="contained" onClick={controller.applyRawJson}>Apply Raw JSON Locally</Button><Button onClick={() => controller.applyConfigToMod("raw-json")}>Apply to Mod</Button></Stack>
    </Stack>
  );
}
