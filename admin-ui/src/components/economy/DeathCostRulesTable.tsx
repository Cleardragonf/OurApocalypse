import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Autocomplete, Button, Checkbox, FormControl, IconButton, InputLabel, MenuItem, Select, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { EconomyDeathCostMode, EconomyDeathCostRule } from "../../types";
import { numberValue } from "../../utils/number";
import { DEATH_CAUSES } from "./economyUtils";

type Props = { rows: EconomyDeathCostRule[]; onAdd: () => void; onUpdate: (index: number, patch: Partial<EconomyDeathCostRule>) => void; onRemove: (index: number) => void };

export default function DeathCostRulesTable({ rows, onAdd, onUpdate, onRemove }: Props) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2" fontWeight={800}>Death cost overrides</Typography><Button startIcon={<AddIcon />} variant="outlined" onClick={onAdd}>Add Death Cost</Button></Stack>
      <Table size="small"><TableHead><TableRow><TableCell>Enabled</TableCell><TableCell>Cause</TableCell><TableCell>Mode</TableCell><TableCell>Amount</TableCell><TableCell>Percent</TableCell><TableCell>Reason</TableCell><TableCell align="right">Remove</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row, index) => (
          <TableRow key={row.id || index}>
            <TableCell><Checkbox checked={row.enabled} onChange={(event) => onUpdate(index, { enabled: event.target.checked })} /></TableCell>
            <TableCell><Autocomplete freeSolo options={DEATH_CAUSES} value={row.deathCause} onChange={(_, value) => onUpdate(index, { deathCause: value ?? "ANY" })} onInputChange={(_, value, reason) => { if (reason === "input") onUpdate(index, { deathCause: value }); }} renderInput={(params) => <TextField {...params} size="small" label="Death Cause" />} sx={{ minWidth: 220 }} /></TableCell>
            <TableCell><FormControl size="small" sx={{ minWidth: 180 }}><InputLabel>Mode</InputLabel><Select label="Mode" value={row.mode} onChange={(event) => onUpdate(index, { mode: event.target.value as EconomyDeathCostMode })}><MenuItem value="FIXED">Fixed amount</MenuItem><MenuItem value="PERCENT_BALANCE">Percent balance</MenuItem></Select></FormControl></TableCell>
            <TableCell><TextField size="small" type="number" value={row.amount} onChange={(event) => onUpdate(index, { amount: numberValue(event.target.value, row.amount) })} /></TableCell>
            <TableCell><TextField size="small" type="number" value={row.percent} onChange={(event) => onUpdate(index, { percent: numberValue(event.target.value, row.percent) })} /></TableCell>
            <TableCell><TextField size="small" value={row.reason} onChange={(event) => onUpdate(index, { reason: event.target.value })} /></TableCell>
            <TableCell align="right"><IconButton color="error" onClick={() => onRemove(index)}><DeleteIcon /></IconButton></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </Stack>
  );
}
