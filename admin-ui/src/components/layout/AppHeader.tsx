import CloudDoneIcon from "@mui/icons-material/CloudDone";
import CloudOffIcon from "@mui/icons-material/CloudOff";
import { Box, Chip, Stack, Typography } from "@mui/material";

type Props = {
  online: boolean;
  revision: number;
  applied: boolean;
};

export default function AppHeader({ online, revision, applied }: Props) {
  return (
    <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", md: "center" }} spacing={2}>
      <Box>
        <Typography variant="h4" fontWeight={900}>Apocalypse Mobs Admin</Typography>
        <Typography color="text.secondary">UI-owned config, REST/polling communication, offline-safe editing, and mob-placed block rollback.</Typography>
      </Box>
      <Stack direction="row" spacing={1} flexWrap="wrap">
        <Chip icon={online ? <CloudDoneIcon /> : <CloudOffIcon />} color={online ? "success" : "default"} label={online ? "Mod API Online" : "Offline / UI only"} />
        <Chip color="primary" label={`Local rev ${revision}`} />
        <Chip color={applied ? "success" : "warning"} label={applied ? "Applied" : "Pending apply"} />
      </Stack>
    </Stack>
  );
}
