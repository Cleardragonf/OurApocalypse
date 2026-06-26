import { Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";
import type { PlacedBlocksResponse } from "../../types";

export default function PlacedBlocksLedgerTable({ placedBlocks }: { placedBlocks: PlacedBlocksResponse | null }) {
  return (
    <Table size="small">
      <TableHead><TableRow><TableCell>Rolled Back</TableCell><TableCell>Block</TableCell><TableCell>Previous</TableCell><TableCell>Reason</TableCell><TableCell>Entity</TableCell><TableCell>Dimension</TableCell><TableCell>Position</TableCell><TableCell>Created</TableCell></TableRow></TableHead>
      <TableBody>{(placedBlocks?.records ?? []).map((row) => (
        <TableRow key={row.id}>
          <TableCell>{row.rolledBack ? "Yes" : "No"}</TableCell><TableCell>{row.placedBlock}</TableCell><TableCell>{row.previousBlock}</TableCell><TableCell>{row.reason}</TableCell><TableCell>{row.entityType}</TableCell><TableCell>{row.dimension}</TableCell><TableCell>{row.x}, {row.y}, {row.z}</TableCell><TableCell>{row.createdAt}</TableCell>
        </TableRow>
      ))}</TableBody>
    </Table>
  );
}
