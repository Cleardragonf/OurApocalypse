import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { Autocomplete, Button, Checkbox, IconButton, Stack, Table, TableBody, TableCell, TableHead, TableRow, TextField, Tooltip, Typography } from "@mui/material";
import type { EconomyMarketListing } from "../../types";
import { numberValue } from "../../utils/number";
import { ITEM_DISPLAY_TOOLTIP, registrySearchText, resolveRegistryItemInput, shortRegistryLabel } from "./economyUtils";

type Props = { rows: EconomyMarketListing[]; itemOptions: string[]; onAdd: () => void; onUpdate: (index: number, patch: Partial<EconomyMarketListing>) => void; onRemove: (index: number) => void };

export default function MarketListingsTable({ rows, itemOptions, onAdd, onUpdate, onRemove }: Props) {
  return (
    <Stack spacing={1}>
      <Stack direction="row" justifyContent="space-between" alignItems="center"><Typography variant="subtitle2" fontWeight={800}>Market listings</Typography><Button startIcon={<AddIcon />} variant="outlined" onClick={onAdd}>Add Listing</Button></Stack>
      <Table size="small"><TableHead><TableRow><TableCell>Enabled</TableCell><TableCell>Item</TableCell><TableCell>Display Name</TableCell><TableCell>Price</TableCell><TableCell>Min Day</TableCell><TableCell>Max/Purchase</TableCell><TableCell>Stock</TableCell><TableCell>Player Limit</TableCell><TableCell>Command On Purchase</TableCell><TableCell align="right">Remove</TableCell></TableRow></TableHead>
        <TableBody>{rows.map((row, index) => (
          <TableRow key={row.id || index}>
            <TableCell><Checkbox checked={row.enabled} onChange={(event) => onUpdate(index, { enabled: event.target.checked })} /></TableCell>
            <TableCell><Autocomplete freeSolo disableClearable options={itemOptions} value={row.item || ""} getOptionLabel={(option) => shortRegistryLabel(option)} filterOptions={(options, state) => { const query = state.inputValue.trim().toLowerCase(); return (!query ? options : options.filter((option) => registrySearchText(option).includes(query))).slice(0, 200); }} onChange={(_, value) => onUpdate(index, { item: resolveRegistryItemInput(value, itemOptions) })} onInputChange={(_, value, reason) => { if (reason === "input") onUpdate(index, { item: resolveRegistryItemInput(value, itemOptions) }); }} renderInput={(params) => <TextField {...params} size="small" label="Item" InputProps={{ ...params.InputProps, endAdornment: <><Tooltip title={ITEM_DISPLAY_TOOLTIP} arrow><HelpOutlineIcon color="action" fontSize="small" sx={{ mr: 0.5 }} /></Tooltip>{params.InputProps.endAdornment}</> }} />} sx={{ minWidth: 240 }} /></TableCell>
            <TableCell><TextField size="small" value={row.displayName} onChange={(event) => onUpdate(index, { displayName: event.target.value })} /></TableCell>
            <TableCell><TextField size="small" type="number" value={row.price} onChange={(event) => onUpdate(index, { price: numberValue(event.target.value, row.price) })} /></TableCell>
            <TableCell><TextField size="small" type="number" value={row.minDay} onChange={(event) => onUpdate(index, { minDay: numberValue(event.target.value, row.minDay) })} /></TableCell>
            <TableCell><TextField size="small" type="number" value={row.maxPerPurchase} onChange={(event) => onUpdate(index, { maxPerPurchase: numberValue(event.target.value, row.maxPerPurchase) })} /></TableCell>
            <TableCell><TextField size="small" type="number" helperText="-1 = unlimited" value={row.stock} onChange={(event) => onUpdate(index, { stock: numberValue(event.target.value, row.stock) })} /></TableCell>
            <TableCell><TextField size="small" type="number" helperText="0 = none" value={row.playerPurchaseLimit} onChange={(event) => onUpdate(index, { playerPurchaseLimit: numberValue(event.target.value, row.playerPurchaseLimit) })} /></TableCell>
            <TableCell><TextField size="small" value={row.commandOnPurchase} placeholder="Optional command" onChange={(event) => onUpdate(index, { commandOnPurchase: event.target.value })} /></TableCell>
            <TableCell align="right"><IconButton color="error" onClick={() => onRemove(index)}><DeleteIcon /></IconButton></TableCell>
          </TableRow>
        ))}</TableBody>
      </Table>
    </Stack>
  );
}
