import { Card, Tab, Tabs } from "@mui/material";
import { useState } from "react";
import type { AdminUiController } from "../../hooks/useAdminUiController";
import AdminConfigTab from "./AdminConfigTab";
import AdminCurrentTab from "./AdminCurrentTab";

type AdminTabKey = "current" | "config";

export default function AdminPage({ controller }: { controller: AdminUiController }) {
  const [tab, setTab] = useState<AdminTabKey>("current");
  return (
    <>
      <Card><Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable" scrollButtons="auto"><Tab value="current" label="Current" /><Tab value="config" label="Config" /></Tabs></Card>
      {tab === "current" && <AdminCurrentTab controller={controller} />}
      {tab === "config" && <AdminConfigTab controller={controller} />}
    </>
  );
}
