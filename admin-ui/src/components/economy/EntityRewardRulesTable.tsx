import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Autocomplete, Button, Checkbox, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { Fragment } from "react";
import type { EconomyEntityRewardRule, EconomyKillRewardTargetMode, EconomyParticipantRewardMode } from "../../types";
import { numberValue } from "../../utils/number";
import { entityLabel, PARTICIPANT_MODE_LABELS, resolveEntityInput, REWARD_TARGET_LABELS } from "./economyUtils";
import WalletLootRow from "./WalletLootRow";

type Props = { rows: EconomyEntityRewardRule[]; entityOptions: string[]; onAdd: () => void; onUpdate: (index: number, patch: Partial<EconomyEntityRewardRule>) => void; onRemove: (index: number) => void };

export default function EntityRewardRulesTable({ rows, entityOptions, onAdd, onUpdate, onRemove }: Props) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2" fontWeight={800}>Baseline kill reward rules</Typography><Button startIcon={<AddIcon />} variant="outlined" onClick={onAdd}>Add Kill Reward</Button></Stack>
      <Table size="small"><TableHead><TableRow><TableCell>Enabled</TableCell><TableCell>Entity</TableCell><TableCell>Min Day</TableCell><TableCell>Chance</TableCell><TableCell>Min $</TableCell><TableCell>Max $</TableCell><TableCell>Target</TableCell><TableCell>Participant Payout</TableCell><TableCell>Reason</TableCell><TableCell align="right">Remove</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row, index) => (
          <Fragment key={row.id || index}>
            <TableRow>
              <TableCell><Checkbox checked={row.enabled} onChange={(event) => onUpdate(index, { enabled: event.target.checked })} /></TableCell>
              <TableCell><Autocomplete freeSolo options={entityOptions} value={row.entity} getOptionLabel={entityLabel} isOptionEqualToValue={(option, value) => option === value} filterOptions={(options, state) => { const query = state.inputValue.toLowerCase().trim(); return (!query ? options : options.filter((option) => `${entityLabel(option)} ${option}`.toLowerCase().includes(query))).slice(0, 200); }} onChange={(_, value) => onUpdate(index, { entity: resolveEntityInput(value ?? "", entityOptions) })} onInputChange={(_, value, reason) => { if (reason === "input") onUpdate(index, { entity: resolveEntityInput(value, entityOptions) }); }} renderInput={(params) => <TextField {...params} size="small" label="Entity" />} sx={{ minWidth: 240 }} /></TableCell>
              <TableCell><TextField size="small" type="number" value={row.minDay} onChange={(event) => onUpdate(index, { minDay: numberValue(event.target.value, row.minDay) })} /></TableCell>
              <TableCell><TextField size="small" type="number" inputProps={{ step: 0.01 }} value={row.chance} onChange={(event) => onUpdate(index, { chance: numberValue(event.target.value, row.chance) })} /></TableCell>
              <TableCell><TextField size="small" type="number" value={row.minAmount} onChange={(event) => onUpdate(index, { minAmount: numberValue(event.target.value, row.minAmount) })} /></TableCell>
              <TableCell><TextField size="small" type="number" value={row.maxAmount} onChange={(event) => onUpdate(index, { maxAmount: numberValue(event.target.value, row.maxAmount) })} /></TableCell>
              <TableCell><FormControl size="small" sx={{ minWidth: 200 }}><InputLabel>Target</InputLabel><Select label="Target" value={row.targetMode} onChange={(event) => onUpdate(index, { targetMode: event.target.value as EconomyKillRewardTargetMode, participantRewardMode: row.participantRewardMode ?? "FULL_TO_EACH_PARTICIPANT" })}>{(Object.keys(REWARD_TARGET_LABELS) as EconomyKillRewardTargetMode[]).map((target) => <MenuItem key={target} value={target}>{REWARD_TARGET_LABELS[target]}</MenuItem>)}</Select></FormControl></TableCell>
              <TableCell><FormControl size="small" sx={{ minWidth: 210 }} disabled={row.targetMode !== "ALL_PARTICIPANTS"}><InputLabel>Participant Payout</InputLabel><Select label="Participant Payout" value={row.participantRewardMode ?? "FULL_TO_EACH_PARTICIPANT"} onChange={(event) => onUpdate(index, { participantRewardMode: event.target.value as EconomyParticipantRewardMode })}>{(Object.keys(PARTICIPANT_MODE_LABELS) as EconomyParticipantRewardMode[]).map((mode) => <MenuItem key={mode} value={mode}>{PARTICIPANT_MODE_LABELS[mode]}</MenuItem>)}</Select></FormControl></TableCell>
              <TableCell><TextField size="small" value={row.reason} onChange={(event) => onUpdate(index, { reason: event.target.value })} /></TableCell>
              <TableCell align="right"><IconButton color="error" onClick={() => onRemove(index)}><DeleteIcon /></IconButton></TableCell>
            </TableRow>
            {(row.entity === "minecraft:player" || row.lootVictimWalletEnabled) && <TableRow><TableCell colSpan={10} sx={{ bgcolor: "action.hover" }}><WalletLootRow row={row} onChange={(patch) => onUpdate(index, patch)} /></TableCell></TableRow>}
          </Fragment>
        ))}</TableBody>
      </Table>
    </Stack>
  );
}
