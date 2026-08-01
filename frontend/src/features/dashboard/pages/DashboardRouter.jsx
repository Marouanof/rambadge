import { useState, useEffect } from 'react';
import api from '@/services/api';
import Dashboard from './Dashboard';
import ManagerDashboard from './ManagerDashboard';
import SureteDashboard from './SureteDashboard';
import EmployeDashboard from './EmployeDashboard';

export default function DashboardRouter() {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me')
      .then((res) => setRole(res.data.data.role))
      .catch(() => setRole(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="empty">Chargement...</div>;
  if (role === 'MANAGER') return <ManagerDashboard />;
  if (role === 'AGENT_SURETE') return <SureteDashboard />;
  if (role === 'EMPLOYE') return <EmployeDashboard />;
  return <Dashboard />;
}
