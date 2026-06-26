import { Card, CardContent, Grid, Typography } from "@mui/material";

export default function StatusCard({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <Grid item xs={12} md={wide ? 12 : 4}>
      <Card variant="outlined">
        <CardContent>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography fontWeight={800} sx={{ wordBreak: "break-word" }}>{value}</Typography>
        </CardContent>
      </Card>
    </Grid>
  );
}
