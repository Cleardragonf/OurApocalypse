import { Card, CardContent, Tab, Tabs } from "@mui/material";
import { useMemo, useState } from "react";
import type { AdminUiController } from "../../hooks/useAdminUiController";
import DropRulesTable from "../DropRulesTable";
import EntitySpawnProfilesEditor from "../EntitySpawnProfilesEditor";
import WaveProfilesEditor from "../WaveProfilesEditor";
import { withCard } from "../hoc/withCard";
import CleanupTab from "./CleanupTab";
import RawJsonTab from "./RawJsonTab";
type ApocalypseTabKey = "waves" | "entities" | "drops" | "cleanup" | "json";

export default function ApocalypsePage({ controller }: { controller: AdminUiController }) {
  const [tab, setTab] = useState<ApocalypseTabKey>("waves");
  const WaveCard = useMemo(() => withCard(WaveProfilesEditor), []);
  const EntityCard = useMemo(() => withCard(EntitySpawnProfilesEditor), []);
  const DropCard = useMemo(() => withCard(DropRulesTable), []);
  return (
    <>
      <Card><Tabs value={tab} onChange={(_, next) => setTab(next)} variant="scrollable" scrollButtons="auto"><Tab value="waves" label="Waves" /><Tab value="entities" label="Entities" /><Tab value="drops" label="Drops" /><Tab value="cleanup" label="Cleanup" /><Tab value="json" label="Raw JSON" /></Tabs></Card>
      {tab === "waves" && <WaveCard config={controller.config} updateConfig={controller.updateConfig} />}
      {tab === "entities" && <EntityCard config={controller.config} effectiveRows={controller.effectiveWeights} registryEntities={controller.registryEntities} refreshRegistryEntities={() => controller.fetchRegistryEntities(false)} updateConfig={controller.updateConfig} />}
      {tab === "drops" && <DropCard config={controller.config} registryItems={controller.registryItems} registryEntities={controller.registryEntities} refreshRegistryItems={() => controller.fetchRegistryItems(false)} refreshRegistryEntities={() => controller.fetchRegistryEntities(false)} updateConfig={controller.updateConfig} />}
      {tab === "cleanup" && <Card><CardContent><CleanupTab controller={controller} /></CardContent></Card>}
      {tab === "json" && <Card><CardContent><RawJsonTab controller={controller} /></CardContent></Card>}
    </>
  );
}
