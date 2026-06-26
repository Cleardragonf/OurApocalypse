import { lazy, Suspense, useState } from "react";
import { Alert, Card, CardContent, Container, LinearProgress, Stack } from "@mui/material";
import { useAdminUiController } from "./hooks/useAdminUiController";
import MainTabs, { type MainPageKey } from "./components/layout/MainTabs";
import AppHeader from "./components/layout/AppHeader";
import AdminPage from "./components/admin/AdminPage";
import ApocalypsePage from "./components/apocalypse/ApocalypsePage";

const ScheduledEventsEditor = lazy(() => import("./components/ScheduledEventsEditor"));
const EconomyEditor = lazy(() => import("./components/EconomyEditor"));
const ClearLagPage = lazy(() => import("./components/clearLag/ClearLagPage"));

export default function App() {
  const controller = useAdminUiController();
  const [mainPage, setMainPage] = useState<MainPageKey>("admin");
  const isApplied = controller.appliedRevision === controller.revision;

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Stack spacing={3}>
        <AppHeader online={controller.online} revision={controller.revision} applied={isApplied} />
        {controller.notice && <Alert severity="info">{controller.notice}</Alert>}
        {controller.error && <Alert severity="warning" onClose={() => controller.setError(null)}>{controller.error}</Alert>}
        <MainTabs value={mainPage} onChange={setMainPage} />
        {mainPage === "admin" && <AdminPage controller={controller} />}
        {mainPage === "apocalypse" && <ApocalypsePage controller={controller} />}
        <Suspense fallback={<LinearProgress />}>
          {mainPage === "scheduled-events" && (
            <Card><CardContent><ScheduledEventsEditor config={controller.config} commandRegistry={controller.registryCommands} refreshCommandRegistry={() => controller.fetchRegistryCommands(false)} fetchCommandSuggestions={controller.fetchCommandSuggestions} updateConfig={controller.updateConfig} /></CardContent></Card>
          )}
          {mainPage === "economy" && (
            <Card><CardContent><EconomyEditor config={controller.config} registryItems={controller.registryItems} registryEntities={controller.registryEntities} refreshRegistryItems={() => controller.fetchRegistryItems(false)} refreshRegistryEntities={() => controller.fetchRegistryEntities(false)} fetchEconomyBalance={controller.fetchEconomyBalance} applyEconomyOperation={controller.applyEconomyOperation} setError={controller.setError} updateConfig={controller.updateConfig} /></CardContent></Card>
          )}
          {mainPage === "clear-lag" && <ClearLagPage controller={controller} />}
        </Suspense>
      </Stack>
    </Container>
  );
}
