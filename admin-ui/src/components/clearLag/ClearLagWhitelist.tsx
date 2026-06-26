import { TextField } from "@mui/material";
import type { ApocalypseConfig } from "../../types";

type Props = { config: ApocalypseConfig; updateConfig: (updater: (draft: ApocalypseConfig) => void) => void };

export default function ClearLagWhitelist({ config, updateConfig }: Props) {
  return (
    <TextField fullWidth multiline minRows={4} label="Item Whitelist" helperText="One item ID per line. Whitelisted dropped items will be preserved when item cleanup is enabled." value={config.clearLag.itemWhitelist.join("\n")} onChange={(event) => updateConfig((draft) => { draft.clearLag.itemWhitelist = event.target.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean); })} />
  );
}
