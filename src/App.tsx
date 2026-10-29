import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { CustomersPage } from './pages/CustomersPage';
import { DashboardPage } from './pages/DashboardPage';
import { DevelopersPage } from './pages/DevelopersPage';
import { LoginPage } from './pages/LoginPage';
import { SettingsPage } from './pages/SettingsPage';
import { TeamPage } from './pages/TeamPage';
import { TicketsPage } from './pages/TicketsPage';
import { useStore } from './state/useStore';

export default function App() {
  const { currentAgent } = useStore();
  if (!currentAgent) return <LoginPage />;

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="tickets/:ticketId?" element={<TicketsPage />} />
        <Route path="customers/:customerId?" element={<CustomersPage />} />
        <Route path="developers" element={<DevelopersPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}
