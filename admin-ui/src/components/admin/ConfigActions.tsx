import DownloadIcon from "@mui/icons-material/Download";
import SaveIcon from "@mui/icons-material/Save";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import { Button, Stack } from "@mui/material";

type Props = {
  exportJson: () => void;
  importJson: (file: File | null) => void;
  resetToDefaults: () => void;
  applyConfigToMod: (source?: string) => void;
};

export default function ConfigActions({ exportJson, importJson, resetToDefaults, applyConfigToMod }: Props) {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap">
      <Button startIcon={<DownloadIcon />} onClick={exportJson}>Export JSON</Button>
      <Button component="label" startIcon={<UploadFileIcon />}>Import JSON<input hidden type="file" accept="application/json" onChange={(event) => importJson(event.target.files?.[0] ?? null)} /></Button>
      <Button color="warning" onClick={resetToDefaults}>Reset Defaults</Button>
      <Button startIcon={<SaveIcon />} variant="contained" onClick={() => applyConfigToMod("manual")}>Apply to Mod</Button>
    </Stack>
  );
}
