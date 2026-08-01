import { Navigate, Outlet, useLocation } from 'react-router-dom';

const roleByPath = {
  SUPER_ADMIN: [
    '/', '/directions', '/agents', '/managers',
    '/consultation', '/rapports', '/simulation', '/parametres',
  ],
  MANAGER: [
    '/', '/validations', '/employes-direction', '/invitations',
    '/incidents', '/parametres',
  ],
  EMPLOYE: [
    '/', '/ma-demande', '/mon-historique', '/parametres',
  ],
  AGENT_SURETE: [
    '/', '/dossiers-n2', '/incidents-surete', '/historique',
    '/rapports-surete', '/parametres',
  ],
};

function getRoleFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const realmAccess = payload.realm_access?.roles || [];
    const role = realmAccess.find((r) =>
      ['SUPER_ADMIN', 'MANAGER', 'EMPLOYE', 'AGENT_SURETE'].includes(r)
    );
    return role || null;
  } catch {
    return null;
  }
}

export default function RoleGuard() {
  const location = useLocation();
  const role = getRoleFromToken();

  if (!role) return <Navigate to="/login" />;

  const allowed = roleByPath[role] || [];
  if (!allowed.includes(location.pathname)) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
