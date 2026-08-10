import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import Login from '@/features/auth/pages/Login';
import Inscription from '@/features/auth/pages/Inscription';
import SetPassword from '@/features/auth/pages/SetPassword';
import ForgotPassword from '@/features/auth/pages/ForgotPassword';
import Layout from './components/Layout';
import DashboardRouter from '@/features/dashboard/pages/DashboardRouter';
import Directions from '@/features/gestion/pages/Directions';
import AgentsSurete from '@/features/gestion/pages/AgentsSurete';
import Managers from '@/features/gestion/pages/Managers';
import ConsultationGlobale from '@/features/consultations/pages/ConsultationGlobale';
import PassagesDirection from '@/features/consultations/pages/PassagesDirection';
import BadgesDirection from '@/features/consultations/pages/BadgesDirection';
import Simulation from '@/features/rapports/pages/Simulation';
import ValidationsN1 from '@/features/validations/pages/ValidationsN1';
import EmployesDirection from '@/features/gestion/pages/EmployesDirection';
import Invitations from '@/features/gestion/pages/Invitations';
import IncidentsManager from '@/features/incidents/pages/IncidentsManager';
import DossiersN2 from '@/features/validations/pages/DossiersN2';
import IncidentsSurete from '@/features/incidents/pages/IncidentsSurete';
import HistoriqueGlobal from '@/features/consultations/pages/HistoriqueGlobal';
import VerificationBadges from '@/features/dashboard/pages/VerificationBadges';
import MaDemande from '@/features/employe/pages/MaDemande';
import MonHistorique from '@/features/employe/pages/MonHistorique';
import Parametres from '@/features/parametres/pages/Parametres';
import Notifications from '@/features/notifications/pages/Notifications';
import RoleGuard from './components/RoleGuard';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';
import { SessionProvider } from '@/context/SessionContext';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return (
    <TooltipProvider>
      <SessionProvider>
        <Layout />
      </SessionProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/inscription" element={<Inscription />} />
          <Route path="/set-password" element={<SetPassword />} />
          <Route path="/reset-password" element={<SetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGuard />}>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/directions" element={<Directions />} />
              <Route path="/agents" element={<AgentsSurete />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/consultation" element={<ConsultationGlobale />} />
              <Route path="/passages-direction" element={<PassagesDirection />} />
              <Route path="/badges-direction" element={<BadgesDirection />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/validations" element={<ValidationsN1 />} />
              <Route path="/employes-direction" element={<EmployesDirection />} />
              <Route path="/invitations" element={<Invitations />} />
              <Route path="/incidents" element={<IncidentsManager />} />
              <Route path="/dossiers-n2" element={<DossiersN2 />} />
              <Route path="/incidents-surete" element={<IncidentsSurete />} />
              <Route path="/historique" element={<HistoriqueGlobal />} />
              <Route path="/verification-badges" element={<VerificationBadges />} />
              <Route path="/ma-demande" element={<MaDemande />} />
              <Route path="/mon-historique" element={<MonHistorique />} />
              <Route path="/parametres" element={<Parametres />} />
              <Route path="/notifications" element={<Notifications />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
