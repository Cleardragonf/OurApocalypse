import { Card, Tab, Tabs } from "@mui/material";

export type MainPageKey = "admin" | "apocalypse" | "scheduled-events" | "economy" | "clear-lag";

type Props = { value: MainPageKey; onChange: (value: MainPageKey) => void };

export default function MainTabs({ value, onChange }: Props) {
  return (
    <Card>
      <Tabs value={value} onChange={(_, next) => onChange(next)} variant="scrollable" scrollButtons="auto">
        <Tab value="admin" label="Admin" />
        <Tab value="apocalypse" label="Apocalypse" />
        <Tab value="scheduled-events" label="Scheduled Events" />
        <Tab value="economy" label="Economy" />
        <Tab value="clear-lag" label="Clear Lag" />
      </Tabs>
    </Card>
  );
}
