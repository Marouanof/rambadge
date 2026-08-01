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
import Rapports from '@/features/rapports/pages/Rapports';
import Simulation from '@/features/rapports/pages/Simulation';
import ValidationsN1 from '@/features/validations/pages/ValidationsN1';
import EmployesDirection from '@/features/gestion/pages/EmployesDirection';
import Invitations from '@/features/gestion/pages/Invitations';
import IncidentsManager from '@/features/incidents/pages/IncidentsManager';
import DossiersN2 from '@/features/validations/pages/DossiersN2';
import IncidentsSurete from '@/features/incidents/pages/IncidentsSurete';
import HistoriqueGlobal from '@/features/consultations/pages/HistoriqueGlobal';
import MaDemande from '@/features/employe/pages/MaDemande';
import MonHistorique from '@/features/employe/pages/MonHistorique';
import Parametres from '@/features/parametres/pages/Parametres';
import RoleGuard from './components/RoleGuard';
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './components/NotFound';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  return (
    <TooltipProvider>
      <Layout />
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
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<RoleGuard />}>
              <Route path="/" element={<DashboardRouter />} />
              <Route path="/directions" element={<Directions />} />
              <Route path="/agents" element={<AgentsSurete />} />
              <Route path="/managers" element={<Managers />} />
              <Route path="/consultation" element={<ConsultationGlobale />} />
              <Route path="/rapports" element={<Rapports />} />
              <Route path="/simulation" element={<Simulation />} />
              <Route path="/validations" element={<ValidationsN1 />} />
              <Route path="/employes-direction" element={<EmployesDirection />} />
              <Route path="/invitations" element={<Invitations />} />
              <Route path="/incidents" element={<IncidentsManager />} />
              <Route path="/dossiers-n2" element={<DossiersN2 />} />
              <Route path="/incidents-surete" element={<IncidentsSurete />} />
              <Route path="/historique" element={<HistoriqueGlobal />} />
              <Route path="/rapports-surete" element={<Rapports />} />
              <Route path="/ma-demande" element={<MaDemande />} />
              <Route path="/mon-historique" element={<MonHistorique />} />
              <Route path="/parametres" element={<Parametres />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
