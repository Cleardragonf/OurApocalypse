import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import { Box, Button, Checkbox, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { PlacementBlockRule } from "../../types";
import { numberValue } from "../../utils/number";

type Props = { rows: PlacementBlockRule[]; onChange: (rows: PlacementBlockRule[]) => void };

export default function PlacementBlocksEditor({ rows, onChange }: Props) {
  const update = (index: number, patch: Partial<PlacementBlockRule>) => onChange(rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)));
  return (
    <Stack spacing={2}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box><Typography variant="subtitle1" fontWeight={800}>Blocks mobs may place</Typography><Typography color="text.secondary" variant="body2">This is the placement palette. The ledger below is the actual cleanup/rollback list.</Typography></Box>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => onChange([...rows, { block: "minecraft:cobblestone", weight: 1, minDay: 1, enabled: true }])}>Add Block</Button>
      </Stack>
      <Table size="small"><TableHead><TableRow><TableCell>Enabled</TableCell><TableCell>Block</TableCell><TableCell>Weight</TableCell><TableCell>Min Day</TableCell><TableCell align="right">Remove</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row, index) => (
          <TableRow key={`${row.block}-${index}`}>
            <TableCell><Checkbox checked={row.enabled} onChange={(event) => update(index, { enabled: event.target.checked })} /></TableCell>
            <TableCell><TextField fullWidth value={row.block} onChange={(event) => update(index, { block: event.target.value })} /></TableCell>
            <TableCell width={140}><TextField type="number" value={row.weight} onChange={(event) => update(index, { weight: numberValue(event.target.value, row.weight) })} /></TableCell>
            <TableCell width={140}><TextField type="number" value={row.minDay} onChange={(event) => update(index, { minDay: numberValue(event.target.value, row.minDay) })} /></TableCell>
            <TableCell align="right"><IconButton color="error" onClick={() => onChange(rows.filter((_, rowIndex) => rowIndex !== index))}><DeleteIcon /></IconButton></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </Stack>
  );
}
